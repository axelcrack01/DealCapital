import Link from "next/link";
import BrandIcon from "../components/BrandIcon";
import EditorialPhoto from "../components/EditorialPhoto";

export const metadata = {
  title: "Contacto",
  description: "Contacta con DealCapital y encuentra respuestas a preguntas frecuentes sobre el uso de la plataforma.",
};

const faq = [
  {q:"¿DealCapital presta dinero directamente?",a:"No. Actualmente es una plataforma de conexión entre emprendedores e inversionistas, no un banco ni una entidad que otorgue préstamos."},
  {q:"¿La plataforma recibe pagos o transferencias?",a:"No. El MVP no recibe, custodia ni ejecuta transferencias de dinero vinculadas a inversiones."},
  {q:"¿Cómo puedo presentar mi proyecto?",a:"Regístrate como emprendedor y utiliza la sección Publicar proyecto. Tu propuesta puede quedar pendiente de revisión antes de ser visible."},
  {q:"¿Las personas y proyectos están verificados con RENIEC o SBS?",a:"No todavía. Las integraciones oficiales no están habilitadas. Una publicación revisada no significa que la identidad o el riesgo crediticio estén certificados."},
  {q:"¿Cómo puedo conocer un proyecto?",a:"Explora el catálogo de oportunidades, consulta los datos publicados y utiliza la función de interés para iniciar una conversación."},
];

export default function Contacto() {
  return (
    <main className="dc-landing">
      <section className="dc-page-head">
        <div className="dc-container dc-page-head-grid">
          <div>
            <p className="dc-kicker">Contacto / DealCapital</p>
            <h1>Las buenas conversaciones <em>empiezan aquí.</em></h1>
            <p className="mt-6">¿Tienes una consulta, una propuesta o quieres conocer
              más sobre el ecosistema? Cuéntanos en qué podemos ayudarte.</p>
          </div>
          <aside className="dc-insight-rail">
            <span>Antes de escribir</span>
            <strong>Consulta primero nuestras respuestas frecuentes.</strong>
            <p className="text-sm leading-7 text-[#cbd5e1]">Si tu pregunta es sobre una inversión específica, revisa la información y los riesgos del proyecto correspondiente.</p>
          </aside>
        </div>
      </section>

      <section className="dc-container dc-landing-section">
        <div className="dc-contact-grid">
          <div>
            <div className="mb-7">
              <p className="dc-eyebrow mb-5">Escríbenos</p>
              <h2 className="dc-section-title">Cuéntanos tu consulta.</h2>
              <p className="dc-section-copy mt-4">Completa los campos y envíanos tu mensaje. No compartas DNI, contraseñas, reportes financieros ni documentos sensibles por este medio.</p>
            </div>
            <form action="https://formspree.io/f/xzdqypwn" method="POST" className="dc-contact-card space-y-5">
              <label className="dc-form-field">
                <span>Nombre</span>
                <input className="dc-input" type="text" name="nombre" autoComplete="name" required maxLength={120} placeholder="Tu nombre"/>
              </label>
              <label className="dc-form-field">
                <span>Correo electrónico</span>
                <input className="dc-input" type="email" name="email" autoComplete="email" required maxLength={180} placeholder="nombre@correo.com"/>
              </label>
              <label className="dc-form-field">
                <span>Motivo de tu mensaje</span>
                <select className="dc-input" name="tipo" required defaultValue="">
                  <option value="" disabled>Selecciona el motivo</option>
                  <option value="Emprendedor">Soy emprendedor</option>
                  <option value="Inversionista">Soy inversionista</option>
                  <option value="Colaboración">Propuesta de colaboración</option>
                  <option value="Otro">Consulta general</option>
                </select>
              </label>
              <label className="dc-form-field">
                <span>Mensaje</span>
                <textarea className="dc-input min-h-[150px] resize-y" name="mensaje" rows={6} minLength={10} maxLength={3000} placeholder="Cuéntanos cómo podemos ayudarte..." required/>
              </label>
              <p className="text-xs leading-6 text-[#9cacc3]">
                Al enviar, los datos del formulario se procesarán a través de Formspree,
                un proveedor externo utilizado para recibir consultas. No envíes información confidencial.
              </p>
              <button type="submit" className="dc-btn dc-btn-primary w-full sm:w-auto">
                Enviar consulta <BrandIcon name="arrow" size={18}/>
              </button>
            </form>
          </div>
          <aside className="space-y-5">
            <EditorialPhoto name="notebook" className="dc-contact-photo" sizes="(max-width: 740px) 92vw, 35vw" />
            <div className="dc-contact-card">
              <span className="dc-editorial-icon mb-6"><BrandIcon name="message" size={32}/></span>
              <h3 className="mb-3 text-xl font-bold">Mantengamos el contacto.</h3>
              <p className="dc-section-copy">También puedes seguir el desarrollo de DealCapital y las novedades del ecosistema en LinkedIn.</p>
              <a href="https://www.linkedin.com/company/dealcapital/" target="_blank" rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#facc15] hover:underline">
                DealCapital en LinkedIn <BrandIcon name="arrow" size={17}/>
              </a>
            </div>
            <div className="dc-contact-card">
              <span className="dc-editorial-icon mb-5"><BrandIcon name="shield" size={32}/></span>
              <h3 className="mb-3 text-xl font-bold">Seguridad y verificación</h3>
              <p className="dc-section-copy">Consulta el estado actual de nuestros procesos de identidad y las funcionalidades que siguen en desarrollo.</p>
              <Link href="/verificacion" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#facc15] hover:underline">
                Conocer el proceso <BrandIcon name="arrow" size={17}/>
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-[#304056] bg-[#061226] py-16 sm:py-20">
        <div className="dc-container grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
          <div><p className="dc-eyebrow mb-5">Respuestas claras</p><h2 className="dc-section-title">Preguntas frecuentes.</h2></div>
          <div className="dc-faq">
            {faq.map(({q,a})=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div>
      </section>
    </main>
  );
}