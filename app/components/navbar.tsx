"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

const publicLinks = [
  { href: "/oportunidades", label: "Oportunidades" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/verificacion", label: "Confianza" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const update = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setSignedIn(Boolean(data.user));
      setName(data.user?.user_metadata?.nombre || data.user?.email?.split("@")[0] || null);
    };
    void update();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void update(); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  const navLink = (href: string, label: string) => (
    <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
      className={"text-sm font-medium transition-colors hover:text-amber-200 " + (pathname === href ? "text-amber-200" : "text-slate-300")}>{label}</Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/60 bg-[#07111d]/95 backdrop-blur-xl">
      <div className="dc-container flex h-[74px] items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="DealCapital, inicio">
          <img src="/logo.png" alt="" width={38} height={38} className="size-[38px] rounded-lg bg-white object-contain p-1" />
          <span className="text-lg font-extrabold tracking-tight text-white">Deal<span className="text-amber-200">Capital</span></span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-7 lg:flex">
          {publicLinks.map(({href,label}) => navLink(href,label))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {signedIn ? (
            <>
              <Link href="/dashboard" className="text-sm text-slate-300 hover:text-amber-200">Panel</Link>
              <Link href="/perfil" className="dc-btn dc-btn-secondary max-w-[175px] truncate">{name || "Mi perfil"}</Link>
              <button type="button" onClick={logout} className="text-sm text-slate-400 hover:text-red-300">Salir</button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 text-sm font-semibold text-slate-300 hover:text-amber-200">Iniciar sesión</Link>
              <Link href="/registro" className="dc-btn dc-btn-primary">Crear cuenta <span aria-hidden="true">↗</span></Link>
            </>
          )}
        </div>

        <button type="button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen}
          aria-controls="mobile-nav" onClick={() => setMenuOpen(value => !value)}
          className="grid size-11 place-items-center rounded-lg border border-slate-700 text-xl text-white lg:hidden">{menuOpen ? "×" : "☰"}</button>
      </div>
      {menuOpen && <nav id="mobile-nav" aria-label="Navegación móvil" className="dc-container flex flex-col gap-5 border-t border-slate-700/70 py-6 lg:hidden">
        {publicLinks.map(({href,label}) => navLink(href,label))}
        {signedIn ? (
          <>
            {navLink("/dashboard","Mi panel")}{navLink("/perfil","Mi perfil")}
            <button type="button" onClick={logout} className="text-left text-sm text-rose-300">Cerrar sesión</button>
          </>
        ) : (
          <div className="flex flex-wrap gap-3"><Link href="/login" className="dc-btn dc-btn-secondary">Iniciar sesión</Link><Link href="/registro" className="dc-btn dc-btn-primary">Crear cuenta</Link></div>
        )}
      </nav>}
    </header>
  );
}
