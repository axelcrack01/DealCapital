"use client";

import {useState, type FormEvent} from "react";
import {supabase} from "../../lib/supabase";

type Props = {
  projectId: number;
  published: boolean;
  onReviewed: () => void;
};

export default function AdminProjectReview({projectId,published,onReviewed}: Props) {
  const [expanded,setExpanded]=useState(false);
  const [reason,setReason]=useState("");
  const [confirmed,setConfirmed]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const target = !published;

  const submit = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if(saving || !confirmed || reason.trim().length < 20 || reason.trim().length > 1000) return;
    setSaving(true);
    setError(null);
    try {
      const {data:auth,error:authError} = await supabase.auth.getUser();
      if(authError || auth.user?.app_metadata?.role !== "admin") {
        setError("Tu cuenta no tiene autorización administrativa confiable.");
        return;
      }
      // The server-side RPC verifies the trusted role again using auth.users,
      // locks the project row and writes an audit event in the same transaction.
      const {error:rpcError} = await supabase.rpc("dc_admin_review_project",{
        p_project_id: projectId, p_publish: target, p_reason: reason.trim()
      });
      if(rpcError) {
        setError("No se pudo registrar la decisión. Comprueba los permisos, el motivo y el estado actual.");
        return;
      }
      setExpanded(false);
      setReason("");
      setConfirmed(false);
      onReviewed();
    } catch {
      setError("No se pudo contactar el servicio de revisión.");
    } finally {setSaving(false);}
  };

  return <div className="min-w-[185px]">
    <button type="button" onClick={()=>{setExpanded(v=>!v);setError(null);}}
      className="rounded-lg border border-[#5d7292] px-3 py-2 text-xs font-bold text-white hover:border-[#facc15] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#facc15]"
      aria-expanded={expanded} aria-controls={"dc-review-"+projectId}>
      {expanded?"Cancelar":"Revisar publicación"}
    </button>
    {expanded && <form id={"dc-review-"+projectId} onSubmit={submit}
      className="mt-3 w-[min(280px,70vw)] space-y-3 rounded-xl border border-[#516380] bg-[#12243e] p-4">
      <p className="text-xs font-bold text-[#facc15]">
        {target?"Autorizar la publicación":"Retirar la publicación"}
      </p>
      <p className="text-[11px] leading-5 text-[#bdcce0]">
        Esta decisión cambia la visibilidad pública del proyecto. No certifica identidad, finanzas ni rentabilidad.
      </p>
      <label className="block text-[11px] font-semibold text-white">
        Motivo de la decisión
        <textarea required minLength={20} maxLength={1000} rows={3}
          className="mt-2 w-full resize-y rounded-lg border border-[#516380] bg-[#061226] p-2 text-xs text-white outline-none focus:border-[#facc15]"
          placeholder="Describe los criterios de revisión (mín. 20 caracteres)."
          value={reason} onChange={e=>setReason(e.target.value)}/>
      </label>
      <label className="flex items-start gap-2 text-[11px] leading-5 text-[#d1deef]">
        <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}
          required className="mt-1 accent-[#facc15]"/>
        Confirmo que revisé esta decisión y que quedará registrada en auditoría.
      </label>
      {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
      <button type="submit" disabled={saving||!confirmed||reason.trim().length<20}
        className="w-full rounded-lg bg-[#facc15] px-3 py-2.5 text-xs font-extrabold text-[#020817] disabled:cursor-not-allowed disabled:opacity-45">
        {saving?"Registrando...":target?"Aprobar publicación":"Retirar publicación"}
      </button>
    </form>}
  </div>;
}
