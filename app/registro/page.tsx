"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";

export default function Registro() {
  const [nombre,setNombre] = useState("");
  const [email,setEmail] = useState("");
  const [tipo,setTipo] = useState<"emprendedor" | "inversionista">("emprendedor");
  const [password,setPassword] = useState("");
  const [accepted,setAccepted] = useState(false);
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");
  const [success,setSuccess] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setMessage("");
    if (nombre.trim().length < 3 || password.length < 10 || !accepted) {
      setMessage("Comprueba tu nombre, la contraseña (mínimo 10 caracteres) y la confirmación.");
      return;
    }
    setLoading(true);
    try {
      const { data,error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), password,
        options: { data: { nombre: nombre.trim(), tipo_usuario: tipo } },
      });
      if (error) {
        setMessage("No pudimos procesar tu registro. Revisa tus datos o intenta iniciar sesión.");
        return;
      }
      if (data.user && data.session) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          tipo_usuario: tipo,
        }, { onConflict: "id" });
        if (profileError) console.error("Could not create user profile", { code: profileError.code });
      }
      setSuccess(true);
      setMessage(data.session
        ? "Tu cuenta está lista para iniciar sesión."
        : "Revisa tu correo electrónico para confirmar el registro y después inicia sesión.");
    } catch {
      setMessage("No se pudo completar el registro. Inténtalo nuevamente.");
    } finally { setLoading(false); }
  };

  return (
    <main className="dc-hero-bg min-h-[calc(100vh-74px)] px-5 py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[22px] border border-slate-700 bg-[#0f1e2d] shadow-2xl lg:grid-cols-[.85fr_1.15fr]">
        <aside className="hidden flex-col justify-between bg-[#112638] p-10 lg:flex">
          <Link href="/" className="text-xl font-bold text-white">Deal<span className="text-amber-200">Capital</span></Link>
          <div><p className="dc-eyebrow mb-6">Comienza aquí</p>
            <h1 className="mb-5 text-4xl font-bold tracking-tight text-white">Conecta tus ideas con nuevas posibilidades.</h1>
            <p className="text-sm leading-8 text-slate-300">Crea tu cuenta provisional, completa tu perfil y presenta o descubre oportunidades dentro del MVP.</p>
          </div>
          <p className="text-xs text-slate-400">La identidad oficial no se verifica en el registro actual.</p>
        </aside>
        <section className="p-7 sm:p-12">
          <p className="dc-eyebrow mb-5">Únete a DealCapital</p>
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-white">Crear cuenta</h2>
          <p className="mb-7 text-sm leading-7 text-slate-400">El registro no acredita identidad ni solvencia. Aún no solicitamos DNI: esa función necesita un proveedor autorizado.</p>
          {success ? <div role="status" className="rounded-xl border border-emerald-300/30 bg-emerald-950/25 p-6">
            <h3 className="mb-3 text-lg font-bold text-emerald-200">Registro procesado</h3>
            <p className="mb-5 text-sm leading-7 text-slate-300">{message}</p>
            <Link href="/login" className="dc-btn dc-btn-primary">Ir a iniciar sesión →</Link>
          </div> : <form onSubmit={submit} className="space-y-5">
            <fieldset>
              <legend className="mb-3 text-sm text-slate-300">Quiero participar como</legend>
              <div className="grid grid-cols-2 gap-3">
                {(["emprendedor","inversionista"] as const).map(value => (
                  <label key={value} className={"cursor-pointer rounded-xl border p-4 text-center text-sm font-semibold capitalize " + (tipo === value ? "border-amber-200 bg-amber-200/10 text-amber-200" : "border-slate-700 text-slate-300")}>
                    <input type="radio" className="mr-2 accent-amber-300" name="tipo" checked={tipo===value} onChange={()=>setTipo(value)} />{value}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block"><span className="mb-2 block text-sm text-slate-300">Nombre completo (declarado)</span>
              <input className="dc-input" type="text" autoComplete="name" minLength={3} required placeholder="Nombres y apellidos" value={nombre} onChange={e=>setNombre(e.target.value)}/></label>
            <label className="block"><span className="mb-2 block text-sm text-slate-300">Correo electrónico</span>
              <input className="dc-input" type="email" autoComplete="email" required placeholder="nombre@correo.com" value={email} onChange={e=>setEmail(e.target.value)} /></label>
            <label className="block"><span className="mb-2 block text-sm text-slate-300">Contraseña</span>
              <input className="dc-input" type="password" autoComplete="new-password" minLength={10} required placeholder="Mínimo 10 caracteres" value={password} onChange={e=>setPassword(e.target.value)}/>
              <span className="mt-2 block text-xs text-slate-500">Usa una contraseña única que no utilices en otros servicios.</span></label>
            <label className="flex items-start gap-3 rounded-lg border border-slate-700 p-4 text-xs leading-6 text-slate-300">
              <input className="mt-1 accent-amber-300" type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} required />
              <span>Entiendo que DealCapital es un MVP, no verifica actualmente identidades mediante RENIEC o SBS y no garantiza rendimientos. <Link href="/verificacion" className="text-amber-200 underline">Conocer el proceso de verificación previsto</Link>.</span>
            </label>
            {message && <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-3 text-sm text-rose-200">{message}</p>}
            <button type="submit" disabled={loading} className="dc-btn dc-btn-primary w-full disabled:opacity-60">{loading ? "Procesando..." : "Crear mi cuenta"} →</button>
          </form>}
          <p className="mt-7 text-center text-sm text-slate-400">¿Ya tienes cuenta? <Link href="/login" className="font-bold text-amber-200 hover:underline">Iniciar sesión</Link></p>
        </section>
      </div>
    </main>
  );
}
