"use client";

import { useEffect, useRef, useState } from "react";
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
    logo_url: "",
    imagen_url: "",
    pitch_deck_url: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [sending,setSending]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const submissionLock=useRef(false);
  const [privatePreviews, setPrivatePreviews] = useState<{ documento_pdf?: string; pitch_deck_url?: string }>({});


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

  const subirArchivo = async (
    e: React.ChangeEvent<HTMLInputElement>,
    bucket: string,
    campo: "documento_pdf" | "logo_url" | "imagen_url" | "pitch_deck_url",
    tipos: string[],
    maxMB: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!tipos.includes(file.type)) {
      setMensaje("Tipo de archivo no permitido.");
      return;
    }

    if (file.size > maxMB * 1024 * 1024) {
      setMensaje(`El archivo debe pesar menos de ${maxMB}MB.`);
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    // Use an opaque object name: never store the original local filename,
    // which may contain a person's name or other confidential details.
    const isPrivate = bucket === "Documentos" || bucket === "pitch-decks";
    const extension = file.type === "application/pdf" ? "pdf"
      : file.type === "image/png" ? "png"
      : file.type === "image/webp" ? "webp" : "jpg";
    const fileName = `${data.user.id}-${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (error) {
      setMensaje("Error al subir el archivo. Comprueba el tipo, tamaño y permisos de acceso.");
      return;
    }

    if (isPrivate) {
      // Never place a signed URL into the projects table: it expires and
      // would become public through the project row.
      setForm((prev) => ({ ...prev, [campo]: fileName }));
      const { data: signed, error: previewError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(fileName, 600);
      if (!previewError && signed?.signedUrl) {
        setPrivatePreviews((prev) => ({ ...prev, [campo]: signed.signedUrl }));
      }
      setMensaje("Documento guardado de forma privada. Su acceso está restringido.");
    } else {
      const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
      setForm((prev) => ({ ...prev, [campo]: publicUrl.publicUrl }));
      setMensaje("Imagen subida correctamente.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(submissionLock.current||submitted)return;
    submissionLock.current=true;
    setSending(true);
    try {

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

    if(error){
      setMensaje(error.code==="23505"
        ?"Ya existe una propuesta activa con el mismo nombre, propietario y monto. Revisa tus proyectos antes de crear otra."
        :"No se pudo enviar el proyecto a revisión. Comprueba los datos e intenta nuevamente.");
      return;
    }
    setSubmitted(true);
    setMensaje("Proyecto recibido correctamente. Queda pendiente de revisión antes de mostrarse públicamente.");
    } catch {
      setMensaje("No se pudo completar el envío. Vuelve a intentarlo.");
    } finally {
      submissionLock.current=false;
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">Presentar proyecto</h1>

        <p className="text-slate-300 mb-10">
          Completa tu propuesta para solicitar su revisión. La publicación pública no es automática y no equivale a una verificación financiera.
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
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl space-y-5">
            <h2 className="text-2xl font-bold">Archivos del proyecto</h2>
            <p className="text-sm leading-6 text-slate-400">Las imágenes pueden mostrarse públicamente al aprobarse el proyecto. Los PDF permanecen privados y no se publican con la ficha de oportunidad.</p>

            <label className="block text-slate-300">Logo del proyecto</label>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) =>
                subirArchivo(e, "logos", "logo_url", ["image/png", "image/jpeg", "image/webp"], 3)
              }
              className="w-full p-4 rounded-xl bg-slate-800"
            />
            {form.logo_url && <a href={form.logo_url} target="_blank" className="block text-yellow-400 underline">Ver logo subido</a>}

            <label className="block text-slate-300">Imagen principal</label>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) =>
                subirArchivo(e, "imagenes-proyectos", "imagen_url", ["image/png", "image/jpeg", "image/webp"], 5)
              }
              className="w-full p-4 rounded-xl bg-slate-800"
            />
            {form.imagen_url && <a href={form.imagen_url} target="_blank" className="block text-yellow-400 underline">Ver imagen subida</a>}

            <label className="block text-slate-300">Pitch Deck PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                subirArchivo(e, "pitch-decks", "pitch_deck_url", ["application/pdf"], 10)
              }
              className="w-full p-4 rounded-xl bg-slate-800"
            />
            {form.pitch_deck_url && <p className="text-xs text-slate-300">Pitch deck privado guardado. No se publica automáticamente.</p>}
            {privatePreviews.pitch_deck_url && <a href={privatePreviews.pitch_deck_url} target="_blank" rel="noopener noreferrer" className="block text-yellow-400 underline">Vista previa privada (10 minutos)</a>}

            <label className="block text-slate-300">Documento adicional PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                subirArchivo(e, "Documentos", "documento_pdf", ["application/pdf"], 10)
              }
              className="w-full p-4 rounded-xl bg-slate-800"
            />
            {form.documento_pdf && <p className="text-xs text-slate-300">Documento privado guardado. Solo el titular y personal autorizado podrán acceder.</p>}
            {privatePreviews.documento_pdf && <a href={privatePreviews.documento_pdf} target="_blank" rel="noopener noreferrer" className="block text-yellow-400 underline">Vista previa privada (10 minutos)</a>}
          </div>

          <button disabled={sending||submitted} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed">
            {submitted?"Propuesta recibida":sending?"Enviando propuesta…":"Enviar proyecto a revisión"}
          </button>
        </form>

        {mensaje && <p role="status" className="mt-6 text-yellow-400">{mensaje}</p>}
      </section>
    </main>
  );
}