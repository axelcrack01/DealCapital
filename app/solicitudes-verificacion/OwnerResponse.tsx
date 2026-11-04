"use client";
import {useState,type FormEvent} from "react";
import {supabase} from "../../lib/supabase";

export default function OwnerResponse({requestId,onSubmitted}:{requestId:number;onSubmitted:()=>void}){
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const response=message.trim();
  if(busy||response.length<20||response.length>1000)return;
  setBusy(true);setError("");
  try{
   const {error:rpcError}=await supabase.rpc("dc_submit_verification_response",{
    p_request_id:requestId,p_response:response
   });
   if(rpcError){setError("No se pudo registrar la subsanación. Comprueba si la solicitud sigue observada o si agotaste el límite de respuestas.");return;}
   setMessage("");onSubmitted();
  }catch{setError("No se pudo contactar el servicio de revisión.");}
  finally{setBusy(false);}
 }
 return <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-amber-500/30 p-4">
  <p className="text-sm font-bold text-amber-100">Responder a la observación</p>
  <p className="text-xs leading-6 text-[#bacce0]">Primero actualiza los datos indicados en Mi perfil. Describe los cambios realizados (20–1000 caracteres). No ingreses DNI, cuentas bancarias ni documentos de identidad.</p>
  <label className="block text-xs font-semibold">
   Detalle de la corrección
   <textarea value={message} onChange={e=>setMessage(e.target.value)} minLength={20} maxLength={1000} rows={4} required
    placeholder="Indica qué información actualizaste para que el administrador pueda volver a evaluarla."
    className="mt-2 w-full resize-y rounded-lg border border-[#63768e] bg-[#071429] p-3 text-sm text-white"/>
  </label>
  {error&&<p role="alert" className="text-xs text-rose-200">{error}</p>}
  <button type="submit" disabled={busy||message.trim().length<20||message.trim().length>1000}
   className="rounded-lg bg-[#facc15] px-4 py-3 text-sm font-bold text-[#071429] disabled:cursor-not-allowed disabled:opacity-40">
   {busy?"Enviando…":"Enviar subsanación"}
  </button>
 </form>;
}