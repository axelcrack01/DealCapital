"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function InteresProyecto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    mensaje: "",
  });

  const [mensajeEstado, setMensajeEstado] = useState("");

  useEffect(() => {
    const verificarSesion = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
      }
    };

    verificarSesion();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("interesados").insert([
      {
        proyecto_id: Number(id),
        nombre: form.nombre,
        email: form.email,
        mensaje: form.mensaje,
      },
    ]);

    if (error) {
      alert(JSON.stringify(error, null, 2));
      setMensajeEstado("Error al enviar interés.");
      return;
    }

    setMensajeEstado("Interés enviado correctamente.");
    setForm({ nombre: "", email: "", mensaje: "" });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Estoy interesado</h1>

        <p className="text-slate-300 mb-8">
          Completa tus datos para que el emprendedor pueda contactarte.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 p-8 rounded-2xl space-y-6"
        >
          <input
            type="text"
            placeholder="Tu nombre completo"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full p-4 rounded-xl bg-slate-800"
            required
          />

          <input
            type="email"
            placeholder="Tu correo electrónico"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-4 rounded-xl bg-slate-800"
            required
          />

          <textarea
            placeholder="Mensaje para el emprendedor"
            rows={5}
            value={form.mensaje}
            onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
            className="w-full p-4 rounded-xl bg-slate-800"
          />

          <button className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold">
            Enviar interés
          </button>
        </form>

        {mensajeEstado && (
          <p className="mt-6 text-yellow-400 font-semibold">{mensajeEstado}</p>
        )}
      </div>
    </main>
  );
}