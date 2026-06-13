export default function Contacto() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">Contacto</h1>
        <p className="text-slate-300 mb-10">
          ¿Tienes dudas sobre DealCapital? Escríbenos y te responderemos pronto.
        </p>

        <form
          action="https://formspree.io/f/xzdqypwn"
          method="POST"
          className="bg-slate-900 p-8 rounded-2xl space-y-5 mb-16"
        >
          <input
            name="nombre"
            placeholder="Nombre completo"
            className="w-full p-4 rounded-xl bg-slate-800"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Correo electrónico"
            className="w-full p-4 rounded-xl bg-slate-800"
            required
          />

          <select
            name="tipo"
            className="w-full p-4 rounded-xl bg-slate-800"
            required
          >
            <option value="">Selecciona una opción</option>
            <option value="Emprendedor">Soy emprendedor</option>
            <option value="Inversionista">Soy inversionista</option>
            <option value="Otro">Otro</option>
          </select>

          <textarea
            name="mensaje"
            placeholder="Escribe tu mensaje"
            rows={6}
            className="w-full p-4 rounded-xl bg-slate-800"
            required
          />

          <button className="bg-yellow-500 text-black px-8 py-4 rounded-xl font-bold">
            Enviar mensaje
          </button>
        </form>

        <h2 className="text-3xl font-bold mb-6">Preguntas frecuentes</h2>

        <div className="space-y-4">
          {[
            {
              q: "¿DealCapital presta dinero directamente?",
              a: "No. DealCapital funciona como una plataforma de conexión entre emprendedores e inversionistas. No somos banco ni entidad financiera.",
            },
            {
              q: "¿La plataforma maneja pagos o transferencias?",
              a: "En esta etapa no. Los acuerdos se coordinan directamente entre las partes interesadas.",
            },
            {
              q: "¿Cómo se conectan emprendedores e inversionistas?",
              a: "El emprendedor publica su oportunidad y el inversionista puede mostrar interés dejando sus datos de contacto.",
            },
            {
              q: "¿Tiene costo publicar un proyecto?",
              a: "Durante la etapa inicial de validación, publicar proyectos puede ser gratuito.",
            },
          ].map((item) => (
            <div key={item.q} className="bg-slate-900 p-6 rounded-xl">
              <h3 className="font-bold text-xl mb-2">{item.q}</h3>
              <p className="text-slate-300">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}