import { supabase } from "../../../lib/supabase";

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
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-5xl font-bold mb-6">
        {proyecto.nombre_proyecto}
      </h1>

      <div className="bg-slate-900 p-8 rounded-2xl max-w-4xl space-y-4">
        <p>{proyecto.descripcion}</p>

        <p><b>Emprendedor:</b> {proyecto.emprendedor}</p>
        <p><b>Email:</b> {proyecto.email}</p>
        <p><b>Capital requerido:</b> S/ {proyecto.capital_requerido}</p>
        <p><b>Retorno ofrecido:</b> {proyecto.retorno_ofrecido || "Por negociar"}</p>

        <a
          href={`/interes/${proyecto.id}`}
          className="inline-block bg-yellow-500 text-black px-8 py-4 rounded-xl font-bold"
        >
          Estoy interesado
        </a>
      </div>
    </main>
  );
}