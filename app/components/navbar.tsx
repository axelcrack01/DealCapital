"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Navbar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        const nombre = data.user.user_metadata?.nombre || data.user.email || "Usuario";
        setUserName(nombre);

        const { data: profile } = await supabase
          .from("profiles")
          .select("nombre, foto_url")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          setUserName(profile.nombre || nombre);
          setFotoUrl(profile.foto_url || null);
        }
      }
    };

    getUser();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="w-full border-b border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="DealCapital" className="w-12 h-12" />
          <span className="font-bold text-xl text-white">DealCapital</span>
        </a>

        <div className="hidden md:flex gap-8 text-slate-300">
          <a href="/">Inicio</a>
          <a href="/nosotros">Nosotros</a>
          <a href="/oportunidades">Oportunidades</a>
          <a href="/inversionistas">Inversionistas</a>
          <a href="/contacto">Contacto</a>
        </div>

        {userName ? (
          <div className="flex items-center gap-4">

            <a href="/dashboard" className="text-slate-300 hover:text-yellow-400">
  Dashboard
</a>
            <a href="/perfil">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Perfil"
                  className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </a>

            <a
              href="/perfil"
              className="text-white font-semibold hover:text-yellow-400 transition"
            >
              {userName}
            </a>

            <button
              onClick={cerrarSesion}
              className="text-slate-300 hover:text-red-400"
            >
              Salir
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <a href="/login" className="text-slate-300">
              Iniciar sesión
            </a>

            <a
              href="/registro"
              className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold"
            >
              Registrarse
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}