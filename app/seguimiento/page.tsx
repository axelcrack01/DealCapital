"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";

type Project={
  id:number; nombre_proyecto:string|null; estado:string|null;
  proyecto_verificado:boolean|null; capital_requerido:number|null; created_at:string|null;
};
type Rejection={
  project_id:number; project_title:string; category:string; explanation:string;
  rejected_at:string; delete_after:string; purged_at:string|null; canceled_at:string|null;
};
type Hold={project_id:number; retention_hold:boolean; retention_hold_at:string|null};

const date=(value:string|null|undefined)=>{
  if(!value)return "No disponible";
  const parsed=new Date(value);
  if(Number.isNaN(parsed.getTime()))return "No disponible";
  return new Intl.DateTimeFormat("es-PE",{dateStyle:"medium",timeZone:"America/Lima"}).format(parsed);
};
const currency=(value:number|null)=>new Intl.NumberFormat("es-PE",{
  style:"currency",currency:"PEN",maximumFractionDigits:0
}).format(Number(value||0));

export default function SeguimientoPropuestas(){
  const [projects,setProjects]=useState<Project[]>([]);
  const [rejections,setRejections]=useState<Rejection[]>([]);
  const [holds,setHolds]=useState<Hold[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [refresh,setRefresh]=useState(0);

  useEffect(()=>{
    let alive=true;
    async function load(){
      setLoading(true);setError(null);
      const {data:auth,error:authError}=await supabase.auth.getUser();
      if(!alive)return;
      if(authError||!auth.user){
        setError("Debes iniciar sesión para consultar tus propuestas.");
        setLoading(false);return;
      }
      try{
        const [projectsResponse,rejectionsResponse,holdsResponse]=await Promise.all([
          supabase.from("proyectos")
            .select("id,nombre_proyecto,estado,proyecto_verificado,capital_requerido,created_at")
            .eq("user_id",auth.user.id).order("created_at",{ascending:false}).limit(100),
          supabase.rpc("dc_my_rejected_projects"),
          supabase.rpc("dc_my_retention_holds")
        ]);
        if(!alive)return;
        if(projectsResponse.error||rejectionsResponse.error||holdsResponse.error){
          setError("No fue posible consultar toda la información. Vuelve a intentar.");
          setProjects([]);setRejections([]);setHolds([]);
        }else{
          setProjects((projectsResponse.data||[]) as Project[]);
          setRejections((rejectionsResponse.data||[]) as Rejection[]);
          setHolds((holdsResponse.data||[]) as Hold[]);
        }
      }catch{
        if(alive)setError("No se pudo contactar el servicio de seguimiento.");
      }finally{
        if(alive)setLoading(false);
      }
    }
    void load();
    return()=>{alive=false;};
  },[refresh]);

  const rejectionById=useMemo(()=>new Map(rejections.map(r=>[r.project_id,r])),[rejections]);
  const holdById=useMemo(()=>new Map(holds.map(h=>[h.project_id,h])),[holds]);
  const summary=useMemo(()=>({
    total:projects.length,
    published:projects.filter(p=>p.proyecto_verificado===true&&p.estado!=="rechazado").length,
    rejected:projects.filter(p=>p.estado==="rechazado").length,
    pending:projects.filter(p=>p.estado==="pendiente"&&!p.proyecto_verificado).length
  }),[projects]);

  return <main className="min-h-screen bg-[#071429] px-5 py-20 text-white">
    <section className="mx-auto max-w-6xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#facc15]">DealCapital / Mi actividad</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-3xl font-extrabold md:text-5xl">Seguimiento de propuestas</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#b7c9dd]">
            Consulta el estado de revisión de tus proyectos y las decisiones registradas.
            La publicación no constituye una validación financiera ni una promesa de inversión.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard" className="rounded-xl border border-[#405775] px-4 py-3 text-sm font-semibold">Volver al panel</Link>
          <Link href="/publicar" className="rounded-xl bg-[#facc15] px-4 py-3 text-sm font-bold text-[#091426]">Presentar proyecto</Link>
        </div>
      </div>

      {loading?<p role="status" className="mt-10 text-sm text-[#b7c9dd]">Consultando propuestas…</p>
      :error?<div role="alert" className="mt-10 rounded-xl border border-rose-500/40 p-5">
        <p className="text-sm text-rose-200">{error}</p>
        <button type="button" onClick={()=>setRefresh(v=>v+1)}
          className="mt-4 rounded-lg border border-[#627995] px-4 py-2 text-xs font-bold">Reintentar</button>
        <Link href="/login" className="ml-4 text-sm text-[#facc15] underline">Iniciar sesión</Link>
      </div>
      :<>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Resumen de propuestas">
          {[
            ["Total",summary.total],["Pendientes",summary.pending],
            ["Publicadas",summary.published],["Rechazadas",summary.rejected]
          ].map(([name,total])=><div key={name} className="rounded-2xl border border-[#334963] bg-[#10223b] p-5">
            <p className="text-xs text-[#b7c9dd]">{name}</p>
            <p className="mt-2 text-3xl font-extrabold">{total}</p>
          </div>)}
        </div>
        {projects.length===0?<div className="mt-8 rounded-2xl border border-[#334963] p-7">
          <h2 className="text-xl font-bold">Aún no has registrado propuestas</h2>
          <p className="mt-2 text-sm text-[#b7c9dd]">Presenta tu proyecto para iniciar el proceso de revisión.</p>
        </div>:<div className="mt-8 space-y-4">
          {projects.map(project=>{
            const rejection=rejectionById.get(project.id);
            const hold=holdById.get(project.id);
            const rejected=project.estado==="rechazado";
            const published=project.proyecto_verificado===true&&!rejected;
            const status=rejected?"Rechazada":published?"Publicada":project.estado==="pendiente"?"En revisión":"Estado: "+(project.estado||"sin especificar");
            return <article key={project.id} className="rounded-2xl border border-[#334963] bg-[#10223b] p-5 md:p-7">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{project.nombre_proyecto||"Propuesta sin nombre"}</h2>
                  <p className="mt-1 text-xs text-[#aabed4]">Solicitud #{project.id} · Recibida: {date(project.created_at)}</p>
                </div>
                <span className={"h-fit rounded-full border px-3 py-1 text-xs font-bold "+(
                  rejected?"border-rose-500/50 text-rose-200":
                  published?"border-emerald-500/50 text-emerald-200":
                  "border-amber-500/50 text-amber-200"
                )}>{status}</span>
              </div>
              <p className="mt-4 text-sm text-[#cfdbeb]">Capital solicitado: <strong>{currency(project.capital_requerido)}</strong></p>
              {rejected&&<section className="mt-5 rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
                <h3 className="text-sm font-bold text-rose-200">Decisión administrativa</h3>
                {rejection?<div className="mt-2 space-y-2 text-xs leading-6 text-[#e5d6dd]">
                  <p><strong>Motivo:</strong> {rejection.explanation}</p>
                  <p>Fecha de rechazo: {date(rejection.rejected_at)}</p>
                  <p>{hold?.retention_hold?
                    "Conservación activa: la eliminación está suspendida.":
                    rejection.purged_at?
                    "Contenido retirado conforme al registro de depuración.":
                    "Eliminación prevista a partir de "+date(rejection.delete_after)+", sujeta a dependencias y conservación."}</p>
                </div>:<p className="mt-2 text-xs text-rose-200">No se pudo asociar un motivo a esta propuesta. Contacta al equipo de revisión.</p>}
              </section>}
              {!rejected&&!published&&<p className="mt-4 text-xs leading-6 text-[#b7c9dd]">
                Pendiente de decisión administrativa. No se publica ni puede recibir inversiones a través del catálogo hasta su aprobación.
              </p>}
              {published&&<Link href={`/oportunidades/${project.id}`} className="mt-4 inline-block text-sm font-bold text-[#facc15] underline underline-offset-4">Ver oportunidad publicada</Link>}
            </article>;
          })}
        </div>}
        <p className="mt-8 text-xs leading-6 text-[#8fa6bf]">
          La información se limita a proyectos asociados a tu sesión. Los documentos privados no se incluyen en esta vista.
          Los bloqueos de conservación y el retiro físico de archivos se administran por separado.
        </p>
      </>}
    </section>
  </main>;
}
