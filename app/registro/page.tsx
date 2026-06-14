"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Registro() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [mensaje, setMensaje] = useState("");

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          tipo,
        },
      },
    });

    if (error) {
      setMensaje(error.message);
      return;
    }

    setMensaje("Cuenta creada. Revisa tu correo para confirmar tu registro.");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <form onSubmit={registrar} className="bg-slate-900 p-10 rounded-2xl w-full max-w-md space-y-5">
        <h1 className="text-4xl font-bold text-center">Crear Cuenta</h1>

        <input className="w-full p-4 rounded-xl bg-slate-800" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

        <input className="w-full p-4 rounded-xl bg-slate-800" type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <select className="w-full p-4 rounded-xl bg-slate-800" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
          <option value="">Tipo de cuenta</option>
          <option value="emprendedor">Emprendedor</option>
          <option value="inversionista">Inversionista</option>
        </select>

        <input className="w-full p-4 rounded-xl bg-slate-800" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold">
          Crear Cuenta
        </button>

        {mensaje && <p className="text-yellow-400 text-center">{mensaje}</p>}
      </form>
    </main>
  );
}