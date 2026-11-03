"use client";

import {useState} from "react";
import {supabase} from "../../lib/supabase";

type PrivateDocument = {label:string;bucket:"Documentos"|"pitch-decks";objectKey:string};

export default function AdminPrivateDocuments({documentoPdf,pitchDeck}:{
  documentoPdf:string|null;
  pitchDeck:string|null;
}) {
  const [links,setLinks]=useState<Record<string,{url:string; expiresAt:number}>>({});
  const [busy,setBusy]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);

  const documents:PrivateDocument[]=[
    ...(pitchDeck&&!/^https?:\/\//i.test(pitchDeck)
      ?[{label:"Pitch deck",bucket:"pitch-decks" as const,objectKey:pitchDeck}]:[]),
    ...(documentoPdf&&!/^https?:\/\//i.test(documentoPdf)
      ?[{label:"Documento",bucket:"Documentos" as const,objectKey:documentoPdf}]:[])
  ];

  const access = async(doc:PrivateDocument)=>{
    setBusy(doc.bucket);
    setError(null);
    // Never make Storage URLs permanent or persist them into the database.
    const {data,error:accessError}=await supabase.storage.from(doc.bucket)
      .createSignedUrl(doc.objectKey,120);
    if(accessError||!data?.signedUrl){
      setError("No se pudo obtener acceso privado al archivo.");
    }else{
      setLinks(prev=>({...prev,[doc.bucket]:{url:data.signedUrl,expiresAt:Date.now()+110000}}));
    }
    setBusy(null);
  };

  if(!documents.length)return <span className="block text-[11px] text-[#8c9cb1]">Sin PDF privado</span>;
  return <div className="mt-3 space-y-2">
    <span className="block text-[11px] font-bold text-[#bfd0e2]">Documentación restringida</span>
    {documents.map(doc=>{
      const link=links[doc.bucket];
      const active=link&&link.expiresAt>Date.now();
      return <div key={doc.bucket} className="text-[11px]">
        {active ? <a href={link.url} target="_blank" rel="noopener noreferrer"
          className="font-bold text-[#facc15] underline underline-offset-2">{doc.label} (enlace temporal)</a>
        : <button type="button" disabled={busy!==null} onClick={()=>void access(doc)}
          className="text-[#facc15] underline underline-offset-2 disabled:opacity-50">
          {busy===doc.bucket?"Generando acceso…":"Abrir "+doc.label}
        </button>}
      </div>;
    })}
    {error&&<p role="alert" className="max-w-64 text-[11px] text-rose-300">{error}</p>}
  </div>;
}
