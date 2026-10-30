import BrandIcon from "./BrandIcon";

export default function DealNetwork() {
  return (
    <div className="dc-network" aria-label="Diagrama conceptual de conexiones entre emprendedores y potenciales inversionistas">
      <div className="dc-network-head">
        <div>
          <p className="dc-network-label">Conexiones · DealCapital</p>
          <h2>El valor está en conectar.</h2>
        </div>
        <span className="rounded-md border border-[#facc15]/25 px-2.5 py-1.5 text-[10px] font-bold text-[#facc15]">
          VISUALIZACIÓN
        </span>
      </div>
      <div className="dc-network-stage dc-dot-grid">
        <svg viewBox="0 0 480 310" role="img" aria-labelledby="dc-net-title">
          <title id="dc-net-title">Esquema ilustrativo que enlaza proyectos y personas interesadas</title>
          <defs>
            <linearGradient id="dc-net-line" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#facc15" stopOpacity=".82"/>
              <stop offset="1" stopColor="#facc15" stopOpacity=".19"/>
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#dc-net-line)" strokeWidth="1.5">
            <path d="M96 89 235 156 386 75M96 89 113 240 235 156 372 236 386 75"/>
            <path d="M113 240 372 236" strokeDasharray="4 8" opacity=".55"/>
            <path d="M235 156 240 40M235 156 245 270" strokeDasharray="3 7" opacity=".7"/>
          </g>
          <circle cx="235" cy="156" r="70" fill="#facc15" opacity=".045"/>
          <circle cx="235" cy="156" r="59" fill="none" stroke="#facc15" strokeOpacity=".27" strokeDasharray="2 7"/>
          <circle cx="235" cy="156" r="39" fill="#facc15" fillOpacity=".10" stroke="#facc15" strokeWidth="1.7"/>
          <circle cx="235" cy="156" r="24" fill="#facc15"/>
          <path d="M220 156h30M235 141v30" stroke="#020817" strokeWidth="3.2" strokeLinecap="round"/>
          {[
            {x:96,y:89,n:"PROYECTO",tx:30,ty:57},
            {x:386,y:75,n:"INVERSIÓN",tx:332,ty:43},
            {x:113,y:240,n:"IDEA",tx:66,ty:281},
            {x:372,y:236,n:"CONEXIÓN",tx:327,ty:279}
          ].map(n=>(
            <g key={n.n}>
              <circle cx={n.x} cy={n.y} r="25" fill="#0f172a" stroke="#facc15" strokeOpacity=".65" strokeWidth="1.5"/>
              <circle cx={n.x} cy={n.y} r="9" fill="none" stroke="#facc15" strokeWidth="1.7"/>
              <circle cx={n.x} cy={n.y} r="2.8" fill="#facc15"/>
              <text x={n.tx} y={n.ty} fontSize="10" fontWeight="700" letterSpacing="1.5" fill="#cbd5e1">{n.n}</text>
            </g>
          ))}
          <g fill="#facc15">
            <circle cx="240" cy="40" r="3"/><circle cx="245" cy="270" r="3"/>
          </g>
        </svg>
      </div>
      <div className="dc-network-foot">
        <span>Una red que comienza con una conversación.</span>
        <span className="dc-network-pill"><BrandIcon name="link" size={18}/> Conectar con criterio</span>
      </div>
    </div>
  );
}