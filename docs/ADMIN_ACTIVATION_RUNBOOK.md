# DealCapital · Activación de administración confiable

**Estado 2026-11-02:** migración 20261102203429 ya aplicada a Supabase de producción. La rama de aplicación está en Preview; no publicar en main hasta provisionar y probar una cuenta administrativa verificada.

## Lo que está instalado
- Función \`public.dc_admin_review_project(bigint,boolean,text)\`: permite publicar o retirar un proyecto; exige justificación de 20 a 1000 caracteres.
- Comprueba la autenticación mediante \`auth.uid()\` y consulta el rol más reciente en \`auth.users.raw_app_meta_data.role\` dentro de una función de privilegios acotados. No confía en \`profiles.rol\`.
- Bloquea la fila de proyecto durante la revisión y rechaza decisiones redundantes; cambios y auditoría se guardan en la misma transacción.
- \`dealcapital_private.project_review_audit\`: guarda actor, proyecto, fecha, motivo y estado anterior/nuevo. Schema privado, sin permisos directos de usuarios web ni acceso público.
- \`public.dc_admin_review_history(integer)\`: solo administradores confiables pueden consultar los últimos eventos (máximo 100).
- \`anon\` no puede ejecutar las funciones y los usuarios normales reciben \`42501\`.
- No habilita verificación de identidad ni crediticia. Una publicación revisada no es un proyecto verificado financieramente.

## Requisito de activación: identidad administrativa
- **Cero** cuentas tenían \`auth.users.app_metadata.role=admin\` durante la revisión de 2026-11-02.
- El campo heredado \`profiles.rol\` no sirve para identificar de forma confiable a un administrador; anteriormente era autoeditable.
- Antes de conceder privilegios, la persona titular del negocio debe identificar explícitamente el correo de la cuenta y validar su titularidad. No promover automáticamente a nadie.
- Un operador autorizado configura \`app_metadata.role='admin'\` mediante Supabase Auth Admin API \`updateUserById\` usando credenciales de backend seguras. No exponer la clave \`service_role\` ni crear un endpoint público de promoción.
- Renovar el token de sesión, cerrar/abrir sesión y comprobar que \`getUser()\` devuelve \`app_metadata.role='admin'\`.
- Probar consulta de proyectos y perfiles; revisar registro y retirada de publicación desde una cuenta de QA autorizada.

## Pruebas realizadas sin persistencia
- No-admin: RPC denegada.
- Admin simulado solo durante transacción reversible: publicación y evento de auditoría coherentes; \`ROLLBACK\` realizado.
- Datos reales sin alteraciones por QA. Sin administración concedida.
- Queda pendiente E2E browser real para 3 roles (invitado, usuario, administrador).

## Auditoría de Supabase
Los asesores pueden advertir que las RPC \`SECURITY DEFINER\` son invocables por \`authenticated\`. Es intencional para permitir que un administrador con JWT actúe desde la aplicación; la función ejecuta una comprobación de rol en \`auth.users\` y deniega a otros usuarios. Revisar periódicamente este control y evitar introducir parámetros SQL dinámicos o variantes sin validación.

## Despliegue
1. Provisionar solo la cuenta administrativa validada.
2. Realizar QA en Preview con esa cuenta.
3. Fusionar la rama de administración en main.
4. Verificar Vercel READY, navegación, lectura RLS, aprobación, auditoría y revocación.
5. Confirmar que los dos proyectos históricamente marcados para publicación, con \`estado='pendiente'\`, son revisados manualmente; no inferir su legitimidad.
