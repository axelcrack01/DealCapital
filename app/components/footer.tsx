import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#07111d] text-slate-300">
      <div className="dc-container grid gap-12 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link href="/" className="mb-5 inline-flex items-center gap-3 text-xl font-bold text-white">
            <span className="grid size-9 place-items-center rounded-lg bg-amber-300 text-lg text-slate-950">✦</span> Deal<span className="-ml-3 text-amber-200">Capital</span>
          </Link>
          <p className="max-w-sm text-sm leading-7 text-slate-400">Unimos emprendimiento y capital mediante conexiones más informadas. Plataforma en desarrollo, enfocada en transparencia y seguridad.</p>
        </div>
        <div>
          <h2 className="mb-5 text-sm font-bold text-white">Explorar</h2>
          <div className="flex flex-col gap-3 text-sm"><Link href="/oportunidades" className="hover:text-amber-200">Oportunidades</Link><Link href="/publicar" className="hover:text-amber-200">Publicar proyecto</Link><Link href="/nosotros" className="hover:text-amber-200">Nosotros</Link><Link href="/contacto" className="hover:text-amber-200">Contacto</Link></div>
        </div>
        <div>
          <h2 className="mb-5 text-sm font-bold text-white">Confianza y soporte</h2>
          <div className="flex flex-col gap-3 text-sm"><Link href="/verificacion" className="hover:text-amber-200">Verificación de identidad</Link><Link href="/contacto" className="hover:text-amber-200">Ayuda y consultas</Link><a href="https://www.linkedin.com/company/dealcapital/" rel="noopener noreferrer" target="_blank" className="hover:text-amber-200">LinkedIn</a><span className="text-slate-500">Lima, Perú</span></div>
        </div>
      </div>
      <div className="dc-container flex flex-col justify-between gap-3 border-t border-slate-800 py-6 text-xs text-slate-500 sm:flex-row">
        <span>© {new Date().getFullYear()} DealCapital. Todos los derechos reservados.</span>
        <span>MVP · La información de las oportunidades es declarada por sus responsables.</span>
      </div>
    </footer>
  );
}
