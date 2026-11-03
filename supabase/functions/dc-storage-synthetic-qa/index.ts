// Admin-only synthetic PDF Storage round-trip.
// Creates and deletes ONLY a freshly-generated QA PDF in private bucket
// dealcapital-qa. Does not accept client paths or project IDs.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.1";

const BUCKET="dealcapital-qa";
const PRIMARY_ORIGIN="https://deal-capital.vercel.app";
const PREVIEW_ORIGIN=/^https:\/\/deal-capital-[a-z0-9-]+-capitaldeal\.vercel\.app$/;
const FOLDER="synthetic";
const MIME="application/pdf";
const allowOrigin=(origin:string|null)=>
  origin===PRIMARY_ORIGIN||(origin!==null&&PREVIEW_ORIGIN.test(origin));
const headers=(origin:string|null)=>({
  "Access-Control-Allow-Origin":allowOrigin(origin)?origin!:PRIMARY_ORIGIN,
  "Access-Control-Allow-Headers":"authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Access-Control-Max-Age":"600",
  "Vary":"Origin","Content-Type":"application/json","Cache-Control":"no-store"
});
const respond=(body:Record<string,unknown>,status:number,origin:string|null)=>
  new Response(JSON.stringify(body),{status,headers:headers(origin)});

// Valid self-contained ASCII PDF. Never includes user data.
function createSyntheticPDF():Uint8Array{
  const stream="BT /F1 12 Tf 24 75 Td (DealCapital - Synthetic Storage QA Only) Tj ET";
  const objects=[
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 330 140] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length "+stream.length+" >>\nstream\n"+stream+"\nendstream"
  ];
  let pdf="%PDF-1.4\n";
  const offsets:number[]=[0];
  for(let i=0;i<objects.length;i++){
    offsets.push(pdf.length);
    pdf+=(i+1)+" 0 obj\n"+objects[i]+"\nendobj\n";
  }
  const xrefAt=pdf.length;
  pdf+="xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n";
  for(const offset of offsets.slice(1)){
    pdf+=String(offset).padStart(10,"0")+" 00000 n \n";
  }
  pdf+="trailer\n<< /Size "+(objects.length+1)+" /Root 1 0 R >>\nstartxref\n"+xrefAt+"\n%%EOF\n";
  return new TextEncoder().encode(pdf);
}
function equalBytes(a:Uint8Array,b:Uint8Array):boolean{
  if(a.length!==b.length)return false;
  for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;
  return true;
}

Deno.serve(async(request:Request)=>{
  const origin=request.headers.get("origin");
  if(origin&&!allowOrigin(origin))return respond({error:"Origin not permitted"},403,origin);
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:headers(origin)});
  if(request.method!=="POST")return respond({error:"Method not allowed"},405,origin);
  const bearer=request.headers.get("authorization")||"";
  if(!bearer.startsWith("Bearer "))return respond({error:"Administrator session required"},401,origin);
  let body:unknown;
  try{body=await request.json();}catch{return respond({error:"Invalid request"},400,origin);}
  if(!body||typeof body!=="object"||Array.isArray(body)||
     Object.keys(body).length!==1||(body as {action?:unknown}).action!=="run"){
    return respond({error:"Only synthetic QA operation is supported"},400,origin);
  }
  const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),
        secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!anon||!secret)return respond({error:"Service unavailable"},503,origin);
  const started=Date.now();
  const userClient=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const adminClient=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  try{
    const {data:auth,error:authErr}=await userClient.auth.getUser(bearer.slice(7).trim());
    if(authErr||!auth.user)return respond({error:"Invalid or expired session"},401,origin);
    const {data:trusted,error:trustedErr}=await adminClient.auth.admin.getUserById(auth.user.id);
    if(trustedErr||trusted.user?.app_metadata?.role!=="admin")
      return respond({error:"Trusted administrator required"},403,origin);
    const {data:runId,error:claimErr}=await adminClient.rpc("dc_service_begin_storage_qa",{
      p_actor_id:auth.user.id
    });
    if(claimErr||typeof runId!=="string")
      return respond({error:"QA is unavailable or rate-limited; retry in one minute"},409,origin);

    const filename="qa-"+crypto.randomUUID()+".pdf";
    const path=FOLDER+"/"+filename;
    const bytes=createSyntheticPDF();
    let attempted=false,uploaded=false,verified=false,deleted=false;
    let failure:string|null=null;
    try{
      const {data:bucket,error:bucketError}=await adminClient.storage.getBucket(BUCKET);
      if(bucketError||!bucket||bucket.public!==false||
         bucket.file_size_limit!==65536||
         bucket.allowed_mime_types?.length!==1||
         bucket.allowed_mime_types[0]!==MIME){
        failure="bucket_configuration";
      }else{
        attempted=true;
        const {error:uploadError}=await adminClient.storage.from(BUCKET)
          .upload(path,new Blob([bytes],{type:MIME}),{contentType:MIME,cacheControl:"0",upsert:false});
        if(uploadError){
          failure="upload_failed";
        }else{
          uploaded=true;
          const {data:blob,error:downloadError}=await adminClient.storage.from(BUCKET).download(path);
          if(downloadError||!blob)failure="download_failed";
          else{
            verified=equalBytes(new Uint8Array(await blob.arrayBuffer()),bytes);
            if(!verified)failure="content_mismatch";
          }
        }
      }
    }catch{
      failure=failure??"storage_io_failure";
    }finally{
      if(attempted){
        // The path is randomly generated here, never supplied by a client.
        // Cleanup runs even on upload/download failures.
        try{
          const {error:removeError}=await adminClient.storage.from(BUCKET).remove([path]);
          if(removeError)failure=failure??"cleanup_failed";
          else{
            const {data:files,error:listError}=await adminClient.storage.from(BUCKET)
              .list(FOLDER,{limit:100,search:filename});
            deleted=!listError&&!files?.some(file=>file.name===filename);
            if(!deleted)failure=failure??"cleanup_unconfirmed";
          }
        }catch{failure=failure??"cleanup_failed";}
      }
    }

    const {data:audit,error:auditErr}=await adminClient.rpc("dc_service_finish_storage_qa",{
      p_run_id:runId,p_actor_id:auth.user.id,
      p_uploaded:uploaded,p_downloaded_verified:verified,
      p_deleted_verified:deleted,p_error_code:failure
    });
    if(auditErr||!audit||audit.run_id!==runId)
      return respond({status:"inconclusive",uploaded,downloaded_verified:verified,
        deleted_verified:deleted,error:"QA audit could not be finalized"},503,origin);
    const passed=audit.status==="passed";
    return respond({
      status:passed?"passed":"failed",run_id:runId,synthetic_pdf:true,
      private_bucket:BUCKET,uploaded,downloaded_verified:verified,
      deleted_verified:deleted,error_code:failure,duration_ms:Date.now()-started,
      business_documents_touched:false,full_proposal_retirement_tested:false,
      note:passed?"Synthetic PDF uploaded, read and deleted with verification"
          :"Inspect private QA log; no business files were selected"
    },passed?200:502,origin);
  }catch{return respond({status:"inconclusive",error:"QA could not complete"},500,origin);}
});
