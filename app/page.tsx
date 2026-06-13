export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Donde el capital encuentra oportunidades
        </h1>

        <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">
          DealCapital conecta emprendedores que necesitan financiamiento
          con inversionistas que buscan oportunidades reales de crecimiento.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-4">
          <button className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-semibold">
            Busco inversión
          </button>

          <button className="border border-white px-8 py-4 rounded-xl font-semibold">
            Quiero invertir
          </button>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          ¿Cómo funciona?
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">1. Publica</h3>
            <p className="text-slate-300">
              Describe tu proyecto y cuánto capital necesitas.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">2. Verifica</h3>
            <p className="text-slate-300">
              Valida tu identidad y la información de tu negocio.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">3. Conecta</h3>
            <p className="text-slate-300">
              Recibe interés de inversionistas potenciales.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">4. Crece</h3>
            <p className="text-slate-300">
              Consigue el capital que necesitas para crecer.
            </p>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          Beneficios
        </h2>

        <div className="grid md:grid-cols-2 gap-8">

          <div className="bg-slate-900 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">
              Para Emprendedores
            </h3>

            <ul className="space-y-3 text-slate-300">
              <li>✓ Acceso a capital</li>
              <li>✓ Más visibilidad</li>
              <li>✓ Contacto con inversionistas</li>
              <li>✓ Oportunidades de crecimiento</li>
            </ul>
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">
              Para Inversionistas
            </h3>

            <ul className="space-y-3 text-slate-300">
              <li>✓ Oportunidades verificadas</li>
              <li>✓ Transparencia</li>
              <li>✓ Diversificación</li>
              <li>✓ Conexión directa con emprendedores</li>
            </ul>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-24 px-6">
        <h2 className="text-4xl font-bold mb-6">
          Sé parte del futuro del financiamiento
        </h2>

        <p className="text-slate-300 mb-8">
          Únete a la comunidad DealCapital y conecta con nuevas oportunidades.
        </p>

        <button className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold">
          Unirme a la lista de espera
        </button>
      </section>

    </main>
  );
}