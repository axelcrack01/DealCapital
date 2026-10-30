import Link from "next/link";
import { supabase } from "../lib/supabase";
import BrandIcon, { type BrandIconName } from "./components/BrandIcon";
import AudienceSwitcher from "./components/AudienceSwitcher";
import DealNetwork from "./components/DealNetwork";

export const dynamic = "force-dynamic";

type FeaturedProject = {
  id: number;
  nombre_proyecto: string | null;
  industria: string | null;
  descripcion: string | null;
  capital_requerido: number | null;
};
const formatMoney = (amount: number) => new Intl.NumberFormat("es-PE", {
  style: "currency", currency: "PEN", maximumFractionDigits: 0,
}).format(amount);

const benefits: {number:string; icon:BrandIconName;title:string;description:string;href:string;cta:string}[] = [
  {number:"01",icon:"venture",title:"Tu proyecto, mejor presentado.",description:"Cuenta qué estás construyendo y qué recursos necesitas para dar el siguiente paso.",href:"/emprendedores",cta:"Para emprendedores"},
  {number:"02",icon:"compass",title:"Descubre con intención.",description:"Busca proyectos por sector, explora sus objetivos y examina información declarada.",href:"/oportunidades",cta:"Explorar oportunidades"},
  {number:"03",icon:"link",title:"Conexiones que avanzan.",description:"Empieza conversaciones con personas interesadas y conoce otras perspectivas.",href:"/registro",cta:"Únete al ecosistema"},
  {number:"04",icon:"document",title:"Información que importa.",description:"Identifica los datos disponibles y los que todavía necesitas comprobar.",href:"/verificacion",cta:"Conoce el proceso"}
];

export default async function Home() {
  const { data, error } = await supabase.from("proyectos")
    .select("id,nombre_proyecto,industria,descripcion,capital_requerido")
    .eq("proyecto_verificado", true)
    .order("created_at",{ascending:false})
    .limit(3);

  const projects = (data ?? []) as FeaturedProject[];

  return (
    <main className="dc-landing">
      <section className="dc-landing-top">
        <div className="dc-container dc-landing-hero">
          <div className="dc-landing-hero-copy">
            <p className="dc-kicker">DealCapital / Emprendimiento e inversión</p>
            <h1>Conectamos emprendedores con <em>inversionistas.</em></h1>
            <p>
              Una plataforma para dar visibilidad a las buenas ideas y conectar
              con personas que buscan oportunidades. Presenta tu proyecto,
              explora negocios y empieza conversaciones con más contexto.
            </p>
            <div className="dc-landing-actions">
              <Link href="/oportunidades" className="dc-btn dc-btn-primary">
                Explorar oportunidades <BrandIcon name="arrow" size={18}/>
              </Link>
              <Link href="/emprendedores" className="dc-btn dc-btn-outline">
                Tengo un proyecto <BrandIcon name="venture" size={19}/>
              </Link>
            </div>
            <p className="dc-landing-disclaimer">
              Plataforma en fase MVP. No recibimos fondos ni garantizamos resultados de inversión.
              Las verificaciones oficiales aún no están habilitadas.
            </p>
          </div>
          <DealNetwork/>
        </div>
      </section>

      <section className="dc-container dc-landing-section" aria-labelledby="dc-value-title">
        <div className="dc-editorial-intro">
          <div>
            <p className="dc-eyebrow mb-5">Lo que puedes hacer</p>
            <h2 id="dc-value-title" className="dc-section-title">No se trata solo de encontrar capital. Se trata de <span className="text-[#facc15]">crear conexiones.</span></h2>
          </div>
          <p className="dc-section-copy">
            Cada interacción comienza con una historia de negocio. DealCapital organiza
            ese primer encuentro en un entorno donde emprendedores e interesados
            encuentran un punto de partida.
          </p>
        </div>
        <div className="dc-editorial-bento">
          {benefits.map((b,index) => (
            <article key={b.number} className={"dc-editorial-tile "+(index<2?"is-large":"is-wide")}>
              <div className="dc-editorial-tile-top">
                <span className="dc-editorial-icon"><BrandIcon name={b.icon} size={32}/></span>
                <span className="dc-editorial-count">{b.number} / 04</span>
              </div>
              <div className="dc-editorial-tile-body">
                <h3>{b.title}</h3>
                <p>{b.description}</p>
                <Link href={b.href}>{b.cta}<BrandIcon name="arrow" size={17}/></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <AudienceSwitcher/>

      <section className="dc-container dc-market-section" aria-labelledby="dc-market-title">
        <div className="dc-market-head">
          <div>
            <p className="dc-eyebrow mb-5">Explora el ecosistema</p>
            <h2 className="dc-section-title" id="dc-market-title">Oportunidades que merecen una mirada.</h2>
            <p className="dc-section-copy mt-4 max-w-2xl">
              Proyectos revisados para publicación. Las cifras son declaradas por
              sus responsables y no representan una certificación financiera.
            </p>
          </div>
          <Link href="/oportunidades" className="dc-btn dc-btn-outline">Ver catálogo completo <BrandIcon name="arrow" size={18}/></Link>
        </div>
        {error ? (
          <div role="status" className="dc-panel p-7 text-sm text-[#cbd5e1]">
            Las oportunidades no están disponibles en este momento. Vuelve a intentarlo más tarde.
          </div>
        ) : projects.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {projects.map(p => (
              <Link key={p.id} href={"/oportunidades/"+p.id} className="dc-market-card group">
                <span className="dc-editorial-icon"><BrandIcon name="venture" size={27}/></span>
                <h3>{p.nombre_proyecto || "Proyecto"}</h3>
                <p className="line-clamp-3">{p.descripcion || "Información en actualización."}</p>
                <footer>
                  <span>{p.industria || "Emprendimiento"}</span>
                  <strong>{formatMoney(Number(p.capital_requerido || 0))}</strong>
                </footer>
                <span className="mt-3 text-[10px] text-slate-400">Capital solicitado · Ver detalle ↗</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="dc-panel flex flex-col items-start justify-between gap-5 p-8 sm:flex-row sm:items-center">
            <div className="flex items-start gap-5">
              <span className="dc-editorial-icon"><BrandIcon name="scope" size={30}/></span>
              <div>
                <h3 className="text-lg font-bold">Estamos preparando el catálogo.</h3>
                <p className="mt-2 text-sm leading-7 text-[#cbd5e1]">Aún no hay proyectos aprobados para mostrarse públicamente.</p>
              </div>
            </div>
            <Link className="dc-btn dc-btn-primary shrink-0" href="/publicar">Presentar proyecto <BrandIcon name="arrow" size={18}/></Link>
          </div>
        )}
      </section>

      <section className="dc-trust-section">
        <div className="dc-container dc-trust-layout">
          <div>
            <p className="dc-eyebrow mb-5">Confianza por diseño</p>
            <h2 className="dc-section-title">Las mejores decisiones comienzan con <span className="text-[#facc15]">mejor información.</span></h2>
            <p className="dc-section-copy mt-6">
              Estamos construyendo procesos de revisión empresarial e identidad.
              La verificación de DNI y las consultas financieras oficiales requieren
              proveedores y autorizaciones que aún no están integrados.
            </p>
            <Link href="/verificacion" className="dc-btn dc-btn-outline mt-7">Nuestro enfoque de seguridad <BrandIcon name="arrow" size={17}/></Link>
          </div>
          <div className="dc-trust-steps">
            {[
              {icon:"shield" as const,title:"Identidad",description:"Validación oficial prevista"},
              {icon:"layers" as const,title:"Negocio",description:"Contexto y documentación"},
              {icon:"scope" as const,title:"Riesgo",description:"Información por revisar"},
              {icon:"message" as const,title:"Decisión",description:"Conversaciones informadas"},
            ].map(s=>(
              <article key={s.title} className="dc-trust-step">
                <span className="dc-editorial-icon"><BrandIcon name={s.icon} size={29}/></span>
                <h3>{s.title}</h3><p>{s.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="dc-endcap">
        <div className="dc-container dc-endcap-inner">
          <div>
            <p className="dc-eyebrow mb-5">El siguiente paso es tuyo</p>
            <h2 className="dc-section-title">Toda gran oportunidad empieza con una conversación.</h2>
          </div>
          <Link className="dc-btn dc-btn-primary" href="/registro">Ser parte de DealCapital <BrandIcon name="arrow" size={18}/></Link>
        </div>
      </section>
    </main>
  );
}
