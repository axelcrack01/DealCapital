import Link from "next/link";
import BrandIcon from "./BrandIcon";

const questions = [
  {
    q: "¿DealCapital financia directamente los proyectos?",
    a: "No. DealCapital facilita el encuentro entre emprendedores y personas interesadas en conocer proyectos. No otorga préstamos, custodia fondos ni garantiza inversiones.",
  },
  {
    q: "¿Cómo puedo presentar una oportunidad?",
    a: "Puedes crear una cuenta y utilizar la opción de publicación de proyectos. Las propuestas pueden pasar por una revisión antes de aparecer en el catálogo público.",
  },
  {
    q: "¿Un proyecto publicado es una inversión verificada?",
    a: "No. La revisión para publicación no equivale a certificar su solvencia, sus datos financieros ni la identidad de sus responsables. Es necesario comprobar la información de forma independiente.",
  },
  {
    q: "¿Puedo explorar proyectos antes de registrarme?",
    a: "Sí. Puedes consultar las oportunidades públicas. Para expresar interés o utilizar funciones de cuenta, deberás iniciar sesión cuando la plataforma lo solicite.",
  },
];

export default function HomeFAQ() {
  return (
    <section className="dc-home-faq" aria-labelledby="dc-home-faq-title">
      <div className="dc-container dc-home-faq-grid">
        <div className="dc-home-faq-intro">
          <p className="dc-eyebrow mb-5">Antes de empezar</p>
          <h2 id="dc-home-faq-title" className="dc-section-title">Respuestas claras, desde el <span className="text-[#facc15]">primer encuentro.</span></h2>
          <p className="dc-section-copy mt-5">
            Conocer los alcances de la plataforma es tan importante como descubrir una oportunidad.
          </p>
          <Link href="/verificacion" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#facc15] hover:underline">
            Cómo trabajamos la confianza <BrandIcon name="arrow" size={18}/>
          </Link>
          <div className="dc-home-faq-summary">
            <span className="text-[#facc15]"><BrandIcon name="shield" size={31}/></span>
            <div>
              <strong className="block text-sm font-bold text-white">Información, antes que promesas.</strong>
              <p className="mt-2 text-xs leading-6 text-[#cbd5e1]">Las consultas oficiales de identidad y antecedentes financieros no están integradas en el MVP.</p>
            </div>
          </div>
        </div>
        <div className="dc-home-faq-list">
          {questions.map((item, i) => (
            <details key={item.q} className="dc-home-faq-item">
              <summary>
                <span className="dc-home-faq-number">0{i + 1}</span>
                <span>{item.q}</span>
                <span className="dc-home-faq-expand" aria-hidden="true"/>
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
