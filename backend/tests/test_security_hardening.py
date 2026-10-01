"""Regression tests for the SSRF guard, PDF job ownership and branding validation."""
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.ssrf import is_blocked_ip, validate_safe_webhook_url
from app.pdf_engine.router import _can_access_job, _public_job
from app.schemas.pdf import BrandingConfig


@pytest.mark.parametrize("ip", [
    "127.0.0.1", "10.1.2.3", "172.16.0.5", "192.168.1.1", "169.254.169.254", "0.0.0.0",
    "100.64.0.1", "224.0.0.1", "198.18.0.1", "::1", "fe80::1", "fc00::1",
    "::ffff:127.0.0.1", "::ffff:7f00:1", "64:ff9b::7f00:1", "not-an-ip",
])
def test_internal_addresses_are_blocked(ip):
    assert is_blocked_ip(ip)


@pytest.mark.parametrize("ip", ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])
def test_public_addresses_are_allowed(ip):
    assert not is_blocked_ip(ip)


@pytest.mark.parametrize("url", [
    "http://example.com/hook",            # not https
    "https://user:pw@example.com/hook",   # credentials
    "https://localhost/hook",
    "https://127.0.0.1/hook",
    "https://169.254.169.254/latest/meta-data",
    "https://service.internal/hook",
])
def test_unsafe_webhook_urls_rejected(url):
    with pytest.raises(HTTPException):
        validate_safe_webhook_url(url)


def test_job_access_rules():
    from app.pdf_engine.router import _owner_hash
    job = {"owner_key_hash": _owner_hash("ak_live_owner")}
    assert _can_access_job(job, "ak_live_owner", {"role": "USER"})
    assert not _can_access_job(job, "ak_live_other", {"role": "USER"})
    assert _can_access_job(job, "ak_live_other", {"role": "ADMIN"})
    # A key string that merely *contains* "internal"/"master_key" gains nothing.
    assert not _can_access_job(job, "internal_master_key_x", {"role": "USER"})
    # Legacy jobs without an owner are admin-only.
    assert not _can_access_job({}, "ak_live_owner", {"role": "USER"})
    assert _can_access_job({}, "ak_live_owner", {"role": "SUPER_ADMIN"})


def test_public_job_hides_server_internals():
    job = {"job_id": "j", "file_path": "C:/srv/x.pdf", "owner_key_hash": "h", "status": "COMPLETED"}
    assert _public_job(job) == {"job_id": "j", "status": "COMPLETED"}


def test_branding_rejects_css_injection_and_non_https_logo():
    with pytest.raises(ValidationError):
        BrandingConfig(primary_color="red; } body { display:none")
    with pytest.raises(ValidationError):
        BrandingConfig(logo_url="javascript:alert(1)")
    assert BrandingConfig(primary_color="#b45309", logo_url="https://cdn.example.com/l.png")


# ── End-to-end ownership checks through the real router ──────────────────────
from fastapi.testclient import TestClient  # noqa: E402

from app.core.security import verify_api_key  # noqa: E402
from app.main import app  # noqa: E402

_BODY = {"dob": "1995-10-05", "tob": "14:30", "lat": 24.5854, "lon": 73.7125, "tz": 5.5}


def _client(role="USER"):
    app.dependency_overrides[verify_api_key] = lambda: {"valid": True, "role": role}
    return TestClient(app)


def test_pdf_jobs_are_isolated_between_api_keys():
    c = _client()
    try:
        r = c.post("/api/v1/pdf/kundli/basic", json=_BODY, headers={"x-api-key": "ak_live_alice"})
        assert r.status_code == 202
        job_id = r.json()["job_id"]
        assert len(job_id) > 30  # 128-bit id

        own = c.get(f"/api/v1/pdf/status/{job_id}", headers={"x-api-key": "ak_live_alice"})
        assert own.status_code == 200
        assert "file_path" not in own.json()["data"] and "owner_key_hash" not in own.json()["data"]

        other = c.get(f"/api/v1/pdf/status/{job_id}", headers={"x-api-key": "ak_live_bob"})
        assert other.status_code == 404
        assert c.get(f"/api/v1/pdf/download/{job_id}", headers={"x-api-key": "ak_live_bob"}).status_code == 404

        bob_jobs = c.get("/api/v1/pdf/jobs", headers={"x-api-key": "ak_live_bob"}).json()["data"]["jobs"]
        assert all(j["job_id"] != job_id for j in bob_jobs)
        alice_jobs = c.get("/api/v1/pdf/jobs", headers={"x-api-key": "ak_live_alice"}).json()["data"]["jobs"]
        assert any(j["job_id"] == job_id for j in alice_jobs)
    finally:
        app.dependency_overrides.clear()


def test_pdf_request_with_internal_webhook_is_rejected():
    c = _client()
    try:
        r = c.post("/api/v1/pdf/kundli/basic", json={**_BODY, "webhook_url": "https://169.254.169.254/x"},
                   headers={"x-api-key": "ak_live_alice"})
        assert r.status_code == 400
    finally:
        app.dependency_overrides.clear()


# ── Refund-on-failure ────────────────────────────────────────────────────────
from fastapi import Request  # noqa: E402

import app.main as main_module  # noqa: E402


def _metered_client(monkeypatch, calls):
    async def metered(request: Request):
        request.state.billing_receipt = {"receiptId": "42", "deductionType": "QUOTA", "addonId": None}
        return {"valid": True, "role": "USER", "receipt": request.state.billing_receipt}

    app.dependency_overrides[verify_api_key] = metered
    monkeypatch.setattr(main_module, "schedule_refund", lambda receipt, status: calls.append((receipt, status)))
    return TestClient(app)


def test_validation_error_triggers_refund(monkeypatch):
    calls = []
    c = _metered_client(monkeypatch, calls)
    try:
        r = c.post("/api/v1/core/planets/positions", json={"dob": "not-a-date"}, headers={"x-api-key": "k"})
        assert r.status_code >= 400
        assert calls and calls[0][0]["receiptId"] == "42" and calls[0][1] == r.status_code
    finally:
        app.dependency_overrides.clear()


def test_successful_call_is_not_refunded(monkeypatch):
    calls = []
    c = _metered_client(monkeypatch, calls)
    try:
        r = c.post("/api/v1/core/planets/positions", json=_BODY, headers={"x-api-key": "k"})
        assert r.status_code == 200
        assert calls == []
    finally:
        app.dependency_overrides.clear()


def test_build_receipt():
    from app.core.billing import build_receipt
    assert build_receipt({}) is None
    assert build_receipt({"receiptId": 7, "deductionType": "WALLET_CREDIT", "addonId": None}) == {
        "receiptId": "7", "deductionType": "WALLET_CREDIT", "addonId": None}


def test_refund_posts_to_billing_service(monkeypatch):
    import asyncio
    import httpx
    from app.core import billing

    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["body"] = request.content.decode()
        seen["secret"] = request.headers.get("x-internal-secret")
        return httpx.Response(200, json={"status": "success", "refunded": True})

    real_client = httpx.AsyncClient
    monkeypatch.setattr(billing.settings, "NEXT_APP_URL", "http://next.test")
    monkeypatch.setattr(billing.settings, "INTERNAL_SECRET_KEY", "s3cret")
    monkeypatch.setattr(billing.httpx, "AsyncClient", lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw))

    ok = asyncio.run(billing.refund_receipt({"receiptId": "42", "deductionType": "QUOTA", "addonId": None}, 422))
    assert ok is True
    assert seen["url"] == "http://next.test/api/internal/refund"
    assert '"receiptId":"42"' in seen["body"].replace(" ", "") and '"httpStatus":422' in seen["body"].replace(" ", "")
    assert seen["secret"] == "s3cret"
    assert asyncio.run(billing.refund_receipt(None)) is False


def test_successful_call_reports_latency(monkeypatch):
    completions = []
    c = _metered_client(monkeypatch, [])
    monkeypatch.setattr(main_module, "schedule_complete", lambda receipt, ms: completions.append((receipt["receiptId"], ms)))
    try:
        r = c.post("/api/v1/core/planets/positions", json=_BODY, headers={"x-api-key": "k"})
        assert r.status_code == 200
        assert len(completions) == 1 and completions[0][0] == "42" and completions[0][1] >= 0
    finally:
        app.dependency_overrides.clear()


def test_complete_receipt_posts_latency(monkeypatch):
    import asyncio
    import httpx
    from app.core import billing

    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["body"] = request.content.decode().replace(" ", "")
        return httpx.Response(200, json={"status": "success"})

    real_client = httpx.AsyncClient
    monkeypatch.setattr(billing.settings, "NEXT_APP_URL", "http://next.test")
    monkeypatch.setattr(billing.httpx, "AsyncClient", lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw))
    asyncio.run(billing.complete_receipt({"receiptId": "9"}, 37))
    assert seen["url"] == "http://next.test/api/internal/complete"
    assert '"receiptId":"9"' in seen["body"] and '"responseTimeMs":37' in seen["body"]
