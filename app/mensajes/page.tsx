"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [userId, setUserId] = useState("");
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [contenido, setContenido] = useState("");

  const cargarMensajes = async () => {
    const { data } = await supabase
      .from("mensajes")
      .select("*")
      .eq("conversacion_id", Number(id))
      .order("created_at", { ascending: true });

    setMensajes(data || []);
  };

  useEffect(() => {
    const iniciar = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUserId(data.user.id);
      cargarMensajes();
    };

    iniciar();
  }, []);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contenido.trim()) return;

    const { error } = await supabase.from("mensajes").insert([
      {
        conversacion_id: Number(id),
        sender_id: userId,
        contenido,
      },
    ]);

    if (error) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    setContenido("");
    cargarMensajes();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Mensajes</h1>

        <div className="bg-slate-900 rounded-2xl p-6 space-y-4 mb-6">
          {mensajes.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-xl max-w-[80%] ${
                m.sender_id === userId
                  ? "bg-yellow-500 text-black ml-auto"
                  : "bg-slate-800 text-white"
              }`}
            >
              {m.contenido}
            </div>
          ))}
        </div>

        <form onSubmit={enviarMensaje} className="flex gap-3">
          <input
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 p-4 rounded-xl bg-slate-800"
          />

          <button className="bg-yellow-500 text-black px-6 rounded-xl font-bold">
            Enviar
          </button>
        </form>
      </section>
    </main>
  );
}