-- DealCapital QA: READ-ONLY role and row visibility regression.
-- Executed on 2026-11-04 using the effective Postgres roles and simulated
-- authenticated claims. This is not an HTTP/JWT-authentication/browser E2E test.
-- Every transaction starts READ ONLY and ends ROLLBACK.
-- No user UUID, email, tokens or personal rows are printed.

-- A. Visitors may read only approved projects, never private records.
BEGIN READ ONLY;
SELECT set_config('dcqa.approved_projects',
  (SELECT COUNT(*)::text FROM public.proyectos WHERE proyecto_verificado IS TRUE),true);
SET LOCAL ROLE anon;
SELECT current_user='anon' AS role_ok,
  (SELECT COUNT(*) FROM public.proyectos)=current_setting('dcqa.approved_projects')::int AS approved_only,
  (SELECT COUNT(*) FROM public.profiles)=0 AS profiles_hidden,
  (SELECT COUNT(*) FROM public.notificaciones)=0 AS notifications_hidden,
  (SELECT COUNT(*) FROM public.interesados)=0 AS interests_hidden,
  (SELECT COUNT(*) FROM public.compromisos)=0 AS commitments_hidden;
ROLLBACK;

-- B. Entrepreneur can read only their own private profile/alerts + public/own projects.
BEGIN READ ONLY;
SELECT
  set_config('request.jwt.claim.sub',u.id::text,true),
  set_config('request.jwt.claims',jsonb_build_object(
    'sub',u.id,'role','authenticated',
    'app_metadata',coalesce(u.raw_app_meta_data,'{}'::jsonb)
  )::text,true),
  set_config('dcqa.expected_projects',(SELECT COUNT(*)::text
     FROM public.proyectos p WHERE p.proyecto_verificado IS TRUE OR p.user_id=u.id),true),
  set_config('dcqa.expected_notifications',(SELECT COUNT(*)::text
     FROM public.notificaciones n WHERE n.user_id=u.id),true)
FROM auth.users u JOIN public.profiles p ON p.id=u.id
WHERE p.tipo_usuario='emprendedor'
  AND coalesce(u.raw_app_meta_data->>'role','')<>'admin'
ORDER BY u.id LIMIT 1;
SET LOCAL ROLE authenticated;
SELECT current_user='authenticated' AS role_ok,auth.uid() IS NOT NULL AS user_claim_present,
  (SELECT COUNT(*) FROM public.proyectos)=current_setting('dcqa.expected_projects')::int AS projects_rls,
  (SELECT COUNT(*) FROM public.profiles)=1 AS own_profile_only,
  (SELECT COUNT(*) FROM public.notificaciones)=current_setting('dcqa.expected_notifications')::int AS own_notifications_only;
ROLLBACK;

-- C. Investor has equivalent owner isolation; no incidental admin authority.
BEGIN READ ONLY;
SELECT
  set_config('request.jwt.claim.sub',u.id::text,true),
  set_config('request.jwt.claims',jsonb_build_object(
    'sub',u.id,'role','authenticated',
    'app_metadata',coalesce(u.raw_app_meta_data,'{}'::jsonb)
  )::text,true),
  set_config('dcqa.expected_projects',(SELECT COUNT(*)::text
     FROM public.proyectos p WHERE p.proyecto_verificado IS TRUE OR p.user_id=u.id),true),
  set_config('dcqa.expected_notifications',(SELECT COUNT(*)::text
     FROM public.notificaciones n WHERE n.user_id=u.id),true)
FROM auth.users u JOIN public.profiles p ON p.id=u.id
WHERE p.tipo_usuario='inversionista'
  AND coalesce(u.raw_app_meta_data->>'role','')<>'admin'
ORDER BY u.id LIMIT 1;
SET LOCAL ROLE authenticated;
SELECT current_user='authenticated' AS role_ok,auth.uid() IS NOT NULL AS user_claim_present,
  (SELECT COUNT(*) FROM public.proyectos)=current_setting('dcqa.expected_projects')::int AS projects_rls,
  (SELECT COUNT(*) FROM public.profiles)=1 AS own_profile_only,
  (SELECT COUNT(*) FROM public.notificaciones)=current_setting('dcqa.expected_notifications')::int AS own_notifications_only;
ROLLBACK;

-- D. Trusted admin can review projects, profiles and interests, while
-- notification read access remains limited to their own notices.
BEGIN READ ONLY;
SELECT
  set_config('request.jwt.claim.sub',u.id::text,true),
  set_config('request.jwt.claims',jsonb_build_object(
    'sub',u.id,'role','authenticated',
    'app_metadata',coalesce(u.raw_app_meta_data,'{}'::jsonb)
  )::text,true),
  set_config('dcqa.expected_projects',(SELECT COUNT(*)::text FROM public.proyectos),true),
  set_config('dcqa.expected_profiles',(SELECT COUNT(*)::text FROM public.profiles),true),
  set_config('dcqa.expected_interests',(SELECT COUNT(*)::text FROM public.interesados),true),
  set_config('dcqa.expected_notifications',(SELECT COUNT(*)::text
     FROM public.notificaciones n WHERE n.user_id=u.id),true)
FROM auth.users u WHERE u.raw_app_meta_data->>'role'='admin' ORDER BY u.id LIMIT 1;
SET LOCAL ROLE authenticated;
SELECT current_user='authenticated' AS role_ok,auth.uid() IS NOT NULL AS user_claim_present,
  (SELECT COUNT(*) FROM public.proyectos)=current_setting('dcqa.expected_projects')::int AS admin_projects,
  (SELECT COUNT(*) FROM public.profiles)=current_setting('dcqa.expected_profiles')::int AS admin_profiles,
  (SELECT COUNT(*) FROM public.interesados)=current_setting('dcqa.expected_interests')::int AS admin_interests,
  (SELECT COUNT(*) FROM public.notificaciones)=current_setting('dcqa.expected_notifications')::int AS own_notifications_only;
ROLLBACK;
