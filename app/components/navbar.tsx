"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/oportunidades", label: "Oportunidades" },
  { href: "/inversionistas", label: "Inversionistas" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const readAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setSignedIn(Boolean(data.user));
      setName(data.user?.user_metadata?.nombre || data.user?.email?.split("@")[0] || null);
    };
    void readAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setSignedIn(Boolean(session?.user));
      setName(session?.user?.user_metadata?.nombre || session?.user?.email?.split("@")[0] || null);
    });
    return () => { alive = false; authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  const navItem = ({href,label}: {href:string;label:string}) => (
    <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
      className={"text-[13px] font-semibold transition-colors hover:text-[#facc15] " +
        (pathname === href ? "text-[#facc15]" : "text-[#cbd5e1]")}>{label}</Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/70 bg-[#020817]/95 backdrop-blur-lg">
      <div className="dc-container flex h-[78px] min-w-0 items-center justify-between gap-5">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-3" aria-label="DealCapital, página de inicio">
          <img src="/logo.png" alt="" width={42} height={42} className="size-[42px] shrink-0 rounded-md bg-white object-contain p-1" />
          <span className="text-xl font-extrabold tracking-tight text-white">
            Deal<span className="text-[#facc15]">Capital</span>
          </span>
        </Link>
        <nav aria-label="Navegación principal" className="hidden items-center gap-5 xl:flex">
          {links.map(navItem)}
        </nav>
        <div className="hidden min-w-0 shrink-0 items-center gap-3 xl:flex">
          {signedIn ? (
            <>
              <Link href="/dashboard" className="text-[13px] font-semibold text-[#cbd5e1] hover:text-[#facc15]">Mi panel</Link>
              <Link href="/perfil" title={name || "Mi perfil"}
                className="max-w-40 truncate rounded-lg border border-[#facc15]/35 px-3 py-2.5 text-[13px] font-semibold text-white hover:border-[#facc15]">
                {name || "Mi perfil"}
              </Link>
              <button type="button" onClick={signOut} className="text-[13px] text-slate-400 hover:text-[#facc15]">Salir</button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-1 text-[13px] font-semibold text-[#cbd5e1] hover:text-[#facc15]">Iniciar sesión</Link>
              <Link href="/registro" className="dc-btn dc-btn-primary">Registrarse</Link>
            </>
          )}
        </div>
        <button type="button" aria-expanded={menuOpen} aria-controls="dealcapital-mobile-nav"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} onClick={()=>setMenuOpen(v=>!v)}
          className="grid size-11 shrink-0 place-items-center rounded-lg border border-slate-700 text-2xl text-white xl:hidden">
          {menuOpen ? "×" : "☰"}
        </button>
      </div>
      {menuOpen && (
        <nav id="dealcapital-mobile-nav" aria-label="Menú móvil" className="dc-container flex flex-col gap-5 border-t border-slate-700/70 py-6 xl:hidden">
          {links.map(navItem)}
          <Link href="/verificacion" className="text-[13px] font-semibold text-[#cbd5e1] hover:text-[#facc15]">Confianza y verificación</Link>
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-700/70 pt-5">
            {signedIn ? (
              <>
                <Link href="/dashboard" className="dc-btn dc-btn-outline">Mi panel</Link>
                <Link href="/perfil" className="dc-btn dc-btn-outline">Mi perfil</Link>
                <button type="button" onClick={signOut} className="text-sm text-rose-300">Cerrar sesión</button>
              </>
            ) : (
              <>
                <Link href="/login" className="dc-btn dc-btn-outline">Iniciar sesión</Link>
                <Link href="/registro" className="dc-btn dc-btn-primary">Registrarse</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
