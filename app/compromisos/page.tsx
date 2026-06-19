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
      .select("*, proyectos(nombre_proyecto, monto_recaudado)")
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
      const { data: proyecto } = await supabase
        .from("proyectos")
        .select("monto_recaudado")
        .eq("id", proyectoId)
        .single();

      const nuevoMonto = Number(proyecto?.monto_recaudado || 0) + Number(monto);

      await supabase
        .from("proyectos")
        .update({ monto_recaudado: nuevoMonto })
        .eq("id", proyectoId);
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
          {compromisos.map((c) => (
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
                Estado:{" "}
                <span className="font-bold">
                  {c.estado}
                </span>
              </p>

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
          ))}

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