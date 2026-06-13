"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PublicarProyecto() {
  const [form, setForm] = useState({
    nombre_proyecto: "",
    emprendedor: "",
    email: "",
    capital_requerido: "",
    descripcion: "",
    retorno_ofrecido: "",
  });

  const [mensaje, setMensaje] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("proyectos").insert([
      {
        ...form,
        capital_requerido: Number(form.capital_requerido),
      },
    ]);

    if (error) {
      setMensaje("Error al publicar el proyecto.");
      console.error(error);
      return;
    }

    setMensaje("Proyecto publicado correctamente.");
    setForm({
      nombre_proyecto: "",
      emprendedor: "",
      email: "",
      capital_requerido: "",
      descripcion: "",
      retorno_ofrecido: "",
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-5xl font-bold mb-10">Publicar Proyecto</h1>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <input name="nombre_proyecto" value={form.nombre_proyecto} onChange={handleChange} placeholder="Nombre del proyecto" className="w-full p-4 rounded-xl bg-slate-900" required />

        <input name="emprendedor" value={form.emprendedor} onChange={handleChange} placeholder="Tu nombre completo" className="w-full p-4 rounded-xl bg-slate-900" required />

        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Correo electrónico" className="w-full p-4 rounded-xl bg-slate-900" required />

        <input name="capital_requerido" type="number" value={form.capital_requerido} onChange={handleChange} placeholder="Capital requerido" className="w-full p-4 rounded-xl bg-slate-900" required />

        <textarea name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Describe tu proyecto" rows={6} className="w-full p-4 rounded-xl bg-slate-900" required />

        <input name="retorno_ofrecido" value={form.retorno_ofrecido} onChange={handleChange} placeholder="Retorno ofrecido, ejemplo: 15% en 6 meses" className="w-full p-4 rounded-xl bg-slate-900" />

        <button className="bg-yellow-500 text-black px-8 py-4 rounded-xl font-bold">
          Publicar Proyecto
        </button>
      </form>

      {mensaje && (
        <p className="mt-6 text-yellow-400 font-semibold">{mensaje}</p>
      )}
    </main>
  );
}