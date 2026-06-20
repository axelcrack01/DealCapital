"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Inversiones() {
  const [inversiones, setInversiones] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("compromisos")
        .select("*, proyectos(nombre_proyecto, industria, roi_estimado)")
        .eq("inversionista_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        alert(JSON.stringify(error, null, 2));
        return;
      }

      setInversiones(data || []);
    };

    cargar();
  }, []);

  const inversionesFiltradas =
    filtro === "todos"
      ? inversiones
      : inversiones.filter((i) => i.estado === filtro);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">Mis inversiones</h1>

        <div className="bg-slate-900 p-4 rounded-2xl mb-8">
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full md:w-72 p-4 rounded-xl bg-slate-800"
          >
            <option value="todos">Todas</option>
            <option value="pendiente">Pendientes</option>
            <option value="aceptado">Aceptadas</option>
            <option value="rechazado">Rechazadas</option>
          </select>
        </div>

        <div className="space-y-4">
          {inversionesFiltradas.map((i) => (
            <div key={i.id} className="bg-slate-900 p-6 rounded-2xl">
              <h2 className="text-2xl font-bold">
                {i.proyectos?.nombre_proyecto || "Proyecto"}
              </h2>

              <p className="text-yellow-400">
                S/ {Number(i.monto).toLocaleString("es-PE")}
              </p>

              <p className="mt-2">
  Estado:{" "}
  <span
    className={`px-3 py-1 rounded-full text-sm font-bold ${
      i.estado === "aceptado"
        ? "bg-green-600 text-white"
        : i.estado === "rechazado"
        ? "bg-red-600 text-white"
        : "bg-yellow-500 text-black"
    }`}
  >
    {i.estado}
  </span>
</p>
              <p>Industria: {i.proyectos?.industria || "No especificada"}</p>
              <p>ROI: {i.proyectos?.roi_estimado || "No especificado"}</p>

              <a
                href={`/oportunidades/${i.proyecto_id}`}
                className="inline-block mt-4 text-yellow-400 underline"
              >
                Ver proyecto
              </a>
            </div>
          ))}

          {inversionesFiltradas.length === 0 && (
            <p className="text-slate-400">No hay inversiones con este filtro.</p>
          )}
        </div>
      </section>
    </main>
  );
}