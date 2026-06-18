"use client";

import { use, useState } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    window.location.href = "/login";
    return;
  }

  const { data: proyecto, error: proyectoError } = await supabase
    .from("proyectos")
    .select("user_id")
    .eq("id", id)
    .single();

  if (proyectoError || !proyecto) {
    alert("No se encontró el proyecto.");
    return;
  }

  const { error: interesError } = await supabase.from("interesados").insert([
    {
      proyecto_id: Number(id),
      inversionista_id: data.user.id,
      nombre: form.nombre,
      email: form.email,
      mensaje: form.mensaje,
    },
  ]);

  if (interesError) {
    alert(JSON.stringify(interesError, null, 2));
    return;
  }

  const { data: conversacion, error: conversacionError } = await supabase
    .from("conversaciones")
    .insert([
      {
        proyecto_id: Number(id),
        emprendedor_id: proyecto.user_id,
        inversionista_id: data.user.id,
      },
    ])
    .select()
    .single();

  if (conversacionError) {
    alert(JSON.stringify(conversacionError, null, 2));
    return;
  }

  if (form.mensaje.trim()) {
    const { error: mensajeError } = await supabase.from("mensajes").insert([
      {
        conversacion_id: conversacion.id,
        sender_id: data.user.id,
        contenido: form.mensaje,
      },
    ]);

    if (mensajeError) {
      alert(JSON.stringify(mensajeError, null, 2));
      return;
    }
  }

  window.location.href = `/mensajes/${conversacion.id}`;
};

  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">
          Estoy interesado
        </h1>

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
            onChange={(e) =>
              setForm({
                ...form,
                nombre: e.target.value,
              })
            }
            className="w-full p-4 rounded-xl bg-slate-800"
            required
          />

          <input
            type="email"
            placeholder="Tu correo electrónico"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className="w-full p-4 rounded-xl bg-slate-800"
            required
          />

          <textarea
            placeholder="Mensaje para el emprendedor"
            rows={5}
            value={form.mensaje}
            onChange={(e) =>
              setForm({
                ...form,
                mensaje: e.target.value,
              })
            }
            className="w-full p-4 rounded-xl bg-slate-800"
          />

          <button
            type="submit"
            className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition"
          >
            Enviar interés
          </button>
        </form>

        {mensajeEstado && (
          <div className="mt-6 bg-green-900 border border-green-600 p-4 rounded-xl">
            {mensajeEstado}
          </div>
        )}
      </div>
    </main>
  );
}