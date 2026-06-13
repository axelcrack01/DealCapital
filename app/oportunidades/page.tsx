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
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-5xl font-bold mb-4">
        Oportunidades de Inversión
      </h1>

      <p className="text-slate-300 mb-10">
        Explora proyectos publicados por emprendedores.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {proyectos?.map((proyecto) => (
          <div
            key={proyecto.id}
            className="bg-slate-900 p-6 rounded-2xl border border-slate-800"
          >
            <h2 className="text-2xl font-bold mb-2">
              {proyecto.nombre_proyecto}
            </h2>

            <p className="text-slate-300 mb-4">
              {proyecto.descripcion}
            </p>

            <p className="mb-2">
              <span className="text-slate-400">Emprendedor:</span>{" "}
              {proyecto.emprendedor}
            </p>

            <p className="mb-2">
              <span className="text-slate-400">Capital requerido:</span>{" "}
              S/ {proyecto.capital_requerido}
            </p>

            <p className="mb-4">
              <span className="text-slate-400">Retorno ofrecido:</span>{" "}
              {proyecto.retorno_ofrecido || "Por negociar"}
            </p>

            <a
  href={`/oportunidades/${proyecto.id}`}
  className="block text-center w-full bg-yellow-500 text-black py-3 rounded-xl font-bold"
>
  Ver oportunidad
</a>
          </div>
        ))}
      </div>
    </main>
  );
}