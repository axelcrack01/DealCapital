export const dynamic = "force-dynamic";

import { supabase } from "../../lib/supabase";
import OportunidadesClient from "./OportunidadesClient";

export default async function Oportunidades() {
  const { data: proyectos, error } = await supabase
    .from("proyectos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("No fue posible cargar oportunidades", { code: error.code, message: error.message });
    return (
      <main className="min-h-screen bg-slate-950 text-white p-10">
        <h1 className="text-4xl font-bold mb-4">
          No pudimos cargar las oportunidades
        </h1>

        <p className="text-slate-300">Ocurrió un problema al consultar los proyectos. Intenta actualizar la página más tarde.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">
          Oportunidades de Inversión
        </h1>

        <p className="text-slate-300 mb-12">
          Descubre startups y proyectos con potencial de crecimiento.
        </p>

        <OportunidadesClient proyectos={proyectos || []} />
      </section>
    </main>
  );
}