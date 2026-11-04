"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";

type Profile={nombre:string|null;tipo_usuario:string|null;telefono:string|null;pais:string|null;ciudad:string|null;empresa:string|null;cargo:string|null;biografia:string|null;experiencia:string|null;perfil_verificado:boolean|null;empresa_verificada:boolean|null};
type Project={id:number;nombre_proyecto:string|null;estado:string|null;proyecto_verificado:boolean|null};
const filled=(x:string|null|undefined)=>typeof x==="string"&&x.trim().length>0;

export default function Expediente(){
 const [profile,setProfile]=useState<Profile|null>(null);
 const [projects,setProjects]=useState<Project[]>([]);
 const [status,setStatus]=useState<"loading"|"ready"|"login"|"error">("loading");
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  let active=true;
  const load=async()=>{
   setStatus("loading");
   try{
    const {data:auth,error:authError}=await supabase.auth.getUser();
    if(!active)return;
    if(authError||!auth.user){setStatus("login");return;}
    const [p,r]=await Promise.all([
     supabase.from("profiles").select("nombre,tipo_usuario,telefono,pais,ciudad,empresa,cargo,biografia,experiencia,perfil_verificado,empresa_verificada").eq("id",auth.user.id).maybeSingle(),
     supabase.from("proyectos").select("id,nombre_proyecto,estado,proyecto_verificado").eq("user_id",auth.user.id).order("created_at",{ascending:false}).limit(50)
    ]);
    if(!active)return;
    if(p.error||r.error){setStatus("error");return;}
    setProfile(p.data as Profile|null);
    setProjects((r.data||[]) as Project[]);
    setStatus("ready");
   }catch{if(active)setStatus("error");}
  };
  void load();
  return ()=>{active=false;};
 },[reload]);
 const checks=[
  ["Nombre completo",filled(profile?.nombre)],
  ["Teléfono de contacto",filled(profile?.telefono)],
  ["País y ciudad",filled(profile?.pais)&&filled(profile?.ciudad)],
  ["Empresa o negocio",filled(profile?.empresa)],
  ["Cargo del responsable",filled(profile?.cargo)],
  ["Experiencia o biografía",filled(profile?.experiencia)||filled(profile?.biografia)]
 ] as const;
 const done=checks.filter(([,ok])=>ok).length;
 return <main className="min-h-screen bg-[#071429] px-5 py-20 text-white">
  <section className="mx-auto max-w-5xl">
   <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#facc15]">DealCapital / Confianza</p>
   <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Mi expediente de emprendedor</h1>
   <p className="mt-4 max-w-3xl text-sm leading-7 text-[#b7c9dd]">Revisa los datos de tu perfil y el estado de tus propuestas. Esta herramienta no verifica identidad civil, empresas, solvencia ni cumplimiento KYC/AML. No solicitamos DNI ni documentación de identidad en esta pantalla.</p>
   {status==="loading"?<p role="status" className="mt-10 text-sm">Consultando expediente…</p>:
   status==="login"?<div className="mt-10 rounded-2xl border border-[#344960] p-6"><p>Debes iniciar sesión para ver tus datos.</p><Link href="/login" className="mt-4 inline-block text-[#facc15] underline">Iniciar sesión</Link></div>:
   status==="error"?<div role="alert" className="mt-10 rounded-2xl border border-rose-600 p-6"><p>No fue posible consultar el expediente.</p><button onClick={()=>setReload(v=>v+1)} className="mt-4 rounded-lg border px-4 py-2">Reintentar</button></div>:
   profile?.tipo_usuario!=="emprendedor"?<div className="mt-10 rounded-2xl border border-[#344960] p-6"><p>Tu cuenta no está configurada como emprendedor. Puedes revisar el tipo de cuenta en tu perfil. La selección del tipo no constituye una validación.</p><Link href="/perfil" className="mt-4 inline-block text-[#facc15] underline">Mi perfil</Link></div>:
   <>
    <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
     <div className="rounded-2xl border border-[#344960] bg-[#11233b] p-6"><p className="text-xs text-[#a8bfd6]">Campos completos</p><p className="mt-2 text-3xl font-extrabold">{done}/{checks.length}</p><p className="mt-2 text-xs text-[#a8bfd6]">Datos declarados, sin validación oficial</p></div>
     <div className="rounded-2xl border border-[#344960] bg-[#11233b] p-6"><p className="text-xs text-[#a8bfd6]">Propuestas registradas</p><p className="mt-2 text-3xl font-extrabold">{projects.length}</p><p className="mt-2 text-xs text-[#a8bfd6]">Últimas 50 propuestas</p></div>
     <div className="rounded-2xl border border-[#344960] bg-[#11233b] p-6"><p className="text-xs text-[#a8bfd6]">Validación de identidad</p><p className="mt-3 text-lg font-bold text-amber-200">Aún no habilitada</p><p className="mt-2 text-xs text-[#a8bfd6]">No existe integración oficial RENIEC/SBS</p></div>
    </div>
    <div className="mt-7 grid gap-5 md:grid-cols-2">
     <section className="rounded-2xl border border-[#344960] bg-[#11233b] p-6"><h2 className="text-xl font-bold">Preparación del perfil</h2><ul className="mt-5 space-y-3">{checks.map(([label,ok])=><li key={label} className="flex justify-between gap-3 text-sm"><span><span className={ok?"text-emerald-300":"text-amber-200"}>{ok?"✓":"○"}</span> {label}</span><span className="text-xs text-[#aac0d5]">{ok?"Completo":"Pendiente"}</span></li>)}</ul><Link href="/perfil" className="mt-7 inline-block rounded-lg bg-[#facc15] px-5 py-3 text-sm font-bold text-[#071429]">Completar datos</Link></section>
     <section className="rounded-2xl border border-[#344960] bg-[#11233b] p-6"><h2 className="text-xl font-bold">Verificaciones pendientes</h2><p className="mt-4 text-sm leading-7 text-[#c2d3e5]">La identidad civil, la representación empresarial y la evaluación KYC/AML requieren proveedores autorizados, consentimiento informado, decisiones auditables y procedimientos de protección de datos.</p><p className="mt-4 rounded-lg border border-amber-500/40 p-3 text-xs leading-6 text-amber-100">Las marcas internas de perfil y empresa no equivalen a una acreditación RENIEC, SBS ni a una certificación de inversión.</p><Link href="/verificacion" className="mt-5 inline-block text-sm font-semibold text-[#facc15] underline">Conocer el proceso previsto</Link><div className="mt-4"><Link href="/solicitudes-verificacion" className="inline-block rounded-lg bg-[#facc15] px-4 py-3 text-sm font-bold text-[#071429]">Solicitar revisión preliminar</Link></div></section>
    </div>
    <section className="mt-7 rounded-2xl border border-[#344960] bg-[#11233b] p-6"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-bold">Mis propuestas recientes</h2><Link href="/seguimiento" className="text-sm font-semibold text-[#facc15] underline">Ver seguimiento</Link></div>{projects.length===0?<p className="mt-4 text-sm text-[#aac0d5]">No tienes propuestas registradas.</p>:<ul className="mt-4 divide-y divide-[#344960]">{projects.slice(0,5).map(p=><li key={p.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><span>{p.nombre_proyecto||"Propuesta sin nombre"}</span><span className="text-[#aec4d9]">{p.estado==="rechazado"?"Rechazada":p.proyecto_verificado?"Publicada":"En revisión"}</span></li>)}</ul>}</section>
   </>}
  </section>
 </main>;
}