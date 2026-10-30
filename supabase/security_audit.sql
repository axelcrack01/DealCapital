-- Read-only security audit. Execute in Supabase SQL Editor with sufficient privileges.
-- Never post result rows containing private business/person information.
-- Audits schema settings, not live access testing. Pair with supabase test db.

SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
  AND c.relname IN ('profiles','proyectos','interesados','compromisos','favoritos','mensajes','notificaciones')
ORDER BY c.relname;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('profiles','proyectos','interesados','compromisos','favoritos','mensajes','notificaciones')
ORDER BY tablename, policyname;

SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public'
  AND table_name IN ('profiles','proyectos','interesados','compromisos','favoritos','mensajes','notificaciones')
  AND grantee IN ('anon','authenticated','PUBLIC')
ORDER BY table_name, grantee, privilege_type;

SELECT table_name, column_name, grantee, privilege_type
FROM information_schema.column_privileges
WHERE table_schema='public'
  AND table_name IN ('profiles','proyectos')
  AND column_name IN ('rol','perfil_verificado','empresa_verificada','proyecto_verificado')
  AND grantee IN ('anon','authenticated','PUBLIC')
ORDER BY table_name, column_name, grantee;

-- Manual adversarial test cases (DO NOT run them as production writes):
-- anon -> INSERT/UPDATE verified flags: forbidden
-- user A -> UPDATE user B profile / projects: forbidden
-- user A -> set profiles.rol='admin': forbidden
-- user A -> set proyecto_verificado=true: forbidden
-- user A -> view private financial documents or other users' messages: forbidden
-- admin -> controlled verification via audited server function: permitted
-- public -> view only publication-approved projects with restricted columns: permitted
