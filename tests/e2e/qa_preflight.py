"""Fail-closed preparation for DealCapital Selenium QA against isolated staging.

This checks only environment metadata. It does not contact Supabase, authenticate,
create accounts or print secrets. Browser-level network origin checks are separate.
"""
from __future__ import annotations

import os
import re
import sys
from collections.abc import Mapping
from urllib.parse import urlparse

PRODUCTION_PROJECT_REF = "knsqqhucibferrvwjakv"
PRODUCTION_ADMIN_EMAIL = "axel.valladares.flores@gmail.com"
PRODUCTION_HOSTS = frozenset({
    "deal-capital.vercel.app",
    "deal-capital-capitaldeal.vercel.app",
})
QA_ROLES = ("ENTREPRENEUR", "INVESTOR", "ADMIN")
QA_SECRET_KEYS = tuple(
    f"DC_{role}_{field}" for role in QA_ROLES for field in ("EMAIL", "PASSWORD")
)


def validate_qa_config(env: Mapping[str, str], *, mutations: bool) -> list[str]:
    """Return generic errors with no values from credentials or tokens."""
    errors: list[str] = []
    base = (env.get("DC_BASE_URL") or "").strip().rstrip("/")
    staging = (env.get("DC_STAGING_BASE_URL") or "").strip().rstrip("/")
    project = (env.get("DC_STAGING_SUPABASE_REF") or "").strip().lower()

    if not base or not staging:
        errors.append("DC_BASE_URL and DC_STAGING_BASE_URL are required")
    else:
        a, b = urlparse(base), urlparse(staging)
        if (a.scheme != "https" or b.scheme != "https"
                or not a.hostname or not b.hostname
                or a.username or b.username or a.password or b.password
                or a.query or b.query or a.fragment or b.fragment
                or a.path not in ("", "/") or b.path not in ("", "/")):
            errors.append("Use clean HTTPS origins without paths, credentials, query or fragment")
        if base != staging:
            errors.append("DC_BASE_URL must equal the declared staging origin")
        if a.hostname in PRODUCTION_HOSTS or b.hostname in PRODUCTION_HOSTS:
            errors.append("Production hosts cannot be used for authenticated QA")

    if not re.fullmatch(r"[a-z0-9]{20}", project):
        errors.append("DC_STAGING_SUPABASE_REF must be a valid independent project ref")
    elif project == PRODUCTION_PROJECT_REF:
        errors.append("Production Supabase ref is forbidden for QA")

    for name in QA_SECRET_KEYS:
        if not (env.get(name) or "").strip():
            errors.append(f"Missing required dedicated QA secret: {name}")

    emails = [(env.get(f"DC_{role}_EMAIL") or "").strip().lower() for role in QA_ROLES]
    if all(emails) and len(set(emails)) != len(emails):
        errors.append("QA test accounts must have distinct emails")
    if emails[-1] == PRODUCTION_ADMIN_EMAIL:
        errors.append("Do not use the production administrator account for QA")

    if mutations and env.get("DC_ALLOW_STAGING_MUTATIONS") != "YES_ISOLATED_STAGING":
        errors.append("Mutation opt-in is missing")
    return errors


def main() -> int:
    mutations = "--write" in sys.argv[1:]
    problems = validate_qa_config(os.environ, mutations=mutations)
    if problems:
        print("QA PRE-FLIGHT BLOCKED:")
        for issue in problems:
            print(f"- {issue}")
        return 2
    print("QA pre-flight: configuration checks PASSED.")
    print("The real browser must still verify the Supabase network origin.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
