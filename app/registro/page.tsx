"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("inversionista");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const registrarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true);

    if (!nombre || !email || !password) {
      setMensaje("Completa todos los campos.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMensaje("La contraseña debe tener mínimo 6 caracteres.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          nombre,
          tipo_usuario: tipoUsuario,
        },
      },
    });

    if (error) {
      console.log("Error register:", error);

      if (
        error.message.toLowerCase().includes("already") ||
        error.message.toLowerCase().includes("registered")
      ) {
        setMensaje("Este correo ya está registrado. Inicia sesión.");
      } else {
        setMensaje(error.message);
      }

      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        nombre,
        email: email.trim().toLowerCase(),
        tipo_usuario: tipoUsuario,
      });

      if (profileError) {
        console.log("Error profile:", profileError);
        setMensaje("Cuenta creada, pero hubo un problema guardando el perfil.");
        setLoading(false);
        return;
      }
    }

    setMensaje("Cuenta creada correctamente.");
    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-[#030712] flex items-center justify-center px-4">
      <form
        onSubmit={registrarUsuario}
        className="w-full max-w-md bg-[#111827] p-10 rounded-2xl shadow-lg"
      >
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Crear Cuenta
        </h1>

        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full mb-5 px-4 py-4 rounded-xl bg-[#1f2937] text-white outline-none"
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-5 px-4 py-4 rounded-xl bg-[#1f2937] text-white outline-none"
        />

        <select
          value={tipoUsuario}
          onChange={(e) => setTipoUsuario(e.target.value)}
          className="w-full mb-5 px-4 py-4 rounded-xl bg-[#1f2937] text-white outline-none"
        >
          <option value="inversionista">Inversionista</option>
          <option value="emprendedor">Emprendedor</option>
        </select>

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-5 px-4 py-4 rounded-xl bg-[#1f2937] text-white outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 rounded-xl transition"
        >
          {loading ? "Creando cuenta..." : "Crear Cuenta"}
        </button>

        {mensaje && (
          <p className="text-center text-yellow-400 mt-5 font-semibold">
            {mensaje}
          </p>
        )}

        <p
          onClick={() => router.push("/login")}
          className="text-center text-yellow-400 mt-6 cursor-pointer hover:underline"
        >
          Ya tengo una cuenta
        </p>
      </form>
    </main>
  );
}