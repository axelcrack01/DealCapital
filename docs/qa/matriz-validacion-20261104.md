# DealCapital — matriz de validación de funcionalidades (4 nov 2026)

Este archivo distingue **pruebas codificadas**, **ejecuciones reales** y **cobertura pendiente**. No representa una certificación de seguridad.

## Alcance por capa

| ID | Requisito de negocio | Capa | Archivo / evidencia | Estado |
|---|---|---|---|---|
| AUTH-01 | Login muestra campos obligatorios | Selenium público | `test_login_form_has_required_fields` | Probado (ejecución #3) |
| AUTH-02 | Registro exige 12 caracteres y consentimiento | Selenium público | `test_registration_requires_consent_and_secure_password` | Probado (ejecución #3) |
| AUTH-03 | Login con cuentas reales de QA por rol | Selenium autenticado | `login` / tests `auth` | No ejecutado: faltan cuentas sintéticas |
| AUTH-04 | Recuperación/caducidad de sesión | E2E | Sin escenario automatizado | No probado |
| RBAC-01 | Visitantes excluidos de áreas privadas | Selenium público | `test_anonymous_private_workspace_redirects_to_login` | Aprobado: Selenium Chrome 22/22 en run #41902023738 |
| RBAC-02 | Visitantes excluidos de administración | Selenium público | `test_anonymous_admin_*` | Aprobado: Selenium Chrome 22/22 en run #41902023738 |
| RBAC-03 | Emprendedor/inversionista no administran | Selenium autenticado | `test_entrepreneur_cannot_*`, `test_investor_cannot_*` | No ejecutado: faltan cuentas sintéticas |
| PUB-01 | Catálogo público y filtros | Selenium público | `test_opportunity_*` | Aprobado: Selenium Chrome 22/22 en run #41902023738 |
| PUB-02 | Proyecto no aprobado no es público | Selenium staging | `test_staging_project_review_documents_interest_and_commitment` | No ejecutado: staging requerido |
| PUB-03 | Publicación y revisión del administrador | Selenium staging | Mismo recorrido | No ejecutado: staging requerido |
| PUB-04 | Rechazo razonado y conservación de auditoría | SQL de regresión / E2E | SQL anterior; sin recorrido UI completo | Parcial |
| PUB-05 | Duplicados de proyecto y eliminación | Integración/E2E | Controles anteriores, sin UI E2E | Parcial |
| VER-01 | Solicitudes y estados por rol | SQL + Selenium | QA SQL anterior; tests `auth` | SQL aprobado; navegador pendiente |
| VER-02 | Subsanación y cierre | SQL + Selenium staging | QA SQL anterior; staging test | SQL aprobado; navegador pendiente |
| VER-03 | Auditoría y notificaciones del ciclo | SQL + Selenium staging | QA SQL anterior; staging test | SQL aprobado; navegador pendiente |
| DOC-01 | Inputs de PDF y restricciones visibles | Selenium autenticado | `test_entrepreneur_can_open_project_submission_without_writing` | No ejecutado: cuenta sintética requerida |
| DOC-02 | Enlace firmado y no acceso anónimo | Selenium staging | PDF sintético / URL sin token | No ejecutado: staging requerido |
| DOC-03 | Enlaces privados ausentes de detalle público | Selenium público | `test_public_project_detail_never_links_private_storage` | Aprobado: Selenium Chrome 22/22 en run #41902023738 |
| DOC-04 | Descarga cruzada, vencimiento real y borrado seguro | Seguridad/E2E | Sin recorrido completo | No probado |
| INT-01 | Formulario interés y compromiso visible | Selenium público | `test_public_investment_forms_are_readable_but_not_submitted` | Aprobado: Selenium Chrome 22/22 en run #41902023738 |
| INT-02 | Interés crea conversación y primer mensaje | Selenium staging | Recorrido completo | No ejecutado: staging requerido |
| INT-03 | Compromiso sintético y notificaciones | Selenium staging | Recorrido completo | No ejecutado: staging requerido |
| INT-04 | Cancelación/aceptación de compromisos | E2E | Sin caso aislado | No probado |
| NOT-01 | Centro notificaciones y controles de lectura | Selenium y SQL | Anon + auth + scripts SQL previos | Parcial |
| QA-01 | Smoke Chrome en CI y reportes JUnit | GitHub Actions | `selenium-smoke.yml` | Aprobado en GitHub Actions run #41902023738 (22/22, 18 no ejecutadas) |
| QA-02 | Evidencia real de roles y transacciones | GitHub Actions manual protegido | `selenium-staging.yml` | Configuración preparada, no ejecutada |
| QA-03 | Rendimiento, carga y accesibilidad | P1 | Sin ejecución formal | No probado |

## Qué significa cada estado

- **Probado:** se ejecutó con datos y entorno declarados, con evidencia de resultado.
- **Parcial:** solo una de las capas está cubierta o faltan variantes críticas.
- **No ejecutado:** existe código de prueba, pero sus precondiciones no están habilitadas.
- **No probado:** no existe un escenario suficiente para afirmar comportamiento.

## Evidencia y aceptación

- Smoke original aprobado en [GitHub Actions run #41899301458](https://github.com/axelcrack01/DealCapital/actions/runs/41899301458): 9 passed, 5 deselected.
- La expansión pública P0 fue aprobada en [GitHub Actions run #41902023738](https://github.com/axelcrack01/DealCapital/actions/runs/41902023738): 22 passed, 18 deselected (16 con sesión y 2 de staging).
- Los recorridos mutables exigen una instancia Supabase *distinta*, deployment QA, cuentas de pruebas por rol y un opt-in manual.
- No subir credenciales, capturas con información personal ni pruebas que escriban datos de inversión a producción.
- Criterio de cierre P0: **0 defectos críticos abiertos**, todos los tests por rol ejecutados, rutas de escritura verificadas con datos sintéticos en staging, descargas privadas y bloqueos de acceso cruzado comprobados.

Nota: probar los controles no implica identidad RENIEC/SBS, KYC/AML regulatorio, seguridad perfecta ni inversiones monetarias reales.
