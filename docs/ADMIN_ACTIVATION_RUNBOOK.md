# DealCapital — Activación de administración confiable

**Estado: 2 de noviembre de 2026.** La migración `20261102203429_dealcapital_trusted_admin_review_audit` se encuentra aplicada a Supabase de producción. La interfaz Admin v3 está en una rama de Vercel Preview.

## Administrador autorizado
- La cuenta del correo **axel.valladares.flores@gmail.com** fue indicada expresamente como único administrador.
- Se confirmó en Supabase Auth que existía un único registro coincidente, con correo verificado, no bloqueado y asociado a un perfil con el rol heredado `admin`.
- Se asignó `auth.users.raw_app_meta_data.role = 'admin'` con una actualización condicionada a todas las comprobaciones anteriores.
- La consulta posterior confirmó **un solo administrador confiable** y que corresponde al correo indicado.
- La actualización no afectó otras cuentas ni modificó sus perfiles.
- El frontend comprueba `auth.getUser()` y renueva JWT si su sesión todavía contiene un rol anterior. Para evitar problemas por tokens viejos se recomienda cerrar e iniciar sesión otra vez.
- Para futuras altas o revocaciones, utilizar preferentemente `auth.admin.updateUserById` desde un entorno de servidor autorizado y nunca exponer claves privilegiadas en el navegador.

## Implementación de backend
- `public.dc_admin_review_project(bigint,boolean,text)`: verifica `auth.uid()` y el rol vigente directamente en `auth.users.raw_app_meta_data.role` antes de aprobar o retirar una publicación.
- Requiere justificación de 20–1000 caracteres; bloquea la fila y registra el cambio junto con la auditoría en una única transacción.
- `dealcapital_private.project_review_audit`: esquema privado con permisos de lectura directa revocados a roles web.
- `public.dc_admin_review_history(integer)`: devuelve hasta 100 eventos únicamente a administradores confiables.
- Ninguna función permite verificación de identidad, empresa, solvencia o historial SBS/RENIEC.

## Pruebas verificadas
- Usuario normal: intento de aprobación rechazado.
- Administrador simulado en transacción reversible: publicación y lectura de auditoría correctas, `ROLLBACK` sin cambios persistentes.
- Falta ejecutar prueba E2E de navegador con sesión real y revisar que el panel muestre los 10 proyectos, los perfiles e interesados.
- Los registros antiguos marcados como publicados deben revisarse manualmente; marca de publicación no equivale a certificación financiera.

## Seguridad pendiente
- Los asesores de Supabase advierten de RPC `SECURITY DEFINER` ejecutables por `authenticated`. El endpoint debe permanecer protegido por comprobación estricta de rol; evaluar arquitectura con esquema privado para la siguiente versión.
- Habilitar protección de contraseñas filtradas en Supabase Auth.
- Probar flujos de revocación y sesiones ya abiertas.
- Mantener verificaciones RENIEC/SBS deshabilitadas hasta tener autorización y controles adecuados.

## Despliegue
1. Verificar que la única cuenta confiable sea la designada.
2. Comprobar compilación Vercel de la rama.
3. Publicar la interfaz en main y comprobar el dominio principal.
4. Cerrar sesión y volver a iniciar sesión en producción con el administrador.
5. Validar las lecturas de RLS y realizar una aprobación real solamente sobre un proyecto revisado formalmente.
