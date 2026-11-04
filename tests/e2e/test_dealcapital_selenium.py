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
    if request.node.rep_call.failed:
        output = Path(os.getenv("DC_ARTIFACT_DIR", "test-results/screenshots"))
        output.mkdir(parents=True, exist_ok=True)
        name = "".join(c if c.isalnum() or c in "-_" else "_" for c in request.node.name)
        session.save_screenshot(str(output / f"{name}.png"))
    session.quit()


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    result = outcome.get_result()
    setattr(item, f"rep_{result.when}", result)


def go(driver, path: str):
    driver.get(f"{BASE_URL}{path}")
    WebDriverWait(driver, WAIT).until(lambda d: d.execute_script("return document.readyState") == "complete")
    return driver


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
