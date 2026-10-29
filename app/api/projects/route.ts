import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const optionalText = (value: unknown, limit = 1000) =>
  typeof value === "string" ? value.trim().slice(0, limit) : "";

const safeLink = (value: unknown) => {
  const input = optionalText(value, 2048);
  if (!input) return "";
  try {
    const parsed = new URL(input);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : "";
  } catch { return ""; }
};

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") || 0) > 32_768) {
    return NextResponse.json({ error: "Solicitud demasiado grande." }, { status: 413 });
  }

  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ") || authHeader.length > 8192) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }
  const accessToken = authHeader.slice(7);
  const authClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !userData.user) {
    return NextResponse.json({ error: "La sesión ha expirado." }, { status: 401 });
  }

  let input: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid JSON");
    input = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const name = optionalText(input.nombre_proyecto, 160);
  const description = optionalText(input.descripcion, 5000);
  const founder = optionalText(input.emprendedor, 140);
  const email = optionalText(input.email, 200);
  const amount = Number(input.capital_requerido);
  if (name.length < 3 || description.length < 30 || founder.length < 3 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !Number.isFinite(amount) || amount <= 0 || amount > 100_000_000_000) {
    return NextResponse.json({ error: "Revisa nombre, descripción (mínimo 30 caracteres), correo y capital solicitado." }, { status: 400 });
  }

  const payload = {
    user_id: userData.user.id,
    nombre_proyecto: name,
    emprendedor: founder,
    email,
    descripcion: description,
    capital_requerido: amount,
    industria: optionalText(input.industria, 120),
    equipo_fundador: optionalText(input.equipo_fundador, 3000),
    retorno_ofrecido: optionalText(input.retorno_ofrecido, 200),
    plazo: optionalText(input.plazo, 160),
    roi_estimado: optionalText(input.roi_estimado, 160),
    proyecciones: optionalText(input.proyecciones, 5000),
    riesgos: optionalText(input.riesgos, 5000),
    riesgo: ["Bajo","Medio","Alto"].includes(String(input.riesgo || "")) ? input.riesgo : null,
    video_pitch: safeLink(input.video_pitch),
    documento_pdf: safeLink(input.documento_pdf),
    logo_url: safeLink(input.logo_url),
    imagen_url: safeLink(input.imagen_url),
    pitch_deck_url: safeLink(input.pitch_deck_url),
    proyecto_verificado: false,
  };

  // User-scoped token: Supabase evaluates DB row-level security for the caller.
  // This is not a substitute for strict RLS INSERT/UPDATE grants.
  const db = createClient(url, key, {
    global: { headers: { Authorization: "Bearer " + accessToken } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await db.from("proyectos").insert(payload);
  if (error) {
    console.error("Project create failed", { code: error.code });
    return NextResponse.json({ error: "No pudimos guardar el proyecto. Comprueba tus permisos o intenta más tarde." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, message: "Proyecto recibido para revisión." }, { status: 201 });
}
