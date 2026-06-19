"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function FavoritoButton({ proyectoId }: { proyectoId: number }) {
  const [mensaje, setMensaje] = useState("");

  const guardarFavorito = async () => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("favoritos").insert([
      {
        proyecto_id: proyectoId,
        user_id: data.user.id,
      },
    ]);

    if (error) {
      setMensaje("Este proyecto ya está en tus favoritos.");
      return;
    }

    setMensaje("Proyecto guardado en favoritos.");
  };

  return (
    <div>
      <button
        onClick={guardarFavorito}
        className="block w-full mt-4 border border-red-500 text-red-400 px-8 py-4 rounded-xl font-bold hover:bg-red-500 hover:text-white"
      >
        ❤️ Guardar favorito
      </button>

      {mensaje && <p className="mt-3 text-sm text-yellow-400">{mensaje}</p>}
    </div>
  );
}