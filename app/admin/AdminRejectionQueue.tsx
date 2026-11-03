"use client";

import {useEffect,useState,type FormEvent} from "react";
import {supabase} from "../../lib/supabase";
import AdminRetentionControls,{type HoldState} from "./AdminRetentionControls";

type Rejection={
 project_id:number;project_title:string;category:string;explanation:string;
 rejected_at:string;delete_after:string;purged_at:string|null;
 dependencies:number;has_files:boolean;can_purge:boolean;
};
const fmt=(v:string)=>new Intl.DateTimeFormat("es-PE",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Lima"}).format(new Date(v));
const categoryLabel:Record<string,string>={
 duplicado:"Duplicada",
 informacion_incompleta:"Información incompleta",
 datos_inconsistentes:"Datos inconsistentes",
 incumplimiento:"Incumplimiento",
 otro:"Otro"
};
export default function AdminRejectionQueue({refreshToken,onReviewed}:{
 refreshToken:number;onReviewed:()=>void
}){
 const [records,setRecords]=useState<Rejection[]>([]);
 const [holds,setHolds]=useState<Record<number,HoldState>>({});
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const [restoring,setRestoring]=useState<number|null>(null);
 const [reason,setReason]=useState("");
 const [saving,setSaving]=useState(false);

 useEffect(()=>{
   let active=true;
   const load=async()=>{
     setLoading(true);
     const [queueResult,holdResult]=await Promise.all([
       supabase.rpc("dc_admin_rejection_queue",{p_limit:100}),
       supabase.rpc("dc_admin_retention_holds")
     ]);
     if(!active)return;
     if(queueResult.error||holdResult.error){
       setError("No se pudo consultar la cola de rechazos y sus bloqueos de conservación.");
       setRecords([]);setHolds({});
     }else{
       const mapped:Record<number,HoldState>={};
       for(const hold of (holdResult.data||[]) as HoldState[])mapped[hold.project_id]=hold;
       setHolds(mapped);
       setError(null);
       setRecords((queueResult.data||[]) as Rejection[]);
     }
     setLoading(false);
   };
   void load();
   return()=>{active=false;};
 },[refreshToken]);

 const restore=async(e:FormEvent<HTMLFormElement>)=>{
   e.preventDefault();
   if(restoring===null||saving||reason.trim().length<20||reason.trim().length>1000)return;
   setSaving(true);setError(null);
   try{
     const {error:rpcError}=await supabase.rpc("dc_admin_restore_rejected_project",{
       p_project_id:restoring,p_reason:reason.trim()
     });
     if(rpcError){setError("No se pudo anular el rechazo. Comprueba que el proyecto siga disponible.");return;}
     setRestoring(null);setReason("");
     onReviewed();
   }catch{setError("Error de conexión al restaurar la propuesta.");}
   finally{setSaving(false);}
 };

 return <section className="rounded-2xl border border-[#334660] bg-[#0e2039] p-6 lg:col-span-2"
  aria-labelledby="dc-rejections-title">
   <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
     <div>
       <p className="text-[11px] font-bold uppercase tracking-widest text-[#facc15]">Trazabilidad</p>
       <h3 id="dc-rejections-title" className="mt-2 text-xl font-bold">Rechazos y eliminación programada</h3>
       <p className="mt-2 text-xs leading-6 text-[#b2c4d9]">
         El plazo es de siete días. Puedes suspender la eliminación por motivos de conservación.
         La purga exige ausencia de actividad, auditorías previas, archivos y bloqueos activos. Cada decisión queda registrada.
       </p>
     </div>
     <span className="rounded-full border border-[#405778] px-3 py-2 text-xs text-[#d1deee]">
       {records.filter(r=>!r.purged_at).length} activos
     </span>
   </div>
   {error&&<p role="alert" className="mt-4 rounded-lg border border-rose-500/40 p-3 text-xs text-rose-200">{error}</p>}
   {loading?<p role="status" className="mt-5 text-xs text-[#b7c8df]">Consultando rechazos…</p>
   :records.length===0?<p className="mt-5 rounded-xl border border-[#3c526e] p-5 text-xs text-[#b7c8df]">Todavía no se registraron rechazos.</p>
   :<div className="mt-6 space-y-3">
      {records.map(r=>{
        const expired=new Date(r.delete_after).getTime()<=Date.now();
        const archived=!!r.purged_at;
        const blocked=r.dependencies>0||r.has_files;
        const hold=holds[r.project_id];
        const preserved=hold?.retention_hold===true;
        return <article key={r.project_id} className="rounded-xl border border-[#334760] bg-[#10213a] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm">{r.project_title} <span className="text-[#9fb2c9]">#{r.project_id}</span></strong>
            <span className={"rounded-full border px-2.5 py-1 text-[11px] font-bold "+
              (archived?"border-slate-500 text-slate-300":preserved?"border-amber-500 text-amber-200":blocked?"border-amber-500 text-amber-200":"border-rose-500/70 text-rose-200")}>
              {archived?"Contenido eliminado":preserved?"Conservación activa":blocked?"Retenido por dependencias":expired?"Eliminación pendiente":"Eliminación programada"}
            </span>
          </div>
          <p className="mt-2 text-xs font-bold text-[#f9d3d8]">{categoryLabel[r.category]||r.category}</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-[#c9d7e8]">{r.explanation}</p>
          <p className="mt-3 text-[11px] text-[#9eb4cd]">
            Rechazado: {fmt(r.rejected_at)} · Eliminación a partir de: {fmt(r.delete_after)}
            {r.purged_at?" · Eliminado: "+fmt(r.purged_at):""}
          </p>
          {blocked&&!archived&&!preserved&&<p className="mt-2 text-[11px] leading-5 text-amber-200">
            La eliminación queda bloqueada por {r.dependencies} relaciones históricas
            {r.has_files?" y archivos asociados":""}. No se borrarán automáticamente esas evidencias.
          </p>}
          {!archived&&<AdminRetentionControls projectId={r.project_id} hold={hold} deadlineReached={expired} hasFiles={r.has_files} dependencies={r.dependencies} onUpdated={onReviewed}/>}
          {preserved&&!archived&&<p className="mt-3 text-[11px] leading-5 text-amber-200">Para restaurar primero debes levantar el bloqueo de conservación mediante una decisión auditada.</p>}
          {!archived&&!preserved&&<div className="mt-3">
            {restoring===r.project_id?<form onSubmit={restore} className="max-w-lg space-y-3">
              <label className="block text-xs font-bold">Justificación para anular el rechazo
                <textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)}
                  minLength={20} maxLength={1000} required
                  className="mt-2 w-full rounded-lg border border-[#526a88] bg-[#07182e] p-3 text-xs text-white"/>
              </label>
              <div className="flex gap-3">
                <button type="submit" disabled={saving||reason.trim().length<20}
                  className="rounded-lg bg-[#facc15] px-4 py-2 text-xs font-bold text-[#020817] disabled:opacity-40">
                  {saving?"Restaurando…":"Restaurar a pendiente"}
                </button>
                <button type="button" onClick={()=>{setRestoring(null);setReason("");}} className="text-xs text-[#d4e0ed]">Cancelar</button>
              </div>
            </form>
            :<button type="button" onClick={()=>{setRestoring(r.project_id);setReason("");setError(null);}}
              className="text-xs font-bold text-[#facc15] underline underline-offset-2">Anular rechazo</button>}
          </div>}
        </article>;
      })}
   </div>}
 </section>;
}
