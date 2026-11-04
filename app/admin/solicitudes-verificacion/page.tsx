"use client";
import Link from "next/link";
import VerificationTimeline,{type VerificationEvent} from "../../components/VerificationTimeline";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {supabase} from "../../../lib/supabase";
type Status="pendiente"|"en_revision"|"observada"|"cerrada";
type ResponseRow={request_id:number;owner_response:string;owner_response_at:string};
type Request={id:number;owner_id:string;request_type:"perfil"|"empresa";status:Status;review_note:string|null;created_at:string;updated_at:string};
const stateNames:Record<Status,string>={pendiente:"Pendiente",en_revision:"En revisión",observada:"Observada",cerrada:"Cerrada"};
function Review({item,onSaved}:{item:Request;onSaved:()=>void}){
 const [status,setStatus]=useState<Status>("en_revision");
 const [note,setNote]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const submit=async(e:FormEvent)=>{
  e.preventDefault();
  if(busy||status===item.status||note.trim().length<20||note.trim().length>1000)return;
  setBusy(true);setError("");
  try{
   const {error:rpcError}=await supabase.rpc("dc_admin_review_verification",{p_request_id:item.id,p_status:status,p_note:note.trim()});
   if(rpcError){setError("No se pudo registrar la decisión. Verifica que el estado y motivo sean válidos.");return;}
   setNote("");onSaved();
  }catch{setError("No se pudo contactar el servicio.");}
  finally{setBusy(false);}
 };
 if(item.status==="cerrada")return <p className="mt-3 text-xs text-[#a7bdd4]">Solicitud cerrada; no se permiten nuevas decisiones.</p>;
 return <form onSubmit={submit} className="mt-4 space-y-3">
  <label className="block text-xs font-semibold">Estado de revisión
   <select value={status} onChange={e=>setStatus(e.target.value as Status)} className="mt-2 w-full rounded-lg border border-[#4c627e] bg-[#071429] p-3 text-sm">
    <option value="en_revision">En revisión</option><option value="observada">Observada</option><option value="cerrada">Cerrada administrativamente</option>
   </select>
  </label>
  <label className="block text-xs font-semibold">Justificación y próximos pasos (20–1000 caracteres)
   <textarea rows={3} minLength={20} maxLength={1000} required value={note} onChange={e=>setNote(e.target.value)}
    placeholder="Registra qué se revisó y qué debe corregirse. No pegues datos de identidad sensibles."
    className="mt-2 w-full rounded-lg border border-[#4c627e] bg-[#071429] p-3 text-sm"/>
  </label>
  {error&&<p role="alert" className="text-xs text-rose-300">{error}</p>}
  <button disabled={busy||status===item.status||note.trim().length<20||note.trim().length>1000}
   type="submit" className="rounded-xl bg-[#facc15] px-5 py-3 text-sm font-bold text-[#071429] disabled:cursor-not-allowed disabled:opacity-40">
   {busy?"Registrando…":"Registrar decisión con auditoría"}
  </button>
 </form>;
}
export default function AdminVerification(){
 const [access,setAccess]=useState<"loading"|"allowed"|"denied">("loading");
 const [items,setItems]=useState<Request[]>([]);
 const [responses,setResponses]=useState<ResponseRow[]>([]);
 const [events,setEvents]=useState<VerificationEvent[]>([]);
 const [error,setError]=useState("");
 const [refresh,setRefresh]=useState(0);
 const load=useCallback(async()=>{
  setAccess("loading");setError("");
  try{
   const {data:auth,error:authErr}=await supabase.auth.getUser();
   if(authErr||!auth.user||auth.user.app_metadata?.role!=="admin"){setAccess("denied");return;}
   const [queue,replies,timeline]=await Promise.all([
    supabase.rpc("dc_admin_verification_queue",{p_limit:100}),
    supabase.rpc("dc_verification_responses",{p_limit:100}),
    supabase.rpc("dc_verification_timeline",{p_limit:500})
   ]);
   if(queue.error||replies.error||timeline.error){setError("No se pudo consultar la cola administrativa.");setAccess("denied");return;}
   setItems((queue.data||[]) as Request[]);
   setResponses((replies.data||[]) as ResponseRow[]);
   setEvents((timeline.data||[]) as VerificationEvent[]);setAccess("allowed");
  }catch{setError("No se pudo conectar al servicio.");setAccess("denied");}
 },[]);
 useEffect(()=>{void load();},[load,refresh]);
 const responseMap=new Map(responses.map(r=>[r.request_id,r]));
 return <main className="min-h-screen bg-[#071429] px-5 py-20 text-white"><section className="mx-auto max-w-5xl">
  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#facc15]">DealCapital / Administración</p>
  <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Revisión de expedientes</h1>
  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#b9cce0]">Trámite administrativo preliminar. Ninguna acción aquí acredita identidad civil, representación legal ni cumplimiento KYC/AML. Cada decisión se registra en auditoría.</p>
  <Link href="/admin" className="mt-5 inline-block text-sm font-bold text-[#facc15] underline">Volver al panel de administración</Link>
  {access==="loading"?<p role="status" className="mt-9">Verificando permisos…</p>:access==="denied"?
   <div role="alert" className="mt-9 rounded-xl border border-rose-500/40 p-5"><p>{error||"No tienes autorización para acceder a estas solicitudes."}</p><button onClick={()=>setRefresh(x=>x+1)} className="mt-3 text-sm text-[#facc15] underline">Reintentar</button></div>:
   items.length===0?<div className="mt-9 rounded-xl border border-[#435871] p-6">No existen solicitudes registradas.</div>:
   <div className="mt-9 space-y-5">{items.map(item=><article key={item.id} className="rounded-2xl border border-[#435871] bg-[#11233c] p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Solicitud #{item.id} · {item.request_type==="perfil"?"Perfil":"Empresa"}</h2><span className="rounded-full border border-[#667f9e] px-3 py-1 text-xs">{stateNames[item.status]}</span></div>
    <p className="mt-2 break-all text-xs text-[#adc2d9]">ID del solicitante: {item.owner_id}</p>
    <p className="mt-2 text-xs text-[#adc2d9]">Registrada: {new Intl.DateTimeFormat("es-PE",{dateStyle:"medium",timeZone:"America/Lima"}).format(new Date(item.created_at))}</p>
    {item.review_note&&<p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#071429] p-4 text-sm"><strong>Última observación:</strong> {item.review_note}</p>}
    {responseMap.get(item.id)&&<p className="mt-3 whitespace-pre-wrap rounded-xl border border-[#60718a] p-4 text-sm"><strong>Última subsanación:</strong> {responseMap.get(item.id)?.owner_response}</p>}
    <Review item={item} onSaved={()=>setRefresh(x=>x+1)}/>
    <VerificationTimeline requestId={item.id} events={events}/>
   </article>)}</div>}
 </section></main>;
}