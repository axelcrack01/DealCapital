import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function DetalleProyecto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: proyecto } = await supabase
    .from("proyectos")
    .select("*")
    .eq("id", id)
    .single();

  if (!proyecto) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-10">
        <h1 className="text-4xl font-bold">Proyecto no encontrado</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-6xl mx-auto">
        <a href="/oportunidades" className="text-yellow-400">
          ← Volver a oportunidades
        </a>

        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 p-8 rounded-2xl">
              <p className="text-yellow-400 font-semibold mb-3">
                {proyecto.industria || "Proyecto"}
              </p>

              <h1 className="text-5xl font-bold mb-4">
                {proyecto.nombre_proyecto}
              </h1>

              {proyecto.proyecto_verificado && (
                <span className="inline-block mb-6 bg-green-600 px-4 py-2 rounded-full">
                  ✅ Proyecto revisado
                </span>
              )}

              <p className="text-slate-300 text-lg">
                {proyecto.descripcion}
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold mb-4">Equipo fundador</h2>
              <p className="text-slate-300">
                {proyecto.equipo_fundador || "Información no disponible."}
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold mb-4">Proyecciones</h2>
              <p className="text-slate-300">
                {proyecto.proyecciones || "Información no disponible."}
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold mb-4">Riesgos</h2>
              <p className="text-slate-300">
                {proyecto.riesgos || "Información no disponible."}
              </p>
            </div>

            {proyecto.video_pitch && (
              <div className="bg-slate-900 p-8 rounded-2xl">
                <h2 className="text-3xl font-bold mb-4">Video pitch</h2>
                <a
                  href={proyecto.video_pitch}
                  target="_blank"
                  className="text-yellow-400 underline"
                >
                  Ver video pitch
                </a>
              </div>
            )}

            {proyecto.documento_pdf && (
              <div className="bg-slate-900 p-8 rounded-2xl">
                <h2 className="text-3xl font-bold mb-4">Documento adjunto</h2>

                <a
                  href={proyecto.documento_pdf}
                  target="_blank"
                  className="inline-block bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold"
                >
                  Ver Pitch Deck / PDF
                </a>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-2xl sticky top-28">
              <h2 className="text-3xl font-bold mb-6">Resumen de inversión</h2>

              <div className="space-y-4 text-slate-300">
                <p>
                  <span className="text-slate-500">Monto solicitado:</span>
                  <br />
                  <b className="text-white text-2xl">
                    S/ {proyecto.capital_requerido}
                  </b>
                </p>

                <p>
                  <span className="text-slate-500">Monto recaudado:</span>
                  <br />
                  <b className="text-white">
                    S/ {proyecto.monto_recaudado || 0}
                  </b>
                </p>

                <p>
                  <span className="text-slate-500">Retorno ofrecido:</span>
                  <br />
                  {proyecto.retorno_ofrecido || "Por negociar"}
                </p>

                <p>
                  <span className="text-slate-500">ROI estimado:</span>
                  <br />
                  {proyecto.roi_estimado || "No especificado"}
                </p>

                <p>
                  <span className="text-slate-500">Plazo:</span>
                  <br />
                  {proyecto.plazo || "No especificado"}
                </p>

                <p>
                  <span className="text-slate-500">Nivel de riesgo:</span>
                  <br />
                  {proyecto.riesgo || "No especificado"}
                </p>

                <p>
                  <span className="text-slate-500">Contacto:</span>
                  <br />
                  {proyecto.email}
                </p>
              </div>

              <a
                href={`/interes/${proyecto.id}`}
                className="block text-center mt-8 bg-yellow-500 text-black px-8 py-4 rounded-xl font-bold hover:bg-yellow-400"
              >
                Estoy interesado
              </a>
              <a
  href={`/comprometer/${proyecto.id}`}
  className="block text-center mt-4 border border-yellow-500 text-yellow-400 px-8 py-4 rounded-xl font-bold hover:bg-yellow-500 hover:text-black"
>
  Comprometer inversión
</a>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}