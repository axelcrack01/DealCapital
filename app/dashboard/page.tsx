"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [perfil, setPerfil] = useState<any>(null);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [interesados, setInteresados] = useState<any[]>([]);

  useEffect(() => {
    const cargarDashboard = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      setPerfil(profile);

      if (profile?.tipo_usuario === "emprendedor") {
        const { data: misProyectos } = await supabase
          .from("proyectos")
          .select("*")
          .eq("email", profile.email);

        setProyectos(misProyectos || []);

        const ids = misProyectos?.map((p) => p.id) || [];

        if (ids.length > 0) {
          const { data: interesadosData } = await supabase
            .from("interesados")
            .select("*")
            .in("proyecto_id", ids);

          setInteresados(interesadosData || []);
        }
      }

      if (profile?.tipo_usuario === "inversionista") {
        const { data: oportunidades } = await supabase
          .from("proyectos")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6);

        setProyectos(oportunidades || []);
      }
    };

    cargarDashboard();
  }, []);

  if (!perfil) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-10">
        Cargando dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">
          Dashboard
        </h1>

        <p className="text-slate-300 mb-10">
          Bienvenido, {perfil.nombre || perfil.email}
        </p>

        {perfil.tipo_usuario === "emprendedor" ? (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-900 p-6 rounded-2xl">
                <h3 className="text-3xl font-bold text-yellow-400">
                  {proyectos.length}
                </h3>
                <p>Mis proyectos</p>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl">
                <h3 className="text-3xl font-bold text-yellow-400">
                  {interesados.length}
                </h3>
                <p>Inversionistas interesados</p>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl">
                <h3 className="text-3xl font-bold text-yellow-400">
                  Pendiente
                </h3>
                <p>Estado de financiamiento</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-6">Mis proyectos</h2>

            <div className="space-y-4 mb-12">
              {proyectos.map((p) => (
                <div key={p.id} className="bg-slate-900 p-6 rounded-2xl">
                  <h3 className="text-xl font-bold">{p.nombre_proyecto}</h3>
                  <p className="text-slate-300">{p.descripcion}</p>
                  <p className="text-yellow-400 mt-2">
                    Capital: S/ {p.capital_requerido}
                  </p>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-bold mb-6">
              Inversionistas interesados
            </h2>

            <div className="space-y-4">
              {interesados.map((i) => (
                <div key={i.id} className="bg-slate-900 p-6 rounded-2xl">
                  <h3 className="text-xl font-bold">{i.nombre}</h3>
                  <p>{i.email}</p>
                  <p className="text-slate-300">{i.mensaje}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-900 p-6 rounded-2xl">
                <h3 className="text-3xl font-bold text-yellow-400">
                  {proyectos.length}
                </h3>
                <p>Oportunidades recomendadas</p>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl">
                <h3 className="text-3xl font-bold text-yellow-400">
                  0
                </h3>
                <p>Proyectos guardados</p>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl">
                <h3 className="text-3xl font-bold text-yellow-400">
                  0
                </h3>
                <p>Mensajes</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-6">
              Oportunidades recomendadas
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {proyectos.map((p) => (
                <div key={p.id} className="bg-slate-900 p-6 rounded-2xl">
                  <h3 className="text-xl font-bold mb-2">
                    {p.nombre_proyecto}
                  </h3>

                  <p className="text-slate-300 mb-4">
                    {p.descripcion}
                  </p>

                  <p className="text-yellow-400 mb-4">
                    S/ {p.capital_requerido}
                  </p>

                  <a
                    href={`/oportunidades/${p.id}`}
                    className="block text-center bg-yellow-500 text-black py-3 rounded-xl font-bold"
                  >
                    Ver oportunidad
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}