import { supabase } from "../lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: proyectos } = await supabase
    .from("proyectos")
    .select("capital_requerido");

  const totalProyectos = proyectos?.length || 0;

  const capitalSolicitado =
    proyectos?.reduce((total, proyecto) => {
      return total + Number(proyecto.capital_requerido || 0);
    }, 0) || 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="text-yellow-400 font-semibold mb-4">
          Plataforma en fase MVP
        </p>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Conectamos emprendedores e inversionistas
        </h1>

        <p className="text-xl text-slate-300 max-w-4xl mx-auto mb-8">
          DealCapital es una plataforma que conecta emprendedores que buscan
          financiamiento con inversionistas interesados en descubrir
          oportunidades de negocio reales.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10 text-left">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            ✓ Publica tu proyecto
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            ✓ Encuentra inversionistas
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            ✓ Conecta directamente
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            ✓ Negocia sin intermediarios
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4">
          <a
            href="/publicar"
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold"
          >
            Publicar Proyecto
          </a>

          <a
            href="/oportunidades"
            className="border border-white hover:bg-white hover:text-black px-8 py-4 rounded-xl font-bold"
          >
            Explorar Oportunidades
          </a>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-8 rounded-2xl text-center border border-slate-800">
            <h3 className="text-4xl font-bold text-yellow-400">
              {totalProyectos}+
            </h3>
            <p className="text-slate-300 mt-2">
              Proyectos publicados
            </p>
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl text-center border border-slate-800">
            <h3 className="text-4xl font-bold text-yellow-400">
              S/ {capitalSolicitado.toLocaleString("es-PE")}
            </h3>
            <p className="text-slate-300 mt-2">
              Capital solicitado
            </p>
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl text-center border border-slate-800">
            <h3 className="text-4xl font-bold text-yellow-400">
              24/7
            </h3>
            <p className="text-slate-300 mt-2">
              Acceso digital a oportunidades
            </p>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          ¿Cómo funciona DealCapital?
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
            <h3 className="text-3xl font-bold mb-6 text-yellow-400">
              Para emprendedores
            </h3>

            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-xl">1. Publica tu proyecto</h4>
                <p className="text-slate-300">
                  Presenta tu negocio, idea o necesidad de capital.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xl">2. Explica cuánto necesitas</h4>
                <p className="text-slate-300">
                  Indica el monto requerido y cómo será utilizado.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xl">3. Recibe interés</h4>
                <p className="text-slate-300">
                  Los inversionistas interesados podrán dejar sus datos.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xl">4. Negocia directamente</h4>
                <p className="text-slate-300">
                  Ambas partes coordinan los términos del acuerdo.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
            <h3 className="text-3xl font-bold mb-6 text-yellow-400">
              Para inversionistas
            </h3>

            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-xl">1. Explora oportunidades</h4>
                <p className="text-slate-300">
                  Revisa proyectos publicados por emprendedores.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xl">2. Analiza propuestas</h4>
                <p className="text-slate-300">
                  Evalúa el capital requerido, retorno ofrecido y descripción.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xl">3. Muestra interés</h4>
                <p className="text-slate-300">
                  Deja tus datos para que el emprendedor pueda contactarte.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xl">4. Decide si participar</h4>
                <p className="text-slate-300">
                  Tú eliges en qué oportunidades deseas involucrarte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUÉ ES DEALCAPITAL */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-slate-900 p-8 md:p-12 rounded-2xl border border-slate-800">
          <h2 className="text-4xl font-bold mb-6">
            ¿Qué es DealCapital?
          </h2>

          <p className="text-slate-300 text-lg mb-6">
            DealCapital es un marketplace digital que busca facilitar la conexión
            entre personas con proyectos o negocios que necesitan capital y
            personas interesadas en encontrar oportunidades de inversión.
          </p>

          <div className="bg-slate-950 p-6 rounded-xl border border-yellow-500">
            <h3 className="text-xl font-bold text-yellow-400 mb-2">
              Importante
            </h3>

            <p className="text-slate-300">
              DealCapital no presta dinero, no capta fondos y no actúa como
              entidad financiera. La plataforma facilita el contacto entre las
              partes para que puedan conversar y evaluar oportunidades.
            </p>
          </div>
        </div>
      </section>

      {/* POR QUÉ ELEGIR */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          ¿Por qué elegir DealCapital?
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-bold text-yellow-400 mb-3">
              Transparencia
            </h3>
            <p className="text-slate-300">
              Información clara sobre cada oportunidad publicada.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-bold text-yellow-400 mb-3">
              Conexión directa
            </h3>
            <p className="text-slate-300">
              Emprendedores e inversionistas pueden comunicarse sin intermediarios.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-bold text-yellow-400 mb-3">
              Acceso rápido
            </h3>
            <p className="text-slate-300">
              Publica o revisa oportunidades desde cualquier lugar.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-bold text-yellow-400 mb-3">
              Crecimiento
            </h3>
            <p className="text-slate-300">
              Impulsamos ideas, negocios y proyectos con potencial.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-bold mb-6">
          ¿Listo para dar el siguiente paso?
        </h2>

        <p className="text-slate-300 max-w-3xl mx-auto mb-8">
          Si eres emprendedor, publica tu proyecto. Si eres inversionista,
          explora oportunidades y conecta con nuevos negocios.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-4">
          <a
            href="/publicar"
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold"
          >
            Publicar Proyecto
          </a>

          <a
            href="/oportunidades"
            className="border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black px-8 py-4 rounded-xl font-bold"
          >
            Ver Oportunidades
          </a>
        </div>
      </section>
    </main>
  );
}
