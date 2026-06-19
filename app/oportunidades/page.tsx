export const dynamic = "force-dynamic";

import { supabase } from "../../lib/supabase";

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

        <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-8">
          {proyectos?.map((proyecto) => {
            const progreso =
              Number(proyecto.capital_requerido || 0) > 0
                ? Math.min(
                    (Number(proyecto.monto_recaudado || 0) /
                      Number(proyecto.capital_requerido)) *
                      100,
                    100
                  )
                : 0;

            return (
              <div
                key={proyecto.id}
                className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-yellow-500 transition-all hover:-translate-y-1"
              >
                {proyecto.imagen_url ? (
                  <img
                    src={proyecto.imagen_url}
                    alt={proyecto.nombre_proyecto}
                    className="w-full h-56 object-cover"
                  />
                ) : (
                  <div className="w-full h-56 bg-slate-800 flex items-center justify-center">
                    <span className="text-slate-500">
                      Sin imagen
                    </span>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-4 mb-5">
                    {proyecto.logo_url ? (
                      <img
                        src={proyecto.logo_url}
                        alt="Logo"
                        className="w-16 h-16 rounded-2xl bg-white object-cover p-2"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                        🚀
                      </div>
                    )}

                    <div>
                      <h2 className="text-2xl font-bold">
                        {proyecto.nombre_proyecto}
                      </h2>

                      <p className="text-yellow-400 text-sm">
                        {proyecto.industria || "Proyecto"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
                    {proyecto.proyecto_verificado && (
                      <span className="bg-green-600 px-3 py-1 rounded-full text-xs">
                        ✅ Verificado
                      </span>
                    )}

                    {proyecto.riesgo && (
                      <span className="bg-slate-800 px-3 py-1 rounded-full text-xs">
                        Riesgo: {proyecto.riesgo}
                      </span>
                    )}

                    {proyecto.roi_estimado && (
                      <span className="bg-slate-800 px-3 py-1 rounded-full text-xs">
                        ROI: {proyecto.roi_estimado}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-300 mb-6 line-clamp-3">
                    {proyecto.descripcion}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-800 p-3 rounded-xl">
                      <p className="text-slate-400 text-sm">
                        Capital
                      </p>

                      <p className="font-bold">
                        S/{" "}
                        {Number(
                          proyecto.capital_requerido || 0
                        ).toLocaleString("es-PE")}
                      </p>
                    </div>

                    <div className="bg-slate-800 p-3 rounded-xl">
                      <p className="text-slate-400 text-sm">
                        Recaudado
                      </p>

                      <p className="font-bold">
                        S/{" "}
                        {Number(
                          proyecto.monto_recaudado || 0
                        ).toLocaleString("es-PE")}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                      <span>Financiamiento</span>
                      <span>{Math.round(progreso)}%</span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-3">
                      <div
                        className="bg-yellow-500 h-3 rounded-full"
                        style={{
                          width: `${progreso}%`,
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
            );
          })}
        </div>
      </section>
    </main>
  );
}