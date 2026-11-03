"use client";

import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";

type Run={
 id:string;
 status:"started"|"passed"|"failed";
 uploaded:boolean;
 downloaded_verified:boolean;
 deleted_verified:boolean;
 error_code:string|null;
 started_at:string;
 finished_at:string|null;
};
type Result={
 status:"passed"|"failed"|"inconclusive";
 run_id?:string;
 uploaded?:boolean;
 downloaded_verified?:boolean;
 deleted_verified?:boolean;
 duration_ms?:number;
 error_code?:string|null;
};
const formatTime=(iso:string)=>new Intl.DateTimeFormat("es-PE",{
 dateStyle:"short",timeStyle:"short",timeZone:"America/Lima"
}).format(new Date(iso));

export default function AdminSyntheticStorageQA(){
 const [confirmed,setConfirmed]=useState(false);
 const [running,setRunning]=useState(false);
 const [history,setHistory]=useState<Run[]>([]);
 const [historyError,setHistoryError]=useState(false);
 const [result,setResult]=useState<Result|null>(null);
 const [error,setError]=useState<string|null>(null);

 const loadHistory=async()=>{
   const {data,error:historyError}=await supabase.rpc(
     "dc_admin_storage_qa_history",{p_limit:10}
   );
   setHistoryError(!!historyError);
   if(!historyError)setHistory((data||[]) as Run[]);
 };
 useEffect(()=>{void loadHistory();},[]);

 const run=async()=>{
   if(running||!confirmed)return;
   setRunning(true);setError(null);setResult(null);
   try{
     const {data:auth,error:authError}=await supabase.auth.getUser();
     if(authError||auth.user?.app_metadata?.role!=="admin"){
       setError("La cuenta actual no tiene permisos administrativos confiables.");
       return;
     }
     const {data, error:callError}=await supabase.functions.invoke(
       "dc-storage-synthetic-qa",{body:{action:"run"}}
     );
     if(callError){
       // A non-200 response from an Edge Function can contain a structured
       // failure record. The server never exposes credentials or object names.
       let details:Result|null=null;
       try{
         const context=(callError as {context?:unknown}).context;
         if(context instanceof Response)details=(await context.json()) as Result;
       }catch{}
       if(details?.status==="failed"||details?.status==="inconclusive")setResult(details);
       setError("La prueba no se completó correctamente. Revisa las fases y el historial privado; si la ejecutaste hace menos de un minuto, respeta el intervalo de seguridad.");
       return;
     }
     if(!data||typeof data!=="object"||data.synthetic_pdf!==true||
       !["passed","failed","inconclusive"].includes(data.status)){
       setError("La función respondió con un formato inesperado.");
       return;
     }
     setResult(data as Result);
   }catch{
     setError("No fue posible completar la prueba con Supabase.");
   }finally{
     setRunning(false);
     setConfirmed(false);
     await loadHistory();
   }
 };

 return <section className="rounded-2xl border border-[#334660] bg-[#0e2039] p-6 lg:col-span-2"
  aria-labelledby="dc-synthetic-storage-title">
   <p className="text-[11px] font-bold uppercase tracking-widest text-[#facc15]">QA operacional</p>
   <h3 id="dc-synthetic-storage-title" className="mt-2 text-xl font-bold">
     Prueba física de PDF sintético
   </h3>
   <p className="mt-3 max-w-3xl text-xs leading-6 text-[#b6c9dd]">
     Ejecuta una subida, lectura íntegra y eliminación verificable de un PDF generado
     automáticamente dentro del bucket privado de pruebas <strong>dealcapital-qa</strong>.
     No utiliza expedientes ni archivos de emprendedores y no modifica proyectos.
   </p>
   <div className="mt-4 flex flex-wrap items-start gap-4">
     <label className="flex max-w-lg items-start gap-2 text-xs leading-5 text-[#d6e1ed]">
       <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}
         className="mt-1 accent-[#facc15]"/>
       Autorizo crear y retirar únicamente el archivo sintético de QA. No se realizará
       ninguna eliminación de documentos comerciales.
     </label>
     <button type="button" disabled={running||!confirmed} onClick={()=>void run()}
       className="shrink-0 rounded-lg bg-[#facc15] px-4 py-2.5 text-xs font-extrabold text-[#051326] disabled:cursor-not-allowed disabled:opacity-45">
       {running?"Ejecutando pruebas…":"Probar subida, lectura y eliminación"}
     </button>
   </div>
   <p className="mt-2 text-[11px] text-[#99acc2]">
     Control: una ejecución por minuto y registro de cada resultado. El archivo de QA
     se limpia también cuando falla una fase, siempre que Storage responda.
   </p>
   {error&&<p role="alert" className="mt-4 rounded-lg border border-rose-500/40 bg-rose-950/20 p-3 text-xs leading-6 text-rose-200">
     {error}
   </p>}
   {result&&<div role="status" className="mt-4 rounded-xl border border-[#3e546f] p-4">
     <strong className={"text-sm "+(result.status==="passed"?"text-emerald-200":"text-amber-200")}>
       {result.status==="passed"?"Prueba sintética superada":"Prueba no superada o no concluyente"}
     </strong>
     <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
       <p>Subida: {result.uploaded?"Verificada":"Sin confirmar"}</p>
       <p>Lectura íntegra: {result.downloaded_verified?"Verificada":"Sin confirmar"}</p>
       <p>Eliminación: {result.deleted_verified?"Verificada":"Sin confirmar"}</p>
     </div>
     {typeof result.duration_ms==="number"&&
       <p className="mt-3 text-[11px] text-[#b4c5d7]">Duración: {result.duration_ms} ms</p>}
     {result.error_code&&<p className="mt-2 text-[11px] text-amber-200">
       Código de incidencia: {result.error_code}
     </p>}
     <p className="mt-3 text-[11px] leading-5 text-[#b8c8db]">
       No sustituye la validación de la purga de propuestas, sus periodos de conservación
       ni las autorizaciones de expedientes reales.
     </p>
   </div>}
   <div className="mt-6 border-t border-[#334760] pt-4">
     <h4 className="text-xs font-bold text-white">Últimas comprobaciones registradas</h4>
     {historyError?<p className="mt-3 text-xs text-rose-300">No se pudo consultar el historial privado.</p>
     :history.length===0?<p className="mt-3 text-xs text-[#9db2ca]">
       Aún no hay pruebas registradas. Se ejecutan exclusivamente cuando el administrador las solicita.
     </p>:<div className="mt-3 divide-y divide-[#2b405a]">
       {history.map(run=><div key={run.id} className="flex flex-wrap justify-between gap-2 py-3 text-[11px]">
         <span className="text-[#c6d6e7]">{formatTime(run.started_at)}</span>
         <span className={run.status==="passed"?"font-bold text-emerald-200":"text-amber-200"}>
           {run.status==="passed"?"Correcta":run.status==="failed"?"Con incidencia":"Interrumpida"}
         </span>
         <span className="text-[#a1b4cc]">
           Subida {run.uploaded?"OK":"—"} · Lectura {run.downloaded_verified?"OK":"—"} · Eliminación {run.deleted_verified?"OK":"—"}
         </span>
       </div>)}
     </div>}
   </div>
 </section>;
}
