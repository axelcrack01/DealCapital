"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BrandIcon from "./BrandIcon";

export type ProposalProject = {
  id: number;
  nombre_proyecto: string | null;
  industria: string | null;
  descripcion: string | null;
  capital_requerido: number | null;
};

const currency = (value: number) => new Intl.NumberFormat("es-PE", {
  style: "currency", currency: "PEN", maximumFractionDigits: 0,
}).format(value);

export default function ProposalCatalog({ projects, unavailable = false }: {
  projects: ProposalProject[];
  unavailable?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const industries = useMemo(() => Array.from(new Set(
    projects.map(p => p.industria).filter((v): v is string => Boolean(v))
  )).sort(), [projects]);

  const filtered = useMemo(() => projects.filter(p => {
    const q = search.trim().toLocaleLowerCase("es-PE");
    const text = [p.nombre_proyecto, p.descripcion, p.industria].filter(Boolean).join(" ").toLocaleLowerCase("es-PE");
    return (!q || text.includes(q)) && (!category || p.industria === category);
  }), [projects, search, category]);

  return (
    <div className="dc-up-catalog-ui" aria-label="Vista de oportunidades disponibles">
      <div className="dc-up-catalog-top">
        <strong>Explorar oportunidades</strong>
        <span>CATÁLOGO REAL</span>
      </div>
      <label className="dc-up-catalog-search">
        <span className="sr-only">Buscar proyectos destacados</span>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
        <input type="search" value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar por nombre, sector o propuesta..." />
      </label>
      <div className="dc-up-catalog-chips" role="group" aria-label="Filtrar proyectos por industria">
        <button type="button" onClick={()=>setCategory("")}
          aria-pressed={!category}>Todos</button>
        {industries.slice(0,4).map(i => (
          <button type="button" key={i} onClick={()=>setCategory(category===i?"":i)}
            aria-pressed={category===i}>{i}</button>
        ))}
      </div>
      <div className="dc-up-catalog-cards">
        {unavailable ? (
          <div className="dc-up-catalog-empty" role="status">
            <BrandIcon name="scope" size={30}/>
            <h3>El catálogo no está disponible.</h3>
            <p>Intenta acceder nuevamente desde la página de oportunidades.</p>
          </div>
        ) : filtered.length ? filtered.slice(0,2).map(p => (
          <Link key={p.id} href={"/oportunidades/"+p.id} className="dc-up-catalog-card">
            <span className="dc-up-catalog-icon"><BrandIcon name="venture" size={26}/></span>
            <span className="dc-up-card-industry">{p.industria || "Emprendimiento"}</span>
            <h3>{p.nombre_proyecto || "Proyecto"}</h3>
            <p>{p.descripcion || "Información en actualización."}</p>
            <div className="dc-up-card-foot">
              <small>Capital solicitado</small>
              <strong>{currency(Number(p.capital_requerido || 0))}</strong>
            </div>
          </Link>
        )) : (
          <div className="dc-up-catalog-empty" role="status">
            <BrandIcon name="compass" size={32}/>
            <h3>{projects.length ? "No hay coincidencias" : "Estamos preparando nuevas oportunidades."}</h3>
            <p>{projects.length ? "Prueba otro sector o término de búsqueda." : "Aún no hay proyectos publicados para mostrar en esta sección."}</p>
            {projects.length ? <button type="button" onClick={()=>{setCategory("");setSearch("");}}>Restablecer filtros</button>
              : <Link href="/publicar">Presentar mi proyecto <BrandIcon name="arrow" size={16}/></Link>}
          </div>
        )}
      </div>
      <div className="dc-up-catalog-note">
        <span>Datos publicados por sus responsables; no constituyen certificación financiera.</span>
        <Link href="/oportunidades">Ver todas <BrandIcon name="arrow" size={15}/></Link>
      </div>
    </div>
  );
}
