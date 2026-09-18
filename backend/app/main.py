from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

app = FastAPI(
    title="AstroEngine B2B API Suite",
    description="""
# AstroEngine Enterprise B2B API Suite
High-performance, multi-language (i18n) Vedic and Western Astrology API Engine, White-label PDF Generator, and Calculations Gateway.

---

## 1. Quick Integration SDK Snippets

### cURL / Terminal
```bash
curl -X POST "http://localhost:8000/api/v1/core/planets/positions" \\
     -H "x-api-key: ak_live_your_api_token" \\
     -H "Content-Type: application/json" \\
     -d '{
       "dob": "1995-10-05",
       "tob": "14:30",
       "lat": 24.5854,
       "lon": 73.7125,
       "tz": 5.5,
       "lang": "en"
     }'
```

### Python (`requests`)
```python
import requests

url = "http://localhost:8000/api/v1/core/planets/positions"
headers = {
    "x-api-key": "ak_live_your_api_token",
    "Content-Type": "application/json"
}
payload = {
    "dob": "1995-10-05",
    "tob": "14:30",
    "lat": 24.5854,
    "lon": 73.7125,
    "tz": 5.5,
    "lang": "hi" # Hindi output
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Sun Position:", data["data"]["planets"][0]["name"], data["data"]["planets"][0]["sign"]["name"])
```

### Node.js / TypeScript (`fetch` / `axios`)
```typescript
import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "x-api-key": "ak_live_your_api_token",
    "Content-Type": "application/json"
  }
});

async function getKundli() {
  const res = await client.post("/parashari/chart/d1", {
    dob: "1995-10-05",
    tob: "14:30",
    lat: 24.5854,
    lon: 73.7125,
    tz: 5.5,
    lang: "en"
  });
  console.log("Ascendant:", res.data.data.ascendant);
}
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

AstroEngine utilizes an in-memory & Upstash Redis sliding-window rate limiter per API key:
| Subscription Plan | Rate Limit | Monthly Quota | Burst Allowance |
| :--- | :--- | :--- | :--- |
| **Free Sandbox** | 20 requests / min | 1,000 calls | 5 concurrent |
| **Starter Tier** | 60 requests / min | 35,000 calls | 15 concurrent |
| **Pro Tier** | 300 requests / min | 100,000 calls | 50 concurrent |
| **Enterprise Tier** | Custom SLA | Unlimited calls | Dedicated cluster |

When limit is exceeded, HTTP `429 Too Many Requests` is returned with a `Retry-After: <seconds>` header.

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
| **`mr`** | Marathi | Devanagari | `सूर्य` | `मेष` |
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
3. **Status Polling:** Query `GET /api/v1/pdf/status/{job_id}` until status reaches `COMPLETED`.
4. **Automated Webhooks:** Pass an optional HTTPS `webhook_url` in request payload to receive an instant webhook callback when PDF is compiled.
5. **Auto-Expiring Storage:** Pre-signed URLs reside on Cloudflare R2 and auto-expire after 24 hours to ensure privacy.

---

## 7. Master Error Codes Dictionary

| Error Code | HTTP Status | Description | Recovery Action |
| :--- | :--- | :--- | :--- |
| `AUTH_HEADER_MISSING` | `401` | Missing `x-api-key` header | Provide valid header |
| `INVALID_API_KEY` | `401` | Key does not match active records | Regenerate key in dashboard |
| `QUOTA_EXCEEDED` | `403` | Monthly call quota or wallet depleted | Upgrade plan or recharge wallet |
| `VALIDATION_ERROR` | `422` | Request body field format error | Verify date/time ISO format |
| `INVALID_COORDINATES` | `400` | Lat not in -90 to +90, lon not in -180 to +180 | Fix geographic coordinates |
| `RATE_LIMIT_EXCEEDED` | `429` | Sliding window rate limit exceeded | Wait for `retry_after_seconds` |
| `EPHEMERIS_CALCULATION_ERROR` | `500` | Date out of 1800-2100 CE Swiss Ephemeris range | Check historical date range |
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=TAGS_METADATA,
    responses=GLOBAL_RESPONSES
)

# Strict CORS: only allow production and local developer domains (avoid open *)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://app.astroengine.io"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal astronomical calculation error",
            "detail": str(exc) if settings.ENVIRONMENT == "development" else "Server error"
        }
    )

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    from fastapi.openapi.utils import get_openapi
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=TAGS_METADATA,
    )

    # Standard example payloads for instant ReDoc preview
    standard_success_example = {
        "status": "success",
        "language": "en",
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

