"use client";

import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";

type RetentionEvent={
 id:number;project_id:number;actor_id:string;action:string;
 reason:string;created_at:string;
};
const label:Record<string,string>={
 hold_applied:"Conservación activada",
 hold_released:"Conservación levantada",
 content_purged:"Contenido del expediente eliminado",
 private_files_retired:"PDF privados retirados"
};
export default function AdminRetentionHistory({refreshToken}:{refreshToken:number}){
 const [events,setEvents]=useState<RetentionEvent[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 useEffect(()=>{
   let live=true;
   const load=async()=>{
     setLoading(true);
     const {data,error:rpcError}=await supabase.rpc("dc_admin_retention_events",{p_limit:30});
     if(!live)return;
     setError(!!rpcError);
     setEvents(rpcError?[]:(data||[]) as RetentionEvent[]);
     setLoading(false);
   };
   void load();
   return()=>{live=false;};
 },[refreshToken]);
 const fmt=(s:string)=>new Intl.DateTimeFormat("es-PE",{
  dateStyle:"short",timeStyle:"short",timeZone:"America/Lima"
 }).format(new Date(s));

 return <section className="rounded-2xl border border-[#334660] bg-[#0e2039] p-6 lg:col-span-2"
   aria-labelledby="dc-retention-history-title">
   <div className="flex flex-wrap justify-between gap-4">
     <div>
       <p className="text-[11px] font-bold uppercase tracking-widest text-[#facc15]">Custodia y cumplimiento</p>
       <h3 id="dc-retention-history-title" className="mt-2 text-xl font-bold">Registro de conservación documental</h3>
       <p className="mt-2 text-xs leading-6 text-[#b2c4d9]">
         Eventos de conservación, liberación, eliminación de contenido y retirada de archivos.
         Las evidencias de decisiones se mantienen en un esquema privado.
       </p>
     </div>
     <span className="text-[11px] text-[#9eb3ce]">Últimos 30 eventos</span>
   </div>
   {loading?<p role="status" className="mt-5 text-xs text-[#b7c8df]">Consultando auditoría…</p>
   :error?<p role="alert" className="mt-5 text-xs text-rose-300">No fue posible cargar el historial de custodia.</p>
   :events.length===0?<p className="mt-5 text-xs text-[#b7c8df]">No hay eventos de conservación registrados.</p>
   :<div className="mt-5 divide-y divide-[#334760]">
     {events.map(e=><article key={e.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-start">
       <div className="max-w-3xl">
         <strong className="text-xs text-white">{label[e.action]||e.action} · Proyecto #{e.project_id}</strong>
         <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-[#c7d5e6]">{e.reason}</p>
       </div>
       <div className="shrink-0 text-[11px] text-[#9eb2ca]">
         <span>{fmt(e.created_at)}</span><small className="mt-1 block">Evento #{e.id}</small>
       </div>
     </article>)}
   </div>}
 </section>;
}
