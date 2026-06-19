"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Navbar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        const nombre =
          data.user.user_metadata?.nombre || data.user.email || "Usuario";

        const { data: profile } = await supabase
          .from("profiles")
          .select("nombre, foto_url")
          .eq("id", data.user.id)
          .single();

        setUserName(profile?.nombre || nombre);
        setFotoUrl(profile?.foto_url || null);
      }
    };

    getUser();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#020817]/95 border-b border-slate-800 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

        <a href="/" className="flex items-center gap-3 shrink-0">
          <img src="/logo.png" alt="DealCapital" className="w-11 h-11 bg-white p-1" />
          <span className="text-xl font-extrabold text-white">
            Deal<span className="text-yellow-400">Capital</span>
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-7 text-slate-200 font-medium">
          <a href="/">Inicio</a>
          <a href="/nosotros">Nosotros</a>
          <a href="/oportunidades">Oportunidades</a>
          <a href="/inversionistas">Inversionistas</a>
          <a href="/contacto">Contacto</a>
        </div>

        {!userName ? (
          <div className="flex items-center gap-4">
            <a href="/login" className="text-slate-300 hover:text-yellow-400">
              Iniciar sesión
            </a>

            <a
              href="/registro"
              className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold"
            >
              Registrarse
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <a href="/perfil" className="hidden sm:flex items-center gap-3">
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

              <span className="text-white font-bold max-w-[150px] truncate">
                {userName}
              </span>
            </a>

            <button
              onClick={() => setOpen(!open)}
              className="text-white text-3xl"
              aria-label="Abrir menú"
            >
              {open ? "×" : "☰"}
            </button>
          </div>
        )}
      </div>

      {userName && open && (
        <div className="absolute right-4 top-[76px] w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 z-50">
          <div className="flex flex-col gap-4 text-slate-200 font-medium">
            <a href="/dashboard" className="hover:text-yellow-400">Dashboard</a>
            <a href="/mensajes" className="hover:text-yellow-400">Mensajes</a>
            <a href="/notificaciones" className="hover:text-yellow-400">Notificaciones</a>
            <a href="/compromisos" className="hover:text-yellow-400">Compromisos</a>
            <a href="/analitica" className="hover:text-yellow-400">Analítica</a>
            <a href="/perfil" className="hover:text-yellow-400">Mi perfil</a>

            <hr className="border-slate-700" />

            <button
              onClick={cerrarSesion}
              className="text-left text-red-400 font-bold"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}