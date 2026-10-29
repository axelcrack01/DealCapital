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

export default async function Home() {
  // Only projects explicitly reviewed for publication should appear publicly.
  const { data, error } = await supabase.from("proyectos")
    .select("id, nombre_proyecto, industria, descripcion, capital_requerido")
    .eq("proyecto_verificado", true)
    .order("created_at", { ascending: false }).limit(3);
  const featured = (data ?? []) as FeaturedProject[];

  return (
    <main className="overflow-hidden">
      <section className="dc-hero-bg relative isolate border-b border-white/5">
        <div aria-hidden="true" className="dc-gridlines pointer-events-none absolute inset-0 -z-10" />
        <div className="dc-container grid min-h-[680px] items-center gap-14 pb-20 pt-20 lg:grid-cols-[1.02fr_.98fr] lg:pb-28 lg:pt-28">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/5 px-4 py-2 text-xs font-semibold tracking-wide text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Ecosistema de inversión en construcción · MVP
            </div>
            <h1 className="dc-display mb-7">
              Las mejores conexiones comienzan con <span className="dc-gradient-text">confianza.</span>
            </h1>
            <p className="mb-9 max-w-[540px] text-base leading-8 text-slate-300 sm:text-lg">
              Un espacio para que emprendedores presenten sus proyectos y
              potenciales inversionistas descubran oportunidades, comparen
              información y comiencen conversaciones mejor informadas.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/oportunidades" className="dc-btn dc-btn-primary">Explorar oportunidades <span aria-hidden="true">↗</span></Link>
              <Link href="/publicar" className="dc-btn dc-btn-secondary">Presentar mi proyecto <span aria-hidden="true">→</span></Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-slate-700/50 pt-6 text-xs text-slate-400">
              <span className="flex items-center gap-2"><span className="text-amber-300">◆</span> Información estructurada</span>
              <span className="flex items-center gap-2"><span className="text-amber-300">◆</span> Comunicación entre partes</span>
              <span className="flex items-center gap-2"><span className="text-amber-300">◆</span> Enfoque en transparencia</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[550px]" aria-label="Vista ilustrativa de las herramientas de DealCapital">
            <div aria-hidden="true" className="absolute -inset-10 rounded-full bg-amber-500/10 blur-[80px]" />
            <div className="relative overflow-hidden rounded-[22px] border border-slate-600/70 bg-[#0d1b2b] p-4 shadow-[0_35px_100px_rgba(0,0,0,.45)] sm:p-6">
              <div className="mb-6 flex items-center justify-between border-b border-slate-700/60 pb-5">
                <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-amber-300 text-xl text-slate-950">✦</span><div><p className="text-sm font-bold text-white">DealCapital</p><p className="text-xs text-slate-400">Explora con criterio</p></div></div>
                <span className="rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">Vista conceptual</span>
              </div>
              <p className="dc-overline mb-2">Exploración de oportunidades</p>
              <h2 className="mb-5 text-[24px] font-semibold tracking-tight text-white">Decisiones con más contexto.</h2>
              <div className="dc-sheen rounded-xl border border-slate-600/60 p-5">
                <div className="mb-5 flex items-center justify-between"><span className="text-xs font-semibold text-slate-300">Información del proyecto</span><span className="rounded-full bg-amber-200/10 px-2 py-1 text-[10px] text-amber-200">En evaluación</span></div>
                <div className="mb-4 h-2 w-3/4 rounded-full bg-slate-500/45" /><div className="mb-6 h-2 w-1/2 rounded-full bg-slate-600/45" />
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["01", "Identidad"],
                    ["02", "Negocio"],
                    ["03", "Documentos"],
                  ].map(([number, title]) => <div key={number} className="rounded-lg border border-slate-600/50 bg-slate-950/35 p-3"><p className="mb-2 font-mono text-lg text-amber-200">{number}</p><p className="text-xs text-slate-300">{title}</p></div>)}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/35 p-4">
                <div><p className="text-xs font-semibold text-white">Diligencia debida asistida</p><p className="mt-1 text-[11px] leading-5 text-slate-400">Una capacidad prevista, no una evaluación financiera activa.</p></div>
                <div className="grid size-10 place-items-center rounded-xl border border-amber-300/30 text-xl text-amber-200">↗</div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-4 hidden rounded-xl border border-amber-300/30 bg-[#162a38] px-5 py-4 shadow-2xl sm:block">
              <span className="mb-1 block text-xs text-amber-200">Prioridad</span><span className="text-sm font-bold text-white">Claridad antes de invertir</span>
            </div>
          </div>
        </div>
      </section>

      <section className="dc-container py-20 sm:py-24">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="dc-eyebrow mb-4">Qué hacemos</p><h2 className="max-w-[620px] text-3xl font-bold tracking-tight text-white sm:text-4xl">Un punto de encuentro para ideas con potencial.</h2></div>
          <p className="max-w-[390px] text-sm leading-7 text-slate-400">Herramientas para descubrir, presentar y evaluar información con mayor claridad. Sin promesas de rentabilidad.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["01", "Para emprendedores", "Presenta tu propuesta, explica el destino del capital y comparte información clave de tu negocio.", "/publicar", "Presentar proyecto"],
            ["02", "Para inversionistas", "Explora oportunidades y revisa descripciones, condiciones declaradas y documentación disponible.", "/oportunidades", "Explorar oportunidades"],
            ["03", "Confianza por diseño", "Preparamos procesos de revisión documental e identidad con proveedores autorizados.", "/verificacion", "Conocer la verificación"],
          ].map(([n, title, body, href, cta]) => <article key={n} className="dc-panel flex min-h-[280px] flex-col p-7 transition-colors hover:border-amber-300/40"><span className="mb-9 font-mono text-2xl text-amber-200/85">{n}</span><h3 className="mb-3 text-xl font-bold text-white">{title}</h3><p className="mb-6 flex-1 text-sm leading-7 text-slate-400">{body}</p><Link href={href} className="text-sm font-bold text-amber-200 hover:text-amber-100">{cta} <span aria-hidden="true">↗</span></Link></article>)}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-[#0b1826] py-20">
        <div className="dc-container">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div><p className="dc-eyebrow mb-4">Oportunidades</p><h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Proyectos en el radar</h2><p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">Solo mostramos aquí proyectos marcados para publicación por la plataforma. Esa revisión no implica rentabilidad ni ausencia de riesgo.</p></div>
            <Link href="/oportunidades" className="dc-btn dc-btn-secondary">Ver catálogo completo <span aria-hidden="true">→</span></Link>
          </div>
          {error ? (
            <div role="status" className="dc-panel p-8 text-slate-300">El catálogo no está disponible en este momento. Intenta nuevamente más tarde.</div>
          ) : featured.length ? (
            <div className="grid gap-4 md:grid-cols-3">{featured.map(p => <Link key={p.id} href={"/oportunidades/" + p.id} className="dc-panel group flex min-h-[245px] flex-col p-6 hover:border-amber-200/45"><p className="dc-overline mb-7 text-amber-200">{p.industria || "Emprendimiento"}</p><h3 className="mb-3 text-xl font-bold text-white group-hover:text-amber-200">{p.nombre_proyecto || "Proyecto"}</h3><p className="mb-7 line-clamp-2 flex-1 text-sm leading-6 text-slate-400">{p.descripcion || "Información en actualización."}</p><div className="flex items-center justify-between border-t border-slate-700/70 pt-4"><span className="text-xs text-slate-400">Capital solicitado</span><strong className="text-sm text-amber-200">{money(Number(p.capital_requerido || 0))}</strong></div></Link>)}</div>
          ) : (
            <div className="dc-panel flex flex-wrap items-center justify-between gap-6 p-8"><div><p className="text-lg font-semibold text-white">Aún no hay proyectos publicados tras revisión.</p><p className="mt-2 text-sm text-slate-400">Puedes presentar tu proyecto para que sea evaluado.</p></div><Link href="/publicar" className="dc-btn dc-btn-primary">Publicar un proyecto →</Link></div>
          )}
        </div>
      </section>

      <section className="dc-container py-20 sm:py-24">
        <div className="dc-trust-card relative overflow-hidden p-8 sm:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border border-amber-300/10 shadow-[0_0_100px_rgba(233,180,87,.09)]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.3fr_.7fr] lg:items-center">
            <div><p className="dc-eyebrow mb-5">DealCapital Trust</p><h2 className="mb-5 max-w-[700px] text-3xl font-bold tracking-tight text-white sm:text-4xl">El futuro de las inversiones exige más transparencia.</h2><p className="max-w-2xl text-sm leading-8 text-slate-300">Diseñamos un proceso progresivo de identidad, validación empresarial y revisión de documentos. Las conexiones con RENIEC, SBS u otros proveedores no están actualmente habilitadas.</p></div>
            <div className="flex lg:justify-end"><Link href="/verificacion" className="dc-btn dc-btn-primary">Nuestro enfoque de confianza <span aria-hidden="true">↗</span></Link></div>
          </div>
        </div>
        <p className="mt-7 text-center text-xs leading-6 text-slate-500">DealCapital es un MVP de conexión. No recibe dinero, no garantiza rendimientos y no debe interpretarse como una entidad financiera autorizada.</p>
      </section>
    </main>
  );
}
