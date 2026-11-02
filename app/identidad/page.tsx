"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";
import BrandIcon, {type BrandIconName} from "../components/BrandIcon";

type Gate = "loading" | "authenticated" | "visitor";
type Section = "personal" | "business" | "financial";

const tracks: {id:Section;number:string;label:string;icon:BrandIconName}[] = [
  {id:"personal",number:"01",label:"Identidad",icon:"verify"},
  {id:"business",number:"02",label:"Emprendimiento",icon:"venture"},
  {id:"financial",number:"03",label:"Información financiera",icon:"scope"},
];

const contentByTrack: Record<Section,{
  tag:string;headline:string;intro:string;authority:string;
  requirements:string[];boundaries:string[];
}> = {
  personal: {
    tag:"Identidad de la persona",
    headline:"Una conexión comienza con saber con quién hablas.",
    intro:"El paso de validación de identidad está diseñado para que un proveedor autorizado pueda confirmar atributos mínimos de una persona. No se solicitará un documento desde esta pantalla hasta contar con condiciones legales, técnicas y de seguridad suficientes.",
    authority:"RENIEC · integración pendiente de convenio o habilitación",
    requirements:[
      "Cuenta y correo electrónico confirmados.",
      "Información clara sobre la finalidad del tratamiento y consentimiento cuando corresponda.",
      "Proveedor autorizado para comprobar identidad, con canal seguro y registros de auditoría.",
    ],
    boundaries:[
      "No ingreses tu DNI, fotografías de documentos, selfies ni huellas aquí.",
      "Un correo confirmado no equivale a identidad civil verificada.",
      "La futura validación oficial no podrá depender de campos editables del perfil.",
    ],
  },
  business: {
    tag:"Emprendimiento y representación",
    headline:"Información del negocio con un responsable identificable.",
    intro:"El recorrido empresarial podrá reunir información declarada del proyecto y comprobar su relación con las personas que lo presentan. La integración con registros de personas jurídicas y la revisión documental aún están en diseño.",
    authority:"Revisión empresarial · futura integración autorizada",
    requirements:[
      "Identificación de la persona responsable del proyecto.",
      "Datos empresariales proporcionados por quien publica.",
      "Revisión de documentos y facultades de representación cuando corresponda.",
    ],
    boundaries:[
      "Crear un proyecto no implica aprobación ni auditoría financiera.",
      "Las declaraciones deben distinguirse de información comprobada.",
      "No cargues documentos de terceros sin autorización.",
    ],
  },
  financial: {
    tag:"Riesgo e información crediticia",
    headline:"Decisiones informadas, nunca promesas de rentabilidad.",
    intro:"DealCapital podrá admitir documentación aportada legítimamente por el titular o información obtenida de proveedores crediticios autorizados, si el modelo legal y los permisos lo permiten. No consulta reportes SBS automáticamente.",
    authority:"SBS / proveedores autorizados · acceso no contratado",
    requirements:[
      "Definir la necesidad real de información crediticia para el servicio.",
      "Precisar fundamento jurídico, autorización y tiempo de conservación.",
      "Separar evaluaciones informativas de decisiones comerciales y de inversión.",
    ],
    boundaries:[
      "No compartas reportes de deudas por chats públicos.",
      "Una calificación crediticia no garantiza la calidad de una oportunidad.",
      "Los informes personales no deben publicarse en fichas de proyectos.",
    ],
  },
};

export default function DealCapitalIdentity() {
  const [gate,setGate]=useState<Gate>("loading");
  const [email,setEmail]=useState<string|null>(null);
  const [selected,setSelected]=useState<Section>("personal");

  useEffect(()=>{
    let alive=true;
    void supabase.auth.getUser().then(({data,error})=>{
      if(!alive)return;
      setGate(!error&&data.user?"authenticated":"visitor");
      setEmail(data.user?.email??null);
    }).catch(()=>{if(alive)setGate("visitor");});
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(!alive)return;
      setGate(session?.user?"authenticated":"visitor");
      setEmail(session?.user?.email??null);
    });
    return()=>{alive=false;listener.subscription.unsubscribe();};
  },[]);

  const c=contentByTrack[selected];
  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <div className="dc-container py-12 sm:py-16 lg:py-20">
        <nav aria-label="Ruta de navegación" className="mb-9 flex gap-2 text-xs text-[#9caec8]">
          <Link href="/" className="hover:text-[#facc15]">DealCapital</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#facc15]">Identity</span>
        </nav>

        <section aria-labelledby="identity-title" className="relative overflow-hidden rounded-[25px] border border-[#314765] bg-[linear-gradient(120deg,#122b49,#07172d)] px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
          <div aria-hidden="true" className="absolute -right-24 -top-32 size-80 rounded-full border border-[#facc15]/15"/>
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#facc15]/30 bg-[#facc15]/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#facc15]">
              <BrandIcon name="shield" size={17}/> DealCapital Identity · Diseño inicial
            </span>
            <h1 id="identity-title" className="mt-6 max-w-2xl text-[clamp(32px,5vw,58px)] font-extrabold leading-[1.12] tracking-[-.055em]">
              Más claridad para construir <span className="text-[#facc15]">confianza.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-[#c8d6e8] sm:text-base">
              Estamos preparando un recorrido de identidad y revisión de información
              para emprendedores e inversionistas. Esta es una vista informativa: todavía
              no verifica personas, empresas ni historial crediticio.
            </p>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#78612a] bg-[#252413] px-5 py-4 text-sm">
          <div className="flex items-start gap-3">
            <BrandIcon name="shield" size={22} className="shrink-0 text-[#facc15]"/>
            <div>
              <strong className="text-[#f9e8b1]">Sin conexión oficial habilitada</strong>
              <p className="mt-1 text-xs leading-6 text-[#d3c8a7]">No solicitamos DNI, biometría ni reportes SBS; no hay validación oficial disponible en este módulo.</p>
            </div>
          </div>
          <span className="rounded-full bg-[#facc15]/10 px-3 py-2 text-[11px] font-bold text-[#facc15]">Fase 1 · Preparación</span>
        </div>

        <section aria-labelledby="identity-track-heading" className="mt-14">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#facc15]">Recorrido de confianza</p>
              <h2 id="identity-track-heading" className="text-3xl font-extrabold tracking-tight sm:text-4xl">Tres componentes. Un proceso transparente.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#a8b9d0]">Selecciona cada componente para conocer su propósito, requisitos y límites actuales.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[.4fr_1fr]">
            <div className="grid gap-2 self-start" role="tablist" aria-label="Componentes de verificación">
              {tracks.map(t=>(
                <button key={t.id} id={"identity-tab-"+t.id} type="button" role="tab" aria-selected={selected===t.id}
                  aria-controls="identity-panel" onClick={()=>setSelected(t.id)}
                  className={"flex min-h-[82px] items-center gap-4 rounded-xl border px-5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#facc15] "+(selected===t.id?"border-[#facc15] bg-[#facc15] text-[#020817]":"border-[#344a67] bg-[#0d1d34] text-[#d5e0ef] hover:border-[#facc15]/60")}>
                  <span className={"text-xs font-black "+(selected===t.id?"text-[#36404c]":"text-[#facc15]")}>{t.number}</span>
                  <BrandIcon name={t.icon} size={24}/>
                  <span className="flex-1 text-sm font-extrabold">{t.label}</span>
                  <BrandIcon name="arrow" size={18}/>
                </button>
              ))}
            </div>

            <article id="identity-panel" role="tabpanel" aria-labelledby={"identity-tab-"+selected} className="rounded-2xl border border-[#314765] bg-[#0b1b31] p-6 sm:p-9">
              <p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#facc15]">{c.tag}</p>
              <h3 className="mt-4 max-w-2xl text-2xl font-extrabold leading-snug tracking-[-.035em] sm:text-3xl">{c.headline}</h3>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#b6c8dc]">{c.intro}</p>
              <div className="mt-7 inline-flex max-w-full items-center gap-2 rounded-lg bg-[#172b47] px-3 py-2 text-xs font-semibold text-[#e2edf8]">
                <BrandIcon name="clock" size={16}/> {c.authority}
              </div>
              <div className="mt-8 grid gap-7 border-t border-[#304663] pt-7 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-bold">Requisitos antes de habilitarlo</h4>
                  <ul className="mt-4 space-y-4">
                    {c.requirements.map(item=><li key={item} className="flex gap-3 text-xs leading-6 text-[#bfcede]"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#facc15]"/>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold">Lo que debes saber</h4>
                  <ul className="mt-4 space-y-4">
                    {c.boundaries.map(item=><li key={item} className="flex gap-3 text-xs leading-6 text-[#bfcede]"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#617892]"/>{item}</li>)}
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="mt-12 grid gap-6 rounded-2xl border border-[#314765] bg-[#0e2038] p-6 md:grid-cols-[1fr_auto] md:items-center sm:p-9" aria-labelledby="identity-account-title">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#facc15]">Tu cuenta DealCapital</p>
            <h2 id="identity-account-title" className="mt-3 text-xl font-extrabold sm:text-2xl">
              {gate==="authenticated"?"Cuenta conectada":gate==="loading"?"Comprobando tu sesión":"Comienza por crear una cuenta"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#bccbe0]">
              {gate==="authenticated"
                ?"Tu correo es "+(email||"el asociado a tu cuenta")+". Estar registrado no significa que tu identidad civil esté verificada."
                :gate==="loading"?"Revisando el estado de tu acceso."
                :"Puedes registrarte y completar tu perfil. La identidad oficial será un paso separado cuando exista una integración autorizada."}
            </p>
          </div>
          {gate==="authenticated" ? <Link href="/perfil" className="dc-btn dc-btn-primary whitespace-nowrap">Completar mi perfil <BrandIcon name="arrow" size={18}/></Link>
            :gate==="visitor" ? <Link href="/registro" className="dc-btn dc-btn-primary whitespace-nowrap">Crear cuenta <BrandIcon name="arrow" size={18}/></Link>
            :<span role="status" className="text-xs text-[#cbd5e1]">Comprobando acceso...</span>}
        </section>

        <div className="mt-9 flex flex-wrap justify-between gap-4 text-xs text-[#9badc6]">
          <span>No envíes fotografías de tu DNI, contraseñas o reportes crediticios por chat.</span>
          <Link href="/verificacion" className="inline-flex items-center gap-2 font-bold text-[#facc15] hover:underline">Conocer la política de verificación <BrandIcon name="arrow" size={16}/></Link>
        </div>
      </div>
    </main>
  );
}
