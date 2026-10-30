import Link from "next/link";
import EditorialPhoto from "./EditorialPhoto";
import BrandIcon from "./BrandIcon";

/**
 * Editorial illustration: authentic photography and structured product hints.
 * No positioning overlays, fake metrics, fabricated users or endorsements.
 */
export default function HeroComposition() {
  return (
    <div className="dc-fusion-visual" aria-label="Vista editorial de la experiencia DealCapital">
      <EditorialPhoto
        name="collaboration"
        priority
        sizes="(max-width: 980px) 70vw, 28vw"
        className="dc-fusion-main-photo"
      />
      <div className="dc-fusion-aside">
        <div className="dc-fusion-info">
          <span className="dc-fusion-label">01 / DESCUBRIR</span>
          <BrandIcon name="compass" size={37} />
          <h2>Ideas con una dirección.</h2>
          <p>Conoce los proyectos, su sector y el capital que buscan.</p>
        </div>
        <Link href="/oportunidades" className="dc-fusion-inset">
          <span className="dc-fusion-label">02 / CONECTAR</span>
          <span className="dc-fusion-icon"><BrandIcon name="link" size={38}/></span>
          <strong>La siguiente conversación importa.</strong>
          <span className="dc-fusion-inset-link">
            Ver oportunidades <BrandIcon name="arrow" size={18}/>
          </span>
        </Link>
      </div>
      <div className="dc-fusion-visual-caption">
        <span>PERSONAS. PROYECTOS. POSIBILIDADES.</span>
        <span aria-hidden="true" className="dc-fusion-dots"><i/><i/><i/></span>
      </div>
    </div>
  );
}
