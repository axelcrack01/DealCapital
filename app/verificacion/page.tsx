import Link from "next/link";
import BrandIcon from "../components/BrandIcon";

export const metadata = {
  title: "Verificación de identidad | DealCapital",
  description: "Información sobre las verificaciones de identidad y evaluación documental previstas en DealCapital.",
};

const steps = [
  {
    title: "1. Confirmación de cuenta",
    description:
      "Validamos el acceso a tu correo y protegemos tu sesión. Esto aún no acredita tu identidad civil.",
  },
  {
    title: "2. DNI y titularidad",
    description:
      "Cuando esté disponible un proveedor autorizado, solicitaremos el DNI en una conexión protegida y verificaremos que seas su titular. Los datos oficiales no podrán editarse libremente.",
  },
  {
    title: "3. Verificación del emprendimiento",
    description:
      "Para publicar oportunidades se revisará la documentación empresarial y la relación del emprendedor con el negocio.",
  },
  {
    title: "4. Evaluación de documentación financiera",
    description:
      "La información crediticia solo se tratará con fundamento legal y acceso autorizado. Ninguna consulta garantiza que una inversión sea segura.",
  },
];

export default function VerificacionPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <section className="max-w-4xl mx-auto">
        <p className="text-yellow-400 text-sm uppercase tracking-widest mb-3">
          Seguridad y confianza
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Verificación de identidad
        </h1>
        <div className="bg-slate-900 border border-amber-700/40 rounded-2xl p-6 mb-10">
          <h2 className="text-xl font-semibold mb-2">
            Integración oficial aún no disponible
          </h2>
          <p className="text-slate-300 leading-relaxed">
            DealCapital está preparando un proceso de validación de identidad
            mediante un proveedor autorizado. Actualmente no consultamos RENIEC
            ni la SBS desde esta página, no pedimos tu DNI aquí y no emitimos
            certificados de identidad. El registro de una cuenta no significa
            que una persona o empresa haya superado una verificación oficial.
          </p>
        </div>

        <section className="mb-11 grid gap-5 rounded-2xl border border-[#344b6b] bg-[#10223b] p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8" aria-labelledby="identity-start-heading">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#facc15]">DealCapital Identity · Fase 1</p>
            <h2 id="identity-start-heading" className="text-xl font-extrabold text-white sm:text-2xl">Conoce nuestro recorrido de confianza.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Explora las etapas previstas de identidad, emprendimiento e información financiera.
              Esta primera versión es informativa y no recopila DNI, biometría ni reportes crediticios.
            </p>
          </div>
          <Link href="/identidad" className="dc-btn dc-btn-primary whitespace-nowrap">
            Explorar DealCapital Identity <BrandIcon name="arrow" size={18}/>
          </Link>
        </section>
        <h2 className="text-2xl font-bold mb-6">Cómo será el proceso</h2>
        <ol className="grid md:grid-cols-2 gap-5 mb-10">
          {steps.map((step) => (
            <li key={step.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                {step.title}
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <p className="text-slate-400 text-sm mb-6">
          Evita compartir fotografías de tu DNI, claves o reportes de deudas
          por chat o correo no solicitado. Cualquier solicitud futura deberá
          informar su finalidad, medidas de protección y tratamiento de datos.
        </p>
        <a
          href="/perfil"
          className="inline-flex rounded-xl bg-yellow-500 px-6 py-3 text-slate-950 font-bold hover:bg-yellow-400"
        >
          Volver a mi perfil
        </a>
      </section>
    </main>
  );
}
