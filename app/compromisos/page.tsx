"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Compromisos() {
  const [compromisos, setCompromisos] = useState<any[]>([]);

  const cargarCompromisos = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("compromisos")
      .select("*, proyectos(nombre_proyecto, monto_recaudado, capital_requerido)")
      .order("created_at", { ascending: false });

    if (error) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    setCompromisos(data || []);
  };

  useEffect(() => {
    cargarCompromisos();
  }, []);

  const actualizarCompromiso = async (
    compromisoId: number,
    proyectoId: number,
    monto: number,
    estado: "aceptado" | "rechazado"
  ) => {
    if (estado === "aceptado") {
      const { data: proyecto, error: proyectoError } = await supabase
        .from("proyectos")
        .select("monto_recaudado, capital_requerido")
        .eq("id", proyectoId)
        .single();

      if (proyectoError) {
        alert(JSON.stringify(proyectoError, null, 2));
        return;
      }

      const nuevoMonto =
        Number(proyecto?.monto_recaudado || 0) + Number(monto);

      const porcentaje =
        Number(proyecto?.capital_requerido || 0) > 0
          ? Math.min(
              (nuevoMonto / Number(proyecto.capital_requerido)) * 100,
              100
            )
          : 0;

      const { error: updateProyectoError } = await supabase
        .from("proyectos")
        .update({
          monto_recaudado: nuevoMonto,
          porcentaje_financiado: porcentaje,
        })
        .eq("id", proyectoId);

      if (updateProyectoError) {
        alert(JSON.stringify(updateProyectoError, null, 2));
        return;
      }
    }

    const { error } = await supabase
      .from("compromisos")
      .update({
        estado,
        aprobado_at: estado === "aceptado" ? new Date().toISOString() : null,
        rechazado_at: estado === "rechazado" ? new Date().toISOString() : null,
      })
      .eq("id", compromisoId);

    if (error) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    cargarCompromisos();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Compromisos de inversión</h1>

        <div className="space-y-4">
          {compromisos.map((c) => {
            const progreso =
              Number(c.proyectos?.capital_requerido || 0) > 0
                ? Math.min(
                    (Number(c.proyectos?.monto_recaudado || 0) /
                      Number(c.proyectos?.capital_requerido || 0)) *
                      100,
                    100
                  )
                : 0;

            return (
              <div key={c.id} className="bg-slate-900 p-6 rounded-2xl">
                <h2 className="text-2xl font-bold">
                  {c.proyectos?.nombre_proyecto || "Proyecto"}
                </h2>

                <p className="text-yellow-400 text-xl mt-2">
                  S/ {Number(c.monto).toLocaleString("es-PE")}
                </p>

                <p className="text-slate-300 mt-2">
                  {c.mensaje || "Sin mensaje"}
                </p>

                <p className="mt-3">
                  Estado: <span className="font-bold">{c.estado}</span>
                </p>

                <div className="mt-5">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Progreso del proyecto</span>
                    <span>{Math.round(progreso)}%</span>
                  </div>

                  <div className="w-full bg-slate-800 h-3 rounded-full">
                    <div
                      className="bg-yellow-500 h-3 rounded-full"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>

                {c.estado === "pendiente" && (
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() =>
                        actualizarCompromiso(
                          c.id,
                          c.proyecto_id,
                          c.monto,
                          "aceptado"
                        )
                      }
                      className="bg-green-600 px-5 py-3 rounded-xl font-bold"
                    >
                      Aceptar
                    </button>

                    <button
                      onClick={() =>
                        actualizarCompromiso(
                          c.id,
                          c.proyecto_id,
                          c.monto,
                          "rechazado"
                        )
                      }
                      className="bg-red-600 px-5 py-3 rounded-xl font-bold"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {compromisos.length === 0 && (
            <p className="text-slate-400">
              Aún no tienes compromisos registrados.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}