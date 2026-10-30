-- DealCapital security hardening candidate — DO NOT APPLY UNTIL STAGING QA.
-- Audited on 2026-10-29; production currently permits client UPDATE of trust flags.
-- Prerequisite: replace browser-based administrator updates with a trusted server endpoint.
-- Backup and test these changes with two distinct users and an admin.
BEGIN;
-- Replace publicly readable all-projects policy. Anonymous visitors see ONLY approved projects.
DROP POLICY IF EXISTS "Todos pueden ver proyectos" ON public.proyectos;
CREATE POLICY "Public reads approved projects" ON public.proyectos
  FOR SELECT TO anon, authenticated USING (proyecto_verificado IS TRUE);
-- Owners still need to inspect their pending drafts.
CREATE POLICY "Owner reads own projects" ON public.proyectos
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Remove potentially dangerous blanket write privileges, retain safe column edits.
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;
GRANT INSERT (id,nombre,email,tipo_usuario) ON public.profiles TO authenticated;
GRANT UPDATE (nombre,email,tipo_usuario,biografia,telefono,ciudad,foto_url,
 empresa,cargo,linkedin,pagina_web,experiencia,capital_disponible,monto_minimo,
 monto_maximo,sectores_interes,tipo_inversionista,pais) ON public.profiles TO authenticated;
-- DO NOT grant rol, perfil_verificado, empresa_verificada to the browser.

REVOKE INSERT, UPDATE ON public.proyectos FROM anon, authenticated;
GRANT INSERT (nombre_proyecto,emprendedor,email,capital_requerido,descripcion,retorno_ofrecido,
 industria,plazo,ubicacion,pagina_web,user_id,riesgo,roi_estimado,video_pitch,
 proyecciones,riesgos,equipo_fundador,documentos_url,documento_pdf,logo_url,imagen_url,
 pitch_deck_url) ON public.proyectos TO authenticated;
GRANT UPDATE (nombre_proyecto,emprendedor,email,capital_requerido,descripcion,retorno_ofrecido,
 industria,plazo,ubicacion,pagina_web,riesgo,roi_estimado,video_pitch,proyecciones,
 riesgos,equipo_fundador,documentos_url,documento_pdf,logo_url,imagen_url,
 pitch_deck_url) ON public.proyectos TO authenticated;
-- Do not allow users to self-approve, manipulate received capital or change owner.
-- Admin moderation requires authenticated server-side privilege checks and audited service operation.
COMMIT;

-- IMPORTANT:
-- 1. SELECT * on projects still exposes personal email and potentially document URLs for approved rows.
--    Follow up with restricted public view/route and remove public table SELECT altogether.
-- 2. Verify table-level grants are revoked and column-level grants take effect.
-- 3. Existing admin client will not be able to approve projects or users after this migration.
-- 4. Check auth.users signup triggers if any and Storage RLS before rollout.
