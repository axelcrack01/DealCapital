# DealCapital — Auditoría y endurecimiento de Supabase (2026-11-02)

## Entorno
- Proyecto Supabase: knsqqhucibferrvwjakv (PostgreSQL 17).
- Objetivo: conservar los registros, bloquear escalada de privilegios y limitar la exposición de proyectos no publicados.
- Migraciones aplicadas directamente a producción y archivadas con versiones reales:
  - `20261102202128_dealcapital_security_phase1_self_verification_rls.sql`
  - `20261102202502_dealcapital_security_phase2_interest_conversations.sql`
- **No se eliminaron ni reiniciaron datos.**

## Hallazgos previos
- RLS activa en diez tablas public.
- `profiles`: el propietario podía cambiar `rol`, `perfil_verificado`, `empresa_verificada`.
- `proyectos`: el propietario podía cambiar `proyecto_verificado`, `estado`, valores de recaudación. Política pública `USING(true)` revelaba también borradores.
- `interesados` y `conversaciones`: los INSERT permitían presentar identidades de otras personas bajo ciertas condiciones.
- `anon` y `authenticated` contaban con permisos SQL `TRUNCATE`, `TRIGGER`, `REFERENCES` otorgados.
- No existían cuentas con `auth.users.app_metadata.role=admin`. Un perfil tenía `profiles.rol='admin'` pero ese atributo era editable antes de la corrección; no se usó para promover privilegios.
- Había diez proyectos; dos con `proyecto_verificado=true`, pero ambos con `estado='pendiente'`. Se requiere revisar esos registros; **no asumir validación oficial**.

## Cambios desplegados en la base
1. Triggers `dc_guard_profile_authority` y `dc_guard_project_authority`. En inserciones normales, impiden creación de registros privilegiados; en updates rechazan cambios de autoridad o verificación para roles web. Escrituras confiables del backend siguen siendo posibles.
2. Política pública: solo proyectos marcados para publicación. El dueño conserva lectura de sus borradores. Lectura global solo por JWT `app_metadata.role='admin'` que se provisionará por un administrador autorizado del servicio Auth.
3. Política adicional de lectura de perfiles/interesados para futuros administradores confiables, sin modificar reglas de propietario.
4. Se revocaron `TRUNCATE`, `TRIGGER` y `REFERENCES` para `anon` y `authenticated` sobre tablas `public`.
5. Inserciones de interesados y conversaciones deben estar asociadas al usuario autenticado, proyecto publicado y emprendedor propietario real; no se modifican registros antiguos.

## Verificación realizada (transacciones revertidas)
- Sesión `anon`: solo dos proyectos marcados para publicación; cero pendientes expuestos.
- Sesión `authenticated` sin identidad: dos proyectos marcados para publicación.
- Edición ordinaria de perfil del propietario: permitida.
- Reasignación de rol, marca de perfil o de proyecto por propietario: rechazada.
- `UPSERT` de perfil existente con marcas inalteradas: permitido.
- Registro legítimo de interés y conversación: permitido.
- Suplantación en INSERT de interés y conversación: rechazada.
- Pruebas DML con `ROLLBACK`; no persistieron datos de prueba.

## Límites y próximos pasos prioritarios
1. **Administrador:** provisionar una cuenta verificada mediante `auth.admin.updateUserById` o equivalente administrativo, asignándole `app_metadata.role='admin'`; hacerlo solo después de confirmar la identidad de la cuenta. Adaptar el frontend `/admin` para utilizar este claim confiable en vez de `profiles.rol`. Mientras tanto, el panel puede mostrar datos parciales.
2. **Flujo de aprobación:** añadir API administrativa autenticada en servidor, auditoría, comprobación de privilegios y edición exclusivamente de los campos autorizados. No incluir `service_role` en frontend.
3. **Histórico de verificaciones:** revisar manualmente los proyectos y perfiles previamente marcados; la migración no valida retrospectivamente esas marcas.
4. **Columnas privadas:** actualmente las fichas de proyectos aprobados podrían exponer más datos de los necesarios mediante `SELECT *`; definir una vista pública minimizada y actualizar los consumidores antes de restringir la tabla base.
5. **Notificaciones y storage:** revisar reglas de INSERT, políticas de buckets y abuso/impersonación; proteger documentos privados y futura evidencia KYC con buckets no públicos.
6. **Supabase Auth:** el asesor de seguridad informó protección de contraseñas filtradas desactivada; habilitar desde el panel Auth antes de ampliar el onboarding. Guía: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
7. `public.inversionistas` y `public.leads` tienen RLS activa sin políticas, actualmente inaccesibles a los roles web. No abrir acceso sin definir uso y privacidad.
8. Añadir tests automatizados de autorización (visitante, propietario, inversionista, admin confiable). No hay comprobación E2E con sesión real de usuario.
