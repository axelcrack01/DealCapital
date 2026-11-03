"use client";

import {useState} from "react";
import {supabase} from "../../lib/supabase";

type PrivateDocument = {label:string;bucket:"Documentos"|"pitch-decks";objectKey:string};
type DocumentKeys = {documento_pdf?:string|null;pitch_deck_url?:string|null};

export default function AdminPrivateDocuments({projectId}:{projectId:number}) {
  const [documents,setDocuments]=useState<PrivateDocument[]|null>(null);
  const [links,setLinks]=useState<Record<string,{url:string;expiresAt:number}>>({});
  const [busy,setBusy]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);

  const inspect=async()=>{
    setBusy("lookup");setError(null);
    try {
      // The privileged function independently verifies the current admin role
      // in auth.users before returning storage object references.
      const {data,error:rpcError}=await supabase.rpc("dc_admin_project_document_keys",{
        p_project_id:projectId
      });
      if(rpcError||!data||typeof data!=="object"||Array.isArray(data)){
        setError("No se pudo consultar el inventario privado. Comprueba tus permisos.");
        return;
      }
      const keys=data as DocumentKeys;
      const list:PrivateDocument[]=[];
      if(keys.pitch_deck_url&&!/^https?:\/\//i.test(keys.pitch_deck_url))
        list.push({label:"Pitch deck",bucket:"pitch-decks",objectKey:keys.pitch_deck_url});
      if(keys.documento_pdf&&!/^https?:\/\//i.test(keys.documento_pdf))
        list.push({label:"Documento",bucket:"Documentos",objectKey:keys.documento_pdf});
      setDocuments(list);
    }catch{
      setError("No se pudo acceder al servicio de documentos.");
    }finally{setBusy(null);}
  };

  const open=async(doc:PrivateDocument)=>{
    setBusy(doc.bucket);setError(null);
    try {
      const {data,error:accessError}=await supabase.storage.from(doc.bucket)
        .createSignedUrl(doc.objectKey,120);
      if(accessError||!data?.signedUrl){
        setError("No se pudo generar el enlace privado de este archivo.");
        return;
      }
      setLinks(old=>({...old,[doc.bucket]:{url:data.signedUrl,expiresAt:Date.now()+110000}}));
    }catch{
      setError("No se pudo generar el enlace privado.");
    }finally{setBusy(null);}
  };

  return <div className="mt-3 space-y-2 text-[11px]">
    {documents===null ?
      <button type="button" onClick={()=>void inspect()} disabled={busy!==null}
        className="text-[#facc15] underline underline-offset-2 disabled:opacity-50">
        {busy==="lookup"?"Comprobando archivos…":"Consultar PDF privados"}
      </button>
    : documents.length===0 ?
      <p className="text-[#8c9cb1]">Sin PDF privado asociado.</p>
    : <div className="space-y-2">
      <p className="font-bold text-[#bfd0e2]">Documentación restringida</p>
      {documents.map(doc=>{
        const link=links[doc.bucket];
        const active=link&&link.expiresAt>Date.now();
        return <div key={doc.bucket} className="flex flex-wrap items-center gap-2">
          {active&&<a href={link.url} target="_blank" rel="noopener noreferrer"
            className="font-bold text-[#facc15] underline underline-offset-2">
              {doc.label} (2 min)
          </a>}
          <button type="button" onClick={()=>void open(doc)} disabled={busy!==null}
            className="text-[#a8c2e5] underline underline-offset-2 disabled:opacity-50">
            {busy===doc.bucket?"Generando enlace…":active?"Renovar enlace":"Abrir "+doc.label}
          </button>
        </div>;
      })}
    </div>}
    {error&&<p role="alert" className="max-w-64 text-rose-300">{error}</p>}
  </div>;
}
