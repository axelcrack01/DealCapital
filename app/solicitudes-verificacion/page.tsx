"use client";
import Link from "next/link";
import VerificationTimeline,{type VerificationEvent} from "../components/VerificationTimeline";
import OwnerResponse from "./OwnerResponse";
import {useCallback,useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";

type ResponseRow={request_id:number;owner_response:string;owner_response_at:string};
type Request={id:number;request_type:"perfil"|"empresa";status:"pendiente"|"en_revision"|"observada"|"cerrada";review_note:string|null;created_at:string;updated_at:string};
const statusLabel:Record<Request["status"],string>={
 pendiente:"Pendiente",en_revision:"En revisión",observada:"Observada",cerrada:"Cerrada"
};
const date=(s:string)=>new Intl.DateTimeFormat("es-PE",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Lima"}).format(new Date(s));

export default function SolicitudesVerificacion(){
 const [items,setItems]=useState<Request[]>([]);
 const [responses,setResponses]=useState<ResponseRow[]>([]);
 const [events,setEvents]=useState<VerificationEvent[]>([]);
 const [state,setState]=useState<"loading"|"ready"|"login"|"error">("loading");
 const [saving,setSaving]=useState<"perfil"|"empresa"|null>(null);
 const [notice,setNotice]=useState("");
 const load=useCallback(async()=>{
  setState("loading");
  const {data:auth,error:authError}=await supabase.auth.getUser();
  if(authError||!auth.user){setState("login");return;}
  const [requestsResult,responsesResult,timelineResult]=await Promise.all([
   supabase.rpc("dc_my_verification_requests"),
   supabase.rpc("dc_verification_responses",{p_limit:100}),
   supabase.rpc("dc_verification_timeline",{p_limit:500})
  ]);
  if(requestsResult.error||responsesResult.error||timelineResult.error){setState("error");return;}
  setItems((requestsResult.data||[]) as Request[]);
  setResponses((responsesResult.data||[]) as ResponseRow[]);
  setEvents((timelineResult.data||[]) as VerificationEvent[]);setState("ready");
 },[]);
 useEffect(()=>{void load();},[load]);
 const submit=async(type:"perfil"|"empresa")=>{
  if(saving)return;
  setSaving(type);setNotice("");
  try{
   const {error}=await supabase.rpc("dc_request_verification",{p_type:type});
   if(error){setNotice(error.code==="23505"?"Ya tienes una solicitud abierta para esta categoría.":"No se pudo registrar la solicitud. Comprueba el tipo de cuenta y los límites de envío.");return;}
   setNotice("Solicitud registrada. El equipo revisará los datos declarados de tu perfil.");
   await load();
  }catch{setNotice("No se pudo contactar el servicio.");}
  finally{setSaving(null);}
 };
 const open=new Set(items.filter(r=>r.status!=="cerrada").map(r=>r.request_type));
 const responseMap=new Map(responses.map(r=>[r.request_id,r]));
 return <main className="min-h-screen bg-[#071429] px-5 py-20 text-white">
  <section className="mx-auto max-w-5xl">
   <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#facc15]">DealCapital / Expediente</p>
   <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Solicitudes de revisión</h1>
   <p className="mt-5 max-w-3xl text-sm leading-7 text-[#b9cce0]">Solicita una revisión administrativa preliminar de los datos que declaraste en tu perfil o empresa. Esta revisión no comprueba tu identidad ante RENIEC, no acredita cumplimiento KYC/AML y no garantiza inversiones. No adjuntes DNI ni documentación sensible.</p>
   <div className="mt-6 flex gap-4 text-sm"><Link href="/expediente" className="text-[#facc15] underline">Mi expediente</Link><Link href="/perfil" className="text-[#facc15] underline">Actualizar perfil</Link></div>
   {state==="loading"?<p role="status" className="mt-9">Consultando solicitudes…</p>:
    state==="login"?<div className="mt-9 rounded-xl border border-[#425774] p-6">Inicia sesión para continuar. <Link href="/login" className="text-[#facc15] underline">Acceder</Link></div>:
    state==="error"?<div role="alert" className="mt-9 rounded-xl border border-rose-500/40 p-6"><p>No se pudo cargar tu historial.</p><button onClick={()=>void load()} className="mt-3 text-[#facc15] underline">Reintentar</button></div>:
    <>
     <div className="mt-9 grid gap-4 md:grid-cols-2">
      {(["perfil","empresa"] as const).map(type=><article key={type} className="rounded-2xl border border-[#40536d] bg-[#11233c] p-6">
       <h2 className="text-xl font-bold">{type==="perfil"?"Revisión de perfil":"Revisión de empresa"}</h2>
       <p className="mt-2 min-h-16 text-sm leading-6 text-[#b9cce0]">{type==="perfil"?"Revisa los datos de contacto y la información profesional que declaraste.":"Comprueba que los datos de negocio y representación estén completos para una revisión interna."}</p>
       <button type="button" onClick={()=>void submit(type)} disabled={saving!==null||open.has(type)}
        className="mt-5 w-full rounded-xl bg-[#facc15] px-4 py-3 text-sm font-bold text-[#071429] disabled:cursor-not-allowed disabled:opacity-40">
        {saving===type?"Enviando…":open.has(type)?"Solicitud abierta":"Solicitar revisión"}
       </button>
      </article>)}
     </div>
     {notice&&<p role="status" className="mt-5 rounded-lg border border-[#526781] p-3 text-sm">{notice}</p>}
     <h2 className="mt-10 text-2xl font-extrabold">Historial de solicitudes</h2>
     {items.length===0?<p className="mt-4 text-sm text-[#b9cce0]">No tienes solicitudes registradas.</p>:
     <div className="mt-5 space-y-4">{items.map(r=><article key={r.id} className="rounded-2xl border border-[#40536d] bg-[#11233c] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">{r.request_type==="perfil"?"Perfil":"Empresa"} · #{r.id}</h3><span className="rounded-full border border-[#687b93] px-3 py-1 text-xs">{statusLabel[r.status]}</span></div>
      <p className="mt-3 text-xs text-[#9db2ca]">Enviada: {date(r.created_at)} · Actualizada: {date(r.updated_at)}</p>
      {r.review_note&&<p className="mt-4 whitespace-pre-wrap rounded-lg bg-[#071429] p-4 text-sm leading-6 text-[#d6e2f1]"><strong>Observación administrativa:</strong> {r.review_note}</p>}
      {responseMap.get(r.id)&&<p className="mt-3 whitespace-pre-wrap rounded-lg border border-[#3c5976] p-4 text-sm leading-6 text-[#d6e2f1]"><strong>Última subsanación enviada:</strong> {responseMap.get(r.id)?.owner_response}</p>}
      {r.status==="observada"&&<OwnerResponse requestId={r.id} onSubmitted={()=>void load()}/>}
      {r.status==="cerrada"&&<p className="mt-3 text-xs leading-6 text-amber-200">Expediente cerrado administrativamente; no equivale a identidad verificada ni certificación financiera.</p>}
      <VerificationTimeline requestId={r.id} events={events}/>
     </article>)}</div>}
    </>}
  </section>
 </main>;
}