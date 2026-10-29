# DealCapital — Plan de identidad, diligencia debida y asistente de IA (v0.1)

Estado: PROPUESTA DE ARQUITECTURA. No equivale a un convenio con RENIEC, SBS o SMV ni a controles en producción.

## Decisiones regulatorias y de producto

- **Identidad civil (RENIEC):** el DNI no se verifica con la SBS. Integración únicamente mediante proveedor con contrato válido / convenio con RENIEC. Un cotejo de DNI contra nombres no prueba posesión: incorporar autenticación de titular (p. ej. biometría por canal autorizado), antifraude y revisión manual.
- **Información crediticia (SBS):** el reporte crediticio pertenece a otra etapa; no se dispone de API abierta de acceso a cualquier DNI. Estudiar convenios o proveedor de información de riesgos con base legal, derechos del titular y autorización que corresponda. Nunca automatizar consultas al portal del usuario ni presentar los resultados como garantía de solvencia.
- **Financiamiento e inversión (SMV):** validar con asesor legal si el modelo concreto configura financiamiento participativo financiero. No custodiar fondos ni activar desembolsos sin evaluación.
- **Datos personales:** Ley 29733 y reglamento DS 016-2024-JUS vigente desde 31/03/2025. Elaborar aviso de privacidad y base legal específica antes de tratar DNI, biometría o reportes de crédito; controlar finalidad, acceso, retención, derechos ARCO y transferencias.
- **No hay alianza con organismos:** no mostrar logos ni textos como “certificado por SBS/RENIEC” sin la acreditación formal.

Fuentes oficiales:
- https://www.gob.pe/13549-solicitar-acceso-al-servicio-de-verificacion-de-identidad-de-personas-en-reniec-utilizar-web-service-de-datos
- https://www.gob.pe/13551-solicitar-acceso-al-servicio-de-verificacion-de-identidad-de-personas-en-reniec-utilizar-web-service-biometrico-facial
- https://www.sbs.gob.pe/usuarios/nuestros-servicios/reporte-de-deudas
- https://www.smv.gob.pe/OrientacionyEducacion/FinanciamientoParticipativo.aspx
- https://www.gob.pe/institucion/anpd/campa%C3%B1as/128319-nuevo-reglamento-de-proteccion-de-datos-personales

## Flujo objetivo

1. Cuenta provisional: email, contraseña robusta, tipo emprendedor/inversionista, confirmación de correo.
2. Aviso de privacidad específico y consentimiento/otra base legal aplicable. La aceptación de contratos y las autorizaciones opcionales se registran por separado con versión y fecha.
3. DNI (8 dígitos) por formulario HTTPS -> endpoint de servidor autenticado, rate-limited; **no almacenar DNI crudo** en `profiles`, `user_metadata`, URL, logs ni analítica.
4. Servicio oficial autorizado: validar documento, devolver nombres/apellidos y fecha de nacimiento solo en campos permitidos. Mostrar al usuario datos para confirmar. **Edad** se calcula a partir de fecha de nacimiento para un propósito específico, nunca es prueba por sí sola.
5. Titularidad: verificación biométrica o mecanismo autorizado equivalente, con prueba de presencia si procede. No confundir una consulta de nombre con identidad verificada.
6. Perfil: atributos oficiales de solo lectura, separados de biografía/cargo/teléfono proporcionados por el usuario.
7. Verificación de negocio: RUC/SUNAT, representación, documentos societarios y propiedad/control según necesidad, con revisión humana.
8. Revisión del riesgo: historial autorizado, vigencia de fuentes, inconsistencias, factores documentados y derecho de rectificación. No hacer público ningún reporte de deuda.
9. Solo después de verificaciones aplicables, autorización de publicación, visualización de documentos restringidos o manifestación de interés, de acuerdo con roles y reglas del negocio.

## Seguridad y protección contra fraude

- Usar servidor para intercambios con RENIEC/proveedor: credenciales en variables de entorno **sin NEXT_PUBLIC_**. No exponer tokens ni claves de servicio al navegador.
- Implementar RLS en todas las tablas; permisos de administración en funciones/backend con evaluación de claims confiables. Las columnas `perfil_verificado`, `empresa_verificada`, `rol` y estatus KYC no deben ser editables mediante APIs públicas de Supabase.
- Activar MFA para administradores y usuarios de alto riesgo, límites de intentos, eventos auditables, control de dispositivos y alerta de cambios.
- No usar un hash sin clave de DNI (espacio pequeño, fuerza bruta fácil). Usar HMAC-SHA256 con secreto de servidor bajo rotación para un identificador seudonimizado y separado; retener únicamente últimos 4 dígitos para visualización si es necesario.
- Documentos financieros y biometría en almacenamiento privado/cifrado con URLs de corta vida y mínimo acceso; preferir no conservar imágenes biométricas en DealCapital.
- Estados separados: email_confirmado, identidad_verificada, empresa_verificada, diligencia_financiera_completada, habilitado_operaciones. `perfil_verificado` antiguo NO es prueba RENIEC.
- El rechazo automático solo por score crediticio o falta de historial es improcedente sin revisión de contexto. Permitir revisión humana y recurso/corrección.
- Monitorizar incidentes y preparar procedimiento de respuesta, borrado y retención. No guardar reportes enteros sin necesidad y base jurídica.

## Contrato del proveedor de identidad (pendiente de autorización)

`POST /api/identity/verify` (futuro; no implementado): requiere sesión, CSRF/origin check, limitación de solicitudes, consentimiento válido. Entrada `{ documentType: "DNI", documentNumber: "12345678" }`. Respuesta solo a titular autenticado: `{ status: "pending" | "verified" | "failed", profile: { firstNames, paternalSurname, maternalSurname } }`. Cualquier fecha de nacimiento se mostrará solo si el proveedor y la finalidad lo permiten. Nunca aceptar `verified:true` del navegador.

La aplicación NO debe llamar a esa ruta hasta la contratación/autorización efectiva del proveedor y las pruebas de seguridad.

## Agente IA — due diligence asistida (fase posterior)

Entradas permitidas: ficha de proyecto, constitución y RUC verificados, pitch deck y documentos consentidos, historial de ingresos/caja aportado, riesgos declarados, informes externos autorizados. Extracción con evidencia de origen, fecha, tabla de hallazgos e incertidumbres. Salida: resumen de negocio, hechos verificados vs declarados, inconsistencias, documentos faltantes, riesgos, preguntas de diligencia debida y citas a evidencias. Nada de inventar calificaciones SBS, deudas o datos ausentes. La IA no toma decisiones finales de inversión ni garantiza ausencia de fraude.

## Criterios de aceptación antes de activar DNI

- [ ] Acuerdo legal con proveedor y alcance preciso de atributos.
- [ ] Informe de tratamiento de datos (finalidad, legitimación, consentimiento cuando aplique, retención).
- [ ] Endpoint autenticado, rate limit, protección contra enumeración y pruebas con datos sintéticos.
- [ ] Pruebas de seguridad RLS por roles, incluyendo imposibilidad de autoasignarse insignias.
- [ ] Verificación de titularidad además del cotejo documental.
- [ ] Servicio no disponible = usuario sigue en estado pendiente; NO se marca verificado.
- [ ] Auditoría y procedimientos de reclamación, rectificación y eliminación.
- [ ] Revisión legal del encaje SMV según operaciones habilitadas.
