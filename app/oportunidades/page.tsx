export const dynamic = "force-dynamic";

import { supabase } from "../../lib/supabase";

export default async function Oportunidades() {
  const { data: proyectos, error } = await supabase
    .from("proyectos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error Supabase:", error);

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

        <p className="text-slate-300 mb-10">
          Explora startups, negocios y proyectos que buscan financiamiento.
        </p>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
          {proyectos?.map((proyecto) => (
            <div
              key={proyecto.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-yellow-500 transition"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-slate-800 text-yellow-400 px-3 py-1 rounded-full text-sm">
                    {proyecto.industria || "Proyecto"}
                  </span>

                  {proyecto.proyecto_verificado && (
                    <span className="bg-green-600 px-3 py-1 rounded-full text-sm">
                      ✅ Verificado
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold mb-3">
                  {proyecto.nombre_proyecto}
                </h2>

                <p className="text-slate-300 mb-6 line-clamp-3">
                  {proyecto.descripcion}
                </p>

                <div className="space-y-3 mb-6">
                  <p>
                    <span className="text-slate-500">
                      Emprendedor:
                    </span>{" "}
                    {proyecto.emprendedor}
                  </p>

                  <p>
                    <span className="text-slate-500">
                      Capital requerido:
                    </span>{" "}
                    <b>S/ {proyecto.capital_requerido}</b>
                  </p>

                  <p>
                    <span className="text-slate-500">
                      ROI estimado:
                    </span>{" "}
                    {proyecto.roi_estimado || "No especificado"}
                  </p>

                  <p>
                    <span className="text-slate-500">
                      Riesgo:
                    </span>{" "}
                    {proyecto.riesgo || "No especificado"}
                  </p>

                  <p>
                    <span className="text-slate-500">
                      Plazo:
                    </span>{" "}
                    {proyecto.plazo || "No especificado"}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Financiamiento</span>

                    <span>
                      S/ {proyecto.monto_recaudado || 0} / S/{" "}
                      {proyecto.capital_requerido}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-3">
                    <div
                      className="bg-yellow-500 h-3 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((proyecto.monto_recaudado || 0) /
                            proyecto.capital_requerido) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <a
                  href={`/oportunidades/${proyecto.id}`}
                  className="block text-center w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold transition"
                >
                  Ver oportunidad
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}