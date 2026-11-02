import Link from "next/link";
import EditorialPhoto from "./EditorialPhoto";
import BrandIcon from "./BrandIcon";

/** Homepage hero from the approved DealCapital unified visual proposal. */
export default function ProposalHeroVisual() {
  return (
    <div className="dc-up-visual" aria-label="Personas creando oportunidades de negocio">
      <EditorialPhoto name="collaboration" priority
        sizes="(max-width: 740px) 90vw, (max-width: 1100px) 55vw, 32vw"
        className="dc-up-photo" />
      <article className="dc-up-float dc-up-float-dark">
        <span className="dc-up-card-index">01 / DESCUBRE</span>
        <h2>Grandes ideas merecen ser vistas.</h2>
        <p>Explora sectores, conoce propuestas y encuentra nuevas perspectivas.</p>
      </article>
      <Link href="/oportunidades" className="dc-up-float dc-up-float-gold">
        <span className="dc-up-card-index">02 / CONECTA</span>
        <strong>La próxima conversación puede cambiarlo todo.</strong>
        <span className="dc-up-card-link">Conoce el ecosistema <BrandIcon name="arrow" size={17}/></span>
      </Link>
    </div>
  );
}
