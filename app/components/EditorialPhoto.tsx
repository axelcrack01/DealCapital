import Image from "next/image";

/**
 * Unsplash editorial photos (free-license images, illustrative only).
 * The people pictured are not identified as DealCapital clients or staff.
 * See docs/EDITORIAL_IMAGES.md for source IDs and replacement guidance.
 */
const catalog = {
  collaboration: {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
    alt: "Equipo de profesionales colaborando alrededor de una mesa de trabajo",
    photographer: "Annie Spratt",
  },
  entrepreneur: {
    src: "https://images.unsplash.com/photo-1497366216548-37526070297c",
    alt: "Espacio de trabajo contemporáneo preparado para desarrollar proyectos",
    photographer: "Unsplash",
  },
  analysis: {
    src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f",
    alt: "Documentación y calculadora dispuestas para revisar información financiera",
    photographer: "Unsplash",
  },
  workshop: {
    src: "https://images.unsplash.com/photo-1556761175-b413da4baf72",
    alt: "Personas colaborando durante una reunión de trabajo",
    photographer: "Unsplash",
  },
  notebook: {
    src: "https://images.unsplash.com/photo-1455390582262-044cdead277a",
    alt: "Cuaderno abierto utilizado para planificar y documentar ideas",
    photographer: "Unsplash",
  },
} as const;

export type EditorialPhotoName = keyof typeof catalog;

type Props = {
  name: EditorialPhotoName;
  priority?: boolean;
  sizes?: string;
  className?: string;
  showCaption?: boolean;
};

export default function EditorialPhoto({
  name, priority = false, sizes = "(max-width: 768px) 100vw, 50vw",
  className = "", showCaption = true,
}: Props) {
  const photo = catalog[name];
  return (
    <figure className={`dc-editorial-photo ${className}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        quality={75}
      />
      <div className="dc-photo-vignette" aria-hidden="true" />
      {showCaption && (
        <figcaption className="dc-photo-caption">
          Fotografía ilustrativa · Unsplash
        </figcaption>
      )}
    </figure>
  );
}
