"use client";

import { useState } from "react";

export default function OportunidadesClient({ proyectos }: { proyectos: any[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [riesgo, setRiesgo] = useState("");
  const [industria, setIndustria] = useState("");
  const [orden, setOrden] = useState("recientes");

  const proyectosFiltrados = proyectos.filter((p) => {
    const coincideBusqueda =
      p.nombre_proyecto?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());

    const coincideRiesgo = riesgo ? p.riesgo === riesgo : true;

    const coincideIndustria = industria
      ? p.industria?.toLowerCase().includes(industria.toLowerCase())
      : true;

    return coincideBusqueda && coincideRiesgo && coincideIndustria;
  });

  const proyectosOrdenados = [...proyectosFiltrados].sort((a, b) => {
    if (orden === "mayorCapital") {
      return Number(b.capital_requerido || 0) - Number(a.capital_requerido || 0);
    }

    if (orden === "menorCapital") {
      return Number(a.capital_requerido || 0) - Number(b.capital_requerido || 0);
    }

    if (orden === "mayorProgreso") {
      const progresoA =
        Number(a.capital_requerido || 0) > 0
          ? Number(a.monto_recaudado || 0) / Number(a.capital_requerido)
          : 0;

      const progresoB =
        Number(b.capital_requerido || 0) > 0
          ? Number(b.monto_recaudado || 0) / Number(b.capital_requerido)
          : 0;

      return progresoB - progresoA;
    }

    return 0;
  });

  return (
    <>
      <div className="bg-slate-900 p-6 rounded-2xl mb-10 grid md:grid-cols-4 gap-4">
        <input
          placeholder="Buscar proyecto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="p-4 rounded-xl bg-slate-800"
        />

        <input
          placeholder="Filtrar por industria..."
          value={industria}
          onChange={(e) => setIndustria(e.target.value)}
          className="p-4 rounded-xl bg-slate-800"
        />

        <select
          value={riesgo}
          onChange={(e) => setRiesgo(e.target.value)}
          className="p-4 rounded-xl bg-slate-800"
        >
          <option value="">Todos los riesgos</option>
          <option value="Bajo">Riesgo bajo</option>
          <option value="Medio">Riesgo medio</option>
          <option value="Alto">Riesgo alto</option>
        </select>

        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          className="p-4 rounded-xl bg-slate-800"
        >
          <option value="recientes">Más recientes</option>
          <option value="mayorCapital">Mayor capital</option>
          <option value="menorCapital">Menor capital</option>
          <option value="mayorProgreso">Mayor progreso</option>
        </select>
      </div>

      <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-8">
        {proyectosOrdenados.map((proyecto) => {
          const progreso =
            Number(proyecto.capital_requerido || 0) > 0
              ? Math.min(
                  (Number(proyecto.monto_recaudado || 0) /
                    Number(proyecto.capital_requerido)) *
                    100,
                  100
                )
              : 0;

          return (
            <div
              key={proyecto.id}
              className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-yellow-500 transition-all hover:-translate-y-1"
            >
              {proyecto.imagen_url ? (
                <img
                  src={proyecto.imagen_url}
                  alt={proyecto.nombre_proyecto}
                  className="w-full h-56 object-cover"
                />
              ) : (
                <div className="w-full h-56 bg-slate-800 flex items-center justify-center">
                  <span className="text-slate-500">Sin imagen</span>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  {proyecto.logo_url ? (
                    <img
                      src={proyecto.logo_url}
                      alt="Logo"
                      className="w-16 h-16 rounded-2xl bg-white object-cover p-2"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                      🚀
                    </div>
                  )}

                  <div>
                    <h2 className="text-2xl font-bold">
                      {proyecto.nombre_proyecto}
                    </h2>

                    <p className="text-yellow-400 text-sm">
                      {proyecto.industria || "Proyecto"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  {proyecto.proyecto_verificado && (
                    <span className="bg-green-600 px-3 py-1 rounded-full text-xs">
                      ✅ Verificado
                    </span>
                  )}

                  {proyecto.riesgo && (
                    <span className="bg-slate-800 px-3 py-1 rounded-full text-xs">
                      Riesgo: {proyecto.riesgo}
                    </span>
                  )}

                  {proyecto.roi_estimado && (
                    <span className="bg-slate-800 px-3 py-1 rounded-full text-xs">
                      ROI: {proyecto.roi_estimado}
                    </span>
                  )}
                </div>

                <p className="text-slate-300 mb-6 line-clamp-3">
                  {proyecto.descripcion}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-800 p-3 rounded-xl">
                    <p className="text-slate-400 text-sm">Capital</p>
                    <p className="font-bold">
                      S/{" "}
                      {Number(proyecto.capital_requerido || 0).toLocaleString(
                        "es-PE"
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-800 p-3 rounded-xl">
                    <p className="text-slate-400 text-sm">Recaudado</p>
                    <p className="font-bold">
                      S/{" "}
                      {Number(proyecto.monto_recaudado || 0).toLocaleString(
                        "es-PE"
                      )}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Financiamiento</span>
                    <span>{Math.round(progreso)}%</span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-3">
                    <div
                      className="bg-yellow-500 h-3 rounded-full"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>

                <a
                  href={`/oportunidades/${proyecto.id}`}
                  className="block text-center w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold transition"
                >
                  Ver oportunidad
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {proyectosOrdenados.length === 0 && (
        <p className="text-slate-400 mt-10">
          No se encontraron oportunidades con esos filtros.
        </p>
      )}
    </>
  );
}