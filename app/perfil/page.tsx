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
    pais: "",
    ciudad: "",
    biografia: "",
    foto_url: "",
    empresa: "",
    cargo: "",
    linkedin: "",
    pagina_web: "",
    experiencia: "",
    capital_disponible: "",
    monto_minimo: "",
    monto_maximo: "",
    sectores_interes: "",
    tipo_inversionista: "",
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
        setPerfil({
          ...perfil,
          ...profile,
          capital_disponible: profile.capital_disponible || "",
          monto_minimo: profile.monto_minimo || "",
          monto_maximo: profile.monto_maximo || "",
        });
      } else {
        setPerfil({
          ...perfil,
          nombre: data.user.user_metadata?.nombre || "",
          email: data.user.email || "",
          tipo_usuario: data.user.user_metadata?.tipo || "",
        });
      }
    };

    cargarPerfil();
  }, []);

  const subirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!tiposPermitidos.includes(file.type)) {
      setMensaje("Solo se permiten imágenes JPG, PNG o WEBP.");
      return;
    }

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
      alert(JSON.stringify(error, null, 2));
      setMensaje("Error al subir la foto.");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

    setPerfil({
      ...perfil,
      foto_url: data.publicUrl,
    });

    setMensaje("Foto subida correctamente. Guarda tu perfil.");
  };

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      id: userId,
      ...perfil,
      capital_disponible: perfil.capital_disponible
        ? Number(perfil.capital_disponible)
        : null,
      monto_minimo: perfil.monto_minimo ? Number(perfil.monto_minimo) : null,
      monto_maximo: perfil.monto_maximo ? Number(perfil.monto_maximo) : null,
    };

    const { error } = await supabase.from("profiles").upsert(payload);

    if (error) {
      alert(JSON.stringify(error, null, 2));
      setMensaje("Error al guardar perfil.");
      return;
    }

    setMensaje("Perfil actualizado correctamente.");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">Mi Perfil</h1>

        <p className="text-slate-300 mb-10">
          Completa tu información para generar mayor confianza dentro de DealCapital.
        </p>

        <form onSubmit={guardarPerfil} className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6">Información principal</h2>

            <div className="flex flex-col md:flex-row gap-8 items-center mb-6">
              {perfil.foto_url ? (
                <img
                  src={perfil.foto_url}
                  alt="Foto de perfil"
                  className="w-36 h-36 rounded-full object-cover border-4 border-yellow-500"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-slate-800 flex items-center justify-center text-4xl font-bold text-yellow-400">
                  {perfil.nombre?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}

              <div className="w-full">
                <label className="block mb-2 text-slate-300">
                  Foto de perfil
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={subirFoto}
                  className="w-full p-4 rounded-xl bg-slate-800"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <input
                placeholder="Nombre completo"
                value={perfil.nombre || ""}
                onChange={(e) =>
                  setPerfil({ ...perfil, nombre: e.target.value })
                }
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
                placeholder="Teléfono / WhatsApp"
                value={perfil.telefono || ""}
                onChange={(e) =>
                  setPerfil({ ...perfil, telefono: e.target.value })
                }
                className="w-full p-4 rounded-xl bg-slate-800"
              />

              <input
                placeholder="País"
                value={perfil.pais || ""}
                onChange={(e) =>
                  setPerfil({ ...perfil, pais: e.target.value })
                }
                className="w-full p-4 rounded-xl bg-slate-800"
              />

              <input
                placeholder="Ciudad"
                value={perfil.ciudad || ""}
                onChange={(e) =>
                  setPerfil({ ...perfil, ciudad: e.target.value })
                }
                className="w-full p-4 rounded-xl bg-slate-800"
              />

              <input
                placeholder="LinkedIn"
                value={perfil.linkedin || ""}
                onChange={(e) =>
                  setPerfil({ ...perfil, linkedin: e.target.value })
                }
                className="w-full p-4 rounded-xl bg-slate-800"
              />

              <input
                placeholder="Página web"
                value={perfil.pagina_web || ""}
                onChange={(e) =>
                  setPerfil({ ...perfil, pagina_web: e.target.value })
                }
                className="w-full p-4 rounded-xl bg-slate-800"
              />
            </div>

            <textarea
              placeholder="Biografía o descripción profesional"
              value={perfil.biografia || ""}
              onChange={(e) =>
                setPerfil({ ...perfil, biografia: e.target.value })
              }
              rows={5}
              className="w-full p-4 rounded-xl bg-slate-800 mt-5"
            />
          </div>

          {perfil.tipo_usuario === "emprendedor" && (
            <div className="bg-slate-900 p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">
                Información de emprendedor
              </h2>

              <div className="grid md:grid-cols-2 gap-5">
                <input
                  placeholder="Empresa o negocio"
                  value={perfil.empresa || ""}
                  onChange={(e) =>
                    setPerfil({ ...perfil, empresa: e.target.value })
                  }
                  className="w-full p-4 rounded-xl bg-slate-800"
                />

                <input
                  placeholder="Cargo"
                  value={perfil.cargo || ""}
                  onChange={(e) =>
                    setPerfil({ ...perfil, cargo: e.target.value })
                  }
                  className="w-full p-4 rounded-xl bg-slate-800"
                />
              </div>

              <textarea
                placeholder="Experiencia como emprendedor"
                value={perfil.experiencia || ""}
                onChange={(e) =>
                  setPerfil({ ...perfil, experiencia: e.target.value })
                }
                rows={5}
                className="w-full p-4 rounded-xl bg-slate-800 mt-5"
              />
            </div>
          )}

          {perfil.tipo_usuario === "inversionista" && (
            <div className="bg-slate-900 p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">
                Información de inversionista
              </h2>

              <div className="grid md:grid-cols-2 gap-5">
                <input
                  type="number"
                  placeholder="Capital disponible"
                  value={perfil.capital_disponible || ""}
                  onChange={(e) =>
                    setPerfil({
                      ...perfil,
                      capital_disponible: e.target.value,
                    })
                  }
                  className="w-full p-4 rounded-xl bg-slate-800"
                />

                <input
                  type="number"
                  placeholder="Monto mínimo de inversión"
                  value={perfil.monto_minimo || ""}
                  onChange={(e) =>
                    setPerfil({ ...perfil, monto_minimo: e.target.value })
                  }
                  className="w-full p-4 rounded-xl bg-slate-800"
                />

                <input
                  type="number"
                  placeholder="Monto máximo de inversión"
                  value={perfil.monto_maximo || ""}
                  onChange={(e) =>
                    setPerfil({ ...perfil, monto_maximo: e.target.value })
                  }
                  className="w-full p-4 rounded-xl bg-slate-800"
                />

                <input
                  placeholder="Tipo de inversionista"
                  value={perfil.tipo_inversionista || ""}
                  onChange={(e) =>
                    setPerfil({
                      ...perfil,
                      tipo_inversionista: e.target.value,
                    })
                  }
                  className="w-full p-4 rounded-xl bg-slate-800"
                />
              </div>

              <textarea
                placeholder="Sectores de interés: tecnología, gastronomía, retail..."
                value={perfil.sectores_interes || ""}
                onChange={(e) =>
                  setPerfil({ ...perfil, sectores_interes: e.target.value })
                }
                rows={4}
                className="w-full p-4 rounded-xl bg-slate-800 mt-5"
              />

              <textarea
                placeholder="Experiencia invirtiendo"
                value={perfil.experiencia || ""}
                onChange={(e) =>
                  setPerfil({ ...perfil, experiencia: e.target.value })
                }
                rows={5}
                className="w-full p-4 rounded-xl bg-slate-800 mt-5"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-xl font-bold transition"
          >
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