import Link from "next/link";
import BrandIcon from "./BrandIcon";

export default function Footer() {
  return (
    <footer className="border-t border-[#2b3a55] bg-[#020817] text-[#cbd5e1]">
      <div className="dc-container grid gap-11 py-16 lg:grid-cols-[1.45fr_.8fr_.8fr_.9fr]">
        <div>
          <Link href="/" className="mb-5 inline-flex items-center gap-3" aria-label="DealCapital, volver a inicio">
            <img src="/logo.png" width={42} height={42} alt="" className="size-[42px] rounded-md bg-white object-contain p-1"/>
            <span className="text-xl font-extrabold tracking-tight text-white">Deal<span className="text-[#facc15]">Capital</span></span>
          </Link>
          <p className="max-w-xs text-sm leading-7">
            Un punto de encuentro entre emprendimiento y capital.
            Creamos mejores condiciones para iniciar conversaciones informadas.
          </p>
          <a className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#facc15] hover:underline"
             href="https://www.linkedin.com/company/dealcapital/" target="_blank" rel="noopener noreferrer">
            Síguenos en LinkedIn <BrandIcon name="arrow" size={16}/>
          </a>
        </div>
        <nav aria-label="Explorar DealCapital" className="flex flex-col gap-3 text-sm">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-white">Explorar</h2>
          <Link className="hover:text-[#facc15]" href="/oportunidades">Oportunidades</Link>
          <Link className="hover:text-[#facc15]" href="/emprendedores">Para emprendedores</Link>
          <Link className="hover:text-[#facc15]" href="/inversionistas">Para inversionistas</Link>
          <Link className="hover:text-[#facc15]" href="/nosotros">Nosotros</Link>
        </nav>
        <nav aria-label="Información de la plataforma" className="flex flex-col gap-3 text-sm">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-white">La plataforma</h2>
          <Link className="hover:text-[#facc15]" href="/registro">Crear cuenta</Link>
          <Link className="hover:text-[#facc15]" href="/login">Iniciar sesión</Link>
          <Link className="hover:text-[#facc15]" href="/verificacion">Confianza y verificación</Link>
          <Link className="hover:text-[#facc15]" href="/contacto">Contacto</Link>
        </nav>
        <div className="text-sm">
          <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-white">Estado actual</h2>
          <span className="inline-flex items-center gap-2 rounded-md border border-[#facc15]/30 bg-[#facc15]/10 px-3 py-2 text-xs font-semibold text-[#facc15]">
            <span className="size-1.5 rounded-full bg-[#facc15]"/> Plataforma en fase MVP
          </span>
          <p className="mt-4 leading-7 text-[#cbd5e1]">DealCapital no recibe fondos ni garantiza rentabilidades.</p>
        </div>
      </div>
      <div className="dc-container flex flex-col justify-between gap-3 border-t border-[#2b3a55] py-6 text-xs text-slate-400 md:flex-row">
        <span>© {new Date().getFullYear()} DealCapital. Todos los derechos reservados.</span>
        <span>Lima, Perú · La información de cada proyecto es declarada por sus responsables.</span>
      </div>
    </footer>
  );
}