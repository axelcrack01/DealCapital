import Link from "next/link";
import BrandIcon from "../components/BrandIcon";

export const metadata = {
  title: "Nosotros",
  description: "Conoce el origen, la misión y la visión de DealCapital, una plataforma en desarrollo para emprendedores e inversionistas.",
};

export default function Nosotros() {
  return (
    <main className="dc-landing">
      <section className="dc-page-head">
        <div className="dc-container dc-page-head-grid">
          <div>
            <p className="dc-kicker">La historia detrás de DealCapital</p>
            <h1>Creemos en las buenas ideas. <em>Y en las personas que las impulsan.</em></h1>
            <p className="mt-6">
              DealCapital nace para acortar la distancia entre quienes construyen
              negocios y quienes buscan conocer nuevas oportunidades. Estamos
              desarrollando una plataforma digital que facilite ese primer encuentro.
            </p>
            <div className="dc-landing-actions">
              <Link href="/oportunidades" className="dc-btn dc-btn-primary">Conocer oportunidades <BrandIcon name="arrow" size={18}/></Link>
              <Link href="/contacto" className="dc-btn dc-btn-outline">Conversar con nosotros <BrandIcon name="message" size={19}/></Link>
            </div>
          </div>
          <aside className="dc-insight-rail">
            <span>Nuestro propósito</span>
            <strong>Hacer más accesible el encuentro entre emprendimiento y capital.</strong>
            <p className="text-sm leading-7 text-[#cbd5e1]">Tecnología al servicio de conexiones más claras y conversaciones mejor informadas.</p>
          </aside>
        </div>
      </section>

      <section className="dc-container dc-landing-section">
        <div className="dc-editorial-intro">
          <div><p className="dc-eyebrow mb-5">Nuestra perspectiva</p><h2 className="dc-section-title">Un ecosistema más abierto empieza con información clara.</h2></div>
          <p className="dc-section-copy">Nuestro objetivo no es reemplazar el criterio de un inversionista, sino facilitar que conozca proyectos y pueda iniciar una evaluación propia.</p>
        </div>
        <div className="dc-outline-list">
          {[
            {icon:"compass" as const,title:"Acceso",body:"Crear un punto de encuentro para personas que buscan impulsar o descubrir proyectos."},
            {icon:"document" as const,title:"Transparencia",body:"Promover descripciones comprensibles, riesgos declarados y documentación relevante."},
            {icon:"growth" as const,title:"Evolución",body:"Desarrollar una experiencia útil, segura y adaptable a las necesidades del ecosistema."},
          ].map(x=>(
            <article key={x.title} className="dc-outline-item">
              <BrandIcon name={x.icon} size={35}/>
              <h3>{x.title}</h3><p>{x.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dc-journey">
        <div className="dc-container">
          <div className="mb-9">
            <p className="dc-eyebrow mb-5">Quién está detrás</p>
            <h2 className="dc-section-title">Una idea que comenzó con una pregunta.</h2>
          </div>
          <div className="dc-founder-card">
            <div className="dc-founder-copy">
              <p className="dc-kicker mb-5">Fundador de DealCapital</p>
              <h3 className="mb-5 text-3xl font-bold tracking-tight text-white">Axel Valladares</h3>
              <p>
                DealCapital surge al identificar que muchos emprendimientos
                necesitan visibilidad, información y conexiones para acceder
                a nuevas posibilidades de crecimiento. Hoy el proyecto
                avanza como plataforma tecnológica en fase MVP.
              </p>
              <p className="mt-5">
                La prioridad es desarrollar un espacio donde cada parte pueda
                conocer mejor a la otra y donde la confianza se construya con hechos.
              </p>
              <a href="https://www.linkedin.com/in/axel-daniel-valladares-flores-0770662ba/"
                rel="noopener noreferrer" target="_blank"
                className="dc-btn dc-btn-outline mt-8">
                Ver perfil en LinkedIn <BrandIcon name="arrow" size={18}/>
              </a>
            </div>
            <div className="dc-founder-image">
              <img src="/fundador.png" alt="Fotografía del fundador de DealCapital" loading="lazy"/>
            </div>
          </div>
        </div>
      </section>

      <section className="dc-container dc-landing-section">
        <div className="grid gap-9 lg:grid-cols-2">
          <div className="dc-panel p-8 sm:p-10">
            <span className="dc-editorial-icon mb-7"><BrandIcon name="scope" size={32}/></span>
            <h2 className="mb-4 text-2xl font-bold">Misión</h2>
            <p className="dc-section-copy">Facilitar conexiones entre emprendedores e inversionistas con información accesible, procesos comprensibles y herramientas digitales.</p>
          </div>
          <div className="dc-panel p-8 sm:p-10">
            <span className="dc-editorial-icon mb-7"><BrandIcon name="compass" size={32}/></span>
            <h2 className="mb-4 text-2xl font-bold">Visión</h2>
            <p className="dc-section-copy">Contribuir al crecimiento del ecosistema emprendedor mediante una plataforma cada vez más confiable y útil para ambas partes.</p>
          </div>
        </div>
      </section>

      <section className="dc-endcap">
        <div className="dc-container dc-endcap-inner">
          <div><p className="dc-eyebrow mb-5">Conecta con el ecosistema</p><h2 className="dc-section-title">El futuro de DealCapital también se construye con nuevas ideas.</h2></div>
          <Link href="/contacto" className="dc-btn dc-btn-primary">Hablemos <BrandIcon name="arrow" size={18}/></Link>
        </div>
      </section>
    </main>
  );
}