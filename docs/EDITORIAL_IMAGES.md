# Dirección fotográfica de DealCapital

Objetivo: humanizar las landing pages sin inventar tracción, clientes, alianzas ni proyectos reales.

## Fotografías incorporadas (Unsplash)
Todas son **fotografías ilustrativas**, NO son fotografías de clientes, emprendedores verificados, inversionistas ni trabajadores de DealCapital. El componente `EditorialPhoto` muestra esa naturaleza ilustrativa como pie de foto.

| Uso | Unsplash photo ID | Descripción |
| --- | --- | --- |
| Inicio / hero | `1522071820081-009f0129c71c` | Equipo trabajando en conjunto (Annie Spratt) |
| Inicio / historia | `1556761175-b413da4baf72` | Reunión de colaboración |
| Inicio / análisis; Inversionistas | `1554224155-6726b3ff858f` | Documentos y calculadora para análisis |
| Emprendedores | `1497366216548-37526070297c` | Espacio de trabajo |
| Contacto | `1455390582262-044cdead277a` | Cuaderno y planificación |

CDN: `https://images.unsplash.com/photo-<ID>`.
Referencia legal: https://unsplash.com/license y https://unsplash.com/terms.
La licencia general de Unsplash permite uso comercial, pero **no otorga automáticamente permisos de imagen personal, marcas ni productos visibles**. Revisar cualquier imagen con sujetos reconocibles antes del lanzamiento comercial; reemplazarla por material propio con autorización si corresponde.

## Reglas de integración
- Restringir dominio en `next.config.ts`, usar `next/image` con WebP/AVIF, `sizes` responsivos, `priority` solo en imágenes relevantes y `loading=lazy` por defecto en las restantes.
- No insertar imágenes de stock como fotos de proyectos, inversores o éxitos reales.
- En proyectos, mostrar únicamente la imagen proporcionada y autorizada por su responsable, con revisión de seguridad.
- Evitar múltiples imágenes iguales en la misma vista, carruseles automáticos, parallax invasivo y filtros amarillos excesivos.
- Reemplazar gradualmente estas fotografías por sesiones reales de producto/usuarios con autorización, sin sugerir alianzas con SBS o RENIEC.
- QA: verificar carga y encuadre a 375px, 768px, 1280px y 1440px, contraste de captions, LCP y CLS.
