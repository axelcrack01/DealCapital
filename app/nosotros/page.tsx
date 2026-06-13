export default function Nosotros() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">Nosotros</h1>

        <p className="text-slate-300 text-lg mb-12">
          DealCapital nace para conectar emprendedores que necesitan capital con
          inversionistas interesados en oportunidades reales de crecimiento.
        </p>

        <div className="grid md:grid-cols-2 gap-10 items-center bg-slate-900 p-8 rounded-2xl mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-4">¿Quiénes somos?</h2>

            <p className="text-slate-300 mb-6">
              Somos una plataforma digital en desarrollo que busca facilitar el
              contacto entre emprendedores e inversionistas, promoviendo
              conexiones transparentes, accesibles y enfocadas en el crecimiento.
            </p>

            <h2 className="text-3xl font-bold mb-4">Fundador</h2>

            <p className="text-slate-300">
              Mi nombre es Axel Valladares, fundador y creador de DealCapital.
              Esta idea nace al identificar que muchos emprendedores tienen
              oportunidades reales, pero no siempre cuentan con el capital
              necesario para desarrollarlas.
            </p>

            <a
              href="https://www.linkedin.com/in/axel-daniel-valladares-flores-0770662ba/"
              target="_blank"
              className="inline-block mt-6 bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold"
            >
              Conectar en LinkedIn
            </a>
          </div>

          <div className="text-center">
            <img
              src="/fundador.png"
              alt="Axel Valladares, fundador de DealCapital"
              className="w-56 h-56 mx-auto rounded-full object-cover mb-4 border-4 border-yellow-500"
            />

            <h3 className="text-2xl font-bold">Axel Valladares</h3>
            <p className="text-yellow-400">Founder & CEO</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-slate-900 p-6 rounded-2xl">
            <h3 className="text-3xl font-bold text-yellow-400">MVP</h3>
            <p className="text-slate-300">Plataforma funcional en desarrollo</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl">
            <h3 className="text-3xl font-bold text-yellow-400">24/7</h3>
            <p className="text-slate-300">Acceso digital a oportunidades</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl">
            <h3 className="text-3xl font-bold text-yellow-400">LatAm</h3>
            <p className="text-slate-300">Visión de crecimiento regional</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-slate-900 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold mb-4">Misión</h2>
            <p className="text-slate-300">
              Facilitar conexiones transparentes entre emprendedores e
              inversionistas para impulsar negocios con potencial de crecimiento.
            </p>
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold mb-4">Visión</h2>
            <p className="text-slate-300">
              Convertirnos en una plataforma referente para conectar capital y
              oportunidades en Latinoamérica.
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Valores</h2>

          <div className="grid md:grid-cols-4 gap-6">
            {["Transparencia", "Confianza", "Innovación", "Crecimiento"].map(
              (valor) => (
                <div key={valor} className="bg-slate-900 p-6 rounded-2xl">
                  <h3 className="text-xl font-bold text-yellow-400">
                    {valor}
                  </h3>
                </div>
              )
            )}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6">
            Timeline de DealCapital
          </h2>

          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border-l-4 border-yellow-500">
              <h3 className="font-bold text-xl">2026 — Idea inicial</h3>
              <p className="text-slate-300">
                Nace la idea de conectar emprendedores con inversionistas.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border-l-4 border-yellow-500">
              <h3 className="font-bold text-xl">2026 — Validación</h3>
              <p className="text-slate-300">
                Se consulta a potenciales usuarios y se valida el interés en la
                plataforma.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border-l-4 border-yellow-500">
              <h3 className="font-bold text-xl">2026 — MVP funcional</h3>
              <p className="text-slate-300">
                Se desarrolla la primera versión con publicación de proyectos,
                oportunidades e interesados.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}