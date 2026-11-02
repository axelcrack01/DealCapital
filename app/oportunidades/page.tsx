import { supabase } from "../../lib/supabase";
import OportunidadesClient, { type Opportunity } from "./OportunidadesClient";
import BrandIcon from "../components/BrandIcon";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Oportunidades | DealCapital",
  description: "Explora emprendimientos y compara información declarada por los responsables de cada proyecto.",
};

export default async function Oportunidades() {
  const { data, error } = await supabase
    .from("proyectos")
    .select("id,nombre_proyecto,industria,descripcion,capital_requerido,riesgo,imagen_url,proyecto_verificado,created_at")
    .eq("proyecto_verificado", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to retrieve opportunities", { code: error.code, message: error.message });
  }

  return (
    <main className="dc-landing min-h-screen">
      <header className="dc-page-head">
        <div className="dc-container dc-page-head-grid">
          <div>
            <p className="dc-kicker">Oportunidades / DealCapital</p>
            <h1>Descubre negocios. <em>Empieza conversaciones.</em></h1>
            <p className="mt-6">
              Explora proyectos, compara sus propuestas y conoce cuánto capital buscan.
              Las cifras y riesgos son información declarada por sus responsables.
            </p>
          </div>
          <aside className="dc-insight-rail">
            <span>Antes de contactar</span>
            <strong>Observa el modelo de negocio, el uso del capital y la documentación.</strong>
            <Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#facc15] hover:underline"
              href="/inversionistas">Guía para inversionistas <BrandIcon name="arrow" size={17}/></Link>
          </aside>
        </div>
      </header>
      <section className="dc-container py-12 sm:py-16">
        {error ? (
          <div role="status" className="dc-panel p-8">
            <h2 className="mb-3 text-xl font-bold">El catálogo no está disponible</h2>
            <p className="text-sm text-slate-400">Intenta actualizar la página más tarde.</p>
          </div>
        ) : (
          <OportunidadesClient proyectos={(data || []) as Opportunity[]} />
        )}
        <p className="mt-10 text-xs leading-6 text-slate-500">
          La publicación no constituye una garantía de rentabilidad ni una verificación financiera.
          El proceso de identidad oficial aún no está habilitado.
        </p>
      </section>
    </main>
  );
}
