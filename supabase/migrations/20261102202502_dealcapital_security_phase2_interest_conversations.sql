-- DealCapital security phase 2 — sender identity and project integrity.
-- No existing rows are modified; only new INSERT operations are restricted.

DROP POLICY IF EXISTS "Usuarios logueados pueden mostrar interes" ON public.interesados;
DROP POLICY IF EXISTS "Inversionistas muestran interes legítimo" ON public.interesados;
CREATE POLICY "Inversionistas muestran interes legítimo"
ON public.interesados FOR INSERT TO authenticated
WITH CHECK (
  inversionista_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.proyectos p
    WHERE p.id = proyecto_id
      AND p.proyecto_verificado IS TRUE
      AND p.user_id IS NOT NULL
      AND p.user_id <> (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Usuarios logueados pueden crear conversaciones" ON public.conversaciones;
DROP POLICY IF EXISTS "Solo inversor inicia conversacion de proyecto publicado" ON public.conversaciones;
CREATE POLICY "Solo inversor inicia conversacion de proyecto publicado"
ON public.conversaciones FOR INSERT TO authenticated
WITH CHECK (
  inversionista_id = (SELECT auth.uid())
  AND emprendedor_id IS NOT NULL
  AND emprendedor_id <> inversionista_id
  AND EXISTS (
    SELECT 1 FROM public.proyectos p
    WHERE p.id = proyecto_id
      AND p.user_id = emprendedor_id
      AND p.proyecto_verificado IS TRUE
  )
);
