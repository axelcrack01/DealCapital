"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PublicarProyecto() {
  const [form, setForm] = useState({
    nombre_proyecto: "",
    emprendedor: "",
    email: "",
    capital_requerido: "",
    descripcion: "",
    retorno_ofrecido: "",
    industria: "",
    plazo: "",
    riesgo: "",
    roi_estimado: "",
    video_pitch: "",
    proyecciones: "",
    riesgos: "",
    equipo_fundador: "",
    documentos_url: "",
  });

  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const verificarSesion = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
      }
    };

    verificarSesion();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("proyectos").insert([
      {
        ...form,
        user_id: data.user.id,
        capital_requerido: Number(form.capital_requerido),
      },
    ]);

    if (error) {
      alert(JSON.stringify(error, null, 2));
      setMensaje("Error al publicar el proyecto.");
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
      industria: "",
      plazo: "",
      riesgo: "",
      roi_estimado: "",
      video_pitch: "",
      proyecciones: "",
      riesgos: "",
      equipo_fundador: "",
      documentos_url: "",
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">Publicar Proyecto</h1>

        <p className="text-slate-300 mb-10">
          Presenta tu proyecto de forma clara para atraer inversionistas.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-2xl space-y-5">
            <h2 className="text-2xl font-bold">Información principal</h2>

            <input name="nombre_proyecto" value={form.nombre_proyecto} onChange={handleChange} placeholder="Nombre del proyecto" className="w-full p-4 rounded-xl bg-slate-800" required />

            <input name="emprendedor" value={form.emprendedor} onChange={handleChange} placeholder="Nombre del emprendedor" className="w-full p-4 rounded-xl bg-slate-800" required />

            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Correo de contacto" className="w-full p-4 rounded-xl bg-slate-800" required />

            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Describe tu proyecto" rows={6} className="w-full p-4 rounded-xl bg-slate-800" required />

            <input name="equipo_fundador" value={form.equipo_fundador} onChange={handleChange} placeholder="Equipo fundador" className="w-full p-4 rounded-xl bg-slate-800" />
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl space-y-5">
            <h2 className="text-2xl font-bold">Datos de inversión</h2>

            <input name="capital_requerido" type="number" value={form.capital_requerido} onChange={handleChange} placeholder="Monto solicitado" className="w-full p-4 rounded-xl bg-slate-800" required />

            <input name="retorno_ofrecido" value={form.retorno_ofrecido} onChange={handleChange} placeholder="Retorno ofrecido, ejemplo: 15% en 6 meses" className="w-full p-4 rounded-xl bg-slate-800" />

            <input name="roi_estimado" value={form.roi_estimado} onChange={handleChange} placeholder="ROI estimado" className="w-full p-4 rounded-xl bg-slate-800" />

            <input name="plazo" value={form.plazo} onChange={handleChange} placeholder="Plazo estimado, ejemplo: 6 meses" className="w-full p-4 rounded-xl bg-slate-800" />

            <select name="riesgo" value={form.riesgo} onChange={handleChange} className="w-full p-4 rounded-xl bg-slate-800">
              <option value="">Nivel de riesgo</option>
              <option value="Bajo">Bajo</option>
              <option value="Medio">Medio</option>
              <option value="Alto">Alto</option>
            </select>

            <input name="industria" value={form.industria} onChange={handleChange} placeholder="Industria: tecnología, gastronomía, retail..." className="w-full p-4 rounded-xl bg-slate-800" />
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl space-y-5">
            <h2 className="text-2xl font-bold">Pitch y análisis</h2>

            <input name="video_pitch" value={form.video_pitch} onChange={handleChange} placeholder="Link de video pitch" className="w-full p-4 rounded-xl bg-slate-800" />

            <textarea name="proyecciones" value={form.proyecciones} onChange={handleChange} placeholder="Proyecciones del proyecto" rows={5} className="w-full p-4 rounded-xl bg-slate-800" />

            <textarea name="riesgos" value={form.riesgos} onChange={handleChange} placeholder="Riesgos del proyecto" rows={5} className="w-full p-4 rounded-xl bg-slate-800" />

            <input name="documentos_url" value={form.documentos_url} onChange={handleChange} placeholder="Link a documentos, pitch deck o evidencias" className="w-full p-4 rounded-xl bg-slate-800" />
          </div>

          <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-xl font-bold transition">
            Publicar Proyecto
          </button>
        </form>

        {mensaje && <p className="mt-6 text-yellow-400">{mensaje}</p>}
      </section>
    </main>
  );
}