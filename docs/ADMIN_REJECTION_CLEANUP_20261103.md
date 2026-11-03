# DealCapital — Rechazo de propuestas y eliminación programada

**Fecha:** 2026-11-03. **Versión:** Admin v4 — propuestas duplicadas y rechazos.

## Diagnóstico confirmado (producción)

El título "Inversiones en Restaurante Baradero 21" aparece 7 veces con el mismo propietario y monto, IDs `11, 12, 13, 14, 15, 16, 17`. El `11` figura publicado, los `12–17` pendientes. El proyecto `17` tiene **dos compromisos**, por lo que no debe purgarse automáticamente. Los `12–16` no tienen interesados, conversaciones, compromisos ni favoritos en el análisis inicial.

**Ningún registro de los diez proyectos fue rechazado o borrado durante la implementación.** El administrador debe revisar y rechazar cada propuesta conscientemente. La similitud del nombre no basta para tomar una decisión irreversible.

## Rechazo administrativo

- Solo cuentas con rol actual `auth.users.raw_app_meta_data.role='admin'` pueden usar `dc_admin_reject_project`.
- Rechazo de proyectos en estado `pendiente` sin marca de publicación; los publicados deben retirarse primero.
- Motivos: duplicado, información incompleta, datos inconsistentes, incumplimiento y otro.
- Explicación de 20–1000 caracteres, editable y documentada por el revisor.
- Se actualiza `estado='rechazado'`, se genera un evento privado y una notificación al propietario con motivo y fecha prevista.
- El nuevo rechazo se conserva en `dealcapital_private.project_rejections`, independiente de la fila del proyecto.
- El titular ve el motivo en Dashboard mediante `dc_my_rejected_projects`.
- El administrador ve fechas, impedimentos para purgar y puede anular el rechazo con justificación mediante `dc_admin_restore_rejected_project`.
- `dc_admin_review_project` no puede re-publicar directamente un expediente rechazado sin restaurarlo.

## Eliminación programada: 7 días

- Supabase Cron tiene el trabajo **`dealcapital-rejected-proposal-purge-hourly`** con schedule `0 * * * *` y usuario `postgres`.
- La primera oportunidad de limpieza es **7 días después del rechazo**, durante la siguiente ejecución horaria (si la cola no está bloqueada).
- `dealcapital_private.dc_purge_rejected_projects(25)` elimina solo la fila de propuesta rechazada y solo si no hay:
  - interesados, conversaciones, compromisos, favoritos;
  - auditoría histórica de publicación;
  - referencias a documentos PDF, imágenes, logos u otros archivos.
- Si existen relaciones o archivos, **no se elimina la propuesta**, ni se borra la actividad por cascada. Queda en la cola como retenida hasta que se resuelvan legal y operativamente las dependencias.
- La auditoría privada del rechazo permanece tras eliminar la propuesta; definir política futura para la retención y eventual anonimización de datos personales de auditoría.
- Las marcas previas de publicación no pueden confundirse con verificación financiera o crediticia.

## Prevención de duplicados

- El formulario deshabilita el botón durante el envío y después de una inserción exitosa.
- Trigger `dc_block_rapid_duplicate_projects`: bajo `authenticated`, rechaza nuevos envíos con **mismo propietario, título normalizado y monto** dentro de la última hora, incluyendo solicitudes concurrentes mediante lock transaccional.
- Los duplicados históricos **no se alteran** con el trigger.
- Admin v4 señala candidatos con nombre, propietario y monto coincidentes, vinculados visualmente al expediente de referencia, sin eliminar automáticamente nada.

## Migraciones aplicadas

- `20261103180530_dealcapital_proposal_rejections_safe_purge_and_duplicates_20261103.sql`.
- `20261103180557_dealcapital_rejected_proposal_purge_hourly_cron_20261103.sql`.

## Pruebas reproducibles con ROLLBACK

1. Simulación administrador: rechazo de proyecto #12, registro de notificación, vencimiento temporal de la fecha y purga de contenido. El registro de auditoría sobrevivió a la purga. Todo revertido.
2. Simulación de rechazo de #17 con compromisos: no fue eliminado al vencer su fecha. Todo revertido.
3. Simulación de dos publicaciones idénticas: la segunda fue rechazada con error de duplicado; sin filas de prueba persistidas.
4. Simulación de anulación de rechazo #13: regreso a pendiente y marca de cancelación en auditoría; impedimento de republicación directa. Todo revertido.
5. Cuenta sin rol administrativo: rechazo bloqueado.
6. Trabajador Supabase Cron: trabajo configurado activo y ejecutado como `postgres`. Pendiente observar la primera ejecución real en `cron.job_run_details`.

## Puntos pendientes

- Prueba funcional de navegador con sesiones reales, correos y archivos. El test de integración SQL no reemplaza E2E.
- Ningún correo electrónico externo se envía con este flujo: la notificación automática es **interna de DealCapital**.
- El historial de rechazo contiene justificaciones y un identificador de titular; fijar plazo de conservación/anonimización con política de protección de datos adecuada.
- Identificar por separado si los compromisos del proyecto #17 son reales y qué decisión corresponde, antes de cualquier purga.
- La capacidad de borrar PDFs alojados en Storage exige un flujo aparte de eliminación con autorización y registro de evidencia; por seguridad, los proyectos con referencias a archivos quedan retenidos.
