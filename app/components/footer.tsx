export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-10">

        <div className="grid md:grid-cols-3 gap-8">

          {/* Marca */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-3">
              DealCapital
            </h3>

            <p className="text-slate-400">
              Conectamos emprendedores con inversionistas para impulsar
              proyectos con potencial de crecimiento.
            </p>
          </div>

          {/* Enlaces */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">
              Navegación
            </h4>

            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="/">Inicio</a>
              </li>

              <li>
                <a href="/oportunidades">Oportunidades</a>
              </li>

              <li>
                <a href="/publicar">Publicar Proyecto</a>
              </li>

              <li>
                <a href="/nosotros">Nosotros</a>
              </li>

              <li>
                <a href="/contacto">Contacto</a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">
              Contacto
            </h4>

            <ul className="space-y-2 text-slate-400">
              <li>contacto@dealcapital.pe</li>
              <li>Lima, Perú</li>
              <li>
                <a href="https://www.linkedin.com/company/dealcapital/?lipi=urn%3Ali%3Apage%3Ad_flagship3_search_srp_all%3B6yCEOgq0TbK34KPHvA%2F5rg%3D%3D">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-center text-slate-500">
          © 2026 DealCapital. Todos los derechos reservados.
        </div>

      </div>
    </footer>
  );
}