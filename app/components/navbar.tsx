import Image from "next/image";
import Link from "next/link";
export default function Navbar() {
  return (
    <nav className="w-full border-b border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        <Link
  href="/"
  className="flex items-center gap-3 hover:opacity-80 transition"
>
  <Image
    src="/logo.png"
    alt="DealCapital"
    width={45}
    height={45}
  />

  <span className="font-bold text-xl text-white">
    DealCapital
  </span>
</Link>

        <div className="hidden md:flex gap-8 text-slate-300">
          <a href="/">Inicio</a>
          <a href="/nosotros">Nosotros</a>
          <a href="/oportunidades">Oportunidades</a>
          <a href="/inversionistas">Inversionistas</a>
          <a href="/contacto">Contacto</a>
        </div>

        <a href="/publicar">
  <button className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-semibold">
    Publicar Proyecto
  </button>
</a>

      </div>
    </nav>
  );
}