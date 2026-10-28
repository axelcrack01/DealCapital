"use client";

import { use, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function Comprometer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [monto, setMonto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState("");

  const enviarCompromiso = async (e: React.FormEvent) => {
    e.preventDefault();

    const importe = Number(monto);
    if (!Number.isFinite(importe) || importe <= 0) {
      setEstado("Ingresa un monto de inversión válido y mayor que cero.");
      return;
    }

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("compromisos").insert([
      {
        proyecto_id: Number(id),
        inversionista_id: data.user.id,
        monto: importe,
        mensaje,
      },
    ]);

    if (error) {
      console.error("No fue posible registrar el compromiso", { code: error.code, message: error.message });
      setEstado("No pudimos registrar el compromiso. Intenta nuevamente.");
      return;
    }

    setEstado("Compromiso registrado correctamente.");
    setMonto("");
    setMensaje("");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">Comprometer inversión</h1>

        <form onSubmit={enviarCompromiso} className="bg-slate-900 p-8 rounded-2xl space-y-5">
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Monto que deseas invertir"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-800"
            required
          />

          <textarea
            placeholder="Mensaje para el emprendedor"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={5}
            className="w-full p-4 rounded-xl bg-slate-800"
          />

          <button className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold">
            Enviar compromiso
          </button>
        </form>

        {estado && <p className="mt-6 text-yellow-400">{estado}</p>}
      </section>
    </main>
  );
}