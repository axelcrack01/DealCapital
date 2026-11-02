"use client";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";

type Entry = {
 id:number; project_id:number; actor_id:string;
 old_published:boolean|null; new_published:boolean;
 reason:string; reviewed_at:string;
};

export default function AdminReviewHistory({refreshToken}:{refreshToken:number}) {
 const [entries,setEntries]=useState<Entry[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 useEffect(()=>{
   let active=true;
   async function load(){
     setLoading(true);
     const {data,error}=await supabase.rpc("dc_admin_review_history",{p_limit:20});
     if(!active)return;
     if(error){setError(true);setEntries([]);}
     else{setError(false);setEntries((data||[]) as Entry[]);}
     setLoading(false);
   }
   void load();
   return()=>{active=false;};
 },[refreshToken]);
 return <section className="rounded-2xl border border-[#334660] bg-[#0e2039] p-6 lg:col-span-2"
   aria-labelledby="dc-admin-history-title">
   <div className="mb-4 flex items-center justify-between gap-3">
     <div><p className="text-[11px] font-bold uppercase tracking-widest text-[#facc15]">Auditoría</p>
       <h3 id="dc-admin-history-title" className="mt-2 text-xl font-bold">Revisiones registradas</h3></div>
     <span className="text-[11px] text-[#9eb3ce]">Últimas 20</span>
   </div>
   {loading ? <p role="status" className="py-3 text-xs text-[#b7c8db]">Consultando auditoría…</p>
    : error ? <p role="alert" className="py-3 text-xs text-rose-300">No se pudo consultar el historial. Comprueba tu autorización.</p>
    : entries.length===0 ? <p className="py-4 text-xs text-[#b7c8db]">Todavía no hay decisiones registradas por este sistema.</p>
    : <div className="divide-y divide-[#32445d]">
      {entries.map(entry=><div key={entry.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-start">
        <div><p className="text-xs font-bold">Proyecto #{entry.project_id} · {entry.new_published?"Publicado":"Retirado"}</p>
          <p className="mt-2 max-w-xl break-words text-xs leading-6 text-[#bbcbe0]">{entry.reason}</p></div>
        <div className="shrink-0 text-[11px] text-[#98aac2]">
          <span>{new Intl.DateTimeFormat("es-PE",{dateStyle:"short",timeStyle:"short"}).format(new Date(entry.reviewed_at))}</span>
          <small className="mt-1 block" title={entry.actor_id}>Evento #{entry.id}</small>
        </div>
      </div>)}
    </div>}
 </section>;
}
