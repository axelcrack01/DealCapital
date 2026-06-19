import { supabase } from "../../../lib/supabase";
import FavoritoButton from "../../components/FavoritoButton";
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
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-7xl mx-auto">
        <a href="/oportunidades" className="text-yellow-400">
          ← Volver a oportunidades
        </a>

        {proyecto.imagen_url && (
          <img
            src={proyecto.imagen_url}
            alt={proyecto.nombre_proyecto}
            className="w-full h-80 object-cover rounded-3xl mt-8 border border-slate-800"
          />
        )}

        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-5 mb-6">
                {proyecto.logo_url && (
                  <img
                    src={proyecto.logo_url}
                    alt="Logo del proyecto"
                    className="w-20 h-20 rounded-2xl object-cover bg-white p-2"
                  />
                )}

                <div>
                  <p className="text-yellow-400 font-semibold">
                    {proyecto.industria || "Proyecto"}
                  </p>

                  <h1 className="text-5xl font-bold">
                    {proyecto.nombre_proyecto}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {proyecto.proyecto_verificado && (
                  <span className="bg-green-600 px-4 py-2 rounded-full">
                    ✅ Proyecto revisado
                  </span>
                )}

                {proyecto.riesgo && (
                  <span className="bg-slate-800 px-4 py-2 rounded-full">
                    Riesgo: {proyecto.riesgo}
                  </span>
                )}

                {proyecto.roi_estimado && (
                  <span className="bg-slate-800 px-4 py-2 rounded-full">
                    ROI: {proyecto.roi_estimado}
                  </span>
                )}
              </div>

              <p className="text-slate-300 text-lg">
                {proyecto.descripcion}
              </p>
            </div>

            <InfoCard title="Equipo fundador" text={proyecto.equipo_fundador} />
            <InfoCard title="Proyecciones" text={proyecto.proyecciones} />
            <InfoCard title="Riesgos" text={proyecto.riesgos} />

            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <h2 className="text-3xl font-bold mb-6">Archivos y recursos</h2>

              <div className="flex flex-wrap gap-4">
                {proyecto.video_pitch && (
                  <FileButton href={proyecto.video_pitch} label="🎥 Video pitch" />
                )}

                {proyecto.pitch_deck_url && (
                  <FileButton href={proyecto.pitch_deck_url} label="📊 Pitch Deck" />
                )}

                {proyecto.documento_pdf && (
                  <FileButton href={proyecto.documento_pdf} label="📄 Documento PDF" />
                )}

                {!proyecto.video_pitch &&
                  !proyecto.pitch_deck_url &&
                  !proyecto.documento_pdf && (
                    <p className="text-slate-400">
                      Este proyecto aún no tiene archivos adjuntos.
                    </p>
                  )}
              </div>
            </div>
          </div>

          <aside>
            <div className="bg-slate-900 p-8 rounded-2xl sticky top-28 border border-slate-800">
              <h2 className="text-3xl font-bold mb-6">Resumen de inversión</h2>

              <div className="space-y-5 text-slate-300">
                <Metric
                  label="Monto solicitado"
                  value={`S/ ${Number(proyecto.capital_requerido || 0).toLocaleString(
                    "es-PE"
                  )}`}
                />

                <Metric
                  label="Monto recaudado"
                  value={`S/ ${Number(proyecto.monto_recaudado || 0).toLocaleString(
                    "es-PE"
                  )}`}
                />

                <div>
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Progreso</span>
                    <span>{Math.round(progreso)}%</span>
                  </div>

                  <div className="w-full bg-slate-800 h-4 rounded-full">
                    <div
                      className="bg-yellow-500 h-4 rounded-full"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>

                <Metric
                  label="Retorno ofrecido"
                  value={proyecto.retorno_ofrecido || "Por negociar"}
                />

                <Metric
                  label="ROI estimado"
                  value={proyecto.roi_estimado || "No especificado"}
                />

                <Metric
                  label="Plazo"
                  value={proyecto.plazo || "No especificado"}
                />

                <Metric
                  label="Nivel de riesgo"
                  value={proyecto.riesgo || "No especificado"}
                />

                <Metric label="Contacto" value={proyecto.email} />
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

function InfoCard({ title, text }: any) {
  return (
    <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-slate-300">
        {text || "Información no disponible."}
      </p>
    </div>
  );
}

function FileButton({ href, label }: any) {
  return (
    <a
      href={href}
      target="_blank"
      className="bg-slate-800 hover:bg-yellow-500 hover:text-black px-5 py-3 rounded-xl font-bold text-yellow-400"
    >
      {label}
    </a>
  );
}

function Metric({ label, value }: any) {
  return (
    <p>
      <span className="text-slate-500">{label}:</span>
      <br />
      <b className="text-white text-xl">{value}</b>
    </p>
  );
}