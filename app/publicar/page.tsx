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
    documento_pdf: "",
  });

  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const verificarSesion = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) window.location.href = "/login";
    };

    verificarSesion();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const subirDocumento = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setMensaje("Solo se permiten archivos PDF.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMensaje("El documento debe pesar menos de 5MB.");
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    const fileName = `${data.user.id}-${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("documentos")
      .upload(fileName, file);

    if (error) {
      alert(JSON.stringify(error, null, 2));
      setMensaje("Error al subir documento.");
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("documentos")
      .getPublicUrl(fileName);

    setForm({ ...form, documento_pdf: publicUrl.publicUrl });
    setMensaje("Documento subido correctamente.");
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
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">Publicar Proyecto</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Mantén aquí todos tus inputs actuales */}

          <div className="bg-slate-900 p-8 rounded-2xl space-y-5">
            <h2 className="text-2xl font-bold">Documentos</h2>

            <input
              type="file"
              accept="application/pdf"
              onChange={subirDocumento}
              className="w-full p-4 rounded-xl bg-slate-800"
            />

            {form.documento_pdf && (
              <a
                href={form.documento_pdf}
                target="_blank"
                className="block text-yellow-400 underline"
              >
                Ver documento subido
              </a>
            )}
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