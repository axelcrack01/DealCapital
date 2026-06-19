"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Navbar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState(0);

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

        const { count } = await supabase
          .from("notificaciones")
          .select("*", { count: "exact", head: true })
          .eq("user_id", data.user.id)
          .eq("leida", false);

        setNotificaciones(count || 0);
      }
    };

    getUser();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const NotiLink = () => (
    <a href="/notificaciones" className="relative hover:text-yellow-400">
      Notificaciones
      {notificaciones > 0 && (
        <span className="absolute -top-3 -right-4 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
          {notificaciones}
        </span>
      )}
    </a>
  );

  return (
    <nav className="sticky top-0 z-50 bg-[#020817]/95 border-b border-slate-800 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 shrink-0">
          <img src="/logo.png" alt="DealCapital" className="w-11 h-11 bg-white p-1" />
          <span className="text-xl font-extrabold text-white">
            Deal<span className="text-yellow-400">Capital</span>
          </span>
        </a>

        <div className="hidden xl:flex items-center gap-7 text-slate-200 font-medium">
          <a href="/">Inicio</a>
          <a href="/nosotros">Nosotros</a>
          <a href="/oportunidades">Oportunidades</a>
          <a href="/inversionistas">Inversionistas</a>
          <a href="/contacto">Contacto</a>
        </div>

        <div className="hidden xl:flex items-center gap-5 text-slate-200 font-medium">
          {userName ? (
            <>
              <a href="/dashboard">Dashboard</a>
              <a href="/mensajes">Mensajes</a>
              <NotiLink />

              <a href="/perfil" className="flex items-center gap-3 border-l border-slate-700 pl-5">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Perfil" className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}

                <span className="text-white font-bold max-w-[150px] leading-tight">
                  {userName}
                </span>
              </a>

              <button onClick={cerrarSesion} className="hover:text-red-400">
                Salir
              </button>
            </>
          ) : (
            <>
              <a href="/login">Iniciar sesión</a>
              <a href="/registro" className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold">
                Registrarse
              </a>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="xl:hidden text-white text-3xl"
        >
          {open ? "×" : "☰"}
        </button>
      </div>

      {open && (
        <div className="xl:hidden bg-[#020817] border-t border-slate-800 px-5 py-6">
          <div className="flex flex-col gap-4 text-slate-200 font-medium">
            <a href="/">Inicio</a>
            <a href="/nosotros">Nosotros</a>
            <a href="/oportunidades">Oportunidades</a>
            <a href="/inversionistas">Inversionistas</a>
            <a href="/contacto">Contacto</a>

            {userName ? (
              <>
                <hr className="border-slate-800" />
                <a href="/dashboard">Dashboard</a>
                <a href="/mensajes">Mensajes</a>

                <a href="/notificaciones" className="relative w-fit">
                  Notificaciones
                  {notificaciones > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      {notificaciones}
                    </span>
                  )}
                </a>

                <a href="/analitica">Analítica</a>
                <a href="/perfil">Mi perfil</a>
                <button onClick={cerrarSesion} className="text-left text-red-400 font-bold">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <hr className="border-slate-800" />
                <a href="/login">Iniciar sesión</a>
                <a href="/registro" className="bg-yellow-500 text-black px-4 py-3 rounded-lg font-bold text-center">
                  Registrarse
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}