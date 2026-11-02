-- DealCapital Supabase security hardening — 2026-11-02
-- No existing rows are modified. Profile/project normal updates remain available.
-- Requires review of legacy approval badges (historical rows were self-editable).
--
-- 1. Prevent authenticated users from assigning privileged profile fields.
CREATE OR REPLACE FUNCTION public.dc_guard_profile_authority()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      -- Preserve compatible UPSERT behavior for existing profile rows:
      -- the UPDATE trigger below still rejects any changed privileged values.
      IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.id) THEN
        NEW.rol := 'usuario';
        NEW.perfil_verificado := false;
        NEW.empresa_verificada := false;
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.rol IS DISTINCT FROM OLD.rol
         OR NEW.perfil_verificado IS DISTINCT FROM OLD.perfil_verificado
         OR NEW.empresa_verificada IS DISTINCT FROM OLD.empresa_verificada THEN
        RAISE EXCEPTION 'Los roles y estados de verificación solo pueden cambiarse desde un proceso administrativo autorizado'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dc_guard_profile_authority ON public.profiles;
CREATE TRIGGER dc_guard_profile_authority
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.dc_guard_profile_authority();

-- 2. Protect project publication and financial tracking from self-approval.
CREATE OR REPLACE FUNCTION public.dc_guard_project_authority()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.proyecto_verificado := false;
      NEW.estado := 'pendiente';
      NEW.monto_recaudado := 0;
      NEW.porcentaje_financiado := 0;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.proyecto_verificado IS DISTINCT FROM OLD.proyecto_verificado
         OR NEW.estado IS DISTINCT FROM OLD.estado
         OR NEW.monto_recaudado IS DISTINCT FROM OLD.monto_recaudado
         OR NEW.porcentaje_financiado IS DISTINCT FROM OLD.porcentaje_financiado THEN
        RAISE EXCEPTION 'La publicación y los indicadores financieros requieren un proceso autorizado'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dc_guard_project_authority ON public.proyectos;
CREATE TRIGGER dc_guard_project_authority
BEFORE INSERT OR UPDATE ON public.proyectos
FOR EACH ROW EXECUTE FUNCTION public.dc_guard_project_authority();

-- 3. Restrict project row visibility: public = marked for publication;
-- owners = own projects; trusted future administrators = app_metadata.role.
DROP POLICY IF EXISTS "Todos pueden ver proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Proyectos publicados visibles" ON public.proyectos;
DROP POLICY IF EXISTS "Propietarios ven todos sus proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Administradores confiables ven proyectos" ON public.proyectos;

CREATE POLICY "Proyectos publicados visibles" ON public.proyectos
FOR SELECT TO anon, authenticated
USING (proyecto_verificado IS TRUE);

CREATE POLICY "Propietarios ven todos sus proyectos" ON public.proyectos
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Administradores confiables ven proyectos" ON public.proyectos
FOR SELECT TO authenticated
USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- 4. Read-only global access for administratively provisioned accounts ONLY;
-- nobody currently receives this claim automatically.
DROP POLICY IF EXISTS "Administradores confiables leen perfiles" ON public.profiles;
CREATE POLICY "Administradores confiables leen perfiles" ON public.profiles
FOR SELECT TO authenticated
USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Administradores confiables leen interesados" ON public.interesados;
CREATE POLICY "Administradores confiables leen interesados" ON public.interesados
FOR SELECT TO authenticated
USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- 5. Eliminate dangerous DDL-level privileges. RLS does not protect TRUNCATE.
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
  LOOP
    EXECUTE format(
      'REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE %I.%I FROM anon, authenticated',
      t.schema_name, t.table_name
    );
  END LOOP;
END;
$$;
