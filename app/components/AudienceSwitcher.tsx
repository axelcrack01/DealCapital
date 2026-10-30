"use client";

import Link from "next/link";
import { useState } from "react";
import BrandIcon from "./BrandIcon";

type Role = "emprendedor" | "inversionista";
const journeys = {
  emprendedor: {
    overline: "Una idea necesita una buena presentación",
    title: "Prepara el terreno para tu próxima conversación.",
    description: "Presenta qué estás construyendo, el problema que resuelves y el uso previsto del capital. Tu propuesta podrá revisarse antes de aparecer en el catálogo.",
    route: "/publicar",
    action: "Presentar un proyecto",
    items: [
      { icon: "document" as const, text: "Estructura tu propuesta y documentos" },
      { icon: "scope" as const, text: "Explica tu modelo y necesidad de capital" },
      { icon: "link" as const, text: "Conecta con personas interesadas" },
    ],
  },
  inversionista: {
    overline: "Descubre antes de decidir",
    title: "Explora proyectos con mejor contexto.",
    description: "Consulta la propuesta, el sector y los riesgos declarados. Usa esta información como punto de partida para hacer preguntas y realizar tu propia diligencia debida.",
    route: "/oportunidades",
    action: "Ver oportunidades",
    items: [
      { icon: "compass" as const, text: "Descubre propuestas por industria" },
      { icon: "document" as const, text: "Revisa los datos disponibles" },
      { icon: "message" as const, text: "Inicia una conversación informada" },
    ],
  },
};
export default function AudienceSwitcher() {
  const [role, setRole] = useState<Role>("emprendedor");
  const current = journeys[role];
  const toggleWithArrow = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const next = role === "emprendedor" ? "inversionista" : "emprendedor";
      setRole(next);
      document.getElementById(next === "emprendedor" ? "dc-role-entrepreneur" : "dc-role-investor")?.focus();
    }
  };
  return (
    <section className="dc-journey" aria-labelledby="dc-journey-title">
      <div className="dc-container">
        <div className="dc-journey-heading">
          <div>
            <p className="dc-eyebrow mb-4">Diseñado para ambos lados</p>
            <h2 id="dc-journey-title" className="dc-section-title">Un lugar. Dos caminos.</h2>
          </div>
          <div className="dc-role-tabs" role="tablist" aria-label="Ver recorrido según tu perfil" onKeyDown={toggleWithArrow}>
            <button type="button" role="tab" id="dc-role-entrepreneur"
              aria-selected={role === "emprendedor"} aria-controls="dc-role-panel" tabIndex={role === "emprendedor" ? 0 : -1}
              onClick={() => setRole("emprendedor")}
              className={"dc-role-tab" + (role === "emprendedor" ? " is-active" : "")}>
              Emprendedor
            </button>
            <button type="button" role="tab" id="dc-role-investor"
              aria-selected={role === "inversionista"} aria-controls="dc-role-panel" tabIndex={role === "inversionista" ? 0 : -1}
              onClick={() => setRole("inversionista")}
              className={"dc-role-tab" + (role === "inversionista" ? " is-active" : "")}>
              Inversionista
            </button>
          </div>
        </div>
        <div className="dc-journey-panel" id="dc-role-panel" role="tabpanel"
          aria-labelledby={role === "emprendedor" ? "dc-role-entrepreneur" : "dc-role-investor"}>
          <div className="dc-journey-main">
            <p className="dc-kicker">{current.overline}</p>
            <h3>{current.title}</h3>
            <p>{current.description}</p>
            <Link href={current.route} className="dc-btn dc-btn-primary">{current.action}<BrandIcon name="arrow" size={18}/></Link>
          </div>
          <ol className="dc-journey-list">
            {current.items.map((item, index) => (
              <li key={item.text}>
                <span className="dc-journey-icon"><BrandIcon name={item.icon} size={27}/></span>
                <span>{item.text}</span>
                <small>0{index+1}</small>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}