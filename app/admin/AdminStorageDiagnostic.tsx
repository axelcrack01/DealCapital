"use client";

import {useState} from "react";
import {supabase} from "../../lib/supabase";

type Check = {
  bucket:string;
  private:boolean;
  pdf_only:boolean;
  service_access:boolean;
  passed:boolean;
};
type Diagnostic = {
  status:"ready"|"storage_configuration_issue";
  auth_verified:boolean;
  trusted_admin_verified:boolean;
  private_storage_ready:boolean;
  checks:Check[];
  destructive_test_performed:false;
  note:string;
};

export default function AdminStorageDiagnostic(){
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState<Diagnostic|null>(null);
  const [error,setError]=useState<string|null>(null);

  const run=async()=>{
    if(loading)return;
    setLoading(true);
    setResult(null);
    setError(null);
    try{
      const {data:userData,error:userError}=await supabase.auth.getUser();
      if(userError||userData.user?.app_metadata?.role!=="admin"){
        setError("Tu sesión no cuenta con permisos administrativos confiables.");
        return;
      }
      const {data,error:diagnosticError}=await supabase.functions.invoke(
        "dc-retire-private-documents",
        {body:{mode:"diagnostic"}}
      );
      if(diagnosticError||!data||typeof data!=="object"||!Array.isArray(data.checks)){
        setError("No se pudo completar la prueba de autenticación y Storage. Verifica que la sesión esté vigente y que la función Edge esté disponible.");
        return;
      }
      const response=data as Diagnostic;
      if(!["ready","storage_configuration_issue"].includes(response.status)){
        setError("La función respondió con un formato inesperado.");
        return;
      }
      setResult(response);
    }catch{
      setError("La comprobación no pudo comunicarse con Supabase.");
    }finally{
      setLoading(false);
    }
  };

  return <section className="rounded-2xl border border-[#334660] bg-[#0e2039] p-6 lg:col-span-2"
    aria-labelledby="dc-storage-check-title">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#facc15]">Seguridad técnica</p>
        <h3 id="dc-storage-check-title" className="mt-2 text-xl font-bold">
          Diagnóstico de documentos privados
        </h3>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-[#c3d3e4]">
          Comprueba tu sesión, la autorización de administrador y la configuración de los buckets
          Documentos y pitch-decks. La prueba no crea registros, no sube archivos y no ejecuta eliminaciones.
        </p>
      </div>
      <button type="button" disabled={loading} onClick={()=>void run()}
        className="rounded-lg bg-[#facc15] px-4 py-3 text-xs font-extrabold text-[#061226] disabled:opacity-50">
        {loading?"Comprobando…":"Ejecutar prueba segura"}
      </button>
    </div>
    {error&&<p role="alert" className="mt-4 rounded-lg border border-rose-600/50 bg-rose-900/20 p-3 text-xs leading-6 text-rose-200">{error}</p>}
    {result&&<div role="status" className="mt-5 rounded-xl border border-[#405572] p-4">
      <p className={"text-sm font-bold "+(result.private_storage_ready?"text-emerald-200":"text-amber-200")}>
        {result.private_storage_ready?"Conexión y configuración básica verificadas":"Se requieren correcciones en Storage"}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {result.checks.map(check=><div key={check.bucket}
          className="rounded-lg border border-[#405572] bg-[#081a30] p-3">
          <p className="text-xs font-bold text-white">{check.bucket}</p>
          <p className="mt-2 text-[11px] leading-5 text-[#c3d3e4]">
            Bucket privado: {check.private?"Sí":"No"}.
            Exclusivamente PDF: {check.pdf_only?"Sí":"No"}.
            Acceso de servicio: {check.service_access?"Correcto":"Error"}.
          </p>
        </div>)}
      </div>
      <p className="mt-4 text-xs leading-6 text-[#d0deed]">
        Esta comprobación no certifica una subida o eliminación física real.
        Para completar esa prueba se necesita un PDF de QA y una sesión autorizada.
      </p>
    </div>}
    <div className="mt-5 border-t border-[#334760] pt-4">
      <p className="text-xs font-semibold text-white">Protección contra contraseñas filtradas</p>
      <p className="mt-2 max-w-3xl text-xs leading-6 text-[#b2c5db]">
        Supabase la ofrece en el plan Pro o superior. El registro de DealCapital requiere
        12 caracteres y confirmación como control adicional del formulario, pero no detecta
        contraseñas comprometidas. La política del servidor debe gestionarse en Supabase Auth.
      </p>
      <a href="https://supabase.com/dashboard/project/knsqqhucibferrvwjakv/auth/providers?provider=Email"
        target="_blank" rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-bold text-[#facc15] underline underline-offset-2">
        Abrir configuración de correo y contraseñas en Supabase
      </a>
    </div>
  </section>;
}
