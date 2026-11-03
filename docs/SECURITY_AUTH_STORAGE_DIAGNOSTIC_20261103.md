# DealCapital — Admin v5.1: comprobación de Storage y registro seguro

**Fecha:** 3 de noviembre de 2026.

## Objetivo
Verificar conectividad y configuración de los buckets privados con una sesión real del administrador, sin utilizar datos personales ni eliminar objetos en producción. Mejorar el formulario de registro sin presentar como activa una función de Supabase que requiere otro plan.

## Supabase Auth: resultado de inspección
- Supabase organization: DealCapital, plan **Free** (comprobado por la administración del proyecto).
- Supabase Security Advisor: `auth_leaked_password_protection`, estado **WARN: disabled**.
- La documentación oficial de Supabase indica que la protección nativa de contraseñas filtradas mediante HaveIBeenPwned está disponible en **Pro y superior**.
- No se modificó el plan ni se habilitó esta función. No se han solicitado credenciales ni claves.
- `/registro` ahora exige contraseña de mínimo 12 caracteres y un segundo campo de confirmación. Es una **validación del frontend**, no una nueva política de Supabase Auth. La aplicación sigue aceptando contraseñas existentes en `/login`.
- Recomendación cuando se disponga de la función: abrir **Authentication > Providers > Email** en el panel de Supabase y habilitar el control nativo de contraseñas filtradas; configurar la longitud mínima en **Auth**, no solo en el formulario. Volver a ejecutar Security Advisor.

## Edge Function v3
- Función: `dc-retire-private-documents`, `verify_jwt=true`.
- Nuevo cuerpo de solicitud `{ "mode": "diagnostic" }`.
- Verifica JWT de sesión mediante `supabase.auth.getUser(jwt)`.
- Comprueba en Supabase Auth Admin API que el usuario tenga `app_metadata.role='admin'` vigente.
- Verifica mediante la API de Storage que **Documentos** y **pitch-decks** existan, sean privados, permitan únicamente `application/pdf` y sean accesibles para las operaciones administrativas de listado.
- Responde únicamente con estado y nombre de bucket; no retorna objetos, nombres de archivo, tokens o claves de servicio.
- **No llama** a `dc_service_begin_file_retirement`, `dc_service_finish_file_retirement` ni `storage.remove` en el modo diagnóstico.
- `mode` omitido o `mode="retire"` conserva el comportamiento de retirada de archivos ya implementado, exige un `project_id` positivo y depende del plazo, bloqueo, integridad de referencias y ausencia de operaciones asociadas.

## Verificación manual del administrador
1. Abrir `https://deal-capital.vercel.app/login`, iniciar sesión con la cuenta administrativa y dirigirse a `/admin`.
2. En la sección **Diagnóstico de documentos privados**, hacer clic en **Ejecutar prueba segura**.
3. Comprobar que la respuesta indica autorización válida, ambos buckets privados, MIME PDF exclusivo y acceso de servicio correcto.
4. Cerrar sesión e intentar ingresar como cuenta ordinaria. El panel no debe mostrar el diagnóstico ni permitir solicitudes administrativas.
5. Esta prueba **no elimina ni sube ningún archivo**. Un resultado `ready` demuestra autorización y conectividad básica, no eliminación física completa.

## Prueba de eliminación física aún pendiente
Para certificar la ruta de archivo real: crear primero un entorno de QA aislado, usuario de pruebas, propuesta de pruebas y archivo PDF sintético sin datos personales; ensayar el cumplimiento de la retención, el bloqueo, el retiro mediante API de Storage y la evidencia de auditoría. **No adelantar vencimientos de propuestas reales en producción** para probar el flujo.

## Límites
- No se considera superada la prueba E2E autenticada hasta ejecutarla y observar su respuesta.
- No se considera habilitada la protección de contraseñas filtradas mientras Supabase Auth mantenga el aviso correspondiente.
- La validación del cliente puede omitirse con peticiones directas al proveedor; solo las políticas de Supabase Auth son obligatorias para todos los canales.
- Un `READY` de Vercel y códigos HTTP 200 en rutas públicas comprueban despliegue, no flujos autenticados.
- Documentos y pitch-decks estaban vacíos en el último inventario; los cuatro objetos de avatars no se modificaron.

## Fuentes de documentación
- https://supabase.com/docs/guides/auth/password-security
- https://supabase.com/docs/guides/functions/auth-headers
- https://supabase.com/docs/guides/storage/management/delete-objects
