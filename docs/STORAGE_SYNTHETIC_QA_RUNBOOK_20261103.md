# DealCapital — QA física de archivos PDF sintéticos

**Fecha:** 3 de noviembre de 2026. **Alcance:** comprobación de Supabase Storage con un PDF artificial, sin utilizar documentos de clientes ni proyectos comerciales.

## Qué se implementó
- Bucket privado `dealcapital-qa`, con `public=false`, límite de 64 KiB y MIME exclusivo `application/pdf`.
- Ningún usuario anónimo o autenticado normal tiene permiso de escritura o lectura directa sobre este bucket; el acceso queda reservado al servicio de QA.
- Edge Function `dc-storage-synthetic-qa`, desplegada con `verify_jwt=true`.
- Endpoint que solo acepta **POST** con cuerpo `{"action":"run"}` y JWT auténtico. Verifica el rol administrativo vigente directamente mediante Supabase Auth Admin API, no mediante campos de perfil editables.
- La función genera internamente un PDF pequeño y válido sin datos personales, elige una ruta aleatoria `synthetic/qa-<UUID>.pdf`, lo sube al bucket de QA, lo descarga y comprueba que cada byte coincida. Después lo elimina mediante la API oficial de Supabase Storage y verifica que el objeto desapareció del listado.
- La ruta del PDF se genera en el servidor y **no puede ser suministrada por el navegador**. No se permite pasar IDs de proyectos ni usar buckets de producción documental.
- Se ejecuta una limpieza en la cláusula `finally` incluso ante fallos de subida o descarga. Si falla Storage o la función se interrumpe abruptamente, puede quedar un objeto sintético; en ese caso hay que revisar únicamente el bucket de QA, nunca borrar otras ubicaciones automáticamente.
- Se guarda un registro en `dealcapital_private.storage_qa_runs` con administrador, momento, fases y código de error. No almacena contenido, nombres de archivo, JWT ni credenciales.
- Dos RPC internas (`dc_service_begin_storage_qa` y `dc_service_finish_storage_qa`) solo son ejecutables por `service_role`. La API read-only `dc_admin_storage_qa_history` es accesible únicamente al administrador confiable.
- Límite de una ejecución por minuto y bloqueo de concurrencia por usuario administrativo.

## Pruebas realizadas
1. Migración `20261103215543_dealcapital_synthetic_storage_qa_and_audit_20261103` ejecutada; `BEGIN/ROLLBACK` de la estructura completado primero.
2. Prueba transaccional de inicio de ejecución, bloqueo de segunda ejecución y finalización de registro: correcta y revertida.
3. Cuenta normal intentando leer historial: denegada. Cuenta administrativa simulada en SQL: lectura permitida, sin ejecuciones previas.
4. La función Edge está desplegada y activa, JWT obligatorio.
5. El bucket de QA está vacío en el momento de las verificaciones y no se tocaron archivos de `Documentos`, `pitch-decks` ni `avatars`.
6. La interfaz de Admin se valida mediante Vercel Preview y rutas HTTP.

## Prueba pendiente de usuario
1. Inicia sesión con la única cuenta administradora de DealCapital.
2. Abre `https://deal-capital.vercel.app/admin`.
3. En **QA operacional → Prueba física de PDF sintético**, confirma el alcance limitado de la operación.
4. Pulsa **Probar subida, lectura y eliminación**.
5. Comprueba que aparezcan `Subida: Verificada`, `Lectura íntegra: Verificada` y `Eliminación: Verificada`; el historial debe registrar estado `passed`.
6. Si aparece `failed`, `inconclusive` o falla el borrado, **no repitas inmediatamente**; revisa el historial y el bucket privado de QA para evitar residuos de prueba.

La prueba no es automática, no solicita un PDF al usuario y **no se ha ejecutado en el turno** porque no se dispone del JWT privado de una sesión administrativa real. No crear sesiones ni credenciales administrativas artificiales en producción.

## Qué demuestra y qué no demuestra
- **Demuestra, cuando se ejecute correctamente:** funcionamiento del upload, la descarga íntegra, la eliminación del archivo sintético mediante API de Storage y la auditoría, con autorización administrativa.
- **No demuestra:** retención legal, eliminación de expedientes, retirada física de archivos comerciales, borrado de backups, revocación inmediata de JWT o todas las reglas de acceso por propietario. Esos flujos requieren pruebas independientes en entorno QA aislado de proyectos reales.
- Los límites de Supabase Free respecto a protección de contraseñas filtradas siguen vigentes; esta prueba no los modifica.

## Referencias
- https://supabase.com/docs/guides/storage/buckets/creating-buckets
- https://supabase.com/docs/reference/javascript/file-buckets-upload
- https://supabase.com/docs/reference/javascript/file-buckets-remove
- https://supabase.com/docs/guides/functions/auth-headers
