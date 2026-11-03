"use client";

import {useState,type FormEvent} from "react";
import {supabase} from "../../lib/supabase";

export type HoldState={
  project_id:number;
  retention_hold:boolean;
  retention_hold_reason:string|null;
  retention_hold_at:string|null;
};

export default function AdminRetentionControls({
 projectId,hold,deadlineReached,hasFiles,dependencies,onUpdated
}:{
 projectId:number;
 hold:HoldState|undefined;
 deadlineReached:boolean;
 hasFiles:boolean;
 dependencies:number;
 onUpdated:()=>void;
}){
 const [form,setForm]=useState<"hold"|"documents"|null>(null);
 const [reason,setReason]=useState("");
 const [confirmation,setConfirmation]=useState(false);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState<string|null>(null);
 const held=hold?.retention_hold===true;
 const canConsiderDocuments=deadlineReached&&!held&&hasFiles&&dependencies===0;

 const submitHold=async(e:FormEvent<HTMLFormElement>)=>{
   e.preventDefault();
   if(saving||reason.trim().length<20||reason.trim().length>1000||!confirmation)return;
   setSaving(true);setError(null);setSuccess(null);
   try{
     const {error:rpcError}=await supabase.rpc("dc_admin_set_retention_hold",{
       p_project_id:projectId,p_enabled:!held,p_reason:reason.trim()
     });
     if(rpcError){setError("No se pudo modificar la conservación. Revisa el estado y la autorización.");return;}
     setSuccess(held?"Conservación liberada. El plazo original continúa vigente.":"Bloqueo de conservación activado. No se realizará la purga.");
     setForm(null);setReason("");setConfirmation(false);onUpdated();
   }catch{setError("No se pudo registrar la decisión de conservación.");}
   finally{setSaving(false);}
 };

 const retirePrivateDocs=async()=>{
   if(saving||!confirmation||!canConsiderDocuments)return;
   setSaving(true);setError(null);setSuccess(null);
   try{
     const {data,error:rpcError}=await supabase.functions.invoke("dc-retire-private-documents",{
       body:{project_id:projectId}
     });
     if(rpcError||!data||data.status!=="completed"){
       setError("La retirada no pudo completarse. Verifica que el plazo haya vencido, que sean PDFs privados y que no existan relaciones o archivos compartidos.");
       return;
     }
     setSuccess("PDF privados retirados mediante Storage. Se conservó la auditoría y se revisará la purga del expediente en la siguiente ejecución programada.");
     setForm(null);setConfirmation(false);onUpdated();
   }catch{setError("La solicitud de retirada de archivos falló.");}
   finally{setSaving(false);}
 };

 return <div className="mt-4 space-y-3 border-t border-[#334760] pt-4">
   <div className="flex flex-wrap gap-3">
     <button type="button"
       onClick={()=>{setForm(form==="hold"?null:"hold");setReason("");setConfirmation(false);setError(null);}}
       className="rounded-lg border border-amber-600/55 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-950/30">
       {held?"Levantar conservación":"Suspender eliminación"}
     </button>
     {canConsiderDocuments&&<button type="button"
       onClick={()=>{setForm(form==="documents"?null:"documents");setConfirmation(false);setError(null);}}
       className="rounded-lg border border-rose-500/45 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-950/30">
       Retirar PDFs privados
     </button>}
   </div>
   {held&&<p className="text-xs leading-5 text-amber-200">Conservación activa.
     {hold?.retention_hold_reason?" Motivo: "+hold.retention_hold_reason:""}
   </p>}
   {form==="hold"&&<form onSubmit={submitHold}
     className="max-w-xl space-y-3 rounded-xl border border-amber-500/35 bg-[#2b281b] p-4">
     <p className="text-xs font-semibold text-amber-100">
       {held?"Liberar el expediente para la purga al vencer el plazo":"Detener la eliminación automática"}
     </p>
     <label className="block text-xs text-white">
       Justificación obligatoria
       <textarea value={reason} onChange={e=>setReason(e.target.value)}
         required minLength={20} maxLength={1000} rows={3}
         className="mt-2 block w-full rounded-lg border border-amber-600/40 bg-[#101927] p-3 text-xs"/>
     </label>
     <label className="flex gap-2 text-[11px] leading-5 text-amber-100">
       <input type="checkbox" checked={confirmation}
         onChange={e=>setConfirmation(e.target.checked)} className="mt-1 accent-amber-500"/>
       Confirmo que esta decisión quedará registrada en la auditoría.
     </label>
     <button type="submit" disabled={saving||!confirmation||reason.trim().length<20}
       className="rounded-lg bg-[#facc15] px-4 py-2 text-xs font-bold text-[#020817] disabled:opacity-45">
       {saving?"Registrando…":held?"Confirmar liberación":"Activar conservación"}
     </button>
   </form>}
   {form==="documents"&&<div className="max-w-xl space-y-3 rounded-xl border border-rose-500/40 bg-rose-950/15 p-4">
     <p className="text-xs font-bold text-rose-100">Retirada permanente de PDFs privados</p>
     <p className="text-[11px] leading-5 text-slate-300">
       Solo se retirarán PDFs privados con propiedad comprobada, sin operaciones ni referencias compartidas.
       Esta eliminación física no se puede deshacer. Los documentos externos y las imágenes quedan retenidos
       para una revisión separada. La fecha mínima de conservación ya debe haberse cumplido.
     </p>
     <label className="flex gap-2 text-[11px] leading-5 text-rose-100">
       <input type="checkbox" checked={confirmation}
         onChange={e=>setConfirmation(e.target.checked)} className="mt-1 accent-rose-500"/>
       Comprendo que los archivos se eliminarán permanentemente y autorizo la operación.
     </label>
     <button type="button" disabled={saving||!confirmation} onClick={()=>void retirePrivateDocs()}
       className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-45">
       {saving?"Comprobando y retirando…":"Confirmar retirada controlada"}
     </button>
   </div>}
   {error&&<p role="alert" className="text-xs text-rose-200">{error}</p>}
   {success&&<p role="status" className="text-xs text-emerald-200">{success}</p>}
 </div>;
}
