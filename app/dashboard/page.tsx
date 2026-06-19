"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [perfil, setPerfil] = useState<any>(null);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [interesados, setInteresados] = useState<any[]>([]);
  const [compromisos, setCompromisos] = useState<any[]>([]);

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
          .eq("user_id", data.user.id);

        setProyectos(misProyectos || []);

        const ids = misProyectos?.map((p) => p.id) || [];

        if (ids.length > 0) {
          const { data: interesadosData } = await supabase
            .from("interesados")
            .select("*")
            .in("proyecto_id", ids);

          const { data: compromisosData } = await supabase
            .from("compromisos")
            .select("*, proyectos(nombre_proyecto)")
            .in("proyecto_id", ids);

          setInteresados(interesadosData || []);
          setCompromisos(compromisosData || []);
        }
      }

      if (profile?.tipo_usuario === "inversionista") {
        const { data: oportunidades } = await supabase
          .from("proyectos")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6);

        const { data: misCompromisos } = await supabase
          .from("compromisos")
          .select("*, proyectos(nombre_proyecto)")
          .eq("inversionista_id", data.user.id);

        setProyectos(oportunidades || []);
        setCompromisos(misCompromisos || []);
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

  const capitalSolicitado = proyectos.reduce(
    (total, p) => total + Number(p.capital_requerido || 0),
    0
  );

  const capitalRecaudado = proyectos.reduce(
    (total, p) => total + Number(p.monto_recaudado || 0),
    0
  );

  const compromisosPendientes = compromisos.filter(
    (c) => c.estado === "pendiente"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">Dashboard</h1>

        <p className="text-slate-300 mb-10">
          Bienvenido, {perfil.nombre || perfil.email}
        </p>

        {perfil.tipo_usuario === "emprendedor" ? (
          <>
            <div className="grid md:grid-cols-5 gap-6 mb-12">
              <Card title="Mis proyectos" value={proyectos.length} />
              <Card title="Interesados" value={interesados.length} />
              <Card title="Compromisos pendientes" value={compromisosPendientes} />
              <Card
                title="Capital solicitado"
                value={`S/ ${capitalSolicitado.toLocaleString("es-PE")}`}
              />
              <Card
                title="Capital recaudado"
                value={`S/ ${capitalRecaudado.toLocaleString("es-PE")}`}
              />
            </div>

            <h2 className="text-3xl font-bold mb-6">Mis proyectos</h2>

            <div className="space-y-4 mb-12">
              {proyectos.map((p) => {
                const progreso =
                  Number(p.capital_requerido) > 0
                    ? Math.min(
                        (Number(p.monto_recaudado || 0) /
                          Number(p.capital_requerido)) *
                          100,
                        100
                      )
                    : 0;

                return (
                  <div key={p.id} className="bg-slate-900 p-6 rounded-2xl">
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold">
                          {p.nombre_proyecto}
                        </h3>
                        <p className="text-slate-300">{p.descripcion}</p>
                      </div>

                      <a
                        href={`/oportunidades/${p.id}`}
                        className="text-yellow-400"
                      >
                        Ver
                      </a>
                    </div>

                    <div className="mt-5">
                      <div className="flex justify-between text-sm text-slate-400 mb-2">
                        <span>Financiamiento</span>
                        <span>
                          S/ {p.monto_recaudado || 0} / S/{" "}
                          {p.capital_requerido}
                        </span>
                      </div>

                      <div className="w-full bg-slate-800 rounded-full h-3">
                        <div
                          className="bg-yellow-500 h-3 rounded-full"
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <h2 className="text-3xl font-bold mb-6">
              Compromisos recibidos
            </h2>

            <div className="space-y-4 mb-12">
              {compromisos.map((c) => (
                <div key={c.id} className="bg-slate-900 p-6 rounded-2xl">
                  <h3 className="text-xl font-bold">
                    {c.proyectos?.nombre_proyecto || "Proyecto"}
                  </h3>
                  <p className="text-yellow-400 text-xl">
                    S/ {Number(c.monto).toLocaleString("es-PE")}
                  </p>
                  <p>Estado: {c.estado}</p>
                  <a href="/compromisos" className="text-yellow-400">
                    Gestionar compromiso
                  </a>
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
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <Card title="Oportunidades" value={proyectos.length} />
              <Card title="Mis compromisos" value={compromisos.length} />
              <Card
                title="Monto comprometido"
                value={`S/ ${compromisos
                  .reduce((t, c) => t + Number(c.monto || 0), 0)
                  .toLocaleString("es-PE")}`}
              />
              <Card
                title="Aceptados"
                value={compromisos.filter((c) => c.estado === "aceptado").length}
              />
            </div>

            <h2 className="text-3xl font-bold mb-6">Mis compromisos</h2>

            <div className="space-y-4 mb-12">
              {compromisos.map((c) => (
                <div key={c.id} className="bg-slate-900 p-6 rounded-2xl">
                  <h3 className="text-xl font-bold">
                    {c.proyectos?.nombre_proyecto || "Proyecto"}
                  </h3>
                  <p className="text-yellow-400">
                    S/ {Number(c.monto).toLocaleString("es-PE")}
                  </p>
                  <p>Estado: {c.estado}</p>
                </div>
              ))}
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

                  <p className="text-slate-300 mb-4">{p.descripcion}</p>

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

function Card({ title, value }: any) {
  return (
    <div className="bg-slate-900 p-6 rounded-2xl">
      <h3 className="text-3xl font-bold text-yellow-400">{value}</h3>
      <p className="text-slate-300 mt-2">{title}</p>
    </div>
  );
}