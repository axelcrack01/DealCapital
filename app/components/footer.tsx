"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import BrandIcon from "./BrandIcon";

type AuthState = "loading" | "signed-in" | "signed-out";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width={21} height={21} fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.6" cy="6.6" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width={21} height={21} fill="currentColor" aria-hidden="true">
      <path d="M5.2 8.1a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8ZM3.55 9.55h3.3V20h-3.3V9.55ZM9 9.55h3.15v1.43h.05a3.47 3.47 0 0 1 3.11-1.72c3.33 0 3.94 2.19 3.94 5.03V20h-3.3v-5.04c0-1.2-.03-2.76-1.68-2.76-1.69 0-1.95 1.31-1.95 2.67V20H9V9.55Z"/>
    </svg>
  );
}

export default function Footer() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let receivedAuthEvent = false;

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedAuthEvent = true;
      if (active) setAuthState(session?.user ? "signed-in" : "signed-out");
    });

    void supabase.auth.getUser().then(({ data }) => {
      if (active && !receivedAuthEvent) {
        setAuthState(data.user ? "signed-in" : "signed-out");
      }
    }).catch(() => {
      if (active && !receivedAuthEvent) setAuthState("signed-out");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLogoutError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLogoutError("No se pudo cerrar la sesión. Inténtalo nuevamente.");
      return;
    }
    setAuthState("signed-out");
    window.location.assign("/");
  };

  return (
    <footer className="border-t border-[#30405a] bg-[#061124] text-[#cbd5e1]">
      <div className="dc-container grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.55fr_.8fr_.9fr_.9fr] lg:gap-8">
        <div className="lg:pr-7">
          <Link href="/" className="mb-5 inline-flex items-center gap-3"
            aria-label="DealCapital, volver al inicio">
            <Image src="/logo.png" width={42} height={42} alt=""
              className="size-[42px] rounded-lg bg-white object-contain p-1"/>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Deal<span className="text-[#facc15]">Capital</span>
            </span>
          </Link>
          <p className="max-w-sm text-[13px] leading-7 text-[#aebed3]">
            Conectamos emprendedores e inversionistas para que las buenas ideas
            encuentren nuevas oportunidades de conversación.
          </p>
          <div className="mt-7">
            <h2 className="mb-3 text-[11px] font-extrabold uppercase tracking-[.14em] text-white">Síguenos</h2>
            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/dealcapitalpe/"
                target="_blank" rel="noopener noreferrer"
                aria-label="Instagram de DealCapital (se abre en otra pestaña)"
                title="Instagram · @dealcapitalpe"
                className="grid size-11 place-items-center rounded-xl border border-[#41536f] text-[#cbd5e1] transition-colors hover:border-[#facc15] hover:bg-[#facc15]/10 hover:text-[#facc15] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#facc15]">
                <InstagramIcon/>
              </a>
              <a href="https://www.linkedin.com/company/dealcapital/"
                target="_blank" rel="noopener noreferrer"
                aria-label="LinkedIn de DealCapital (se abre en otra pestaña)"
                title="LinkedIn · DealCapital"
                className="grid size-11 place-items-center rounded-xl border border-[#41536f] text-[#cbd5e1] transition-colors hover:border-[#facc15] hover:bg-[#facc15]/10 hover:text-[#facc15] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#facc15]">
                <LinkedInIcon/>
              </a>
              <span className="text-xs text-[#8294b0]">@dealcapitalpe</span>
            </div>
          </div>
        </div>

        <nav aria-label="Explorar DealCapital" className="flex flex-col items-start gap-3 text-[13px]">
          <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-white">Explorar</h2>
          <Link className="hover:text-[#facc15]" href="/oportunidades">Oportunidades</Link>
          <Link className="hover:text-[#facc15]" href="/emprendedores">Emprendedores</Link>
          <Link className="hover:text-[#facc15]" href="/inversionistas">Inversionistas</Link>
          <Link className="hover:text-[#facc15]" href="/nosotros">Nosotros</Link>
        </nav>

        <nav aria-label="Accesos de DealCapital" className="flex flex-col items-start gap-3 text-[13px]">
          <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-white">Mi espacio</h2>
          {authState === "signed-in" ? (
            <>
              <Link className="hover:text-[#facc15]" href="/dashboard">Mi panel</Link>
              <Link className="hover:text-[#facc15]" href="/perfil">Mi perfil</Link>
              <button type="button" onClick={signOut} className="text-left text-[#facc15] hover:underline">
                Cerrar sesión
              </button>
              {logoutError && <p role="alert" className="text-xs text-rose-300">{logoutError}</p>}
            </>
          ) : authState === "signed-out" ? (
            <>
              <Link className="hover:text-[#facc15]" href="/registro">Crear cuenta</Link>
              <Link className="hover:text-[#facc15]" href="/login">Iniciar sesión</Link>
            </>
          ) : (
            <span role="status" className="text-xs text-[#8497b0]">Comprobando sesión…</span>
          )}
          <Link className="hover:text-[#facc15]" href="/verificacion">Confianza y verificación</Link>
          <Link className="hover:text-[#facc15]" href="/contacto">Contacto</Link>
        </nav>

        <div className="text-[13px]">
          <h2 className="mb-5 text-[11px] font-extrabold uppercase tracking-[.14em] text-white">Nuestra etapa</h2>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#facc15]/35 bg-[#facc15]/10 px-3 py-2 text-xs font-bold text-[#facc15]">
            <span className="size-1.5 rounded-full bg-[#facc15]"/> Fase MVP
          </span>
          <p className="mt-5 max-w-[230px] leading-7 text-[#aebed3]">
            Un espacio para explorar y conectar. DealCapital no recibe fondos ni garantiza rentabilidades.
          </p>
          <Link href="/verificacion" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#facc15] hover:underline">
            Conocer nuestros límites actuales <BrandIcon name="arrow" size={15}/>
          </Link>
        </div>
      </div>

      <div className="border-t border-[#263750]">
        <div className="dc-container flex flex-col justify-between gap-3 py-6 text-[11px] text-[#8fa3be] md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} DealCapital. Todos los derechos reservados.</span>
          <span>Lima, Perú · Plataforma en desarrollo · Información declarada por sus responsables.</span>
        </div>
      </div>
    </footer>
  );
}
