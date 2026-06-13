export default function Nosotros() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">Nosotros</h1>

        <p className="text-slate-300 text-lg mb-10">
          DealCapital nace con la idea de conectar emprendedores que necesitan capital
          con personas interesadas en invertir en oportunidades reales de crecimiento.
        </p>

        <div className="grid md:grid-cols-2 gap-10 items-center bg-slate-900 p-8 rounded-2xl">
  
  <div>
    <h2 className="text-3xl font-bold mb-4">¿Quiénes somos?</h2>

    <p className="text-slate-300 mb-4">
      Somos una plataforma digital en desarrollo que busca facilitar el contacto
      entre emprendedores e inversionistas, promoviendo conexiones transparentes,
      accesibles y enfocadas en el crecimiento.
    </p>

    <h2 className="text-3xl font-bold mb-4 mt-8">Fundador</h2>

    <p className="text-slate-300">
      Mi nombre es Axel Valladares, fundador y creador de DealCapital. Esta idea
      nace al identificar que muchos emprendedores tienen oportunidades reales,
      pero no siempre cuentan con el capital necesario para desarrollarlas.
    </p>
  </div>

  <div className="text-center">
    <img
      src="/fundador.png"
      alt="Axel Valladares, fundador de DealCapital"
      className="w-48 h-48 mx-auto rounded-full object-cover mb-4 border-4 border-yellow-500"
    />

    <h3 className="text-2xl font-bold">
      Axel Valladares
    </h3>

    <p className="text-yellow-400">
      Founder & CEO
    </p>
  </div>

</div>
      </section>
    </main>
  );
}