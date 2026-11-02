# DealCapital · Requisitos para habilitar operaciones administrativas

Estado: revisión técnica requerida. **Este documento no modifica ni migra Supabase.**

## Hallazgos verificados (2026-11-02)

- `profiles`: RLS activa. La política `Usuario ve su perfil` limita SELECT al propietario. `Usuario actualiza su perfil` permite actualizar toda la fila propia, incluidos campos sensibles `rol`, `perfil_verificado` y `empresa_verificada`. El campo `rol` no es una fuente de autoridad segura.
- `proyectos`: RLS activa; la política de actualización del dueño permite modificar la fila propia y por tanto `proyecto_verificado`.
- `interesados`: RLS activa; su SELECT está limitado al propietario del proyecto, no al administrador global.
- Ninguna cuenta de `auth.users` tiene actualmente `app_metadata.role/rol = admin` (consulta agregada de conteo, sin datos personales). No usar una migración que bloquee al administrador sin antes provisionar su rol confiable.

## Diseño objetivo (antes de habilitar aprobar/verificar)

1. Configurar un origen **confiable** del rol administrativo (`auth.users.raw_app_meta_data` escrito solo desde backend privilegiado o tabla protegida); no usar `user_metadata` ni un `profiles.rol` editable por el usuario.
2. Bloquear cambios de usuarios normales a columnas `profiles.rol`, `profiles.perfil_verificado`, `profiles.empresa_verificada`, `proyectos.proyecto_verificado` mediante permisos de columnas y/o triggers confiables. Proteger asimismo INSERT contra asignación de atributos privilegiados.
3. Crear políticas de SELECT de perfiles e interesados para administradores autenticados, con comprobación de rol confiable; mantener políticas de propietario sin ampliar su alcance.
4. Crear políticas administrativas y endpoints de aprobación específicos (no SELECT/UPDATE `*` indiscriminados), con auditoría, validaciones y confirmación explícita. Preferir rutas Next.js protegidas y permisos mínimos. Nunca exponer `service_role` al navegador.
5. Registrar para cada aprobación: actor, fecha, registro afectado, estado anterior/nuevo y criterio de revisión. Etiquetar claramente la revisión interna y distinguirla de validación oficial/KYC.
6. Probar con tres perfiles distintos: visitante, usuario estándar y administrador; probar explícitamente intentos de autoascenso y de autoverificación mediante llamadas directas a Supabase, además de la UI.
7. Revisar los asesores de seguridad de Supabase después de cualquier cambio. Activar protección frente a contraseñas filtradas en la configuración de Auth.

## Alcance de Admin v2

- UI con resumen, métricas de registros **accesibles**, filtros y registros.
- Solo lectura; no ejecuta aprobaciones ni cambios de rol.
- El control en UI comprueba `profiles.rol` únicamente para mantener el acceso de la cuenta existente durante la fase visual. **No es una frontera de seguridad** ni debe emplearse para conceder operaciones privilegiadas.
- Límite de 200 filas por consulta; implementar paginación y conteos del backend cuando exista API admin.
