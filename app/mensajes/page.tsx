"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Mensajes() {
  const [conversaciones, setConversaciones] = useState<any[]>([]);

  useEffect(() => {
    const cargarConversaciones = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("conversaciones")
        .select("*, proyectos(nombre_proyecto)")
        .or(
          `emprendedor_id.eq.${userData.user.id},inversionista_id.eq.${userData.user.id}`
        )
        .order("created_at", { ascending: false });

      if (error) {
        alert(JSON.stringify(error, null, 2));
        return;
      }

      setConversaciones(data || []);
    };

    cargarConversaciones();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Mis conversaciones</h1>

        <div className="space-y-4">
          {conversaciones.map((c) => (
            <a
              key={c.id}
              href={`/mensajes/${c.id}`}
              className="block bg-slate-900 p-6 rounded-2xl hover:bg-slate-800 transition"
            >
              <h2 className="text-xl font-bold">
                {c.proyectos?.nombre_proyecto || "Proyecto"}
              </h2>

              <p className="text-slate-400">Conversación #{c.id}</p>
            </a>
          ))}

          {conversaciones.length === 0 && (
            <p className="text-slate-400">Aún no tienes conversaciones.</p>
          )}
        </div>
      </section>
    </main>
  );
}