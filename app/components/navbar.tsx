"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";
import BrandIcon from "./BrandIcon";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/oportunidades", label: "Oportunidades" },
  { href: "/emprendedores", label: "Emprendedores" },
  { href: "/inversionistas", label: "Inversionistas" },
  { href: "/nosotros", label: "Nosotros" },
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

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="dc-site-header sticky top-0 z-50 border-b border-slate-700/60 bg-[#020817]/95 backdrop-blur-xl">
      <div className="dc-container relative z-20 flex h-[76px] min-w-0 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label="DealCapital — ir al inicio">
          <Image src="/logo.png" alt="" width={40} height={40}
            className="size-10 shrink-0 rounded-lg bg-white object-contain p-1" />
          <span className="text-[19px] font-extrabold tracking-[-.04em] text-white">
            Deal<span className="text-[#facc15]">Capital</span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-1 xl:flex">
          {links.map(({href,label}) => (
            <Link key={href} href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={"dc-nav-link" + (isActive(href) ? " is-current" : "")}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          {signedIn ? (
            <>
              <Link href="/dashboard" className="dc-nav-link">Mi panel</Link>
              <Link href="/perfil" title={name || "Mi perfil"}
                className="max-w-32 truncate rounded-lg border border-[#facc15]/40 px-3 py-2 text-xs font-semibold text-white hover:border-[#facc15]">
                {name || "Mi perfil"}
              </Link>
              <button type="button" onClick={signOut} className="px-1 text-xs text-slate-400 hover:text-[#facc15]">Salir</button>
            </>
          ) : (
            <>
              <Link href="/login" className="dc-nav-link whitespace-nowrap">Ingresar</Link>
              <Link href="/registro" className="dc-btn dc-btn-primary min-h-10 whitespace-nowrap px-4 py-2 text-xs">
                Crear cuenta <BrandIcon name="arrow" size={16}/>
              </Link>
            </>
          )}
        </div>

        <button type="button" aria-expanded={menuOpen} aria-controls="dealcapital-mobile-nav"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuOpen(v => !v)}
          className="grid size-11 shrink-0 place-items-center rounded-lg border border-slate-700 text-white xl:hidden">
          {menuOpen ? (
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M9 12h11M4 17h16"/></svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <>
          <button type="button" aria-label="Cerrar menú de navegación"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-x-0 top-[76px] z-0 h-[calc(100dvh-76px)] bg-[#020817]/75 xl:hidden" />
          <nav id="dealcapital-mobile-nav" aria-label="Navegación móvil"
            className="dc-mobile-nav absolute left-0 right-0 top-full z-10 max-h-[calc(100dvh-76px)] overflow-y-auto border-b border-slate-700 bg-[#061226] shadow-2xl xl:hidden">
            <div className="dc-container flex flex-col gap-1 py-5">
              {links.map(({href,label}) => (
                <Link key={href} href={href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={"dc-mobile-nav-link" + (isActive(href) ? " is-current" : "")}>
                  {label}
                  {isActive(href) && <span className="size-1.5 rounded-full bg-[#facc15]" aria-hidden="true"/>}
                </Link>
              ))}
              <Link href="/verificacion" onClick={() => setMenuOpen(false)}
                className="dc-mobile-nav-link">Confianza y verificación</Link>
              <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-700/80 pt-5">
                {signedIn ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="dc-btn dc-btn-primary">Mi panel</Link>
                    <Link href="/perfil" onClick={() => setMenuOpen(false)} className="dc-btn dc-btn-outline">Mi perfil</Link>
                    <button type="button" onClick={signOut} className="px-3 text-sm text-slate-300">Salir</button>
                  </>
                ) : (
                  <>
                    <Link href="/registro" onClick={() => setMenuOpen(false)} className="dc-btn dc-btn-primary flex-1">Crear cuenta</Link>
                    <Link href="/login" onClick={() => setMenuOpen(false)} className="dc-btn dc-btn-outline flex-1">Ingresar</Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
