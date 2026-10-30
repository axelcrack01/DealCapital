import Link from "next/link";
import { supabase } from "../lib/supabase";

export const dynamic = "force-dynamic";

type FeaturedProject = {
  id: number;
  nombre_proyecto: string | null;
  industria: string | null;
  descripcion: string | null;
  capital_requerido: number | null;
};

const money = (amount: number) => new Intl.NumberFormat("es-PE", {
  style: "currency", currency: "PEN", maximumFractionDigits: 0,
}).format(amount);

const benefits = [
  { number: "01", title: "Publica tu proyecto", description: "Organiza tu propuesta de negocio y presenta cuánto capital necesitas.", href: "/publicar", link: "Presentar proyecto" },
  { number: "02", title: "Explora oportunidades", description: "Descubre negocios y consulta información sobre sus objetivos y condiciones.", href: "/oportunidades", link: "Explorar proyectos" },
  { number: "03", title: "Conecta directamente", description: "Expresa interés y empieza conversaciones con los responsables de cada iniciativa.", href: "/registro", link: "Crear una cuenta" },
  { number: "04", title: "Conoce los riesgos", description: "Compara información declarada y revisa los documentos disponibles antes de decidir.", href: "/verificacion", link: "Nuestro enfoque" },
];

export default async function Home() {
  const { data, error } = await supabase.from("proyectos")
    .select("id, nombre_proyecto, industria, descripcion, capital_requerido")
    .eq("proyecto_verificado", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const featured = (data ?? []) as FeaturedProject[];

  return (
    <main className="dc-home">
      <section className="dc-hero">
        <div className="dc-container dc-hero-grid">
          <div className="min-w-0">
            <p className="dc-badge"><span aria-hidden="true" className="size-1.5 rounded-full bg-[#facc15]" /> Plataforma en fase MVP</p>
            <h1 className="dc-title">
              Conectamos emprendedores e <span>inversionistas.</span>
            </h1>
            <p className="dc-subtitle">
              DealCapital conecta emprendedores que buscan financiamiento con
              personas interesadas en descubrir nuevas oportunidades de negocio.
              Presenta tu idea, conoce proyectos y construye conexiones con más información.
            </p>
            <div className="dc-actions">
              <Link href="/oportunidades" className="dc-btn dc-btn-primary">
                Explorar oportunidades <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/publicar" className="dc-btn dc-btn-outline">
                Publicar mi proyecto <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="mt-7 max-w-xl text-xs leading-6 text-slate-400">
              Un espacio de conexión en desarrollo. DealCapital no recibe fondos
              ni garantiza resultados de inversión.
            </p>
          </div>

          <aside className="dc-preview" aria-label="Resumen de cómo funciona DealCapital">
            <div className="dc-preview-header">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg border border-[#facc15]/40 text-base font-extrabold text-[#facc15]">DC</span>
                <div>
                  <p className="text-base font-bold text-white">Tu próximo paso</p>
                  <p className="text-xs text-slate-400">Así funciona DealCapital</p>
                </div>
              </div>
              <span className="rounded-md border border-[#facc15]/30 bg-[#facc15]/10 px-2.5 py-1 text-[10px] font-semibold text-[#facc15]">FASE MVP</span>
            </div>
            <h2 className="mb-2 text-2xl font-bold leading-snug text-white">Del proyecto a la conexión.</h2>
            <p className="mb-5 text-sm leading-7 text-[#cbd5e1]">
              Un recorrido sencillo para conocer la información relevante antes de conversar.
            </p>
            <div>
              {[
                ["01", "Descubre una oportunidad", "Revisa el negocio, su sector y el capital solicitado."],
                ["02", "Analiza su propuesta", "Consulta objetivos, documentación y riesgos declarados."],
                ["03", "Inicia una conversación", "Contacta con el responsable a través de la plataforma."],
              ].map(([n, title, description]) => (
                <div className="dc-preview-step" key={n}>
                  <span className="dc-preview-index">{n}</span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                </div>
              ))}
            </div>
            <Link href="/verificacion" className="mt-5 inline-flex text-xs font-bold text-[#facc15] hover:underline">
              Conoce nuestro enfoque de seguridad <span aria-hidden="true" className="ml-2">↗</span>
            </Link>
          </aside>
        </div>
      </section>

      <section className="dc-container py-16 sm:py-20" aria-labelledby="benefits-heading">
        <div className="mb-9 grid gap-5 md:grid-cols-[1.1fr_.9fr] md:items-end">
          <div>
            <p className="dc-eyebrow mb-4">Nuestro ecosistema</p>
            <h2 id="benefits-heading" className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Una plataforma para conectar ideas y capital.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[#cbd5e1]">
            Emprendedores e inversionistas necesitan información clara, un proceso simple
            y canales de contacto sin complicaciones.
          </p>
        </div>
        <div className="dc-features">
          {benefits.map((item) => (
            <article key={item.number} className="dc-feature-card flex flex-col">
              <div className="dc-feature-icon" aria-hidden="true">{item.number}</div>
              <h3>{item.title}</h3>
              <p className="mb-5 flex-1">{item.description}</p>
              <Link href={item.href} className="text-xs font-bold text-[#facc15] hover:underline">
                {item.link} <span aria-hidden="true">↗</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-[#061226] py-16 sm:py-20">
        <div className="dc-container">
          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="dc-eyebrow mb-4">Oportunidades</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Conoce los proyectos publicados.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#cbd5e1]">
                Cada proyecto presenta información suministrada por su responsable.
                Una revisión de publicación no es una garantía de inversión.
              </p>
            </div>
            <Link href="/oportunidades" className="dc-btn dc-btn-outline shrink-0">Ver todas las oportunidades ↗</Link>
          </div>
          {error ? (
            <div role="status" className="dc-panel p-7 text-sm text-[#cbd5e1]">
              No podemos mostrar las oportunidades en este momento. Intenta nuevamente más tarde.
            </div>
          ) : featured.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {featured.map((project) => (
                <Link href={"/oportunidades/" + project.id} key={project.id}
                  className="dc-panel group flex min-h-56 flex-col p-6 transition-colors hover:border-[#facc15]/50">
                  <p className="mb-6 text-xs font-bold uppercase tracking-wider text-[#facc15]">
                    {project.industria || "Emprendimiento"}
                  </p>
                  <h3 className="mb-3 text-lg font-bold text-white">{project.nombre_proyecto || "Proyecto"}</h3>
                  <p className="mb-6 line-clamp-3 flex-1 text-sm leading-6 text-[#cbd5e1]">
                    {project.descripcion || "Información no disponible."}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700 pt-4">
                    <span className="text-xs text-slate-400">Capital solicitado</span>
                    <span className="text-sm font-bold text-[#facc15]">{money(Number(project.capital_requerido || 0))}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dc-panel flex flex-col justify-between gap-5 p-7 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Pronto encontrarás oportunidades aquí.</h3>
                <p className="mt-2 text-sm text-[#cbd5e1]">Por ahora no hay proyectos aprobados para publicación.</p>
              </div>
              <Link href="/publicar" className="dc-btn dc-btn-primary shrink-0">Presentar un proyecto ↗</Link>
            </div>
          )}
        </div>
      </section>

      <section className="dc-container py-16 sm:py-20">
        <div className="dc-trust-card grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="dc-eyebrow mb-4">Confianza y transparencia</p>
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Más información para tomar mejores decisiones.
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-[#cbd5e1]">
              Estamos diseñando controles de identidad y revisión documental.
              Las integraciones oficiales de RENIEC y SBS aún no están disponibles en DealCapital.
            </p>
          </div>
          <Link href="/verificacion" className="dc-btn dc-btn-primary">Cómo verificaremos identidades ↗</Link>
        </div>
      </section>
    </main>
  );
}
