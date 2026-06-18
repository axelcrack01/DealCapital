"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

export default function Analitica() {
  const [proyectos, setProyectos] = useState<any[]>([]);

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from("proyectos").select("*");
      setProyectos(data || []);
    };

    cargar();
  }, []);

  const totalProyectos = proyectos.length;
  const capitalSolicitado = proyectos.reduce((t, p) => t + Number(p.capital_requerido || 0), 0);
  const capitalRecaudado = proyectos.reduce((t, p) => t + Number(p.monto_recaudado || 0), 0);
  const verificados = proyectos.filter((p) => p.proyecto_verificado).length;

  const porRiesgo = ["Bajo", "Medio", "Alto"].map((r) => ({
    name: r,
    value: proyectos.filter((p) => p.riesgo === r).length,
  }));

  const industrias = Object.values(
    proyectos.reduce((acc: any, p) => {
      const industria = p.industria || "Sin industria";
      acc[industria] = acc[industria] || { name: industria, value: 0 };
      acc[industria].value += 1;
      return acc;
    }, {})
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <section className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-10">Analítica DealCapital</h1>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card title="Proyectos" value={totalProyectos} />
          <Card title="Capital solicitado" value={`S/ ${capitalSolicitado.toLocaleString("es-PE")}`} />
          <Card title="Capital recaudado" value={`S/ ${capitalRecaudado.toLocaleString("es-PE")}`} />
          <Card title="Verificados" value={verificados} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <ChartBox title="Proyectos por riesgo">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={porRiesgo}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Proyectos por industria">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={industrias as any[]} dataKey="value" nameKey="name" outerRadius={100} label>
                  {(industrias as any[]).map((_, index) => (
                    <Cell key={index} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
      <p className="text-slate-400">{title}</p>
      <h2 className="text-3xl font-bold text-yellow-400 mt-2">{value}</h2>
    </div>
  );
}

function ChartBox({ title, children }: any) {
  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      {children}
    </div>
  );
}