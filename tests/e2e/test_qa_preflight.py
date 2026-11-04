"""Pure QA preflight unit tests; no browser, network or credentials are used."""
from __future__ import annotations

import pytest

from qa_preflight import validate_qa_config


def qa_env() -> dict[str, str]:
    return {
        "DC_BASE_URL": "https://qa-dealcapital.example.test",
        "DC_STAGING_BASE_URL": "https://qa-dealcapital.example.test",
        "DC_STAGING_SUPABASE_REF": "abcdefghijklmnopqrst",
        "DC_ENTREPRENEUR_EMAIL": "qa-entrepreneur@example.test",
        "DC_ENTREPRENEUR_PASSWORD": "fake-test-entrepreneur",
        "DC_INVESTOR_EMAIL": "qa-investor@example.test",
        "DC_INVESTOR_PASSWORD": "fake-test-investor",
        "DC_ADMIN_EMAIL": "qa-admin@example.test",
        "DC_ADMIN_PASSWORD": "fake-test-admin",
        "DC_ALLOW_STAGING_MUTATIONS": "YES_ISOLATED_STAGING",
    }


@pytest.mark.guard
def test_qa_readonly_valid_config_passes():
    assert validate_qa_config(qa_env(), mutations=False) == []


@pytest.mark.guard
def test_qa_mutations_valid_config_passes():
    assert validate_qa_config(qa_env(), mutations=True) == []


@pytest.mark.guard
def test_refuses_actual_production_url():
    conf = qa_env()
    conf["DC_BASE_URL"] = conf["DC_STAGING_BASE_URL"] = "https://deal-capital.vercel.app"
    assert validate_qa_config(conf, mutations=False)


@pytest.mark.guard
def test_refuses_production_supabase_ref_even_with_preview_url():
    conf = qa_env()
    conf["DC_STAGING_SUPABASE_REF"] = "knsqqhucibferrvwjakv"
    assert validate_qa_config(conf, mutations=True)


@pytest.mark.guard
def test_refuses_missing_qa_credentials():
    conf = qa_env()
    del conf["DC_ADMIN_PASSWORD"]
    assert any("DC_ADMIN_PASSWORD" in s for s in validate_qa_config(conf, mutations=False))


@pytest.mark.guard
def test_refuses_reused_accounts():
    conf = qa_env()
    conf["DC_INVESTOR_EMAIL"] = conf["DC_ENTREPRENEUR_EMAIL"]
    assert validate_qa_config(conf, mutations=True)


@pytest.mark.guard
def test_refuses_real_production_admin():
    conf = qa_env()
    conf["DC_ADMIN_EMAIL"] = "axel.valladares.flores@gmail.com"
    assert validate_qa_config(conf, mutations=False)


@pytest.mark.guard
def test_refuses_staging_write_without_explicit_opt_in():
    conf = qa_env()
    del conf["DC_ALLOW_STAGING_MUTATIONS"]
    assert validate_qa_config(conf, mutations=True)


@pytest.mark.guard
def test_refuses_mismatched_staging_origin():
    conf = qa_env()
    conf["DC_BASE_URL"] = "https://other.example.test"
    assert validate_qa_config(conf, mutations=True)


@pytest.mark.guard
def test_refuses_insecure_http_origin():
    conf = qa_env()
    conf["DC_BASE_URL"] = conf["DC_STAGING_BASE_URL"] = "http://qa-dealcapital.example.test"
    assert validate_qa_config(conf, mutations=False)
