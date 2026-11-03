"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "../../lib/supabase";
import BrandIcon from "../components/BrandIcon";
import AdminProjectReview from "./AdminProjectReview";
import AdminReviewHistory from "./AdminReviewHistory";
import AdminPrivateDocuments from "./AdminPrivateDocuments";
import AdminRejectProposal from "./AdminRejectProposal";
import AdminRejectionQueue from "./AdminRejectionQueue";
import AdminRetentionHistory from "./AdminRetentionHistory";
import AdminStorageDiagnostic from "./AdminStorageDiagnostic";
import AdminSyntheticStorageQA from "./AdminSyntheticStorageQA";

type Project = {id:number;nombre_proyecto:string|null;emprendedor:string|null;industria:string|null;capital_requerido:number|null;proyecto_verificado:boolean|null;estado:string|null;user_id:string|null;created_at:string|null};
type User = {id:string;nombre:string|null;email:string|null;tipo_usuario:string|null;perfil_verificado:boolean|null;empresa_verificada:boolean|null;created_at:string|null};
type Interest = {id:number;proyecto_id:number|null;nombre:string|null;email:string|null;mensaje:string|null;created_at:string|null};
type Section = "resumen"|"proyectos"|"usuarios"|"interesados";
type Access = "loading"|"allowed"|"denied";
const money = (n:number) => new Intl.NumberFormat("es-PE",{style:"currency",currency:"PEN",maximumFractionDigits:0}).format(n);
const date = (s:string|null) => {
  if(!s) return "Sin fecha";
  const d=new Date(s);
  return Number.isNaN(d.getTime())?"Sin fecha":new Intl.DateTimeFormat("es-PE",{day:"2-digit",month:"short",year:"numeric"}).format(d);
};
const sections: {key:Section;label:string;icon:"growth"|"venture"|"layers"|"message"}[]=[
  {key:"resumen",label:"Resumen",icon:"growth"},
  {key:"proyectos",label:"Proyectos",icon:"venture"},
  {key:"usuarios",label:"Usuarios",icon:"layers"},
  {key:"interesados",label:"Interesados",icon:"message"},
];
const panel="rounded-2xl border border-[#2c405d] bg-[#0b1a31]";
const faint="text-[#a8b9d0]";
const badge=(active:boolean)=>"inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold "+(active?"border-[#facc15]/45 bg-[#facc15]/10 text-[#facc15]":"border-[#42526c] bg-[#15243a] text-[#b4c4d8]");

export default function Admin() {
  const router=useRouter();
  const [access,setAccess]=useState<Access>("loading");
  const [busy,setBusy]=useState(true);
  const [projects,setProjects]=useState<Project[]>([]);
  const [users,setUsers]=useState<User[]>([]);
  const [interests,setInterests]=useState<Interest[]>([]);
  const [errors,setErrors]=useState<string[]>([]);
  const [tab,setTab]=useState<Section>("resumen");
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");
  const [reload,setReload]=useState(0);
  const [updated,setUpdated]=useState<string|null>(null);

  useEffect(()=>{
    let live=true;
    async function load(){
      setBusy(true);
      setErrors([]);
      try{
        const {data:auth,error:authErr}=await supabase.auth.getUser();
        if(!live)return;
        if(authErr||!auth.user){
          setAccess("denied");
          router.replace("/login");
          return;
        }
        // getUser() is verified by Supabase Auth. app_metadata is controlled by
        // authorized Auth admins; profiles.rol is user-controlled legacy data.
        if(auth.user.app_metadata?.role!=="admin"){
          setAccess("denied");
          return;
        }
        // RLS reads app_metadata from the JWT, which can be stale after
        // the admin role is provisioned. Refresh only when the cached token
        // has not yet received the trusted role.
        const {data:sessionData}=await supabase.auth.getSession();
        if(!live)return;
        if(sessionData.session?.user?.app_metadata?.role!=="admin"){
          const {data:refreshed,error:refreshError}=await supabase.auth.refreshSession();
          if(!live)return;
          if(refreshError||refreshed.session?.user?.app_metadata?.role!=="admin"){
            setErrors(["Tu sesión necesita renovarse. Cierra sesión y vuelve a iniciar sesión para usar el panel de administración."]);
            setAccess("denied");
            return;
          }
        }
        // Actual mutations are independently authorized by server-side RPC.
        setAccess("allowed");
        const [p,u,i]=await Promise.all([
          supabase.from("proyectos").select("id,nombre_proyecto,emprendedor,industria,capital_requerido,proyecto_verificado,estado,user_id,created_at").order("created_at",{ascending:false}).limit(200),
          supabase.from("profiles").select("id,nombre,email,tipo_usuario,perfil_verificado,empresa_verificada,created_at").order("created_at",{ascending:false}).limit(200),
          supabase.from("interesados").select("id,proyecto_id,nombre,email,mensaje,created_at").order("created_at",{ascending:false}).limit(200)
        ]);
        if(!live)return;
        const notices:string[]=[];
        if(p.error)notices.push("Proyectos: "+p.error.message);
        if(u.error)notices.push("Usuarios: "+u.error.message);
        if(i.error)notices.push("Interesados: "+i.error.message);
        setErrors(notices);
        setProjects((p.data||[]) as Project[]);
        setUsers((u.data||[]) as User[]);
        setInterests((i.data||[]) as Interest[]);
        setUpdated(new Intl.DateTimeFormat("es-PE",{hour:"2-digit",minute:"2-digit"}).format(new Date()));
      }catch{
        if(live)setErrors(["No se pudieron cargar los registros. Vuelve a intentarlo."]);
      }finally{if(live)setBusy(false);}
    }
    void load();
    return()=>{live=false;};
  },[router,reload]);


  const duplicateOf=useMemo(()=>{
    const groups=new Map<string,Project[]>();
    const normalize=(text:string)=>text.trim().toLocaleLowerCase("es-PE").replace(/\s+/g," ");
    for(const p of projects){
      if(!p.user_id||p.estado==="rechazado")continue;
      const key=[p.user_id,normalize(p.nombre_proyecto||""),String(p.capital_requerido??"")].join("|");
      groups.set(key,[...(groups.get(key)||[]),p]);
    }
    const duplicates=new Map<number,number>();
    for(const list of groups.values()){
      if(list.length<2)continue;
      const ordered=[...list].sort((a,b)=>Number(!!b.proyecto_verificado)-Number(!!a.proyecto_verificado)||(a.id-b.id));
      for(const dupe of ordered.slice(1))duplicates.set(dupe.id,ordered[0].id);
    }
    return duplicates;
  },[projects]);

  const totals=useMemo(()=>({
    marked:projects.filter(p=>p.proyecto_verificado===true).length,
    unmarked:projects.filter(p=>p.proyecto_verificado!==true).length,
    amount:projects.reduce((n,p)=>n+Number(p.capital_requerido||0),0),
    inconsistent:projects.filter(p=>p.proyecto_verificado===true && p.estado!=="publicado").length,
    duplicates:duplicateOf.size,
    rejected:projects.filter(p=>p.estado==="rechazado").length
  }),[projects,duplicateOf]);
  const names=useMemo(()=>new Map(projects.map(p=>[p.id,p.nombre_proyecto||"Proyecto"])),[projects]);
  const rows=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(tab==="proyectos")return projects.filter(p=>{
      const match=!q||[p.nombre_proyecto,p.emprendedor,p.industria,String(p.id)].filter(Boolean).join(" ").toLowerCase().includes(q);
      return match&&(filter==="all"||(filter==="duplicates"?duplicateOf.has(p.id):filter==="rejected"?p.estado==="rechazado":filter==="marked"?!!p.proyecto_verificado:!p.proyecto_verificado));
    });
    if(tab==="usuarios")return users.filter(u=>{
      const match=!q||[u.nombre,u.email,u.tipo_usuario].filter(Boolean).join(" ").toLowerCase().includes(q);
      return match&&(filter==="all"||(filter==="marked"?!!u.perfil_verificado:!u.perfil_verificado));
    });
    if(tab==="interesados")return interests.filter(i=>!q||[i.nombre,i.email,i.mensaje,String(i.proyecto_id||"")].filter(Boolean).join(" ").toLowerCase().includes(q));
    return [];
  },[tab,query,filter,projects,users,interests,duplicateOf]);
  const switchTab=(id:Section)=>{setTab(id);setQuery("");setFilter("all");};
  const tile=(label:string,count:string,icon:"venture"|"clock"|"layers"|"message",note:string)=>(
    <div className={panel+" p-5 sm:p-6"}>
      <div className="flex items-center justify-between">
        <p className={"text-xs font-semibold "+faint}>{label}</p>
        <span className="grid size-10 place-items-center rounded-xl bg-[#162b47] text-[#facc15]"><BrandIcon name={icon} size={21}/></span>
      </div>
      <strong className="mt-5 block text-4xl font-extrabold tracking-tight text-white">{busy?"—":count}</strong>
      <p className={"mt-3 text-[11px] "+faint}>{note}</p>
    </div>
  );
  if(access==="loading")return <main className="grid min-h-[60vh] place-items-center bg-[#020817] px-6 text-center text-white">
    <div role="status" className="space-y-4"><span className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#3d506d] text-[#facc15]"><BrandIcon name="shield" size={30}/></span><h1 className="text-2xl font-bold">Verificando acceso administrativo</h1><p className={faint}>Comprobando tu sesión de DealCapital.</p></div>
  </main>;
  if(access==="denied")return <main className="grid min-h-[60vh] place-items-center bg-[#020817] px-6 text-center text-white"><div className="space-y-5"><h1 className="text-2xl font-bold">Acceso restringido</h1><p className={faint}>Tu cuenta necesita el rol administrativo confiable de Supabase Auth. El rol de perfil antiguo ya no concede acceso.</p><Link href="/" className="inline-flex rounded-xl bg-[#facc15] px-6 py-3 font-bold text-[#020817]">Volver a DealCapital</Link></div></main>;
  return <main className="min-h-screen bg-[#020817] text-white">
    <div className="dc-container pb-20 pt-9 md:pt-14">
      <div className="mb-6 flex items-center gap-2 text-xs text-[#93a6c1]"><Link href="/" className="hover:text-[#facc15]">DealCapital</Link><span>/</span><span className="text-[#facc15]">Administración</span></div>
      <div className="mb-9 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#facc15]">Centro de operaciones / MVP</p>
          <h1 className="text-[clamp(35px,4vw,56px)] font-extrabold leading-tight tracking-[-.055em]">Panel de <span className="text-[#facc15]">administración.</span></h1>
          <p className={"mt-4 max-w-2xl text-sm leading-7 "+faint}>Supervisa publicaciones, perfiles e interesados desde un espacio organizado. Las cifras representan únicamente registros accesibles a tu sesión.</p>
        </div>
        <button disabled={busy} type="button" onClick={()=>setReload(x=>x+1)} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#445979] px-5 text-sm font-bold text-white transition hover:border-[#facc15] disabled:opacity-60"><BrandIcon name="clock" size={18}/>{busy?"Actualizando…":"Actualizar datos"}</button>
      </div>
      <div className="mb-9 flex items-start gap-4 rounded-2xl border border-[#786129] bg-[#312b15] p-5 text-[#e9dfbd]" role="note">
        <BrandIcon name="shield" size={26} className="mt-1 shrink-0 text-[#facc15]"/>
        <div><strong className="block text-sm text-white">Publicaciones con autorización y auditoría</strong>
        <p className="mt-2 text-xs leading-6">Solo los administradores habilitados en Supabase Auth pueden revisar publicaciones. Cada aprobación o retiro requiere un motivo y queda registrado. Las verificaciones de identidad, empresa y solvencia permanecen deshabilitadas y no están certificadas por RENIEC ni SBS.</p></div>
      </div>
      {errors.length>0&&<div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-950/20 p-5 text-sm text-rose-200" role="alert"><strong>Consultas con incidencias</strong>{errors.map(e=><p className="mt-2" key={e}>{e}</p>)}</div>}

      <div className="mb-11 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tile("Proyectos accesibles",String(projects.length),"venture","Registros disponibles")}
        {tile("Sin marca de publicación",String(totals.unmarked),"clock","Incluye rechazos")}
        {tile("Perfiles accesibles",String(users.length),"layers","Con límites de RLS")}
        {tile("Interesados accesibles",String(interests.length),"message","Con límites de RLS")}
      </div>

      <div className={panel+" overflow-hidden"}>
        <div className="flex flex-col justify-between gap-4 border-b border-[#2c405d] p-5 sm:flex-row sm:items-end sm:p-7">
          <div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#facc15]">Gestión del ecosistema</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight">Operaciones y seguimiento</h2><p className={"mt-2 text-xs "+faint}>{updated?"Última actualización: "+updated:"Consultando información…"}</p></div>
          <Link href="/oportunidades" className="inline-flex items-center gap-2 text-xs font-bold text-[#facc15] hover:underline">Ver sitio público <BrandIcon name="arrow" size={17}/></Link>
        </div>
        <div className="flex flex-wrap gap-1 border-b border-[#2c405d] px-3 pt-3 sm:px-6" role="tablist" aria-label="Secciones de administración">
          {sections.map(s=><button key={s.key} role="tab" aria-selected={tab===s.key} type="button" onClick={()=>switchTab(s.key)} className={"flex items-center gap-2 rounded-t-xl border-b-2 px-4 py-3 text-xs font-bold transition "+(tab===s.key?"border-[#facc15] bg-[#152740] text-[#facc15]":"border-transparent text-[#9fb2ca] hover:bg-[#12233d] hover:text-white")}><BrandIcon name={s.icon} size={18}/>{s.label}</button>)}
        </div>

        {tab==="resumen" ? <div className="grid gap-5 p-5 lg:grid-cols-2 lg:p-7">
          <section className="rounded-2xl border border-[#334660] bg-[#0e2039] p-6">
            <div className="flex justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-widest text-[#facc15]">Publicaciones</p><h3 className="mt-2 text-xl font-bold">Estado de proyectos</h3></div><BrandIcon name="venture" size={28} className="text-[#facc15]"/></div>
            <div className="mt-7 flex items-baseline gap-3"><strong className="text-5xl font-extrabold">{projects.length}</strong><span className={"text-xs "+faint}>proyectos accesibles</span></div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#35465e]"><div className="h-full rounded-full bg-[#facc15]" style={{width: projects.length?(100*totals.marked/projects.length)+"%":"0%"}}/></div>
            <div className="mt-4 flex flex-wrap justify-between gap-3 text-xs"><span className="text-[#facc15]">Con marca: {totals.marked}</span><span className={faint}>Sin marca: {totals.unmarked}</span></div>
            <p className={"mt-5 text-xs leading-6 "+faint}>Las marcas actuales de publicación no equivalen a una validación financiera.</p>
            {totals.inconsistent>0 && <p role="note" className="mt-3 rounded-lg border border-amber-500/45 bg-amber-900/20 p-3 text-xs leading-5 text-amber-200">
              {totals.inconsistent} {totals.inconsistent===1?"proyecto tiene":"proyectos tienen"} marca de publicación, pero su estado general sigue pendiente. Revisa estos registros históricos antes de tomar decisiones.
            </p>}
            {totals.duplicates>0&&<p role="note" className="mt-3 rounded-lg border border-amber-500/45 bg-amber-900/20 p-3 text-xs leading-5 text-amber-200">{totals.duplicates} proyectos potencialmente duplicados. Se agrupan por propietario, nombre y monto; revisa los expedientes antes de rechazar.</p>}
            {totals.rejected>0&&<p className="mt-2 text-xs text-rose-200">{totals.rejected} propuestas rechazadas bajo seguimiento de eliminación.</p>}
            <button type="button" onClick={()=>{switchTab("proyectos");setFilter("duplicates");}} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#facc15]">Revisar duplicados <BrandIcon name="arrow" size={17}/></button>
          </section>
          <section className="rounded-2xl border border-[#334660] bg-[#0e2039] p-6">
            <div className="flex justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-widest text-[#facc15]">Capital solicitado</p><h3 className="mt-2 text-xl font-bold">Importes declarados</h3></div><BrandIcon name="invest" size={28} className="text-[#facc15]"/></div>
            <strong className="mt-8 block break-words text-3xl font-extrabold tracking-tight sm:text-4xl">{money(totals.amount)}</strong>
            <p className={"mt-5 text-xs leading-6 "+faint}>Suma del capital solicitado por los proyectos visibles. No es dinero recaudado ni garantizado.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button onClick={()=>switchTab("usuarios")} className="flex justify-between rounded-xl border border-[#354965] px-4 py-4 text-xs font-bold hover:border-[#facc15]">Ver perfiles <BrandIcon name="arrow" size={17}/></button>
              <button onClick={()=>switchTab("interesados")} className="flex justify-between rounded-xl border border-[#354965] px-4 py-4 text-xs font-bold hover:border-[#facc15]">Ver interesados <BrandIcon name="arrow" size={17}/></button>
            </div>
          </section>
          <section className="rounded-2xl border border-[#334660] bg-[#0e2039] p-6 lg:col-span-2">
            <div className="mb-5 flex justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-widest text-[#facc15]">Actividad</p><h3 className="mt-2 text-xl font-bold">Publicaciones recientes</h3></div><button type="button" onClick={()=>switchTab("proyectos")} className="text-xs font-bold text-[#facc15]">Ver todas</button></div>
            {projects.length ? projects.slice(0,5).map(p=><Link href={"/oportunidades/"+p.id} key={p.id} className="flex items-center justify-between gap-3 border-t border-[#334660] py-4 transition hover:bg-[#152b48]">
              <span className="min-w-0"><strong className="block truncate text-sm">{p.nombre_proyecto||"Proyecto"}</strong><small className={"mt-1 block text-xs "+faint}>{p.industria||"Sin sector"} · {date(p.created_at)}</small></span>
              <span className={badge(!!p.proyecto_verificado)}>{p.proyecto_verificado?"Con marca":"Sin marca"}</span>
            </Link>) : <p className={"py-7 text-sm "+faint}>No hay proyectos accesibles.</p>}
          </section>
          <AdminReviewHistory refreshToken={reload}/>
          <AdminRejectionQueue refreshToken={reload} onReviewed={()=>setReload(v=>v+1)}/>
          <AdminRetentionHistory refreshToken={reload}/>
          <AdminStorageDiagnostic/>
          <AdminSyntheticStorageQA/>
        </div> : <section className="p-5 lg:p-7">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><h3 className="text-xl font-extrabold">{tab==="proyectos"?"Registro de proyectos":tab==="usuarios"?"Perfiles de usuarios":"Interés en proyectos"}</h3><p className={"mt-2 text-xs "+faint}>Vista de lectura según los permisos de la sesión.</p></div>
            <span className={badge(false)}>{rows.length} resultados</span>
          </div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#3c506b] bg-[#07162b] px-4 py-3 focus-within:border-[#facc15]"><BrandIcon name="scope" size={19} className="shrink-0 text-[#facc15]"/><span className="sr-only">Buscar registros</span><input type="search" placeholder="Buscar en los registros..." value={query} onChange={e=>setQuery(e.target.value)} className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-[#7f91ac]"/></label>
            {tab!=="interesados"&&<label className="rounded-xl border border-[#3c506b] bg-[#07162b] px-3 py-2"><span className="sr-only">Filtrar estado</span><select className="h-full w-full bg-transparent text-sm text-white outline-none" value={filter} onChange={e=>setFilter(e.target.value)}><option className="bg-[#07162b]" value="all">Todos los estados</option><option className="bg-[#07162b]" value="marked">Con marca</option><option className="bg-[#07162b]" value="unmarked">Sin marca</option>{tab==="proyectos"&&<><option className="bg-[#07162b]" value="duplicates">Posibles duplicados</option><option className="bg-[#07162b]" value="rejected">Rechazados</option></>}</select></label>}
          </div>
          {busy?<div className={"rounded-xl border border-[#344760] p-8 text-sm "+faint}>Actualizando registros…</div>
            : !rows.length?<div className="rounded-xl border border-dashed border-[#3c506b] p-9 text-center"><BrandIcon name="compass" size={30} className="mx-auto text-[#facc15]"/><h4 className="mt-3 font-bold">Sin resultados disponibles</h4><p className={"mt-2 text-xs "+faint}>Revisa tus filtros o los permisos de acceso de la base de datos.</p><button className="mt-4 text-xs font-bold text-[#facc15]" onClick={()=>{setQuery("");setFilter("all");}}>Limpiar filtros</button></div>
            : <div className="overflow-x-auto rounded-xl border border-[#344760]">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                <thead className="bg-[#142640] text-[#afc1d6]"><tr>
                  {tab==="proyectos"?<><th className="p-4">Proyecto</th><th className="p-4">Capital</th><th className="p-4">Fecha</th><th className="p-4">Publicación</th><th className="p-4">Revisión</th></>:
                  tab==="usuarios"?<><th className="p-4">Usuario</th><th className="p-4">Perfil</th><th className="p-4">Registro</th><th className="p-4">Marcas internas</th></>:
                  <><th className="p-4">Interesado</th><th className="p-4">Proyecto</th><th className="p-4">Fecha</th><th className="p-4">Mensaje</th></>}
                </tr></thead>
                <tbody className="divide-y divide-[#2c405d]">
                  {tab==="proyectos"&&(rows as Project[]).map(p=><tr key={p.id} className="hover:bg-[#15253e]"><td className="p-4"><strong className="block text-sm">{p.nombre_proyecto||"Proyecto"}</strong><small className={faint}>{p.industria||"Sin sector"} · {p.emprendedor||"Sin responsable"}</small>{duplicateOf.has(p.id)&&<small className="mt-2 block font-bold text-amber-300">Posible duplicado de #{duplicateOf.get(p.id)}</small>}</td><td className="p-4 font-bold">{money(Number(p.capital_requerido||0))}</td><td className="p-4">{date(p.created_at)}</td><td className="p-4"><span className={badge(!!p.proyecto_verificado)}>{p.proyecto_verificado?"Visible":"No visible"}</span>{p.estado==="rechazado"&&<small className="mt-2 block font-bold text-rose-300">Rechazado · eliminación programada</small>}{p.proyecto_verificado&&p.estado!=="publicado"&&<small className="mt-2 block text-amber-300">Estado heredado: {p.estado||"sin definir"}</small>}</td><td className="p-4">{p.estado!=="rechazado"&&<AdminProjectReview projectId={p.id} published={!!p.proyecto_verificado} onReviewed={()=>setReload(v=>v+1)}/>} {p.estado==="pendiente"&&!p.proyecto_verificado&&<AdminRejectProposal projectId={p.id} onReviewed={()=>setReload(v=>v+1)}/>}<AdminPrivateDocuments projectId={p.id}/>{p.proyecto_verificado&&<Link href={"/oportunidades/"+p.id} className="mt-2 block text-[11px] font-bold text-[#facc15]">Ver publicación</Link>}</td></tr>)}
                  {tab==="usuarios"&&(rows as User[]).map(u=><tr key={u.id} className="hover:bg-[#15253e]"><td className="p-4"><strong className="block text-sm">{u.nombre||"Sin nombre"}</strong><small className={faint}>{u.email||"Correo no disponible"}</small></td><td className="p-4">{u.tipo_usuario||"No definido"}</td><td className="p-4">{date(u.created_at)}</td><td className="p-4"><span className={badge(!!u.perfil_verificado)}>{u.perfil_verificado?"Perfil marcado":"Sin marca"}</span><span className={"ml-1 "+badge(!!u.empresa_verificada)}>{u.empresa_verificada?"Empresa marcada":"Sin marca"}</span></td></tr>)}
                  {tab==="interesados"&&(rows as Interest[]).map(i=><tr key={i.id} className="hover:bg-[#15253e]"><td className="p-4"><strong className="block text-sm">{i.nombre||"Interesado"}</strong><small className={faint}>{i.email||"Sin correo"}</small></td><td className="p-4">{i.proyecto_id?names.get(i.proyecto_id)||"Proyecto #"+i.proyecto_id:"Sin asociar"}</td><td className="p-4">{date(i.created_at)}</td><td className="max-w-60 truncate p-4" title={i.mensaje||""}>{i.mensaje||"Sin mensaje"}</td></tr>)}
                </tbody>
              </table>
            </div>}
          <p className={"mt-5 text-xs leading-6 "+faint}>Límite: 200 registros por consulta. El rechazo requiere un motivo, notifica al titular y programa eliminación tras 7 días si no hay dependencias. La auditoría permanece. Los registros duplicados requieren revisión humana; no se borran por simple similitud.</p>
        </section>}
      </div>
      <div className={"mt-8 flex flex-col justify-between gap-3 text-xs sm:flex-row "+faint}><span>DealCapital Operations · Panel MVP</span><Link href="/contacto" className="hover:text-[#facc15]">Contacto y soporte</Link></div>
    </div>
  </main>;
}
