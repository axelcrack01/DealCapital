"use client";

export type VerificationEvent={
 event_id:number;
 request_id:number;
 event_type:"created"|"status_changed";
 previous_status:string|null;
 new_status:string;
 note:string|null;
 actor_kind:"emprendedor"|"administrador";
 created_at:string;
};

const labels:Record<string,string>={
 pendiente:"Pendiente",en_revision:"En revisión",observada:"Observada",cerrada:"Cerrada"
};
const time=(s:string)=>{
 const d=new Date(s);
 return Number.isNaN(d.getTime())?"Sin fecha":new Intl.DateTimeFormat("es-PE",{
  dateStyle:"medium",timeStyle:"short",timeZone:"America/Lima"
 }).format(d);
};

export default function VerificationTimeline({
 events,requestId
}:{events:VerificationEvent[];requestId:number}){
 const sorted=events.filter(e=>e.request_id===requestId).slice().reverse();
 return <section className="mt-5 border-t border-[#3e526d] pt-5" aria-label={"Historial de solicitud "+requestId}>
  <h4 className="text-sm font-bold text-[#facc15]">Línea de tiempo de revisión</h4>
  {sorted.length===0?<p className="mt-3 text-xs text-[#afc2d8]">No hay eventos disponibles para esta solicitud.</p>:
  <ol className="mt-4 space-y-4 border-l border-[#536785] pl-5">
   {sorted.map(e=><li key={e.event_id} className="relative">
    <span aria-hidden="true" className="absolute -left-[25px] top-1 size-2 rounded-full bg-[#facc15]"/>
    <div className="flex flex-wrap items-baseline justify-between gap-2">
     <p className="text-xs font-bold text-white">
      {e.event_type==="created"?"Solicitud registrada":
       e.actor_kind==="emprendedor"?"Subsanación enviada":
       "Cambio de estado: "+(labels[e.new_status]||e.new_status)}
     </p>
     <time className="text-[11px] text-[#a0b5cd]" dateTime={e.created_at}>{time(e.created_at)}</time>
    </div>
    <p className="mt-1 text-[11px] text-[#a0b5cd]">Actor: {e.actor_kind==="administrador"?"Administración":"Emprendedor"}</p>
    {e.note&&<p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-[#071429] p-3 text-xs leading-6 text-[#d3e1f0]">{e.note}</p>}
   </li>)}
  </ol>}
  <p className="mt-4 text-[11px] leading-5 text-[#91a8c2]">Los eventos reflejan actuaciones administrativas; no certifican identidad ni cumplimiento KYC/AML.</p>
 </section>;
}
