"use client";

import {useState, type FormEvent} from "react";
import {supabase} from "../../lib/supabase";

type Category = "duplicado"|"informacion_incompleta"|"datos_inconsistentes"|"incumplimiento"|"otro";

const categories:{value:Category;label:string;template:string}[]=[
  {value:"duplicado",label:"Propuesta duplicada",template:"Se detectó otro registro de esta misma propuesta. Se rechaza este envío repetido para conservar un expediente único. Referencia del proyecto original: #"},
  {value:"informacion_incompleta",label:"Información incompleta",template:"La propuesta no cuenta con información suficiente para una evaluación responsable. Es necesario precisar los datos y documentos que faltan: "},
  {value:"datos_inconsistentes",label:"Datos inconsistentes",template:"Durante la revisión se encontraron inconsistencias que deben aclararse antes de presentar nuevamente la propuesta. Indica los datos a corregir: "},
  {value:"incumplimiento",label:"Incumplimiento de condiciones",template:"La propuesta no cumple los requisitos de publicación vigentes. Detalla la condición incumplida y cómo corregirla: "},
  {value:"otro",label:"Otro motivo",template:"La propuesta no superó la revisión administrativa. Explica detalladamente las razones verificadas: "}
];

export default function AdminRejectProposal({projectId,onReviewed}:{
 projectId:number;onReviewed:()=>void
}) {
  const [open,setOpen]=useState(false);
  const [category,setCategory]=useState<Category>("duplicado");
  const [reason,setReason]=useState(categories[0].template);
  const [confirmed,setConfirmed]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [success,setSuccess]=useState(false);

  const choose=(c:Category)=>{
    setCategory(c);
    setReason(categories.find(x=>x.value===c)?.template??"");
    setConfirmed(false);
    setError(null);
  };

  const submit=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    if(saving||!confirmed||reason.trim().length<20||reason.trim().length>1000)return;
    setSaving(true);setError(null);setSuccess(false);
    try{
      const {data:auth,error:authError}=await supabase.auth.getUser();
      if(authError||auth.user?.app_metadata?.role!=="admin"){
        setError("Solo un administrador confiable puede rechazar propuestas.");
        return;
      }
      const {error:rpcError}=await supabase.rpc("dc_admin_reject_project",{
        p_project_id:projectId,p_category:category,p_explanation:reason.trim()
      });
      if(rpcError){
        setError("No se pudo registrar el rechazo. Comprueba que siga pendiente y que no haya sido rechazado antes.");
        return;
      }
      setOpen(false);
      setConfirmed(false);
      setSuccess(true);
      onReviewed();
    }catch{
      setError("No fue posible completar la revisión.");
    }finally{setSaving(false);}
  };

  return <div className="mt-2 max-w-[310px]">
    <button type="button" onClick={()=>{setOpen(v=>!v);setError(null);}}
      aria-expanded={open} aria-controls={"dc-reject-"+projectId}
      className="rounded-lg border border-rose-500/50 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-950/40">
      {open?"Cerrar rechazo":"Rechazar propuesta"}
    </button>
    {success&&<p role="status" className="mt-2 text-xs text-emerald-200">Rechazo registrado. Notificación enviada al propietario.</p>}
    {open&&<form id={"dc-reject-"+projectId} onSubmit={submit}
      className="mt-3 space-y-3 rounded-xl border border-rose-500/40 bg-[#231c2d] p-4">
      <strong className="block text-xs text-rose-100">Rechazo con trazabilidad</strong>
      <p className="text-[11px] leading-5 text-[#e6d7df]">
        El propietario recibirá una explicación automática. La eliminación se programará para dentro de 7 días.
        No se borrarán registros que tengan compromisos, conversaciones, interesados, favoritos,
        auditorías anteriores o archivos vinculados.
      </p>
      <label className="block text-xs font-semibold text-white">
        Motivo
        <select value={category} onChange={e=>choose(e.target.value as Category)}
          className="mt-2 w-full rounded-lg border border-[#516380] bg-[#09162b] p-2 text-xs">
          {categories.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}
        </select>
      </label>
      <label className="block text-xs font-semibold text-white">
        Justificación enviada al emprendedor
        <textarea value={reason} rows={5} minLength={20} maxLength={1000} required
          onChange={e=>setReason(e.target.value)}
          className="mt-2 w-full resize-y rounded-lg border border-[#516380] bg-[#09162b] p-2 text-xs leading-5"
          placeholder="Explica el motivo y las evidencias concretas."/>
      </label>
      <span className="block text-[11px] text-[#c5b7c8]">{reason.trim().length}/1000 caracteres</span>
      <label className="flex items-start gap-2 text-[11px] leading-5 text-[#eddbdf]">
        <input type="checkbox" required checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}
          className="mt-1 accent-rose-500"/>
        He comprobado el expediente. Confirmo el rechazo, la notificación y su programación de eliminación.
      </label>
      {error&&<p role="alert" className="text-xs text-rose-200">{error}</p>}
      <button type="submit" disabled={saving||!confirmed||reason.trim().length<20||reason.trim().length>1000}
        className="w-full rounded-lg bg-rose-600 px-3 py-2.5 text-xs font-extrabold text-white disabled:opacity-45">
        {saving?"Registrando rechazo…":"Confirmar rechazo"}
      </button>
    </form>}
    {error&&!open&&<p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}
  </div>;
}
