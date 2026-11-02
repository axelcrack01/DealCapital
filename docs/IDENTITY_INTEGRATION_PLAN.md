# DealCapital Identity — Plan de integración y seguridad

**Estado:** fundación de UI y contratos técnicos sin servicios conectados. No se recolectan DNI, selfies, biometría, documentos ni reportes SBS. No se ha cambiado Supabase.

## Fase 0: requisitos obligatorios

1. Corregir la política RLS de profiles: hoy permite al propietario modificar los campos sensibles rol, perfil_verificado y empresa_verificada.
2. Corregir la política RLS de proyectos: el propietario puede alterar proyecto_verificado. Los distintivos no deben basarse en datos autoeditables.
3. Establecer una fuente de autorización administrativa controlada por el servidor (p. ej. app_metadata o tabla protegida) y reforzar todos los endpoints con autorización y auditoría.
4. Definir finalidad, legitimación del tratamiento, información al titular, retención, revocación, seguridad y respuesta a solicitudes de privacidad. Obtener revisión legal en Perú.
5. Determinar con asesoría el alcance regulatorio de DealCapital respecto de la SMV antes de intermediar financiamiento.

## Fase 1: implementado

- Ruta /identidad: tres fases informativas, con límites y requisitos.
- Rutas /verificacion y /registro: acceso informativo al programa.
- GET /api/identity/capabilities: manifiesta que las integraciones no están disponibles y que no se aceptan datos personales.
- lib/identity/provider-contract.ts: interfaz tipada, todavía sin implementación de proveedores.

## Fase 2: integración oficial, pendiente

1. RENIEC: solicitar acceso a un mecanismo autorizado y verificar alcance, contrato, costos, seguridad y compatibilidad. No asumir una API pública libre.
2. Crédito: contratar fuente autorizada o diseñar un flujo seguro de aportes voluntarios del titular, con validación de autenticidad y finalidad. No afirmar acceso directo a SBS sin contrato.
3. Crear adaptadores server-to-server, guardar credenciales únicamente en secret manager del backend, añadir protección anti-replay, rate limits, control del propietario, idempotencia y trazabilidad.
4. No guardar DNI, fotos biométricas o reportes crediticios sin necesidad justificada y controles adecuados; preferir identificadores opacos y estados.
5. No permitir que un usuario se apruebe o revise a sí mismo. Registrar actor, fecha, fuente, consentimiento, alcance y caducidad.
6. Mantener distinción entre identidad comprobada, empresa revisada e información financiera evaluada, sin promesas de solvencia o rentabilidad.

## Modelo conceptual futuro, NO ejecutado

- identity_checks: id, subject_id, capability, provider_code, state, created_at, expires_at, evidence_reference
- identity_consents: id, subject_id, purpose_code, legal_text_version, accepted_at, revoked_at
- identity_audit_events: id, actor_id, check_id, action, occurred_at, trace_id

Usar esquema privado o RLS estricta. Proteger updates de columnas de estado. No exponer datos identificatorios en URLs, client-side logs, telemetry o respuestas públicas.

## Criterios de aceptación

- Un usuario normal no puede autoconcederse admin ni actualizar un distintivo.
- Un usuario no puede consultar comprobaciones de otros.
- No se expone service_role ni secretos de proveedores al navegador.
- No se envían documentos antes de contar con proveedor, base legal y almacenamiento adecuado.
- Se verifican errores, timeouts, rechazos y controles manuales con pruebas de varios roles.
- Los distintivos indican solo verificaciones realmente completadas y vigentes.
