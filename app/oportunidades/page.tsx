export const dynamic = "force-dynamic";

import { supabase } from "../../lib/supabase";
import OportunidadesClient from "./OportunidadesClient";

export default async function Oportunidades() {
  const { data: proyectos, error } = await supabase
    .from("proyectos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-10">
        <h1 className="text-4xl font-bold mb-4">
          Error cargando oportunidades
        </h1>

        <pre className="text-red-400">
          {JSON.stringify(error, null, 2)}
        </pre>
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