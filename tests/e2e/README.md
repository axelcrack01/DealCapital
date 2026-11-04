# DealCapital — Selenium E2E

Este conjunto valida navegación y permisos **desde un navegador real**, sin generar operaciones de inversión ni solicitudes de verificación. No sustituye pruebas unitarias de lógica aislada ni pruebas de integración SQL.

## Preparación (Windows / PowerShell)

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r tests/e2e/requirements.txt
$env:DC_BASE_URL = "https://deal-capital.vercel.app"
$env:DC_BROWSER = "edge" # o chrome
python -m pytest -m smoke --junitxml=test-results/selenium-public.xml
```

Selenium Manager gestiona el controlador Edge/Chrome cuando es necesario. Se necesita navegador y conectividad.

## Pruebas con cuentas dedicadas

Configura estas variables en el entorno local o en secretos de CI (nunca en Git):

- `DC_ENTREPRENEUR_EMAIL`, `DC_ENTREPRENEUR_PASSWORD`
- `DC_INVESTOR_EMAIL`, `DC_INVESTOR_PASSWORD`
- `DC_ADMIN_EMAIL`, `DC_ADMIN_PASSWORD`

Ejecuta:

```powershell
python -m pytest -m auth --junitxml=test-results/selenium-auth.xml
python -m pytest --junitxml=test-results/selenium-completo.xml
```

Las pruebas marcadas `auth` se omiten si no se configuran credenciales. **Una suite con pruebas omitidas NO certifica que el rol funciona.** La cuenta de administrador debe tener rol confiable en `auth.users.raw_app_meta_data`, no solo un atributo editable del perfil. No uses credenciales personales ni compartas contraseñas en el chat.

## Reglas de seguridad

- Todo es **solo lectura**, salvo el intento de autenticación. No pulsa botones que creen usuarios, proyectos, intereses, solicitudes o compromisos.
- Para probar ciclos que escriben datos (solicitud → observación → subsanación → cierre), usar un proyecto **staging aislado** con datos sintéticos, cuentas de prueba y limpieza verificada. No ejecutar ese ciclo sobre producción.
- Nunca interpretar pruebas `SKIPPED` como `PASSED`.
- Las capturas de fallos se guardan en `test-results/screenshots`. Pueden contener datos visibles de la cuenta: no publicarlas ni subirlas al repositorio.
- El reporte JUnit `test-results/*.xml` permite construir una matriz de cobertura: Passed / Failed / Skipped; cualquier funcionalidad sin escenario queda **Not Tested**.

## Cobertura y pendientes

| Módulo | Cobertura inicial | Falta |
|---|---|---|
| Landing, Login, Registro, Oportunidades, Verificación | Smoke UI | Responsive, accesibilidad, mensajes de error |
| Autenticación | Login de cuentas dedicadas | Recuperar contraseña, caducidad, reautenticación |
| Roles | Emprendedor, inversionista, administrador (lectura) | JWT firmado y llamadas RPC negativas |
| Solicitudes de verificación | Historial de emprendedor y cola admin | Escrituras en staging, estados y auditoría |
| Notificaciones | Apertura del centro | Nueva/leer/marcar todas, alertas en staging |
| Proyectos | Pantalla pública de oportunidades | Publicar, editar, aprobar, rechazar, duplicados |
| Documentos | Sin pruebas Selenium | Upload, MIME/tamaño, acceso cruzado, firma, caducidad |
| Interés y compromisos | Sin pruebas Selenium | Flujo comercial, aceptación, cancelación, registros |
| Seguridad técnica | Complementa regresiones SQL existentes | CSP, cookies, RLS HTTP, rate limit, pruebas pentest |

## Criterio de calidad

Para cerrar P0: sin fallos críticos, ninguna prueba de autorización omitida, 100 % de los flujos críticos con evidencia real y resultados archivados. No se puede afirmar “todo validado” únicamente por compilar Vercel o por ejecutar `pytest -m smoke`.


## Extensión P0 — rutas críticas y negocio

El archivo `test_dealcapital_selenium.py` ahora también comprueba:
- Redirección anónima de `/publicar`, `/dashboard`, `/perfil`, `/mensajes` y `/compromisos`.
- Denegación de acceso a las dos vistas administrativas para visitantes.
- Búsqueda y limpieza de filtros, opciones de ordenamiento y manejo de IDs de proyectos inválidos.
- Campos de formularios de interés y compromisos, **sin enviar datos**.
- Enlaces de documentación privada ausentes de las vistas públicas (si existen proyectos aprobados).
- Navegación con cuentas de emprendedor, inversionista y administrador, y campos obligatorios de publicación de propuestas, sin modificarlas.

### Acceso a staging aislado

Los flujos de escritura completos se encuentran en `test_staging_workflows.py`. Contemplan:
1. Solicitud de revisión → observación → respuesta → cierre → notificaciones → auditoría.
2. Crear una propuesta sintética → subir PDF sintético → verificar enlace firmado → revisión administrativa → publicar → enviar interés → crear compromiso sintético.

**No los ejecutes sobre producción.** Para habilitarlos se requiere TODO lo siguiente:
- Una instancia **distinta** de Supabase con un project ref diferente del entorno de producción y migraciones aplicadas.
- Un deployment Vercel de QA cuyos `NEXT_PUBLIC_SUPABASE_URL` y clave anónima correspondan a esa instancia; usar Preview sin cambiar estas variables **no basta**.
- Cuentas sintéticas independientes con roles de emprendedor, inversionista y administrador.
- `DC_BASE_URL` igual a `DC_STAGING_BASE_URL` (URL HTTPS de staging).
- `DC_STAGING_SUPABASE_REF` de ese proyecto aislado.
- `DC_ALLOW_STAGING_MUTATIONS=YES_ISOLATED_STAGING` (opt-in). El test inspecciona el origen de las llamadas Supabase realizadas por el navegador y se niega a modificar la BD si coincide con la instancia productiva o no puede comprobarse.
- Un entorno protegido `qa-staging` en GitHub Actions que contenga las seis credenciales `DC_*_EMAIL`/`DC_*_PASSWORD`, además de las variables `DC_STAGING_BASE_URL` y `DC_STAGING_SUPABASE_REF`.

**Ejemplo en PowerShell, únicamente en un staging aislado:**

```powershell
$env:DC_BASE_URL = "https://qa-tu-dominio.example"
$env:DC_STAGING_BASE_URL = $env:DC_BASE_URL
$env:DC_STAGING_SUPABASE_REF = "ref_de_su_instancia_aislada"
$env:DC_ALLOW_STAGING_MUTATIONS = "YES_ISOLATED_STAGING"
# Define las seis variables DC_*_EMAIL/PASSWORD de cuentas sintéticas en el entorno.
python -m pytest -m staging -v --junitxml=test-results/selenium-staging.xml
```

En GitHub, el workflow **DealCapital QA - authenticated and staging E2E** se dispara manualmente (`Actions > Run workflow`). El checkbox `run_mutations` inicia los dos escenarios que escriben datos; sin él, solo ejecuta las comprobaciones de roles. Nunca pegues contraseñas en el repositorio o el chat.

Los escenarios de staging **dejan registros de prueba** para inspeccionar sus auditorías. Restablece periódicamente el proyecto aislado desde un estado limpio. Esto es intencional; no hay borrado automático que pueda tocar una base productiva.

### Qué constituye un resultado válido

`PASSED`: ejecutado con los datos/roles necesarios y resultado satisfactorio.
`FAILED`: ejecutado y encontrado un defecto o precondición incorrecta.
`SKIPPED`: no ejecutado; requiere prueba posterior o fixture.
`NOT TESTED`: ninguna prueba cubre aún esa funcionalidad.

El reporte GitHub Actions `selenium-public.xml` no certifica los escenarios de autenticación ni los flujos que escriben datos. **No usar un resumen global de pruebas sin revisar las pruebas omitidas.**
