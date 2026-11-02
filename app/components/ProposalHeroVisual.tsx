import Link from "next/link";
import EditorialPhoto from "./EditorialPhoto";
import BrandIcon from "./BrandIcon";

/**
 * Responsive editorial composition.
 * The photo and information cards are separate grid children: no overlapping,
 * no clipped faces, no conflicting absolute positioning.
 */
export default function ProposalHeroVisual() {
  return (
    <div className="dc-refined-visual" aria-label="Ideas, proyectos y conexiones en DealCapital">
      <EditorialPhoto
        name="collaboration"
        priority
        sizes="(max-width: 560px) 90vw, (max-width: 900px) 66vw, 27vw"
        className="dc-refined-photo"
      />
      <div className="dc-refined-stories">
        <div className="dc-refined-story dc-refined-story-dark">
          <span className="dc-refined-label">01 / DESCUBRE</span>
          <span className="dc-refined-story-icon" aria-hidden="true">
            <BrandIcon name="compass" size={30}/>
          </span>
          <div>
            <h2>Ideas con potencial para explorar.</h2>
            <p>Conoce proyectos, sectores y objetivos antes de decidir.</p>
          </div>
        </div>
        <Link href="/oportunidades" className="dc-refined-story dc-refined-story-yellow">
          <span className="dc-refined-label">02 / CONECTA</span>
          <span className="dc-refined-story-icon" aria-hidden="true">
            <BrandIcon name="link" size={30}/>
          </span>
          <div>
            <strong>La siguiente oportunidad empieza aquí.</strong>
            <span className="dc-refined-cta">Explorar proyectos <BrandIcon name="arrow" size={18}/></span>
          </div>
        </Link>
      </div>
    </div>
  );
}
