import { supabase } from "../../lib/supabase";
import OportunidadesClient, { type Opportunity } from "./OportunidadesClient";

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
    <main className="min-h-screen">
      <header className="border-b border-slate-800 bg-[#0b1929] py-16">
        <div className="dc-container">
          <p className="dc-eyebrow mb-5">Explora · DealCapital</p>
          <h1 className="mb-5 max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Encuentra oportunidades que merezcan tu atención.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-300">
            Compara propuestas, conoce sus objetivos y conversa con sus responsables.
            La información financiera es declarada por cada proyecto.
          </p>
        </div>
      </header>
      <section className="dc-container py-12">
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
