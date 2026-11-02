"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), password,
      });
      if (error || !data.user) {
        setMessage("No pudimos iniciar sesión. Revisa tus credenciales y confirma tu correo si es necesario.");
        return;
      }
      const { data: existing, error: lookupError } = await supabase
        .from("profiles").select("id").eq("id",data.user.id).maybeSingle();
      if (!lookupError && !existing) {
        // Best effort recovery when email confirmation interrupted profile creation.
        const kind = data.user.user_metadata?.tipo_usuario;
        await supabase.from("profiles").insert({
          id: data.user.id,
          nombre: String(data.user.user_metadata?.nombre || ""),
          email: data.user.email,
          tipo_usuario: kind === "emprendedor" ? "emprendedor" : "inversionista",
        });
      }
      window.location.assign("/dashboard");
    } catch {
      setMessage("No fue posible conectar. Intenta de nuevo.");
    } finally { setLoading(false); }
  };
  return (
    <main className="dc-hero-bg min-h-[calc(100vh-74px)] px-5 py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[22px] border border-slate-700 bg-[#0f1e2d] shadow-2xl lg:grid-cols-2">
        <aside className="hidden flex-col justify-between bg-[#112638] p-12 lg:flex">
          <Link href="/" className="text-xl font-bold text-white">Deal<span className="text-amber-200">Capital</span></Link>
          <div>
            <p className="dc-eyebrow mb-6">Bienvenido de nuevo</p>
            <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-white">Cada oportunidad comienza con una buena conexión.</h1>
            <p className="leading-8 text-slate-300">Accede a tu panel, revisa tus proyectos y continúa conversaciones dentro del ecosistema.</p>
          </div>
          <p className="text-xs text-slate-400">Plataforma MVP · La inversión implica riesgos.</p>
        </aside>
        <section className="p-7 sm:p-12">
          <p className="dc-eyebrow mb-5">Tu cuenta</p>
          <h2 className="mb-3 text-3xl font-bold text-white">Iniciar sesión</h2>
          <p className="mb-9 text-sm text-slate-400">Ingresa tus credenciales para continuar.</p>
          <form onSubmit={submit} className="space-y-6">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Correo electrónico</span>
              <input className="dc-input" type="email" autoComplete="email" required
                placeholder="nombre@correo.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Contraseña</span>
              <input className="dc-input" type="password" autoComplete="current-password" required
                placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
            </label>
            {message && <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-3 text-sm text-rose-200">{message}</p>}
            <button type="submit" disabled={loading} className="dc-btn dc-btn-primary w-full disabled:opacity-60">
              {loading ? "Verificando..." : "Entrar a mi cuenta"} <span aria-hidden="true">→</span>
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-slate-400">¿Aún no tienes cuenta? <Link href="/registro" className="font-bold text-amber-200 hover:underline">Registrarme</Link></p>
        </section>
      </div>
    </main>
  );
}
