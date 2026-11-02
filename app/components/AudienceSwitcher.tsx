"use client";

import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import BrandIcon from "./BrandIcon";

type Role = "emprendedor" | "inversionista";
const journeys = {
  emprendedor: {
    overline: "Para quienes están construyendo",
    title: "Tu idea merece una presentación a su altura.",
    description: "Comparte tu propuesta de valor, presenta la necesidad de capital y facilita que otras personas entiendan el potencial y los desafíos de tu negocio.",
    route: "/publicar",
    action: "Preparar mi proyecto",
    items: [
      { icon: "document" as const, text: "Organiza tu idea y modelo de negocio" },
      { icon: "scope" as const, text: "Explica el capital que necesitas" },
      { icon: "link" as const, text: "Conecta con posibles interesados" },
    ],
  },
  inversionista: {
    overline: "Para quienes buscan oportunidades",
    title: "Descubre proyectos con una mirada más clara.",
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
  const toggleWithArrow = (event: KeyboardEvent<HTMLDivElement>) => {
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
            <p className="dc-eyebrow mb-4">02 / Experiencia personalizada</p>
            <h2 id="dc-journey-title" className="dc-section-title">Dos perfiles. <em>Un punto de encuentro.</em></h2>
          </div>
          <div className="dc-role-tabs" role="tablist" aria-label="Ver recorrido según tu perfil" onKeyDown={toggleWithArrow}>
            <button type="button" role="tab" id="dc-role-entrepreneur"
              aria-selected={role === "emprendedor"} aria-controls="dc-role-panel" tabIndex={role === "emprendedor" ? 0 : -1}
              onClick={() => setRole("emprendedor")}
              className={"dc-role-tab" + (role === "emprendedor" ? " is-active" : "")}>
              Soy emprendedor
            </button>
            <button type="button" role="tab" id="dc-role-investor"
              aria-selected={role === "inversionista"} aria-controls="dc-role-panel" tabIndex={role === "inversionista" ? 0 : -1}
              onClick={() => setRole("inversionista")}
              className={"dc-role-tab" + (role === "inversionista" ? " is-active" : "")}>
              Soy inversionista
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