"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  const login = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMensaje(error.message);
      return;
    }

    window.location.href = "/oportunidades";
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <form onSubmit={login} className="bg-slate-900 p-10 rounded-2xl w-full max-w-md space-y-5">
        <h1 className="text-4xl font-bold text-center">Iniciar Sesión</h1>

        <input className="w-full p-4 rounded-xl bg-slate-800" type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <input className="w-full p-4 rounded-xl bg-slate-800" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold">
          Iniciar Sesión
        </button>

        {mensaje && <p className="text-red-400 text-center">{mensaje}</p>}

        <a href="/registro" className="block text-center text-yellow-400">
          ¿No tienes cuenta? Regístrate
        </a>
      </form>
    </main>
  );
}