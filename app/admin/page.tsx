import { supabase } from "../../lib/supabase";

export default async function Admin() {
  const { data: proyectos } = await supabase
    .from("proyectos")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: interesados } = await supabase
    .from("interesados")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-5xl font-bold mb-10">Panel Admin</h1>

      <section className="mb-14">
        <h2 className="text-3xl font-bold mb-6">Proyectos publicados</h2>

        <div className="space-y-4">
          {proyectos?.map((p) => (
            <div key={p.id} className="bg-slate-900 p-5 rounded-xl">
              <h3 className="text-xl font-bold">{p.nombre_proyecto}</h3>
              <p>Emprendedor: {p.emprendedor}</p>
              <p>Email: {p.email}</p>
              <p>Capital: S/ {p.capital_requerido}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-6">Interesados</h2>

        <div className="space-y-4">
          {interesados?.map((i) => (
            <div key={i.id} className="bg-slate-900 p-5 rounded-xl">
              <h3 className="text-xl font-bold">{i.nombre}</h3>
              <p>Email: {i.email}</p>
              <p>Proyecto ID: {i.proyecto_id}</p>
              <p>Mensaje: {i.mensaje || "Sin mensaje"}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}