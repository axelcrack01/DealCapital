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
        const nombre =
          data.user.user_metadata?.nombre || data.user.email || "Usuario";

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
    <nav className="sticky top-0 z-50 bg-[#020817]/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <a href="/" className="flex items-center gap-3 shrink-0">
          <img src="/logo.png" alt="DealCapital" className="w-12 h-12 bg-white p-1" />
          <span className="text-2xl font-extrabold text-white">
            Deal<span className="text-yellow-400">Capital</span>
          </span>
        </a>

        <div className="hidden xl:flex items-center gap-8 text-slate-200 font-medium">
          <a href="/" className="hover:text-yellow-400">Inicio</a>
          <a href="/nosotros" className="hover:text-yellow-400">Nosotros</a>
          <a href="/oportunidades" className="hover:text-yellow-400">Oportunidades</a>
          <a href="/inversionistas" className="hover:text-yellow-400">Inversionistas</a>
          <a href="/contacto" className="hover:text-yellow-400">Contacto</a>
        </div>

        {userName ? (
          <div className="hidden lg:flex items-center gap-6 text-slate-200 font-medium">
            <a href="/dashboard" className="hover:text-yellow-400">▦ Dashboard</a>
            <a href="/mensajes" className="hover:text-yellow-400">▱ Mensajes</a>
            <a href="/notificaciones" className="hover:text-yellow-400">🔔 Notificaciones</a>
            <a href="/analitica" className="hover:text-yellow-400">▥ Analítica</a>

            <a href="/perfil" className="flex items-center gap-3 border-l border-slate-700 pl-5">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Perfil"
                  className="w-11 h-11 rounded-full object-cover border-2 border-yellow-500"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}

              <span className="text-white font-bold max-w-[180px] leading-tight">
                {userName}
              </span>
            </a>

            <button onClick={cerrarSesion} className="border-l border-slate-700 pl-5 hover:text-red-400">
              Salir
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <a href="/login" className="text-slate-300 hover:text-yellow-400">
              Iniciar sesión
            </a>

            <a
              href="/registro"
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold"
            >
              Registrarse
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}