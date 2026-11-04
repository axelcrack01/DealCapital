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
