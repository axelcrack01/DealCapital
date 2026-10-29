"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type Opportunity = {
  id: number;
  nombre_proyecto: string | null;
  industria: string | null;
  descripcion: string | null;
  capital_requerido: number | null;
  riesgo: string | null;
  imagen_url: string | null;
  proyecto_verificado: boolean | null;
  created_at: string | null;
};

const amount = (n: number) => new Intl.NumberFormat("es-PE", {
  style: "currency", currency: "PEN", maximumFractionDigits: 0,
}).format(n);

export default function OportunidadesClient({ proyectos }: { proyectos: Opportunity[] }) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [sort, setSort] = useState("recent");
  const industries = useMemo(() => Array.from(new Set(
    proyectos.map(p => p.industria).filter((i): i is string => Boolean(i))
  )).sort(), [proyectos]);

  const results = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("es");
    return proyectos.filter(p => (
      (!search || [p.nombre_proyecto,p.descripcion,p.industria]
        .filter(Boolean).join(" ").toLocaleLowerCase("es").includes(search)) &&
      (!industry || p.industria === industry)
    )).sort((a,b) => {
      if (sort === "low") return Number(a.capital_requerido || 0) - Number(b.capital_requerido || 0);
      if (sort === "high") return Number(b.capital_requerido || 0) - Number(a.capital_requerido || 0);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [proyectos, query, industry, sort]);

  const clear = () => { setQuery(""); setIndustry(""); setSort("recent"); };

  return (
    <>
      <div className="dc-panel mb-7 grid gap-5 p-5 md:grid-cols-3 md:p-6">
        <label className="text-sm text-slate-300">
          <span className="mb-2 block font-semibold">Buscar proyectos</span>
          <input type="search" className="dc-input" value={query}
            onChange={e => setQuery(e.target.value)} placeholder="Nombre, descripción, sector..." />
        </label>
        <label className="text-sm text-slate-300">
          <span className="mb-2 block font-semibold">Industria</span>
          <select className="dc-input" value={industry} onChange={e=>setIndustry(e.target.value)}>
            <option value="">Todas</option>
            {industries.map(i => <option value={i} key={i}>{i}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          <span className="mb-2 block font-semibold">Ordenar por</span>
          <select className="dc-input" value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="recent">Más recientes</option>
            <option value="low">Menor capital solicitado</option>
            <option value="high">Mayor capital solicitado</option>
          </select>
        </label>
      </div>
      <div className="mb-7 flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-slate-400"><strong className="text-white">{results.length}</strong> oportunidades</p>
        {(query || industry || sort !== "recent") && <button type="button" onClick={clear}
          className="text-sm font-semibold text-amber-200 underline">Limpiar filtros</button>}
      </div>
      {results.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.map(p => (
            <article key={p.id} className="dc-panel group flex flex-col overflow-hidden transition-colors hover:border-amber-200/50">
              <div className="dc-sheen relative h-44 overflow-hidden border-b border-slate-700">
                {p.imagen_url
                  ? <img src={p.imagen_url} alt="" loading="lazy" className="size-full object-cover transition-transform group-hover:scale-105" />
                  : <div className="grid size-full place-items-center text-6xl text-amber-200/40">✧</div>}
                <span className="absolute left-4 top-4 rounded-lg bg-[#091827]/90 px-3 py-1.5 text-xs font-semibold text-amber-200">
                  {p.industria || "Emprendimiento"}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h2 className="mb-3 text-xl font-bold text-white">{p.nombre_proyecto || "Proyecto"}</h2>
                <p className="mb-6 line-clamp-3 flex-1 text-sm leading-7 text-slate-400">{p.descripcion || "Sin descripción disponible."}</p>
                <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-[#0a1726] p-4">
                  <div><p className="mb-1 text-xs text-slate-400">Capital solicitado</p><p className="text-sm font-bold text-white">{amount(Number(p.capital_requerido || 0))}</p></div>
                  <div><p className="mb-1 text-xs text-slate-400">Riesgo declarado</p><p className="text-sm font-bold text-white">{p.riesgo || "No informado"}</p></div>
                </div>
                <p className="mb-5 text-xs leading-5 text-slate-500">Revisión de publicación. No es una certificación crediticia.</p>
                <Link href={"/oportunidades/" + p.id} className="dc-btn dc-btn-secondary w-full">Ver oportunidad <span aria-hidden="true">↗</span></Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="dc-panel p-9">
          <h2 className="mb-3 text-xl font-bold text-white">{proyectos.length ? "No hay coincidencias" : "Aún no hay proyectos publicados tras revisión"}</h2>
          <p className="mb-6 text-sm leading-7 text-slate-400">{proyectos.length ? "Prueba con otra búsqueda." : "Puedes presentar tu idea y solicitar su revisión en DealCapital."}</p>
          {proyectos.length ? <button type="button" onClick={clear} className="dc-btn dc-btn-secondary">Limpiar filtros</button>
            : <Link href="/publicar" className="dc-btn dc-btn-primary">Presentar proyecto</Link>}
        </div>
      )}
    </>
  );
}
