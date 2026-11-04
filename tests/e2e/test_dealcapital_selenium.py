"""DealCapital browser E2E smoke checks.

Read-only by default. Do not run automated registration, investment, or
verification mutations against production. Test identities must be dedicated.
"""
from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import urlparse

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.support.ui import WebDriverWait


BASE_URL = os.getenv("DC_BASE_URL", "https://deal-capital.vercel.app").rstrip("/")
WAIT = int(os.getenv("DC_WAIT_SECONDS", "25"))


def _credentials(role: str) -> tuple[str, str]:
    email = os.getenv(f"DC_{role}_EMAIL", "").strip()
    password = os.getenv(f"DC_{role}_PASSWORD", "")
    if not email or not password:
        pytest.skip(f"Credenciales DC_{role}_EMAIL / DC_{role}_PASSWORD no configuradas")
    return email, password


@pytest.fixture
def driver(request: pytest.FixtureRequest):
    """Isolated browser context for each test, with screenshots on failure."""
    browser = os.getenv("DC_BROWSER", "chrome").lower()
    headless = os.getenv("DC_HEADLESS", "1") != "0"
    if browser == "edge":
        options = EdgeOptions()
    elif browser == "chrome":
        options = ChromeOptions()
    else:
        pytest.fail("DC_BROWSER debe ser chrome o edge")
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,900")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-sandbox")
    try:
        session = webdriver.Edge(options=options) if browser == "edge" else webdriver.Chrome(options=options)
    except Exception as exc:
        pytest.fail(f"No se pudo iniciar WebDriver ({browser}): {exc}")
    session.set_page_load_timeout(40)
    yield session
    if getattr(request.node, "rep_call", None) is not None and request.node.rep_call.failed:
        output = Path(os.getenv("DC_ARTIFACT_DIR", "test-results/screenshots"))
        output.mkdir(parents=True, exist_ok=True)
        name = "".join(c if c.isalnum() or c in "-_" else "_" for c in request.node.name)
        session.save_screenshot(str(output / f"{name}.png"))
    session.quit()


def go(driver, path: str):
    driver.get(f"{BASE_URL}{path}")
    WebDriverWait(driver, WAIT).until(lambda d: d.execute_script("return document.readyState") == "complete")
    return driver



def click_visible(driver, element):
    """Scroll like a real user before attempting a native WebDriver click."""
    driver.execute_script("arguments[0].scrollIntoView({block: 'center', inline: 'nearest'});", element)
    WebDriverWait(driver, WAIT).until(
        lambda d: element.is_displayed() and element.is_enabled()
    )
    element.click()


def text_present(driver, content: str) -> bool:
    return content.casefold() in driver.find_element(By.TAG_NAME, "body").text.casefold()


def wait_for_text(driver, content: str):
    WebDriverWait(driver, WAIT).until(lambda d: text_present(d, content))


def login(driver, role: str):
    email, password = _credentials(role)
    go(driver, "/login")
    driver.find_element(By.CSS_SELECTOR, "input[type=email]").send_keys(email)
    driver.find_element(By.CSS_SELECTOR, "input[type=password]").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    WebDriverWait(driver, WAIT).until(
        lambda d: urlparse(d.current_url).path.startswith("/dashboard")
        or bool(d.find_elements(By.CSS_SELECTOR, "[role=alert]"))
    )
    assert urlparse(driver.current_url).path.startswith("/dashboard"), (
        f"Inicio de sesión {role} no llegó al dashboard; revisar captura de pantalla."
    )


@pytest.mark.smoke
@pytest.mark.parametrize(
    ("path", "expected"),
    [
        ("/", "DealCapital"),
        ("/login", "Iniciar sesión"),
        ("/registro", "Crear cuenta"),
        ("/oportunidades", "Oportunidades"),
        ("/verificacion", "Verificación"),
    ],
)
def test_public_pages_render(driver, path, expected):
    go(driver, path)
    assert text_present(driver, expected), f"{path}: falta el texto esperado {expected!r}"
    assert "Application error" not in driver.page_source, f"{path}: error de aplicación"


@pytest.mark.smoke
def test_login_form_has_required_fields(driver):
    go(driver, "/login")
    assert driver.find_element(By.CSS_SELECTOR, "input[type=email]").get_attribute("required") is not None
    assert driver.find_element(By.CSS_SELECTOR, "input[type=password]").get_attribute("required") is not None
    assert driver.find_element(By.CSS_SELECTOR, "button[type=submit]").is_enabled()


@pytest.mark.smoke
def test_registration_requires_consent_and_secure_password(driver):
    go(driver, "/registro")
    passwords = driver.find_elements(By.CSS_SELECTOR, "input[type=password]")
    assert len(passwords) >= 2, "Se espera contraseña y confirmación"
    assert any(int(field.get_attribute("minlength") or 0) >= 12 for field in passwords), (
        "El campo de contraseña no expresa el mínimo de 12 caracteres"
    )
    assert driver.find_elements(By.CSS_SELECTOR, "input[type=checkbox]"), "No se encontró consentimiento"


@pytest.mark.smoke
def test_private_requests_prompt_login(driver):
    go(driver, "/solicitudes-verificacion")
    wait_for_text(driver, "Inicia sesión")
    assert text_present(driver, "Inicia sesión")


@pytest.mark.smoke
def test_private_notifications_redirect_to_login(driver):
    go(driver, "/notificaciones")
    WebDriverWait(driver, WAIT).until(lambda d: urlparse(d.current_url).path.startswith("/login"))
    assert urlparse(driver.current_url).path.startswith("/login")


@pytest.mark.auth
def test_entrepreneur_can_read_verification_requests(driver):
    login(driver, "ENTREPRENEUR")
    go(driver, "/solicitudes-verificacion")
    wait_for_text(driver, "Solicitudes de revisión")
    assert text_present(driver, "Historial de solicitudes")
    assert not text_present(driver, "No se pudo cargar tu historial")


@pytest.mark.auth
def test_entrepreneur_cannot_access_admin_review(driver):
    login(driver, "ENTREPRENEUR")
    go(driver, "/admin/solicitudes-verificacion")
    wait_for_text(driver, "No tienes autorización")
    assert not text_present(driver, "Registrar decisión con auditoría")


@pytest.mark.auth
def test_entrepreneur_can_read_notification_center(driver):
    login(driver, "ENTREPRENEUR")
    go(driver, "/notificaciones")
    wait_for_text(driver, "Notificaciones")
    assert not text_present(driver, "Application error")


@pytest.mark.auth
def test_admin_can_open_verification_review(driver):
    login(driver, "ADMIN")
    go(driver, "/admin/solicitudes-verificacion")
    wait_for_text(driver, "Revisión de expedientes")
    WebDriverWait(driver, WAIT).until(
        lambda d: text_present(d, "No existen solicitudes registradas")
        or bool(d.find_elements(By.CSS_SELECTOR, "form textarea"))
        or text_present(d, "Solicitud #")
        or text_present(d, "No se pudo consultar la cola")
    )
    assert not text_present(driver, "No se pudo consultar la cola"), "RPC administrativo falló"
    assert not text_present(driver, "No tienes autorización"), "Admin no autorizado"


@pytest.mark.auth
def test_investor_cannot_open_admin_or_submit_entrepreneur_request(driver):
    login(driver, "INVESTOR")
    go(driver, "/admin")
    wait_for_text(driver, "Acceso restringido")
    go(driver, "/solicitudes-verificacion")
    wait_for_text(driver, "Solicitudes de revisión")
    # Intencionalmente NO pulsamos el botón de solicitud: no modificar producción.
    assert text_present(driver, "Solicitar revisión") or text_present(driver, "Solicitud abierta")



# Expanded P0 read-only coverage. Never clicks create, approve, reject or invest.
@pytest.mark.smoke
@pytest.mark.parametrize("path", [
    "/publicar", "/dashboard", "/perfil", "/mensajes", "/compromisos"
])
def test_anonymous_private_workspace_redirects_to_login(driver, path):
    go(driver, path)
    WebDriverWait(driver, WAIT).until(
        lambda d: urlparse(d.current_url).path.startswith("/login")
    )
    assert urlparse(driver.current_url).path.startswith("/login"), (
        f"La ruta protegida {path} no redirigió a login."
    )


@pytest.mark.smoke
def test_anonymous_admin_panel_is_restricted(driver):
    go(driver, "/admin")
    wait_for_text(driver, "Acceso restringido")
    assert not text_present(driver, "Centro de operaciones / MVP")


@pytest.mark.smoke
def test_anonymous_admin_review_is_restricted(driver):
    go(driver, "/admin/solicitudes-verificacion")
    wait_for_text(driver, "No tienes autorización")
    assert not text_present(driver, "Registrar decisión con auditoría")


@pytest.mark.smoke
def test_opportunity_filters_can_be_reset(driver):
    go(driver, "/oportunidades")
    search = WebDriverWait(driver, WAIT).until(
        lambda d: d.find_element(By.CSS_SELECTOR, "input[type=search]")
    )
    search.send_keys("__qa_sin_coincidencias_20261104__")
    WebDriverWait(driver, WAIT).until(
        lambda d: "0 oportunidades" in d.find_element(By.TAG_NAME, "body").text
    )
    buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Limpiar filtros')]")
    assert buttons, "Falta la acción para limpiar filtros"
    click_visible(driver, buttons[0])
    assert search.get_attribute("value") == ""


@pytest.mark.smoke
def test_opportunity_sort_has_both_capital_directions(driver):
    go(driver, "/oportunidades")
    sort = driver.find_element(
        By.XPATH, "//label[.//span[contains(., 'Ordenar por')]]/select"
    )
    assert sort.find_elements(By.CSS_SELECTOR, "option[value='low']")
    assert sort.find_elements(By.CSS_SELECTOR, "option[value='high']")
    sort.find_element(By.CSS_SELECTOR, "option[value='high']").click()
    assert sort.get_attribute("value") == "high"


@pytest.mark.smoke
def test_invalid_opportunity_id_does_not_reveal_a_project(driver):
    go(driver, "/oportunidades/identificador-no-numerico")
    wait_for_text(driver, "Proyecto no encontrado")
    assert not driver.find_elements(By.CSS_SELECTOR, "a[href^='/interes/']")


@pytest.mark.smoke
@pytest.mark.parametrize(("path", "title"), [
    ("/interes/999999999", "Estoy interesado"),
    ("/comprometer/999999999", "Comprometer inversión"),
])
def test_public_investment_forms_are_readable_but_not_submitted(driver, path, title):
    go(driver, path)
    wait_for_text(driver, title)
    assert driver.find_elements(By.CSS_SELECTOR, "form input[required]")
    # NO submit: these routes create real records once authenticated.


@pytest.mark.smoke
def test_public_project_detail_never_links_private_storage(driver):
    go(driver, "/oportunidades")
    cards = driver.find_elements(
        By.CSS_SELECTOR, "a[href^='/oportunidades/']"
    )
    if not cards:
        pytest.skip("No hay proyectos aprobados publicados para inspeccionar.")
    click_visible(driver, cards[0])
    WebDriverWait(driver, WAIT).until(
        lambda d: urlparse(d.current_url).path.startswith("/oportunidades/")
    )
    urls = [
        element.get_attribute("href") or element.get_attribute("src") or ""
        for element in driver.find_elements(By.CSS_SELECTOR, "a[href],img[src]")
    ]
    assert not any(
        ("/storage/v1/object/public/" in u or "/storage/v1/object/sign/" in u)
        and any("/" + bucket + "/" in u for bucket in ("Documentos", "pitch-decks"))
        for u in urls
    ), "Un archivo privado fue expuesto mediante un enlace público o firmado."


@pytest.mark.auth
def test_entrepreneur_can_open_project_submission_without_writing(driver):
    login(driver, "ENTREPRENEUR")
    go(driver, "/publicar")
    wait_for_text(driver, "Presentar proyecto")
    for selector in ("input[name=nombre_proyecto]", "input[name=emprendedor]",
                     "input[name=email]", "textarea[name=descripcion]",
                     "input[name=capital_requerido]"):
        field = driver.find_element(By.CSS_SELECTOR, selector)
        assert field.get_attribute("required") is not None, selector
    pdfs = driver.find_elements(By.CSS_SELECTOR, "input[type=file][accept='application/pdf']")
    assert len(pdfs) >= 2, "Faltan selectores para pitch deck y documento PDF."
    assert not text_present(driver, "Proyecto recibido correctamente")


@pytest.mark.auth
@pytest.mark.parametrize(("path", "heading"), [
    ("/seguimiento", "Seguimiento"),
    ("/expediente", "Mi expediente de emprendedor"),
    ("/dashboard", "Dashboard"),
    ("/perfil", "Mi Perfil"),
])
def test_entrepreneur_can_open_owned_workspace(driver, path, heading):
    login(driver, "ENTREPRENEUR")
    go(driver, path)
    wait_for_text(driver, heading)
    assert "Application error" not in driver.page_source


@pytest.mark.auth
@pytest.mark.parametrize(("path", "heading"), [
    ("/mensajes", "Mis conversaciones"),
    ("/compromisos", "Compromisos de inversión"),
    ("/dashboard", "Dashboard"),
])
def test_investor_can_read_commercial_workspace(driver, path, heading):
    login(driver, "INVESTOR")
    go(driver, path)
    wait_for_text(driver, heading)
    assert "Application error" not in driver.page_source


@pytest.mark.auth
def test_admin_dashboard_has_review_links(driver):
    login(driver, "ADMIN")
    go(driver, "/admin")
    wait_for_text(driver, "Panel de")
    assert driver.find_elements(
        By.CSS_SELECTOR, "a[href='/admin/solicitudes-verificacion']"
    ), "El panel no enlaza la cola de revisión."


@pytest.mark.auth
def test_admin_can_read_storage_diagnostic_area_without_running_destructive_qa(driver):
    login(driver, "ADMIN")
    go(driver, "/admin")
    wait_for_text(driver, "Panel de")
    assert text_present(driver, "Seguridad técnica")
    # Do not press synthetic-storage QA; it creates and deletes cloud objects.


@pytest.mark.auth
def test_entrepreneur_cannot_render_project_admin_controls(driver):
    login(driver, "ENTREPRENEUR")
    go(driver, "/admin")
    wait_for_text(driver, "Acceso restringido")
    assert not text_present(driver, "Revisar solicitudes de verificación")
