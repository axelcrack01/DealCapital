import Link from "next/link";
import BrandIcon from "../components/BrandIcon";
import EditorialPhoto from "../components/EditorialPhoto";

export const metadata = {
  title: "Para inversionistas",
  description: "Descubre proyectos, compara información declarada y conversa con emprendedores en DealCapital.",
};

const questions = [
  {q:"¿Los proyectos están verificados financieramente?",a:"No. Los proyectos que aparecen públicamente pueden haber sido revisados para publicación, pero esto no representa una certificación de identidad, solvencia o desempeño. La verificación mediante proveedores oficiales sigue en desarrollo."},
  {q:"¿DealCapital recibe el dinero que deseo invertir?",a:"No. El MVP funciona como plataforma de conexión y no custodia fondos, ejecuta desembolsos ni garantiza rendimientos."},
  {q:"¿Qué información debo revisar antes de decidir?",a:"Como mínimo, el modelo de negocio, documentación legal, quién representa a la empresa, proyecciones y su sustento, riesgos, condiciones propuestas y las verificaciones independientes que correspondan."},
  {q:"¿La plataforma decide por mí si una inversión es segura?",a:"No. La información disponible es un punto de partida, no asesoría financiera. Cada persona debe efectuar su propia evaluación y obtener orientación profesional cuando sea necesario."},
];

export default function InversionistasPage() {
  return (
    <main className="dc-landing">
      <section className="dc-page-head">
        <div className="dc-container dc-page-head-grid">
          <div>
            <p className="dc-kicker">Para quienes quieren descubrir oportunidades</p>
            <h1>Mira más allá de la idea. <em>Conoce el negocio.</em></h1>
            <p className="mt-6">
              Descubre emprendimientos, identifica qué información está disponible
              y habla con los responsables antes de tomar cualquier decisión.
              Invierte tiempo en entender primero.
            </p>
            <div className="dc-landing-actions">
              <Link href="/oportunidades" className="dc-btn dc-btn-primary">Explorar proyectos <BrandIcon name="arrow" size={18}/></Link>
              <Link href="/verificacion" className="dc-btn dc-btn-outline">Cómo evaluamos la información <BrandIcon name="shield" size={19}/></Link>
            </div>
          </div>
          <EditorialPhoto name="analysis" className="dc-side-photo" sizes="(max-width: 740px) 92vw, 38vw" priority/>
        </div>
      </section>

      <section className="dc-container dc-landing-section">
        <div className="dc-editorial-intro">
          <div><p className="dc-eyebrow mb-5">Antes de empezar</p>
            <h2 className="dc-section-title">Elige con una mirada más completa.</h2>
          </div>
          <p className="dc-section-copy">Una decisión no debería depender únicamente de una cifra de retorno. Empieza con el negocio, sus fundamentos y los riesgos.</p>
        </div>
        <div className="dc-outline-list">
          {[
            {icon:"compass" as const,title:"Descubre",body:"Explora sectores, proyectos y necesidades de capital dentro del catálogo."},
            {icon:"document" as const,title:"Contrasta",body:"Revisa qué información declara el proyecto y qué datos necesitan validación externa."},
            {icon:"message" as const,title:"Conversa",body:"Contacta con el emprendedor para solicitar aclaraciones y documentación adicional."},
          ].map((x,i)=>(
            <article key={x.title} className="dc-outline-item">
              <div className="flex justify-between"><BrandIcon name={x.icon} size={36}/><span className="text-sm font-bold text-[#facc15]">0{i+1}</span></div>
              <h3>{x.title}</h3><p>{x.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dc-journey">
        <div className="dc-container grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="dc-eyebrow mb-5">La información importa</p>
            <h2 className="dc-section-title">Una evaluación comienza con <span className="text-[#facc15]">evidencias.</span></h2>
            <p className="dc-section-copy mt-6">
              Estamos diseñando una experiencia de diligencia debida asistida para
              organizar documentos e inconsistencias. No existe hoy una consulta
              automatizada a SBS, RENIEC u otras fuentes oficiales dentro del MVP.
            </p>
            <Link href="/verificacion" className="dc-btn dc-btn-outline mt-7">Conocer el plan de verificación <BrandIcon name="arrow" size={18}/></Link>
          </div>
          <div className="dc-panel p-7 sm:p-9">
            <p className="dc-kicker mb-5">Preguntas para una primera revisión</p>
            {[
              ["Modelo","¿Cómo gana dinero el negocio?"],
              ["Capital","¿Cómo se usarían los fondos solicitados?"],
              ["Evidencia","¿Qué documentos respaldan las afirmaciones?"],
              ["Riesgos","¿Qué podría salir diferente a lo esperado?"],
            ].map(([label,question])=>(
              <div key={label} className="grid grid-cols-[85px_1fr] gap-3 border-t border-slate-700/80 py-4 text-sm first:border-t-0">
                <span className="font-bold text-[#facc15]">{label}</span><span className="text-[#cbd5e1]">{question}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dc-container dc-landing-section">
        <p className="dc-eyebrow mb-5">Preguntas frecuentes</p>
        <div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]">
          <h2 className="dc-section-title">Lo esencial, sin letra pequeña.</h2>
          <div className="dc-faq">
            {questions.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}
          </div>
        </div>
      </section>

      <section className="dc-endcap">
        <div className="dc-container dc-endcap-inner">
          <div><p className="dc-eyebrow mb-5">Explorar con criterio</p>
            <h2 className="dc-section-title">Tu próxima conversación empieza aquí.</h2>
          </div>
          <Link href="/oportunidades" className="dc-btn dc-btn-primary">Ver oportunidades <BrandIcon name="arrow" size={18}/></Link>
        </div>
      </section>
    </main>
  );
}