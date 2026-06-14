"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Perfil() {
  const [userId, setUserId] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [perfil, setPerfil] = useState({
    nombre: "",
    email: "",
    tipo_usuario: "",
    telefono: "",
    ciudad: "",
    biografia: "",
    foto_url: "",
  });

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUserId(data.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profile) {
        setPerfil(profile);
      } else {
        setPerfil({
          nombre: data.user.user_metadata?.nombre || "",
          email: data.user.email || "",
          tipo_usuario: data.user.user_metadata?.tipo || "",
          telefono: "",
          ciudad: "",
          biografia: "",
          foto_url: "",
        });
      }
    };

    cargarPerfil();
  }, []);

  const subirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
  setMensaje("La imagen debe pesar menos de 5MB.");
  return;
}
    const extension = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (error) {
  console.log("Error al subir foto:", error);
  alert(JSON.stringify(error, null, 2));
  setMensaje("Error al subir la foto.");
  return;
}

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    setPerfil({
      ...perfil,
      foto_url: data.publicUrl,
    });

    setMensaje("Foto subida correctamente. Guarda tu perfil.");
  };

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      ...perfil,
    });

    if (error) {
  console.log("Error al guardar perfil:", error);
  alert(JSON.stringify(error, null, 2));
  setMensaje("Error al guardar perfil.");
  return;
}

    setMensaje("Perfil actualizado correctamente.");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Mi Perfil</h1>

        <form
          onSubmit={guardarPerfil}
          className="bg-slate-900 p-8 rounded-2xl space-y-5"
        >
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={subirFoto}
            className="w-full p-4 rounded-xl bg-slate-800"
          />

          {perfil.foto_url && (
            <img
              src={perfil.foto_url}
              alt="Foto de perfil"
              className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-yellow-500"
            />
          )}

          <input
            placeholder="Nombre completo"
            value={perfil.nombre || ""}
            onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
            className="w-full p-4 rounded-xl bg-slate-800"
          />

          <input
            placeholder="Correo"
            value={perfil.email || ""}
            disabled
            className="w-full p-4 rounded-xl bg-slate-800 opacity-70"
          />

          <select
            value={perfil.tipo_usuario || ""}
            onChange={(e) =>
              setPerfil({ ...perfil, tipo_usuario: e.target.value })
            }
            className="w-full p-4 rounded-xl bg-slate-800"
          >
            <option value="">Tipo de cuenta</option>
            <option value="emprendedor">Emprendedor</option>
            <option value="inversionista">Inversionista</option>
          </select>

          <input
            placeholder="Número de contacto"
            value={perfil.telefono || ""}
            onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
            className="w-full p-4 rounded-xl bg-slate-800"
          />

          <input
            placeholder="Ciudad"
            value={perfil.ciudad || ""}
            onChange={(e) => setPerfil({ ...perfil, ciudad: e.target.value })}
            className="w-full p-4 rounded-xl bg-slate-800"
          />

          <textarea
            placeholder="Biografía o descripción"
            value={perfil.biografia || ""}
            onChange={(e) =>
              setPerfil({ ...perfil, biografia: e.target.value })
            }
            rows={5}
            className="w-full p-4 rounded-xl bg-slate-800"
          />

          <button className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold">
            Guardar Perfil
          </button>
        </form>

        {mensaje && (
          <p className="mt-6 text-yellow-400 font-semibold">{mensaje}</p>
        )}
      </section>
    </main>
  );
}