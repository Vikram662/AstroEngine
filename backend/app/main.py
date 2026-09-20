from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from app.core.config import settings
from app.modules.core_astronomy.router import router as core_astronomy_router
from app.modules.panchang.router import router as panchang_router
from app.modules.parashari.router import router as parashari_router
from app.modules.dasha.router import router as dasha_router
from app.modules.kp.router import router as kp_router
from app.modules.dosha_matching.router import router as dosha_matching_router
from app.modules.remedies.router import router as remedies_router
from app.modules.numerology.router import router as numerology_router
from app.modules.western.router import router as western_router
from app.modules.lalkitab.router import router as lalkitab_router
from app.modules.advanced.router import router as advanced_router
from app.pdf_engine.router import router as pdf_router
from app.modules.ai_astrologer.router import router as ai_astrologer_router
from app.modules.tarot.router import router as tarot_router
from app.modules.vastu.router import router as vastu_router

TAGS_METADATA = [
    {
        "name": "System",
        "description": "Liveness probes, health checks, and engine readiness monitors for load balancers."
    },
    {
        "name": "Core Astronomy",
        "description": "High-precision planetary calculations using Swiss Ephemeris (`pyswisseph`), 12 house cusps, retrograde speeds, and astronomical timings."
    },
    {
        "name": "Panchang & Muhurat",
        "description": "The 5 classical limbs of Vedic time (Tithi, Vaar, Nakshatra, Yoga, Karana) and dynamic 16-slot Choghadiya."
    },
    {
        "name": "Parashari Kundli & Divisional Charts",
        "description": "Birth chart (D1), Navamsha (D9), harmonic divisional charts (D2 to D60), and scalable Vector SVG chart diagrams."
    },
    {
        "name": "Dasha Systems",
        "description": "120-Year Vimshottari Mahadasha, Antardasha, and live real-time running Dasha hierarchy (MD > AD > PD)."
    },
    {
        "name": "KP System",
        "description": "Krishnamurti Paddhati stellar astrology: Sign Lords, Star Lords, Sub-Lords, Placidus cusps, and Horary seeds 1–249."
    },
    {
        "name": "Lal Kitab System",
        "description": "Kalpurush chart conversions, sleeping houses, 6 ancestral debts (Rin), and age-based Varshphal progressions."
    },
    {
        "name": "Jaimini & Tajik Varshphal",
        "description": "7 Jaimini Chara Karakas (Atmakaraka to Darakaraka) and Tajik annual solar returns with Muntha house evaluations."
    },
    {
        "name": "Dosha Analysis & Matchmaking",
        "description": "Manglik dosha with 20+ classical cancellations, 12 Kaal Sarp types, and 36 Guna Ashtakoot Kundli Milan."
    },
    {
        "name": "Astrological Remedies",
        "description": "Prescriptions for Life/Lucky/Benefic Gemstones, 1–14 Mukhi Rudrakshas, and Vedic Beej Mantras."
    },
    {
        "name": "Numerology Engine",
        "description": "Mulank (Birth), Bhagyank (Destiny), Namank (Chaldean), and 3x3 Lo Shu Magic Grid plane strengths."
    },
    {
        "name": "Western Astrology",
        "description": "Sayana/Tropical placements from 0° Aries, Big Three personality profiles, Aspects matrix, and circular wheel SVG."
    },
    {
        "name": "White-Label PDF Reports",
        "description": "Async PDF report generation queue (HTTP 202 Accepted) with custom branding, logo injection, and status polling."
    }
]

GLOBAL_RESPONSES = {
    400: {"description": "Bad Request — Input validation failure or parameters out of astronomical range."},
    401: {"description": "Unauthorized — Missing or invalid 'x-api-key' authentication header."},
    403: {"description": "Forbidden — Account suspended or monthly quota exhausted."},
    429: {"description": "Too Many Requests — Rate limit exceeded (sliding-window 60 calls/min)."},
    500: {"description": "Internal Server Error — Calculation or C-binding execution error."}
}

def get_dynamic_plans_markdown() -> str:
    """
    Fetch active subscription plans dynamically from Next.js /api/plans (MySQL database)
    and format them into a markdown table for ReDoc / OpenAPI documentation.
    """
    import urllib.request
    import json
    try:
        base_url = (settings.NEXT_APP_URL or "http://localhost:3000").rstrip("/")
        req = urllib.request.Request(f"{base_url}/api/plans")
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            if resp.status == 200:
                payload = json.loads(resp.read().decode("utf-8"))
                plans_data = payload.get("data", [])
            if plans_data:
                rows = []
                for p in plans_data:
                    name = p.get("name", p.get("tier", ""))
                    price = f"₹{int(p.get('priceMonthly', 0)):,}" if p.get('priceMonthly') else "Free / ₹0"
                    quota = f"{int(p.get('includedQuota', 0)):,} calls"
                    rpm = f"{p.get('rateLimitPerMin', 60)} req / min"
                    overage = f"₹{p.get('overageCost', 0.02)} / call"
                    features = ", ".join(p.get("features", [])[:3]) if isinstance(p.get("features"), list) else "Standard Endpoints"
                    rows.append(f"| **{name} Tier** | **{price} / mo** | **{quota}** | {rpm} | {overage} | {features} |")
                
                table_header = "| Subscription Plan | Monthly Price | Monthly Included Quota | Rate Limit (RPM) | Overage Cost / Call | Key Features |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n"
                return table_header + "\n".join(rows)
    except Exception:
        pass

    # Fallback to current database standard if frontend service is not yet ready during cold boot
    return (
        "| Subscription Plan | Monthly Price | Monthly Included Quota | Rate Limit (RPM) | Overage Cost / Call | Key Features |\n"
        "| :--- | :--- | :--- | :--- | :--- | :--- |\n"
        "| **Starter Tier** | **₹4,999 / mo** | **35,000 calls** | 60 req / min | ₹0.02 / call | All 117 Endpoints, Full Kundli & Panchang, Community Support |\n"
        "| **Pro Tier** | **₹14,999 / mo** | **300,000 calls** | 300 req / min | ₹0.015 / call | Full D1–D60 Divisional Charts, High Throughput, 99.9% SLA & Priority Support |\n"
        "| **Enterprise Tier** | **₹39,999 / mo** | **1,500,000 calls** | 1,200 req / min | ₹0.01 / call | White-label PDF Engine, Dedicated Cache, Custom Branding & 24/7 SLA |"
    )

def build_api_description(plans_table_markdown: str) -> str:
    return f"""# AstroEngine Enterprise B2B API Suite
High-performance, multi-language (i18n) Vedic and Western Astrology API Engine, White-label PDF Generator, and Calculations Gateway.

---

## 1. Quick Integration SDK Snippets

### cURL / Terminal
```bash
curl -X POST "http://localhost:8000/api/v1/core/planets/positions" \\
     -H "x-api-key: ak_live_your_api_token" \\
     -H "Content-Type: application/json" \\
     -d '{{
       "dob": "1995-10-05",
       "tob": "14:30",
       "lat": 24.5854,
       "lon": 73.7125,
       "tz": 5.5,
       "lang": "en"
     }}'
```

### Python (`requests`)
```python
import requests

url = "http://localhost:8000/api/v1/core/planets/positions"
headers = {{
    "x-api-key": "ak_live_your_api_token",
    "Content-Type": "application/json"
}}
payload = {{
    "dob": "1995-10-05",
    "tob": "14:30",
    "lat": 24.5854,
    "lon": 73.7125,
    "tz": 5.5,
    "lang": "hi" # Hindi output
}}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Sun Position:", data["data"]["planets"][0]["name"], data["data"]["planets"][0]["sign"]["name"])
```

### Node.js / TypeScript (`fetch` / `axios`)
```typescript
import axios from "axios";

const client = axios.create({{
  baseURL: "http://localhost:8000/api/v1",
  headers: {{
    "x-api-key": "ak_live_your_api_token",
    "Content-Type": "application/json"
  }}
}});

async function getKundli() {{
  const res = await client.post("/parashari/chart/d1", {{
    dob: "1995-10-05",
    tob: "14:30",
    lat: 24.5854,
    lon: 73.7125,
    tz: 5.5,
    lang: "en"
  }});
  console.log("Ascendant:", res.data.data.ascendant);
}}
```

### PHP (`cURL`)
```php
<?php
$ch = curl_init("http://localhost:8000/api/v1/core/planets/positions");
$payload = json_encode([
    "dob" => "1995-10-05",
    "tob" => "14:30",
    "lat" => 24.5854,
    "lon" => 73.7125,
    "tz"  => 5.5,
    "lang" => "en"
]);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "x-api-key: ak_live_your_api_token",
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
curl_close($ch);
$result = json_decode($response, true);
?>
```

---

## 2. Authentication & Header-Only Security

All API endpoints strictly enforce authentication via HTTP request headers.
* **Header Name:** `x-api-key`
* **Value Format:** `ak_live_...` (Live Production Key) or `ak_test_...` (Sandbox Key)
* **Security Notice:** API keys passed in URL query parameters (e.g. `?api_key=...`) are explicitly rejected to prevent token leakage in server access logs and browser histories.

---

## 3. Rate Limits & Quota Policy

AstroEngine enforces sliding-window rate limiting per API key and a dual-tier consumption model (Monthly Plan Quota first, followed by prepaid Wallet Credits overage):

### Subscription Plans & Throughput

{plans_table_markdown}

---

### Metering & Overage Lifecycle

1. **Active Plan Quota First:** Each incoming authenticated API request decrements from your subscription plan's `monthlyQuota` (e.g. 35,000 calls on Starter, 300,000 on Pro).
2. **Seamless Wallet Credit Fallback:** Once your monthly included quota reaches `0`, calls transition automatically into **Overage Mode**. Calls are charged against your prepaid wallet balance at the plan's overage rate (e.g. ₹0.02/call for Starter, ₹0.015/call for Pro, ₹0.01/call for Enterprise) without interrupting your live production traffic.
3. **Double Exhaustion & Grace Handling:** When both the monthly quota **and** wallet balance are depleted, the gateway rejects subsequent calls with **`HTTP 403 Forbidden` (`QUOTA_AND_CREDITS_EXHAUSTED`)** and provides a direct recharge URL (`/billing`) with real-time balance metrics.
4. **Rate Limit Throttling (`429 Too Many Requests`):** If bursts exceed the plan's RPM threshold (e.g., 60 RPM on Starter, 300 RPM on Pro, 1,200 RPM on Enterprise), the engine returns HTTP 429 with a `Retry-After: <seconds>` header.

---

### Real-Time Live Quota & Consumption Telemetry

Every API response automatically returns live subscription balance metadata in both the **JSON body** and **HTTP response headers**:

#### Response JSON `quota` Object:
```json
{{
  "status": "success",
  "language": "en",
  "quota": {{
    "plan": "STARTER",
    "plan_name": "Starter Plan",
    "plan_price_monthly": 4999.0,
    "monthly_quota": 35000,
    "monthly_usage": 142,
    "remaining_quota": 34858,
    "deduction_type": "QUOTA",
    "wallet_balance": 150.00
  }},
  "data": {{ ... }}
}}
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `plan` | string | Subscription plan tier code (`STARTER`, `PRO`, `ENTERPRISE`) |
| `plan_name` | string | Live plan display title configured in database |
| `plan_price_monthly` | number | Active monthly subscription fee in INR |
| `monthly_quota` | integer | Total calls included for current monthly billing cycle |
| `monthly_usage` | integer | Calls consumed so far this month |
| `remaining_quota` | integer | Remaining free plan calls before overage applies |
| `deduction_type` | string | `QUOTA` (plan quota used) or `WALLET_CREDIT` (prepaid overage) |
| `wallet_balance` | number | Available prepaid wallet balance in INR |

#### Live HTTP Response Headers:
* `x-plan-tier`: Active plan code
* `x-quota-monthly`: Included monthly limit
* `x-quota-remaining`: Remaining monthly balance
* `x-quota-deduction-type`: Quota or Wallet deduction source
* `x-wallet-balance`: Real-time prepaid INR balance

---

## 4. Multi-Language Localization (i18n)

AstroEngine uses a **Dual-Key Response Architecture**:
* `id` contains invariant machine-readable uppercase constants (e.g. `SUN`, `ARIES`, `ROHINI`).
* `name` contains localized unicode script based on the request body `lang` parameter.

| Code | Language | Script | Example Sun (`Surya`) | Example Aries (`Mesh`) |
| :--- | :--- | :--- | :--- | :--- |
| **`en`** (Default) | English | Latin | `Sun` | `Aries` |
| **`hi`** | Hindi | Devanagari | `सूर्य` | `मेष` |
| **`gu`** | Gujarati | Gujarati Unicode | `સૂર્ય` | `મેષ` |
| **`mr`** | Marathi | Devanagari | `सूर्य` | `મેષ` |
| **`ta`** | Tamil | Dravidian Tamil | `சூரியன்` | `மேஷம்` |
| **`te`** | Telugu | Telugu Unicode | `సూర్యుడు` | `మేషం` |

---

## 5. Standard Astronomical Reference Enums

### Ayanamsa Modes
* `LAHIRI` (Chitra Paksha — Official Indian Calendar Standard, Recommended)
* `RAMAN` (B.V. Raman Ayanamsa)
* `KP` (Krishnamurti Paddhati Traditional)
* `FAGAN_BRADLEY` (Western Sidereal)
* `TROPICAL` (Sayana / 0° Vernal Equinox)

### House Systems
* `PLACIDUS` (Semi-arc division, KP Astrology standard)
* `SRIPATI` (Classical Vedic Porphyry-variant)
* `EQUAL` (30-degree equal house from Ascendant)
* `WHOLE_SIGN` (Entire sign of ascendant is House 1)

---

## 6. Asynchronous PDF Generation & Webhook Pipeline

PDF generation is an asynchronous non-blocking background pipeline:
1. **Initiate Generation:** Client sends `POST /api/v1/pdf/kundli/basic` or `POST /api/v1/pdf/kundli/brihat`.
2. **Instant Acknowledgement:** Returns `HTTP 202 Accepted` with a unique `job_id` and `poll_url`.
3. **Status Polling:** Query `GET /api/v1/pdf/status/{{job_id}}` until status reaches `COMPLETED`.
4. **Automated Webhooks:** Pass an optional HTTPS `webhook_url` in request payload to receive an instant webhook callback when PDF is compiled.
5. **Auto-Expiring Storage:** Pre-signed URLs reside on Cloudflare R2 and auto-expire after 24 hours to ensure privacy.

---

## 7. Master Error Codes Dictionary

| Error Code | HTTP Status | Description | Recovery Action |
| :--- | :--- | :--- | :--- |
| `AUTH_HEADER_MISSING` | `401` | Missing `x-api-key` header | Provide valid header |
| `INVALID_API_KEY` | `401` | Key does not match active records | Regenerate key in dashboard |
| `QUOTA_AND_CREDITS_EXHAUSTED` | `403` | Both monthly plan quota and prepaid wallet balance are depleted | Recharge wallet or upgrade plan via `/billing` |
| `ACCOUNT_SUSPENDED` | `403` | Account has been blocked or suspended by administrator | Contact support or check billing status |
| `MAINTENANCE_MODE` | `503` | Platform maintenance in progress | Retry after scheduled window |
| `VALIDATION_ERROR` | `422` | Request body field format error | Verify date/time ISO format |
| `INVALID_COORDINATES` | `400` | Lat not in -90 to +90, lon not in -180 to +180 | Fix geographic coordinates |
| `RATE_LIMIT_EXCEEDED` | `429` | Sliding window rate limit exceeded | Wait for `retry_after_seconds` |
| `EPHEMERIS_CALCULATION_ERROR` | `500` | Date out of 1800-2100 CE Swiss Ephemeris range | Check historical date range |
"""

app = FastAPI(
    title="AstroEngine B2B API Suite",
    description=build_api_description(get_dynamic_plans_markdown()),
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,  # Powered by custom Next.js-styled ReDoc UI below
    openapi_url="/openapi.json",
    openapi_tags=TAGS_METADATA,
    responses=GLOBAL_RESPONSES
)

# Dynamic CORS loaded from environment variables
origins = []
if settings.CORS_ORIGINS:
    origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
elif settings.NEXT_APP_URL:
    origins = [settings.NEXT_APP_URL.rstrip("/")]
else:
    origins = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def attach_quota_to_response(request: Request, call_next):
    """
    Middleware that automatically injects subscription quota & balance details
    into both HTTP response headers and the JSON response body (`quota` field).
    """
    response = await call_next(request)

    # Attach quota headers if authenticated
    quota = getattr(request.state, "quota", None)
    if quota:
        if "plan" in quota:
            response.headers["x-plan-tier"] = str(quota["plan"])
        if "monthlyQuota" in quota:
            response.headers["x-quota-monthly"] = str(quota["monthlyQuota"])
        if "remainingQuota" in quota:
            response.headers["x-quota-remaining"] = str(quota["remainingQuota"])
        if "deductionType" in quota:
            response.headers["x-quota-deduction-type"] = str(quota["deductionType"])
        if "walletBalance" in quota and quota["walletBalance"] is not None:
            response.headers["x-wallet-balance"] = str(quota["walletBalance"])

    # If response is application/json from our /api endpoints, inject into JSON body
    if (
        request.url.path.startswith("/api/v1") 
        and response.status_code == 200 
        and quota 
        and response.headers.get("content-type", "").startswith("application/json")
    ):
        import json
        from starlette.responses import Response as StarletteResponse
        
        # Consume response body
        body = [section async for section in response.body_iterator]
        body_bytes = b"".join(body)
        
        try:
            payload = json.loads(body_bytes.decode("utf-8"))
            if isinstance(payload, dict) and "status" in payload and payload["status"] == "success":
                # Inject real-time plan quota breakdown directly from DB record
                payload["quota"] = {
                    "plan": quota.get("plan"),
                    "plan_name": quota.get("planName", quota.get("plan")),
                    "plan_price_monthly": quota.get("priceMonthly"),
                    "monthly_quota": quota.get("monthlyQuota"),
                    "monthly_usage": quota.get("monthlyUsage"),
                    "remaining_quota": quota.get("remainingQuota"),
                    "deduction_type": quota.get("deductionType"),
                    "wallet_balance": quota.get("walletBalance")
                }
                modified_bytes = json.dumps(payload).encode("utf-8")
                
                new_response = StarletteResponse(
                    content=modified_bytes,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type="application/json"
                )
                new_response.headers["content-length"] = str(len(modified_bytes))
                return new_response
        except Exception:
            # Fallback if body cannot be parsed
            return StarletteResponse(
                content=body_bytes,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type="application/json"
            )

    return response

# Health & Readiness Probes (§12.4 in Technical Specification)
@app.get("/health", tags=["System"])
async def health_check():
    """Liveness probe for Render, load balancers, and uptime monitors."""
    return {
        "status": "healthy",
        "service": "AstroEngine API Suite",
        "environment": settings.ENVIRONMENT
    }

@app.get("/ready", tags=["System"])
async def readiness_check():
    """Readiness probe verifying operational state."""
    import os
    from fastapi.responses import JSONResponse
    ephe_exists = os.path.isdir(settings.EPHE_PATH)
    if not ephe_exists:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "ephe_path": settings.EPHE_PATH,
                "error": "Ephemeris directory missing or inaccessible"
            }
        )
    return {
        "status": "ready",
        "ephe_path": settings.EPHE_PATH
    }

from app.schemas.common import ENDPOINT_RESPONSES

# Register API Routers with complete typed Error Schemas
app.include_router(core_astronomy_router, responses=ENDPOINT_RESPONSES)
app.include_router(panchang_router, responses=ENDPOINT_RESPONSES)
app.include_router(parashari_router, responses=ENDPOINT_RESPONSES)
app.include_router(dasha_router, responses=ENDPOINT_RESPONSES)
app.include_router(kp_router, responses=ENDPOINT_RESPONSES)
app.include_router(dosha_matching_router, responses=ENDPOINT_RESPONSES)
app.include_router(remedies_router, responses=ENDPOINT_RESPONSES)
app.include_router(numerology_router, responses=ENDPOINT_RESPONSES)
app.include_router(western_router, responses=ENDPOINT_RESPONSES)
app.include_router(lalkitab_router, responses=ENDPOINT_RESPONSES)
app.include_router(advanced_router, responses=ENDPOINT_RESPONSES)
app.include_router(pdf_router, responses=ENDPOINT_RESPONSES)
app.include_router(ai_astrologer_router, responses=ENDPOINT_RESPONSES)
app.include_router(tarot_router, responses=ENDPOINT_RESPONSES)
app.include_router(vastu_router, responses=ENDPOINT_RESPONSES)

@app.get("/documentation", response_class=HTMLResponse, include_in_schema=False)
@app.get("/redoc", response_class=HTMLResponse, include_in_schema=False)
async def custom_redoc_html():
    """Custom ReDoc UI crafted to match the Next.js clean light-mode developer portal aesthetic."""
    next_url = (settings.NEXT_APP_URL or "http://localhost:3000").rstrip("/")
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AstroEngine B2B API Suite — Documentation</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><path d='M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z'/></svg>" />
  
  <!-- Next.js Typography: Inter & JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

  <style>
    :root {{
      --bg-page: #fafafa;
      --bg-card: #ffffff;
      --border-color: #e4e4e7;
      --border-muted: #f4f4f5;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --text-main: #09090b;
      --text-muted: #71717a;
      --code-panel-bg: #18181b;
      --code-panel-text: #f4f4f5;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      margin: 0;
      padding: 0;
      background-color: var(--bg-page);
      color: var(--text-main);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
    }}

    /* Sleek Next.js White Header */
    .next-nav {{
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 10000;
    }}

    .nav-left {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .brand-icon {{
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: 15px;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
    }}

    .brand-title {{
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #09090b;
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .brand-badge {{
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 9999px;
      background: #f4f4f5;
      border: 1px solid var(--border-color);
      color: #52525b;
      letter-spacing: 0.04em;
    }}

    .live-indicator {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #15803d;
      font-weight: 500;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 3px 10px;
      border-radius: 9999px;
    }}

    .pulse-dot {{
      width: 7px;
      height: 7px;
      background-color: #22c55e;
      border-radius: 50%;
      animation: pulse 2s infinite ease-in-out;
    }}

    @keyframes pulse {{
      0%, 100% {{ opacity: 1; transform: scale(1); }}
      50% {{ opacity: 0.4; transform: scale(0.85); }}
    }}

    .nav-actions {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .nav-btn {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #3f3f46;
      text-decoration: none;
      padding: 6px 13px;
      border-radius: 7px;
      background: #ffffff;
      border: 1px solid var(--border-color);
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }}

    .nav-btn:hover {{
      color: #09090b;
      background: #f4f4f5;
      border-color: #d4d4d8;
    }}

    .nav-btn-primary {{
      background: #09090b;
      color: #ffffff;
      border: 1px solid #09090b;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }}

    .nav-btn-primary:hover {{
      background: #27272a;
      color: #ffffff;
    }}

    /* Container & Perfectly Centered Screen Loader */
    #redoc-container {{
      margin-top: 60px;
      min-height: calc(100vh - 60px);
      background-color: var(--bg-page);
      display: flex;
      flex-direction: column;
    }}

    @keyframes spin {{
      to {{ transform: rotate(360deg); }}
    }}

    /* Center ReDoc's internal loading screen */
    #redoc-container > div:not(.redoc-wrap) {{
      min-height: calc(100vh - 120px) !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      margin: auto !important;
      text-align: center !important;
      font-family: 'Inter', sans-serif !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      color: #4f46e5 !important;
    }}

    /* ReDoc Overrides matching Next.js Light Theme */
    .redoc-wrap {{
      background-color: var(--bg-page) !important;
    }}

    /* Left Sidebar */
    .menu-content {{
      background-color: #ffffff !important;
      border-right: 1px solid var(--border-color) !important;
    }}

    .menu-item-title {{
      font-family: 'Inter', sans-serif !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      color: #52525b !important;
    }}

    .menu-item-title:hover {{
      color: #09090b !important;
    }}

    .active .menu-item-title {{
      color: #4f46e5 !important;
      font-weight: 600 !important;
    }}

    /* Modern Sleek HTTP Method Badges */
    .operation-type {{
      font-family: 'JetBrains Mono', monospace !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      line-height: 16px !important;
      height: 18px !important;
      min-width: 40px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 4px !important;
      padding: 0 5px !important;
      letter-spacing: 0.06em !important;
      text-transform: uppercase !important;
      margin-right: 8px !important;
      box-shadow: none !important;
    }}

    .operation-type.post {{
      background-color: #ecfdf5 !important;
      color: #047857 !important;
      border: 1px solid #a7f3d0 !important;
    }}

    .operation-type.get {{
      background-color: #eff6ff !important;
      color: #1d4ed8 !important;
      border: 1px solid #bfdbfe !important;
    }}

    .operation-type.put {{
      background-color: #fffbeb !important;
      color: #b45309 !important;
      border: 1px solid #fde68a !important;
    }}

    .operation-type.delete {{
      background-color: #fef2f2 !important;
      color: #b91c1c !important;
      border: 1px solid #fecaca !important;
    }}

    /* Clean Light Scrollbars */
    ::-webkit-scrollbar {{
      width: 6px;
      height: 6px;
    }}
    ::-webkit-scrollbar-track {{
      background: #f4f4f5;
    }}
    ::-webkit-scrollbar-thumb {{
      background: #d4d4d8;
      border-radius: 3px;
    }}
    ::-webkit-scrollbar-thumb:hover {{
      background: #a1a1aa;
    }}

    /* Markdown Tables in Light Mode */
    table {{
      border-collapse: collapse !important;
      width: 100% !important;
      margin: 18px 0 !important;
      border: 1px solid var(--border-color) !important;
      border-radius: 8px !important;
      background: #ffffff !important;
    }}

    th {{
      background-color: #f8fafc !important;
      color: #0f172a !important;
      font-weight: 600 !important;
      font-size: 13px !important;
      padding: 12px 16px !important;
      border-bottom: 1px solid var(--border-color) !important;
    }}

    td {{
      padding: 11px 16px !important;
      border-bottom: 1px solid var(--border-color) !important;
      font-size: 13px !important;
      color: #334155 !important;
    }}

    tr:nth-child(even) {{
      background-color: #fafafa !important;
    }}
  </style>
</head>
<body>
  <!-- Next.js Clean Light Header -->
  <header class="next-nav">
    <div class="nav-left">
      <div class="brand-icon">✦</div>
      <div class="brand-title">
        AstroEngine
        <span class="brand-badge">B2B API Suite</span>
      </div>
      <div class="live-indicator">
        <span class="pulse-dot"></span>
        v1.0.0 Live
      </div>
    </div>

    <div class="nav-actions">
      <a href="{next_url}/dashboard" class="nav-btn" target="_blank">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        Dashboard
      </a>
      <a href="{next_url}/api-keys" class="nav-btn" target="_blank">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
        API Keys
      </a>
      <a href="/openapi.json" class="nav-btn" target="_blank">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        OpenAPI Spec
      </a>
      <a href="{next_url}/pricing" class="nav-btn nav-btn-primary" target="_blank">
        Get Started
      </a>
    </div>
  </header>

  <!-- ReDoc Container with Centered Next.js Loader -->
  <div id="redoc-container">
    <div id="init-loader" style="min-height: calc(100vh - 120px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; margin: auto;">
      <div style="width: 32px; height: 32px; border: 3px solid #e4e4e7; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <div style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; color: #71717a;">Loading Documentation...</div>
    </div>
  </div>

  <!-- ReDoc Standalone Script -->
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    Redoc.init('/openapi.json', {{
      theme: {{
        spacing: {{
          unit: 5,
          sectionHorizontal: 40,
          sectionVertical: 36
        }},
        breakpoints: {{
          small: '50rem',
          medium: '85rem',
          large: '105rem'
        }},
        colors: {{
          tonalOffset: 0.2,
          primary: {{
            main: '#4f46e5',
            light: '#6366f1',
            dark: '#4338ca'
          }},
          success: {{
            main: '#16a34a',
            light: '#22c55e',
            dark: '#15803d'
          }},
          warning: {{
            main: '#d97706',
            light: '#f59e0b',
            dark: '#b45309'
          }},
          error: {{
            main: '#dc2626',
            light: '#ef4444',
            dark: '#b91c1c'
          }},
          text: {{
            primary: '#09090b',
            secondary: '#71717a'
          }},
          border: {{
            dark: '#e4e4e7',
            light: '#f4f4f5'
          }},
          http: {{
            get: '#2563eb',
            post: '#16a34a',
            put: '#d97706',
            options: '#71717a',
            patch: '#0891b2',
            delete: '#dc2626',
            basic: '#52525b',
            link: '#4f46e5',
            head: '#9333ea'
          }},
          responses: {{
            success: {{
              color: '#16a34a',
              backgroundColor: '#f0fdf4'
            }},
            error: {{
              color: '#dc2626',
              backgroundColor: '#fef2f2'
            }},
            info: {{
              color: '#2563eb',
              backgroundColor: '#eff6ff'
            }}
          }}
        }},
        typography: {{
          fontSize: '14px',
          lineHeight: '1.65em',
          fontWeightRegular: '400',
          fontWeightBold: '600',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          headings: {{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontWeight: '700',
            lineHeight: '1.4em'
          }},
          code: {{
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
            lineHeight: '1.6em',
            backgroundColor: '#f4f4f5',
            color: '#09090b'
          }}
        }},
        sidebar: {{
          width: '280px',
          backgroundColor: '#ffffff',
          textColor: '#52525b',
          activeTextColor: '#09090b',
          groupItems: {{
            activeBackgroundColor: '#f4f4f5',
            activeTextColor: '#09090b'
          }},
          level1Items: {{
            activeBackgroundColor: '#eef2ff',
            activeTextColor: '#4f46e5'
          }}
        }},
        rightPanel: {{
          backgroundColor: '#18181b',
          width: '42%',
          textColor: '#f4f4f5'
        }},
        schema: {{
          nestedBackground: '#f8fafc',
          linesColor: '#e4e4e7',
          defaultDetailsWidth: '75%'
        }}
      }},
      scrollYOffset: 60,
      hideDownloadButton: false,
      expandResponses: '200,201',
      requiredPropsFirst: true,
      sortPropsAlphabetically: false,
      showExtensions: true,
      pathInMiddlePanel: false,
      nativeScrollbars: true
    }}, document.getElementById('redoc-container'));
  </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content)

def custom_openapi():
    # Dynamically generate fresh documentation with live DB plans table
    from fastapi.openapi.utils import get_openapi
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=build_api_description(get_dynamic_plans_markdown()),
        routes=app.routes,
        tags=TAGS_METADATA,
    )

    # Standard example payloads for instant ReDoc preview
    standard_success_example = {
        "status": "success",
        "language": "en",
        "quota": {
            "plan": "STARTER",
            "plan_name": "Starter Plan",
            "plan_price_monthly": 4999.0,
            "monthly_quota": 35000,
            "monthly_usage": 142,
            "remaining_quota": 34858,
            "deduction_type": "QUOTA",
            "wallet_balance": 150.00
        },
        "data": {
            "ayanamsa": {"name": "LAHIRI", "value_degrees": 23.8214},
            "planets": {
                "Sun": {"longitude": 168.32, "sign": "Virgo", "house": 10, "speed": 0.985, "is_retrograde": False},
                "Moon": {"longitude": 312.45, "sign": "Aquarius", "house": 3, "speed": 13.2, "is_retrograde": False}
            },
            "ascendant": {"longitude": 245.12, "sign": "Sagittarius", "degree_in_sign": 5.12}
        }
    }
    
    error_400_example = {
        "status": "error",
        "code": "INVALID_COORDINATES",
        "message": "Geographic coordinates out of valid range (-90 to +90 lat, -180 to +180 lon).",
        "detail": {"field": "lat", "input": 999.0, "rule": "ge=-90.0, le=90.0"}
    }

    error_401_example = {
        "status": "error",
        "code": "AUTH_HEADER_MISSING",
        "message": "Missing or invalid 'x-api-key' authentication header.",
        "detail": "API keys must strictly be supplied via the 'x-api-key' HTTP request header."
    }

    error_403_example = {
        "status": "error",
        "code": "QUOTA_EXCEEDED",
        "message": "Monthly API credit limit reached or account suspended.",
        "detail": "Please upgrade your subscription tier or recharge your prepaid API wallet."
    }

    error_422_example = {
        "status": "error",
        "code": "VALIDATION_ERROR",
        "message": "Request body or parameter schema validation failed.",
        "errors": [
            {"loc": ["body", "dob"], "msg": "Field required", "type": "value_error.missing"},
            {"loc": ["body", "lat"], "msg": "Input should be less than or equal to 90.0", "type": "value_error.number.not_le"}
        ]
    }

    error_429_example = {
        "status": "error",
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Sliding-window request quota exceeded (60 calls/min).",
        "retry_after_seconds": 15
    }

    error_500_example = {
        "status": "error",
        "code": "EPHEMERIS_CALCULATION_ERROR",
        "message": "Swiss Ephemeris core calculation failed or coordinates out of ephemeris bounds.",
        "detail": "Julian Day out of range (1800-2100 CE) or ephemeris file missing."
    }

    # Inject direct example cards into all operations in openapi_schema
    for path, methods in openapi_schema.get("paths", {}).items():
        for method, operation in methods.items():
            if path in ["/health", "/ready"]:
                continue
            responses = operation.get("responses", {})
            
            # 200 Success example
            if "200" in responses:
                resp_200 = responses["200"]
                if "content" in resp_200 and "application/json" in resp_200["content"]:
                    resp_200["content"]["application/json"]["example"] = standard_success_example
            
            # 400 Bad Request
            if "400" in responses:
                resp_400 = responses["400"]
                if "content" in resp_400 and "application/json" in resp_400["content"]:
                    resp_400["content"]["application/json"]["example"] = error_400_example
            
            # 401 Unauthorized
            if "401" in responses:
                resp_401 = responses["401"]
                if "content" in resp_401 and "application/json" in resp_401["content"]:
                    resp_401["content"]["application/json"]["example"] = error_401_example

            # 403 Forbidden
            if "403" in responses:
                resp_403 = responses["403"]
                if "content" in resp_403 and "application/json" in resp_403["content"]:
                    resp_403["content"]["application/json"]["example"] = error_403_example

            # 422 Unprocessable Entity
            if "422" in responses:
                resp_422 = responses["422"]
                if "content" in resp_422 and "application/json" in resp_422["content"]:
                    resp_422["content"]["application/json"]["example"] = error_422_example

            # 429 Rate Limit
            if "429" in responses:
                resp_429 = responses["429"]
                if "content" in resp_429 and "application/json" in resp_429["content"]:
                    resp_429["content"]["application/json"]["example"] = error_429_example

            # 500 Ephemeris Calculation Fault
            if "500" in responses:
                resp_500 = responses["500"]
                if "content" in resp_500 and "application/json" in resp_500["content"]:
                    resp_500["content"]["application/json"]["example"] = error_500_example

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

