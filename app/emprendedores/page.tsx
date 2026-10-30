import Link from "next/link";
import BrandIcon from "../components/BrandIcon";
import EditorialPhoto from "../components/EditorialPhoto";

export const metadata = {
  title: "Para emprendedores",
  description: "Presenta tu emprendimiento, organiza tu propuesta y conecta con personas interesadas en conocer tu negocio.",
};

const steps = [
  {n:"01",icon:"venture" as const,title:"Cuéntanos qué construyes",body:"Describe tu negocio, su propuesta de valor, el mercado y el equipo que lo impulsa."},
  {n:"02",icon:"document" as const,title:"Presenta tu necesidad de capital",body:"Explica el importe solicitado, el destino de los recursos y los riesgos que identificas."},
  {n:"03",icon:"message" as const,title:"Abre nuevas conversaciones",body:"Una vez revisada para publicación, tu propuesta podrá ser descubierta por potenciales interesados."},
];

export default function EmprendedoresPage() {
  return (
    <main className="dc-landing">
      <section className="dc-page-head">
        <div className="dc-container dc-page-head-grid">
          <div>
            <p className="dc-kicker">Para quienes están construyendo algo</p>
            <h1>Tu próximo capítulo necesita una <em>buena conexión.</em></h1>
            <p className="mt-6">Una gran idea merece ser presentada con claridad.
              DealCapital ofrece un punto de encuentro para dar a conocer tu proyecto
              y conversar con personas que buscan descubrir negocios.</p>
            <div className="dc-landing-actions">
              <Link href="/publicar" className="dc-btn dc-btn-primary">Presentar mi proyecto <BrandIcon name="arrow" size={18}/></Link>
              <Link href="/contacto" className="dc-btn dc-btn-outline">Resolver una consulta <BrandIcon name="message" size={18}/></Link>
            </div>
          </div>
          <EditorialPhoto name="entrepreneur" className="dc-side-photo" sizes="(max-width: 740px) 92vw, 38vw" priority/>
        </div>
      </section>

      <section className="dc-container dc-landing-section" aria-labelledby="dc-entrepreneur-flow">
        <div className="dc-editorial-intro">
          <div><p className="dc-eyebrow mb-5">Tu recorrido</p><h2 id="dc-entrepreneur-flow" className="dc-section-title">De una presentación sólida a una conversación relevante.</h2></div>
          <p className="dc-section-copy">El objetivo no es publicar por publicar. Es explicar con precisión qué necesitas y por qué tu proyecto resulta interesante.</p>
        </div>
        <div className="dc-outline-list">
          {steps.map(item=>(
            <article key={item.n} className="dc-outline-item">
              <div className="flex items-center justify-between gap-3">
                <BrandIcon name={item.icon} size={34}/>
                <span className="text-xs font-bold tracking-widest text-[#facc15]">{item.n}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dc-journey">
        <div className="dc-container grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="dc-eyebrow mb-5">Una propuesta con contenido</p>
            <h2 className="dc-section-title">La historia importa. <span className="text-[#facc15]">Los datos también.</span></h2>
            <p className="dc-section-copy mt-6">Antes de presentar tu emprendimiento, reúne información suficiente para explicar de forma responsable su situación actual y lo que pretendes conseguir.</p>
            <Link href="/publicar" className="dc-btn dc-btn-primary mt-7">Empezar mi presentación <BrandIcon name="arrow" size={18}/></Link>
          </div>
          <div className="dc-panel p-6 sm:p-8">
            <p className="dc-kicker mb-6">Tu propuesta puede incluir</p>
            {[
              ["Propuesta de valor","Qué problema resuelves y para quién."],
              ["Modelo de negocio","Cómo generas ingresos y cuáles son tus costos."],
              ["Capital solicitado","Cuánto necesitas y cómo piensas utilizarlo."],
              ["Riesgos identificados","Qué podría impedir el crecimiento esperado."],
            ].map(([title,description],i)=>(
              <div key={title} className="flex gap-5 border-t border-slate-700/70 py-4 first:border-0">
                <span className="w-8 shrink-0 text-lg font-bold text-[#facc15]">0{i+1}</span>
                <div><h3 className="text-sm font-bold text-white">{title}</h3><p className="mt-1 text-xs leading-6 text-[#cbd5e1]">{description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dc-endcap">
        <div className="dc-container dc-endcap-inner">
          <div>
            <p className="dc-eyebrow mb-5">Publicación responsable</p>
            <h2 className="dc-section-title">¿Tienes una idea que vale la pena contar?</h2>
            <p className="dc-section-copy mt-4 max-w-2xl">Las propuestas pueden revisarse antes de ser visibles. La revisión no certifica identidad, solvencia ni resultados futuros.</p>
          </div>
          <Link href="/publicar" className="dc-btn dc-btn-primary">Presentar mi negocio <BrandIcon name="arrow" size={18}/></Link>
        </div>
      </section>
    </main>
  );
}