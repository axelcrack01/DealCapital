// DealCapital controlled disposal of private proposal PDFs.
// Security: verified JWT, current authoritative admin role, and service-role
// RPC preflight. No service key or storage object contents reach the browser.
// The Edge function never removes files that are public, shared, held,
// associated with financial activity, or within the seven-day retention window.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.108.1";

type PlanFile = {
  bucket: "Documentos" | "pitch-decks";
  path: string;
  exists: boolean;
};
type RetirementPlan = { job_id: string; project_id: number; files: PlanFile[] };

const previewHost = /^https:\/\/deal-capital-[a-z0-9-]+-capitaldeal\.vercel\.app$/;
const primaryHost = "https://deal-capital.vercel.app";
const privatePDF = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;

const cors = (origin: string | null) => {
  const trusted = origin === primaryHost || (origin !== null && previewHost.test(origin));
  return {
    "Access-Control-Allow-Origin": trusted ? origin! : primaryHost,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    "Access-Control-Max-Age": "3600",
    "Vary": "Origin",
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };
};
const reply = (body: Record<string, unknown>, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: cors(origin) });

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (origin && origin !== primaryHost && !previewHost.test(origin)) {
    return reply({ error: "Origin not permitted" }, 403, origin);
  }
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405, origin);

  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return reply({ error: "Authentication required" }, 401, origin);
  }
  const jwt = authHeader.slice(7).trim();
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return reply({ error: "Service configuration is incomplete" }, 503, origin);
  }

  try {
    const input = await request.json();
    if (
      !input || typeof input !== "object" || Array.isArray(input) ||
      !Number.isSafeInteger(input.project_id) || input.project_id <= 0
    ) return reply({ error: "Invalid project id" }, 400, origin);

    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: session, error: sessionError } = await userClient.auth.getUser(jwt);
    if (sessionError || !session.user) return reply({ error: "Invalid session" }, 401, origin);

    const adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: trusted, error: trustedError } =
      await adminClient.auth.admin.getUserById(session.user.id);
    if (trustedError || trusted.user?.app_metadata?.role !== "admin") {
      return reply({ error: "Administrative access denied" }, 403, origin);
    }

    const { data: planData, error: planError } =
      await adminClient.rpc("dc_service_begin_file_retirement", {
        p_project_id: input.project_id,
        p_actor_id: session.user.id
      });
    if (planError || !planData || typeof planData !== "object" || Array.isArray(planData)) {
      return reply({ error: "Document retirement is not eligible or is already processing" }, 409, origin);
    }
    const plan = planData as RetirementPlan;
    if (
      !plan.job_id || plan.project_id !== input.project_id ||
      !Array.isArray(plan.files) || plan.files.length < 1 || plan.files.length > 2 ||
      plan.files.some(f =>
        !["Documentos","pitch-decks"].includes(f.bucket) ||
        typeof f.path !== "string" || !privatePDF.test(f.path) ||
        typeof f.exists !== "boolean"
      )
    ) return reply({ error: "Invalid disposal plan" }, 500, origin);

    // Remove the real bytes via the Storage API, not storage.objects SQL.
    // If a previous attempt removed one file, retry is idempotent: the database
    // preflight marks the missing object, which the worker skips.
    for (const file of plan.files) {
      if (!file.exists) continue;
      const { error: removalError } = await adminClient.storage
        .from(file.bucket).remove([file.path]);
      if (removalError) {
        return reply({ error: "Storage deletion was incomplete; retry after the claim expires" }, 502, origin);
      }
    }
    // The protected completion RPC rechecks the rejection, legal hold,
    // dependencies, exact refs and absence of objects before clearing refs.
    const { data: completed, error: completeError } =
      await adminClient.rpc("dc_service_finish_file_retirement", {
        p_job_id: plan.job_id,
        p_actor_id: session.user.id
      });
    if (completeError || !completed) {
      return reply({ error: "Physical deletion requires reconciliation before database cleanup" }, 409, origin);
    }
    return reply({
      status: "completed",
      project_id: input.project_id,
      files_processed: plan.files.length,
      next_step: "Eligible proposal content is purged by the scheduled database job"
    }, 200, origin);
  } catch {
    return reply({ error: "Unable to complete the controlled document retirement" }, 500, origin);
  }
});
