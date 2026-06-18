"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Admin() {
  const [autorizado, setAutorizado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [interesados, setInteresados] = useState<any[]>([]);

  const cargarDatos = async () => {
    const { data: proyectosData } = await supabase
      .from("proyectos")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: interesadosData } = await supabase
      .from("interesados")
      .select("*")
      .order("created_at", { ascending: false });

    setProyectos(proyectosData || []);
    setInteresados(interesadosData || []);
  };

  useEffect(() => {
    const verificarAdmin = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", data.user.id)
        .single();

      if (profile?.rol !== "admin") {
        window.location.href = "/";
        return;
      }

      setAutorizado(true);
      await cargarDatos();
      setCargando(false);
    };

    verificarAdmin();
  }, []);

  const verificarProyecto = async (id: number, estadoActual: boolean) => {
    const { error } = await supabase
      .from("proyectos")
      .update({
        proyecto_verificado: !estadoActual,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await cargarDatos();
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-10">
        Verificando acceso...
      </main>
    );
  }

  if (!autorizado) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-5xl font-bold mb-10">Panel Admin</h1>

      <section className="mb-14">
        <h2 className="text-3xl font-bold mb-6">Proyectos publicados</h2>

        <div className="space-y-4">
          {proyectos.map((p) => (
            <div key={p.id} className="bg-slate-900 p-5 rounded-xl">
              <h3 className="text-xl font-bold">{p.nombre_proyecto}</h3>

              <p>Emprendedor: {p.emprendedor}</p>
              <p>Email: {p.email}</p>
              <p>Capital: S/ {p.capital_requerido}</p>

              <p className="mt-2">
                Estado:
                {p.proyecto_verificado ? (
                  <span className="text-green-400 ml-2">✅ Verificado</span>
                ) : (
                  <span className="text-red-400 ml-2">❌ Pendiente</span>
                )}
              </p>

              <button
                onClick={() =>
                  verificarProyecto(p.id, p.proyecto_verificado)
                }
                className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold"
              >
                {p.proyecto_verificado
                  ? "Quitar verificación"
                  : "Verificar Proyecto"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-6">Interesados</h2>

        <div className="space-y-4">
          {interesados.map((i) => (
            <div key={i.id} className="bg-slate-900 p-5 rounded-xl">
              <h3 className="text-xl font-bold">{i.nombre}</h3>
              <p>Email: {i.email}</p>
              <p>Proyecto ID: {i.proyecto_id}</p>
              <p>Mensaje: {i.mensaje || "Sin mensaje"}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}