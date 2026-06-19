"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Favoritos() {
  const [favoritos, setFavoritos] = useState<any[]>([]);

  const cargarFavoritos = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("favoritos")
      .select("*, proyectos(*)")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    setFavoritos(data || []);
  };

  useEffect(() => {
    cargarFavoritos();
  }, []);

  const eliminarFavorito = async (id: number) => {
    const { error } = await supabase.from("favoritos").delete().eq("id", id);

    if (error) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    cargarFavoritos();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Mis favoritos</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {favoritos.map((fav) => {
            const p = fav.proyectos;

            return (
              <div key={fav.id} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                {p?.imagen_url && (
                  <img src={p.imagen_url} className="w-full h-48 object-cover" />
                )}

                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {p?.nombre_proyecto}
                  </h2>

                  <p className="text-slate-300 mb-4">
                    {p?.descripcion}
                  </p>

                  <a
                    href={`/oportunidades/${p?.id}`}
                    className="block text-center bg-yellow-500 text-black py-3 rounded-xl font-bold mb-3"
                  >
                    Ver oportunidad
                  </a>

                  <button
                    onClick={() => eliminarFavorito(fav.id)}
                    className="w-full border border-red-500 text-red-400 py-3 rounded-xl font-bold"
                  >
                    Quitar favorito
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {favoritos.length === 0 && (
          <p className="text-slate-400">Aún no tienes proyectos favoritos.</p>
        )}
      </section>
    </main>
  );
}