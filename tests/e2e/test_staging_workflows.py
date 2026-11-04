"""Mutation E2E: ONLY for independently provisioned, isolated staging.

Never enable on production or a Vercel preview connected to production Supabase.
This file is intentionally excluded from PR smoke runs and requires three
separate staging user identities plus explicit opt-in.
"""
from __future__ import annotations

import os
import re
import uuid
from pathlib import Path
from urllib.parse import urlparse, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from test_dealcapital_selenium import (
    BASE_URL, WAIT, driver, go, login, text_present, wait_for_text
)

PRODUCTION_REF = "knsqqhucibferrvwjakv"
PRODUCTION_HOSTS = {"deal-capital.vercel.app", "deal-capital-capitaldeal.vercel.app"}


def require_staging_config():
    if os.getenv("DC_ALLOW_STAGING_MUTATIONS") != "YES_ISOLATED_STAGING":
        pytest.skip("Staging mutations disabled; expected DC_ALLOW_STAGING_MUTATIONS=YES_ISOLATED_STAGING")
    staged_url = os.getenv("DC_STAGING_BASE_URL", "").rstrip("/")
    expected_ref = os.getenv("DC_STAGING_SUPABASE_REF", "").strip()
    if not staged_url or not expected_ref:
        pytest.fail("Missing separate staging URL and Supabase project ref")
    parsed = urlparse(BASE_URL)
    expected = urlparse(staged_url)
    if parsed.scheme != "https" or parsed.netloc != expected.netloc or parsed.path not in ("", "/"):
        pytest.fail("DC_BASE_URL must exactly match the explicitly configured staging origin")
    if parsed.hostname in PRODUCTION_HOSTS or "deal-capital.vercel.app" in BASE_URL:
        pytest.fail("Refusing mutations on DealCapital production")
    if not re.fullmatch(r"[a-z0-9]{12,30}", expected_ref) or expected_ref == PRODUCTION_REF:
        pytest.fail("DC_STAGING_SUPABASE_REF must name a different Supabase project")
    return f"{expected_ref}.supabase.co"


def assert_staging_backend(driver, staging_host: str):
    """Fail closed unless browser resource timing reveals only staging Supabase."""
    def hosts(d):
        return d.execute_script("""
            return [...new Set(performance.getEntriesByType('resource')
              .map(x => { try { return new URL(x.name).hostname; } catch { return ''; } })
              .filter(x => x.endsWith('.supabase.co')))];
        """)
    known = WebDriverWait(driver, WAIT).until(
        lambda d: hosts(d) or False,
        message="Supabase origin not observable: refusing database mutation"
    )
    assert known == [staging_host] or (len(known) > 0 and all(h == staging_host for h in known)), (
        "Browser is connected to an unexpected Supabase project; mutation blocked"
    )


def switch_role(driver, role: str, staging_host: str):
    # New session, same test-browser process; clear local Supabase tokens.
    go(driver, "/")
    driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
    driver.delete_all_cookies()
    login(driver, role)
    assert_staging_backend(driver, staging_host)


def find_request_article(driver, request_id: int, admin: bool):
    title_tag = "h2" if admin else "h3"
    target = f"Solicitud #{request_id}" if admin else f"#{request_id}"
    xpath = f"//article[.//{title_tag}[contains(normalize-space(.), '{target}')]]"
    return WebDriverWait(driver, WAIT).until(
        lambda d: d.find_element(By.XPATH, xpath)
    )


@pytest.mark.staging
def test_staging_verification_observe_remediate_close_and_notifications(driver):
    host = require_staging_config()
    switch_role(driver, "ENTREPRENEUR", host)
    go(driver, "/solicitudes-verificacion")
    wait_for_text(driver, "Historial de solicitudes")
    old_ids = set(re.findall(r"Perfil\s*·\s*#(\d+)", driver.find_element(By.TAG_NAME, "body").text))
    card = driver.find_element(By.XPATH, "//article[.//h2[contains(., 'Revisión de perfil')]]")
    request_button = card.find_element(By.TAG_NAME, "button")
    assert request_button.is_enabled(), (
        "Dedicated staging entrepreneur already has an open profile review; reset staging fixture"
    )
    request_button.click()
    def created_id(d):
        ids = set(re.findall(r"Perfil\s*·\s*#(\d+)", d.find_element(By.TAG_NAME, "body").text))
        newer = ids - old_ids
        return int(max(newer, key=int)) if newer else False
    request_id = WebDriverWait(driver, WAIT).until(created_id)

    switch_role(driver, "ADMIN", host)
    go(driver, "/admin/solicitudes-verificacion")
    article = find_request_article(driver, request_id, admin=True)
    review_form = article.find_element(By.TAG_NAME, "form")
    review_form.find_element(By.CSS_SELECTOR, "select option[value='observada']").click()
    review_form.find_element(By.TAG_NAME, "textarea").send_keys(
        "Se requiere ampliar la descripción del emprendimiento de prueba."
    )
    review_form.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    WebDriverWait(driver, WAIT).until(
        lambda d: "Observada" in find_request_article(d, request_id, admin=True).text
    )

    switch_role(driver, "ENTREPRENEUR", host)
    go(driver, "/notificaciones")
    wait_for_text(driver, "Solicitud observada")
    go(driver, "/solicitudes-verificacion")
    article = find_request_article(driver, request_id, admin=False)
    response = article.find_element(By.TAG_NAME, "textarea")
    response.send_keys("Actualicé los datos profesionales y aclaré el alcance del negocio de prueba.")
    article.find_element(By.CSS_SELECTOR, "form button[type=submit]").click()
    WebDriverWait(driver, WAIT).until(
        lambda d: "En revisión" in find_request_article(d, request_id, admin=False).text
    )

    switch_role(driver, "ADMIN", host)
    go(driver, "/notificaciones")
    wait_for_text(driver, "Subsanación recibida")
    go(driver, "/admin/solicitudes-verificacion")
    article = find_request_article(driver, request_id, admin=True)
    assert "Actualicé los datos profesionales" in article.text
    review_form = article.find_element(By.TAG_NAME, "form")
    review_form.find_element(By.CSS_SELECTOR, "select option[value='cerrada']").click()
    review_form.find_element(By.TAG_NAME, "textarea").send_keys(
        "Revisión administrativa cerrada tras subsanación; no constituye KYC oficial."
    )
    review_form.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    WebDriverWait(driver, WAIT).until(
        lambda d: "Cerrada" in find_request_article(d, request_id, admin=True).text
    )

    switch_role(driver, "ENTREPRENEUR", host)
    go(driver, "/notificaciones")
    wait_for_text(driver, "Revisión cerrada")
    go(driver, "/solicitudes-verificacion")
    article = find_request_article(driver, request_id, admin=False)
    assert "Cerrada" in article.text
    timeline = article.find_element(By.XPATH, ".//section[@aria-label]")
    assert len(timeline.find_elements(By.TAG_NAME, "li")) >= 4
    # The permanent synthetic audit trail remains in staging for review.


def make_synthetic_pdf(path: Path):
    """Create a minimal, non-personal PDF (only when staging is explicitly enabled)."""
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Contents 4 0 R >>",
        b"<< /Length 0 >>\nstream\n\nendstream",
    ]
    data = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for i, obj in enumerate(objects, 1):
        offsets.append(len(data))
        data.extend(f"{i} 0 obj\n".encode() + obj + b"\nendobj\n")
    xref = len(data)
    data.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    data.extend(b"0000000000 65535 f \n")
    for pos in offsets[1:]:
        data.extend(f"{pos:010d} 00000 n \n".encode())
    data.extend(
        f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    )
    path.write_bytes(data)


@pytest.mark.staging
def test_staging_project_review_documents_interest_and_commitment(driver, tmp_path: Path):
    host = require_staging_config()
    switch_role(driver, "ENTREPRENEUR", host)
    project_name = "DC-QA-" + uuid.uuid4().hex[:12]
    go(driver, "/publicar")
    wait_for_text(driver, "Presentar proyecto")
    driver.find_element(By.CSS_SELECTOR, "input[name=nombre_proyecto]").send_keys(project_name)
    driver.find_element(By.CSS_SELECTOR, "input[name=emprendedor]").send_keys("Emprendimiento de prueba")
    driver.find_element(By.CSS_SELECTOR, "input[name=email]").send_keys(os.environ["DC_ENTREPRENEUR_EMAIL"])
    driver.find_element(By.CSS_SELECTOR, "input[name=capital_requerido]").send_keys("1000")
    driver.find_element(By.CSS_SELECTOR, "textarea[name=descripcion]").send_keys(
        "Iniciativa sintética de pruebas automatizadas. No representa una inversión real."
    )
    pdf_path = tmp_path / "documento-qa.pdf"
    make_synthetic_pdf(pdf_path)
    upload = driver.find_elements(By.CSS_SELECTOR, "input[type=file][accept='application/pdf']")
    assert len(upload) >= 2
    upload[-1].send_keys(str(pdf_path))
    wait_for_text(driver, "Documento guardado de forma privada")
    signed = driver.find_elements(By.CSS_SELECTOR, "a[href*='/storage/v1/object/sign/']")
    assert signed, "La vista privada no generó un enlace firmado para el PDF"

    # A signed URL without its signature MUST NOT grant public access.
    signed_url = signed[-1].get_attribute("href")
    u = urlsplit(signed_url)
    assert u.hostname == host
    unsigned = urlunsplit((u.scheme, u.netloc, u.path, "", ""))
    try:
        with urlopen(Request(unsigned, method="GET"), timeout=15) as resp:
            pytest.fail(f"Unsigned private file returned HTTP {resp.status}")
    except HTTPError as err:
        assert err.code in (400, 401, 403, 404), "Unexpected private file response"

    driver.find_element(By.CSS_SELECTOR, "form button").click()
    wait_for_text(driver, "Proyecto recibido correctamente")
    go(driver, "/seguimiento")
    wait_for_text(driver, project_name)
    go(driver, "/oportunidades")
    assert project_name not in driver.find_element(By.TAG_NAME, "body").text, (
        "Un proyecto pendiente apareció públicamente"
    )

    switch_role(driver, "ADMIN", host)
    go(driver, "/admin")
    wait_for_text(driver, "Panel de")
    driver.find_element(By.XPATH, "//*[@role='tab' and contains(.,'Proyectos')]").click()
    project_row = WebDriverWait(driver, WAIT).until(
        lambda d: d.find_element(By.XPATH, f"//tr[.//strong[contains(., '{project_name}')]]")
    )
    review_button = project_row.find_element(By.XPATH, ".//button[contains(.,'Revisar publicación')]")
    controls = review_button.get_attribute("aria-controls") or ""
    project_id_match = re.search(r"dc-review-(\d+)", controls)
    assert project_id_match, "No se pudo obtener el ID del proyecto de prueba"
    project_id = int(project_id_match.group(1))

    project_row.find_element(By.XPATH, ".//button[contains(.,'Consultar PDF privados')]").click()
    WebDriverWait(driver, WAIT).until(
        lambda d: "Documentación restringida" in d.find_element(
            By.XPATH, f"//tr[.//strong[contains(., '{project_name}')]]"
        ).text
    )
    assert "Documento" in project_row.text
    review_button.click()
    form = project_row.find_element(By.CSS_SELECTOR, "form[id^='dc-review-']")
    form.find_element(By.TAG_NAME, "textarea").send_keys(
        "Se aprueba la publicación de la propuesta sintética de QA en staging."
    )
    form.find_element(By.CSS_SELECTOR, "input[type=checkbox]").click()
    form.find_element(By.CSS_SELECTOR, "button[type=submit]").click()
    WebDriverWait(driver, WAIT).until(
        lambda d: "Visible" in d.find_element(
            By.XPATH, f"//tr[.//strong[contains(., '{project_name}')]]"
        ).text
    )

    go(driver, f"/oportunidades/{project_id}")
    wait_for_text(driver, project_name)
    visible_urls = [
        x.get_attribute("href") or ""
        for x in driver.find_elements(By.CSS_SELECTOR, "a[href]")
    ]
    assert not any("/Documentos/" in u or "/pitch-decks/" in u for u in visible_urls), (
        "Private document link leaked to public project detail"
    )

    switch_role(driver, "INVESTOR", host)
    go(driver, f"/interes/{project_id}")
    wait_for_text(driver, "Estoy interesado")
    driver.find_element(By.CSS_SELECTOR, "input[placeholder='Tu nombre completo']").send_keys("Inversionista QA")
    driver.find_element(By.CSS_SELECTOR, "input[type=email]").send_keys(os.environ["DC_INVESTOR_EMAIL"])
    driver.find_element(By.CSS_SELECTOR, "textarea").send_keys(
        "Interés sintético para validar el flujo. Sin intención económica real."
    )
    driver.find_element(By.CSS_SELECTOR, "form button[type=submit]").click()
    WebDriverWait(driver, WAIT).until(
        lambda d: urlparse(d.current_url).path.startswith("/mensajes/")
    )
    go(driver, f"/comprometer/{project_id}")
    driver.find_element(By.CSS_SELECTOR, "input[type=number]").send_keys("100")
    driver.find_element(By.TAG_NAME, "textarea").send_keys("Compromiso exclusivamente sintético de QA.")
    driver.find_element(By.XPATH, "//button[contains(., 'Enviar compromiso')]").click()
    wait_for_text(driver, "Compromiso registrado correctamente")

    switch_role(driver, "ENTREPRENEUR", host)
    go(driver, "/dashboard")
    wait_for_text(driver, project_name)
    go(driver, "/compromisos")
    wait_for_text(driver, "Compromisos de inversión")
    # Test data must remain isolated to the non-production database.
