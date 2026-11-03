# DealCapital — Política operativa de conservación documental v0.1

**Fecha:** 3 de noviembre de 2026. **Estado:** controles técnicos implementados; política jurídica de conservación y anonimización pendiente de aprobación por el responsable legal/privacidad.

## Objetivo

Reducir archivos y propuestas rechazadas sin destruir evidencia de negociaciones, justificaciones administrativas, compromisos, intereses ni datos sujetos a conservación.

## Matriz de ciclo de vida

| Clase | Inicio del plazo | Acción prevista | Condición de bloqueo |
| --- | --- | --- | --- |
| Propuesta pendiente | Presentación | Mantener hasta decisión | No se purga sin decisión administrativa |
| Propuesta publicada | Publicación | Mantener mientras esté activa | Requiere retiro previo para rechazo |
| Propuesta rechazada sin vínculos ni archivos | Rechazo | Desde día 7, purga de la fila por Cron cada hora | Conservación activa o dependencias |
| Propuesta rechazada con compromisos/intereses/conversaciones/favoritos o auditorías previas | Rechazo | Retener hasta resolver las dependencias | Ninguna eliminación en cascada automática |
| PDF privado de una propuesta rechazada | Rechazo | Tras día 7, retiro MANUAL por administrador con Storage API | Actividad vinculada, conservación, archivo ajeno/compartido o formato no reconocido |
| Imágenes, logos, URLs externas y documentos heredados | Rechazo | Retención y revisión individual | No se retiran con la función de PDFs privados |
| Registro de rechazo, revisión y custodia | Fecha del evento | Conservar en esquema privado hasta aprobar plazo legal | No hay eliminación ni anonimización automáticas del historial |
| Documentación KYC de RENIEC/SBS | No aplica | Todavía no debe recopilarse | Falta proveedor autorizado, base legal y política específica |

**Importante:** siete días es una regla operativa para contenidos descartados, **no una afirmación de cumplimiento legal**. Antes de establecer una fecha de eliminación de evidencias o datos personales de auditoría, validar la finalidad, bases legales, obligaciones regulatorias, periodos de prescripción y conservación, tratamiento de copias de seguridad y derechos de titulares.

## Controles aplicados a Supabase

1. `dealcapital_private.project_rejections.retention_hold`: bloqueo de conservación que puede establecer y levantar **solo** una cuenta administrativa confiable, con motivo de 20–1000 caracteres.
2. `public.dc_admin_set_retention_hold`: valida la función del administrador usando `auth.users.raw_app_meta_data.role`; bloquea y actualiza el expediente; escribe un evento privado.
3. `dealcapital_private.retention_events`: registra `hold_applied`, `hold_released`, `private_files_retired` y `content_purged`. Sin acceso SQL directo desde roles web.
4. `public.dc_admin_retention_events`: lectura limitada del historial al administrador.
5. `public.dc_my_retention_holds`: comunica al titular únicamente si su eliminación está suspendida, sin revelar notas internas.
6. `dealcapital_private.dc_purge_rejected_projects`: comprueba bloqueos, plazo, dependencias y referencias; al purgar registra un evento. La tarea de Supabase Cron se mantiene en `0 * * * *` como `postgres`.
7. `public.dc_guard_project_authority`: un usuario web no puede reescribir un expediente rechazado para quitar referencias y eludir la purga segura.
8. `public.dc_admin_restore_rejected_project`: exige levantar el bloqueo antes de restaurar.

## Retirada controlada de PDFs privados

**Función de servidor desplegada:** `dc-retire-private-documents`, `verify_jwt=true`.

Flujo:
1. El administrador espera a que venza el plazo de siete días y confirma explícitamente la retirada irreversible.
2. La Edge Function verifica el JWT mediante Supabase Auth y lee la asignación administrativa actual desde Auth Admin API.
3. La RPC restringida a `service_role` `dc_service_begin_file_retirement` comprueba estado, bloqueo, plazo, titularidad, referencias no compartidas, ausencias de vínculos empresariales y las dos ubicaciones privadas permitidas: `Documentos` y `pitch-decks`.
4. La función ejecuta `storage.from(bucket).remove([path])` en el servidor; ninguna clave privilegiada llega al navegador. La función no elimina objetos públicos ni URLs externas.
5. `dc_service_finish_file_retirement` confirma que Storage ya no conserva los objetos, que el proyecto y los bloqueos no han cambiado y que la referencia coincide antes de limpiar columnas. Registra evento de custodia y deja que Cron purgue el expediente si cumple las demás condiciones.
6. Si falla la eliminación o cambia el estado, se conservan las referencias para revisión/reintento; tras un trabajo incompleto, volver a evaluar el expediente. El proceso no garantiza una transacción atómica entre la API de archivos y PostgreSQL.

La eliminación de archivos en Storage es permanente a nivel de API, pero las **copias de seguridad** del proveedor pueden seguir ciclos de conservación independientes. Debe verificarse ese alcance antes de prometer eliminación completa o inmediata de todas las copias.

## Estado comprobado en producción

A las 13:37 (Perú) del 3/11/2026 existían seis rechazos de Baradero 21, IDs `12, 13, 14, 15, 16, 17`, con vencimiento el `10/11/2026` cerca de las `13:19` (Perú). El `17` tiene dos compromisos; su purga está bloqueada independientemente de cualquier conservación adicional. Los otros cinco no tenían relaciones empresariales ni referencias documentales en la consulta de auditoría. Storage contenía cuatro objetos en el bucket `avatars` y ninguno en los buckets PDF privados.

**Ningún archivo ni proyecto existente fue eliminado para probar esta versión.** Las pruebas de mutación de datos utilizaron `BEGIN ... ROLLBACK`.

## Comprobaciones de aceptación

- Activar conservación de #12 bloqueó una purga simulada con plazo vencido; liberarla permitió la purga y produjo tres eventos de auditoría, todo revertido.
- La restauración de un expediente con conservación activa fue rechazada; la edición directa de un expediente rechazado por su propietario también fue rechazada.
- Un PDF de ruta canónica ficticia no existente pasó por preparación, confirmación de ausencia en Storage, limpieza de referencia y auditoría dentro de transacción revertida.
- La función de retiro de archivos físicos está desplegada y exige JWT. **Falta prueba real con PDF de QA y sesión administrativa autenticada**, por lo que no se afirma que la retirada física esté certificada de extremo a extremo.

## Pendientes de conformidad y operación

- Aprobación legal de una política de retención, anonimización y acceso al historial; no usar plazos arbitrarios de borrado de auditoría.
- Verificación E2E de la función de Storage con un archivo de pruebas y con una cuenta real; validar errores/reintentos, revocación de permisos y concurrencia con conservación legal.
- Asegurar el ciclo de vida de archivos públicos y documentos heredados (no incluido en el retiro automático).
- Revisar compromisos del expediente #17 antes de decidir su cierre definitivo.
- Habilitar protección de contraseñas filtradas en Supabase Auth.
- Evaluar endurecimiento de RPC `SECURITY DEFINER` expuestas a `authenticated`; todas deben conservar verificaciones de titular/rol del lado servidor.

## Referencias oficiales
- https://supabase.com/docs/guides/storage/management/delete-objects
- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/cron
