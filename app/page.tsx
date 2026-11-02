import Link from "next/link";
import { supabase } from "../lib/supabase";
import BrandIcon, { type BrandIconName } from "./components/BrandIcon";
import ProposalHeroVisual from "./components/ProposalHeroVisual";
import ProposalCatalog, { type ProposalProject } from "./components/ProposalCatalog";
import AudienceSwitcher from "./components/AudienceSwitcher";

export const dynamic = "force-dynamic";

const values: {number:string;icon:BrandIconName;title:string;body:string}[] = [
  {
    number:"01", icon:"venture", title:"Haz visible tu idea.",
    body:"Cuenta qué construyes, qué problema resuelves y qué capital necesitas.",
  },
  {
    number:"02", icon:"compass", title:"Descubre con criterio.",
    body:"Encuentra proyectos por su sector y examina información disponible.",
  },
  {
    number:"03", icon:"link", title:"Conversa para avanzar.",
    body:"Inicia una conexión y continúa el análisis antes de tomar decisiones.",
  },
];

const trust: {icon:BrandIconName;title:string;tag:string;body:string}[] = [
  {icon:"shield",title:"Identidad",tag:"PLANIFICADO",body:"Validaciones oficiales por integrar"},
  {icon:"document",title:"Documentación",tag:"EN EVOLUCIÓN",body:"Información aportada por usuarios"},
  {icon:"scope",title:"Evaluación",tag:"INFORMATIVO",body:"Riesgos que corresponde contrastar"},
  {icon:"link",title:"Conexión",tag:"MVP",body:"Diálogo entre personas interesadas"},
];

export default async function Home() {
  const { data, error } = await supabase.from("proyectos")
    .select("id,nombre_proyecto,industria,descripcion,capital_requerido")
    .eq("proyecto_verificado",true)
    .order("created_at",{ascending:false}).limit(6);
  const projects = (data ?? []) as ProposalProject[];

  return (
    <main className="dc-landing dc-unified">
      <section className="dc-up-hero" aria-labelledby="dc-up-title">
        <div className="dc-container dc-up-hero-grid">
          <div className="dc-up-hero-copy">
            <p className="dc-up-overline">DealCapital / Emprendimiento e inversión</p>
            <h1 id="dc-up-title">Conectamos emprendedores con <em>inversionistas.</em></h1>
            <p className="dc-up-lead">
              Las ideas necesitan visibilidad. Las oportunidades, contexto.
              Unimos ambos mundos en una plataforma diseñada para presentar proyectos,
              explorar propuestas y comenzar conversaciones con mayor claridad.
            </p>
            <div className="dc-up-actions">
              <Link href="/oportunidades" className="dc-btn dc-btn-primary">
                Explorar oportunidades <BrandIcon name="arrow" size={18}/>
              </Link>
              <Link href="/publicar" className="dc-btn dc-btn-outline">
                Tengo un proyecto <BrandIcon name="arrow" size={18}/>
              </Link>
            </div>
            <div className="dc-up-proof" aria-label="Características de DealCapital">
              <span>Propuestas estructuradas</span>
              <span>Descubrimiento informado</span>
              <span>Plataforma en fase MVP</span>
            </div>
          </div>
          <ProposalHeroVisual/>
        </div>
      </section>

      <nav className="dc-up-shortcuts" aria-label="Elige tu camino en DealCapital">
        <div className="dc-container dc-up-shortcut-grid">
          <Link href="/publicar" className="dc-up-shortcut">
            <BrandIcon name="venture" size={27}/>
            <span><strong>Tengo un proyecto</strong><small>Prepara y presenta tu oportunidad</small></span>
            <BrandIcon name="arrow" size={19}/>
          </Link>
          <Link href="/oportunidades" className="dc-up-shortcut">
            <BrandIcon name="compass" size={27}/>
            <span><strong>Busco oportunidades</strong><small>Explora negocios con más contexto</small></span>
            <BrandIcon name="arrow" size={19}/>
          </Link>
          <Link href="/verificacion" className="dc-up-shortcut">
            <BrandIcon name="shield" size={27}/>
            <span><strong>Quiero saber más</strong><small>Conoce el enfoque de confianza</small></span>
            <BrandIcon name="arrow" size={19}/>
          </Link>
        </div>
      </nav>

      <section id="propuesta" className="dc-up-values" aria-labelledby="dc-up-values-title">
        <div className="dc-container">
          <div className="dc-up-heading">
            <div>
              <p className="dc-up-label">01 / Nuestra propuesta</p>
              <h2 id="dc-up-values-title">Un ecosistema diseñado para <em>conexiones con propósito.</em></h2>
            </div>
            <p>En DealCapital, cada perfil sigue un recorrido claro. Menos ruido visual,
              mejor información y acciones que ayudan a avanzar de la idea al diálogo.</p>
          </div>
          <div className="dc-up-value-grid">
            {values.map((v,index)=>(
              <article key={v.number} className={"dc-up-value-card"+(index===1?" is-highlight":"")}>
                <div className="dc-up-value-top">
                  <span className="dc-up-value-icon"><BrandIcon name={v.icon} size={26}/></span>
                  <span>{v.number} / 03</span>
                </div>
                <div>
                  <h3>{v.title}</h3>
                  <p>{v.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div id="experiencia" className="dc-up-journey-wrapper"><AudienceSwitcher/></div>

      <section id="proyectos" className="dc-up-catalog-section" aria-labelledby="dc-up-catalog-title">
        <div className="dc-container dc-up-catalog-layout">
          <div className="dc-up-catalog-copy">
            <p className="dc-up-label">03 / Explora oportunidades</p>
            <h2 id="dc-up-catalog-title">Un catálogo pensado para <em>descubrir con criterio.</em></h2>
            <p>Una experiencia de búsqueda mejor organizada: filtros por sector,
              fichas más claras y acceso a los detalles de cada propuesta. Sin métricas
              inventadas ni promesas de rentabilidad.</p>
            <Link href="/oportunidades" className="dc-btn dc-btn-outline">
              Ver catálogo completo <BrandIcon name="arrow" size={18}/>
            </Link>
          </div>
          <ProposalCatalog projects={projects} unavailable={Boolean(error)}/>
        </div>
      </section>

      <section id="confianza" className="dc-up-trust" aria-labelledby="dc-up-trust-title">
        <div className="dc-container dc-up-trust-layout">
          <div>
            <p className="dc-up-label">04 / Confianza y transparencia</p>
            <h2 id="dc-up-trust-title">La confianza se construye con <em>información clara.</em></h2>
            <p>Explicamos qué datos se muestran, qué debe verificar cada persona
              y qué funciones están previstas para versiones futuras. La revisión de
              publicación no equivale a certificación financiera.</p>
            <Link href="/verificacion" className="dc-up-trust-link">
              Conoce nuestro enfoque de confianza <BrandIcon name="arrow" size={17}/>
            </Link>
          </div>
          <div className="dc-up-trust-grid">
            {trust.map(t => (
              <article key={t.title} className="dc-up-trust-card">
                <div className="dc-up-trust-meta">
                  <BrandIcon name={t.icon} size={23}/>
                  <span>{t.tag}</span>
                </div>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dc-up-bottom">
        <div className="dc-container dc-up-bottom-inner">
          <h2>Las grandes ideas avanzan cuando encuentran a las personas correctas.</h2>
          <Link href="/registro" className="dc-up-bottom-cta">
            Descubre DealCapital <BrandIcon name="arrow" size={19}/>
          </Link>
        </div>
      </section>
    </main>
  );
}
