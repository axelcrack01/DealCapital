"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [userId, setUserId] = useState("");
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [contenido, setContenido] = useState("");
  const [sendError,setSendError]=useState<string|null>(null);

  const cargarMensajes = async () => {
    const { data } = await supabase
      .from("mensajes")
      .select("*")
      .eq("conversacion_id", Number(id))
      .order("created_at", { ascending: true });

    setMensajes(data || []);
  };

  useEffect(() => {
    let canal: any;

    const iniciar = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUserId(data.user.id);
      await cargarMensajes();

      canal = supabase
        .channel(`chat-${id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "mensajes",
            filter: `conversacion_id=eq.${id}`,
          },
          (payload) => {
            setMensajes((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();
    };

    iniciar();

    return () => {
      if (canal) {
        supabase.removeChannel(canal);
      }
    };
  }, [id]);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contenido.trim()) return;

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data: conversacion } = await supabase
      .from("conversaciones")
      .select("emprendedor_id, inversionista_id")
      .eq("id", Number(id))
      .single();

    if (!conversacion) return;

    // The database checks the conversation participant and generates a
    // recipient notification only if the message insert succeeds.
    const {error:sendError}=await supabase.from("mensajes").insert([
      {
        conversacion_id:Number(id),
        sender_id:userData.user.id,
        contenido:contenido.trim(),
      },
    ]);
    if(sendError) {
      setSendError("No se pudo enviar el mensaje. Comprueba tu acceso e intenta nuevamente.");
      return;
    }
    setSendError(null);
    setContenido("");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Mensajes</h1>

        <div className="bg-slate-900 rounded-2xl p-6 space-y-4 mb-6 min-h-[300px]">
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

        {sendError&&<p role="alert" className="mb-3 text-sm text-rose-300">{sendError}</p>}
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