import { supabase } from "../lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: proyectos } = await supabase.from("proyectos").select("*");

  const totalProyectos = proyectos?.length || 0;
  const capitalSolicitado =
    proyectos?.reduce((t, p) => t + Number(p.capital_requerido || 0), 0) || 0;
  const capitalRecaudado =
    proyectos?.reduce((t, p) => t + Number(p.monto_recaudado || 0), 0) || 0;
  const verificados =
    proyectos?.filter((p) => p.proyecto_verificado).length || 0;

  return (
    <main className="dc-home">
      <section className="dc-hero">
        <div className="dc-bg-glow-left" />
        <div className="dc-bg-glow-right" />
        <div className="dc-lines-left" />
        <div className="dc-lines-right" />

        <div className="dc-hero-inner">
          <div className="dc-badge">PLATAFORMA EN FASE MVP</div>

          <h1 className="dc-title">
            Conectamos emprendedores
            <br />
            e <span>inversionistas</span>
          </h1>

          <p className="dc-subtitle">
            DealCapital es una plataforma que conecta emprendedores que buscan
            financiamiento con inversionistas interesados en descubrir
            oportunidades de negocio reales.
          </p>

          <div className="dc-features">
            <Feature symbol="↗" title="Publica tu proyecto" text="Presenta tu idea y consigue financiamiento." />
            <Feature symbol="∞" title="Encuentra inversionistas" text="Accede a una red de inversionistas verificados." />
            <Feature symbol="◇" title="Conecta directamente" text="Comunicación directa entre emprendedores e inversores." />
            <Feature symbol="✓" title="Negocia sin intermediarios" text="Acuerdos transparentes y sin comisiones ocultas." />
          </div>

          <div className="dc-actions">
            <a href="/publicar" className="dc-btn-primary">
              Publicar Proyecto
            </a>

            <a href="/oportunidades" className="dc-btn-outline">
              Explorar Oportunidades
            </a>
          </div>

          <div className="dc-stats">
            <Stat symbol="▣" value={totalProyectos} label="Proyectos publicados" />
            <Stat symbol="∞" value="+" label="Inversionistas activos" />
            <Stat
              symbol="▤"
              value={`S/ ${capitalSolicitado.toLocaleString("es-PE")}`}
              label="Capital solicitado"
            />
            <Stat
              symbol="↗"
              value={`S/ ${capitalRecaudado.toLocaleString("es-PE")}`}
              label="Capital recaudado"
            />
            <Stat symbol="✓" value={verificados} label="Proyectos verificados" />
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ symbol, title, text }: any) {
  return (
    <div className="dc-feature-card">
      <div className="dc-feature-icon">{symbol}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Stat({ symbol, value, label }: any) {
  return (
    <div className="dc-stat-card">
      <div className="dc-stat-icon">{symbol}</div>
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  );
}