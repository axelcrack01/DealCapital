"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data } = await supabase
        .from("notificaciones")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      setNotificaciones(data || []);
    };

    cargar();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Notificaciones</h1>

        <div className="space-y-4">
          {notificaciones.map((n) => (
            <div key={n.id} className="bg-slate-900 p-6 rounded-2xl">
              <p className="text-yellow-400 font-bold">{n.tipo}</p>
              <p className="text-slate-300">{n.mensaje}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}