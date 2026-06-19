"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);

  const cargarNotificaciones = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("notificaciones")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    setNotificaciones(data || []);
  };

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const marcarLeida = async (id: number) => {
    const { error } = await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    cargarNotificaciones();
  };

  const marcarTodas = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return;

    const { error } = await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("user_id", userData.user.id);

    if (error) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    cargarNotificaciones();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <h1 className="text-5xl font-bold">Notificaciones</h1>

          <button
            onClick={marcarTodas}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold"
          >
            Marcar todas como leídas
          </button>
        </div>

        <div className="space-y-4">
          {notificaciones.map((n) => (
            <div
              key={n.id}
              className={`p-6 rounded-2xl border ${
                n.leida
                  ? "bg-slate-900 border-slate-800 opacity-60"
                  : "bg-slate-900 border-yellow-500"
              }`}
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-yellow-400 font-bold">{n.tipo}</p>
                  <p className="text-slate-300">{n.mensaje}</p>
                </div>

                <span className="text-sm text-slate-500">
                  {n.leida ? "Leída" : "Nueva"}
                </span>
              </div>

              {!n.leida && (
                <button
                  onClick={() => marcarLeida(n.id)}
                  className="mt-4 bg-slate-800 hover:bg-slate-700 text-yellow-400 px-4 py-2 rounded-lg font-bold"
                >
                  Marcar como leída
                </button>
              )}
            </div>
          ))}

          {notificaciones.length === 0 && (
            <p className="text-slate-400">No tienes notificaciones.</p>
          )}
        </div>
      </section>
    </main>
  );
}