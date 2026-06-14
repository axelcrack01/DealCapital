export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="text-yellow-400 font-semibold mb-4">
          Plataforma en fase MVP
        </p>

        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Donde el capital encuentra oportunidades
        </h1>

        <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">
          DealCapital conecta emprendedores que necesitan financiamiento con
          inversionistas interesados en descubrir oportunidades de negocio.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-4">
          <a
            href="/publicar"
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold"
          >
            Busco inversión
          </a>

          <a
            href="/oportunidades"
            className="border border-white hover:bg-white hover:text-black px-8 py-4 rounded-xl font-bold"
          >
            Quiero invertir
          </a>

          <a
            href="/nosotros"
            className="border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black px-8 py-4 rounded-xl font-bold"
          >
            Conocer más
          </a>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl">
          <h3 className="text-3xl font-bold text-yellow-400">01</h3>
          <h2 className="text-xl font-bold mt-3">Publica tu proyecto</h2>
          <p className="text-slate-300 mt-2">
            Los emprendedores registran su oportunidad de negocio.
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl">
          <h3 className="text-3xl font-bold text-yellow-400">02</h3>
          <h2 className="text-xl font-bold mt-3">Explora oportunidades</h2>
          <p className="text-slate-300 mt-2">
            Los inversionistas revisan proyectos disponibles.
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl">
          <h3 className="text-3xl font-bold text-yellow-400">03</h3>
          <h2 className="text-xl font-bold mt-3">Conecta directamente</h2>
          <p className="text-slate-300 mt-2">
            Ambas partes pueden iniciar una conversación para evaluar acuerdos.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-8 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">Para emprendedores</h2>
          <p className="text-slate-300 mb-6">
            Publica tu necesidad de capital y presenta tu negocio ante posibles
            inversionistas.
          </p>

          <a
            href="/publicar"
            className="inline-block bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold"
          >
            Publicar proyecto
          </a>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">Para inversionistas</h2>
          <p className="text-slate-300 mb-6">
            Descubre oportunidades, revisa propuestas y muestra interés en los
            proyectos que consideres atractivos.
          </p>

          <a
            href="/oportunidades"
            className="inline-block bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold"
          >
            Ver oportunidades
          </a>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-bold mb-6">
          Construyendo una nueva forma de conectar capital y oportunidades
        </h2>

        <p className="text-slate-300 max-w-3xl mx-auto mb-8">
          DealCapital aún está en etapa inicial, pero ya permite publicar
          proyectos, explorar oportunidades y registrar interés de inversionistas.
        </p>

        <a
          href="/contacto"
          className="inline-block border border-yellow-500 text-yellow-400 px-8 py-4 rounded-xl font-bold hover:bg-yellow-500 hover:text-black"
        >
          Contactar al equipo
        </a>
      </section>
    </main>
  );
}