# AstroEngine — Complete API Reference & ReDoc Integration Specification

**Gateway URL (Local):** `http://localhost:8000`  
**Interactive Swagger UI:** `http://localhost:8000/docs`  
**Enterprise ReDoc UI:** `http://localhost:8000/redoc`  
**OpenAPI JSON Schema:** `http://localhost:8000/openapi.json`  

---

## 1. Global Authentication & HTTP Standards

### Authentication Header
Every API call (except `/health` and `/ready`) requires client authentication sent strictly via the HTTP header:
```http
x-api-key: ak_live_your_secret_api_key
Content-Type: application/json
```
> **Security Rule:** The engine **never** accepts API keys via URL query parameters (e.g. `?api_key=...`) to prevent token leakage in CDN logs and browser history.

### Standard Response Envelopes

#### 1. Success Response (`HTTP 200 OK`)
```json
{
  "status": "success",
  "language": "en",
  "data": { ... }
}
```
*Note: In all data outputs, an invariant machine token `id` is returned alongside the localized presentation string `name`.*

#### 2. Accepted Async Job (`HTTP 202 Accepted`)
```json
{
  "status": "PENDING",
  "job_id": "pdf_job_920c23032f26",
  "report_type": "kundli_basic",
  "poll_url": "/api/v1/pdf/status/pdf_job_920c23032f26",
  "message": "Basic Kundli PDF generation job queued successfully."
}
```

#### 3. Standard HTTP Status & Error Codes
| HTTP Code | Name | Scenario |
| :--- | :--- | :--- |
| **`200 OK`** | Success | Request succeeded and calculation output returned synchronously. |
| **`202 Accepted`** | Job Queued | Heavy async task (PDF generation) initiated in the background. |
| **`400 Bad Request`** | Validation Error | Missing required fields, invalid date/time format, or latitude/longitude out of range. |
| **`401 Unauthorized`** | Auth Failed | Missing or invalid `x-api-key` header. |
| **`403 Forbidden`** | Account Blocked / Quota | Account suspended (`isBlocked: true`) or wallet credits exhausted. |
| **`404 Not Found`** | Resource Missing | Invalid `job_id` passed to status poll endpoint. |
| **`422 Unprocessable Entity`** | Pydantic Failure | JSON body failed structural schema validation. |
| **`429 Too Many Requests`** | Rate Limit | Request burst exceeded sliding-window limit (default: 60 req/min). |
| **`500 Internal Error`** | Engine Failure | Unexpected Swiss Ephemeris calculation or C-binding fault. |

---

## 2. Standard Request Body (`BirthDataRequest`)

Used across almost all calculation endpoints:
```json
{
  "dob": "1995-10-05",
  "tob": "14:30",
  "lat": 24.5854,
  "lon": 73.7125,
  "tz": 5.5,
  "ayanamsa": "LAHIRI",
  "lang": "en"
}
```

### Parameter Documentation:
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `dob` | `string` | **Yes** | — | Birth date in ISO `YYYY-MM-DD` format. |
| `tob` | `string` | **Yes** | — | Birth time in `HH:MM` or `HH:MM:SS` format (24-hour clock). |
| `lat` | `float` | **Yes** | — | Birth latitude in decimal degrees (`-90.0` to `+90.0`). |
| `lon` | `float` | **Yes** | — | Birth longitude in decimal degrees (`-180.0` to `+180.0`). |
| `tz` | `float` | No | `5.5` | Timezone offset in decimal hours from UTC (e.g. `5.5` for IST, `-5.0` for EST). |
| `ayanamsa` | `string` | No | `"LAHIRI"` | `LAHIRI`, `RAMAN`, `KP`, `FAGAN_BRADLEY`, `TROPICAL`. |
| `lang` | `string` | No | `"en"` | Language selector: `en`, `hi`, `gu`, `mr`, `ta`, `te`. |

---

## 3. Complete Module-Wise Endpoint Reference

---

### Module 1: Core Astronomy & Geolocation (`/api/v1/core`)

#### 1. `POST /api/v1/core/planets/positions`
* **Description:** Calculates exact longitude, latitude, speed, distance in AU, zodiac sign, nakshatra, and pada for 9 Vedic grahas + outer planets + Ascendant/Lagna.
* **Payload:** `BirthDataRequest`
* **Sample Output (`data`):**
```json
{
  "julian_day": 2449995.875,
  "ayanamsa_name": "LAHIRI",
  "ayanamsa_degree": 23.8051,
  "ascendant": {
    "full_degree": 270.47,
    "sign": { "id": "CAPRICORN", "name": "Capricorn", "number": 10 },
    "nakshatra": { "id": "UTTARA_ASHADHA", "name": "Uttara Ashadha", "pada": 2, "lord": "SUN" }
  },
  "planets": [
    {
      "id": "SUN",
      "name": "Sun",
      "full_degree": 167.854,
      "norm_degree": 17.854,
      "speed": 0.985,
      "is_retrograde": false,
      "sign": { "id": "VIRGO", "name": "Virgo", "number": 6 },
      "nakshatra": { "id": "HASTA", "name": "Hasta", "number": 13, "pada": 3, "lord": "MOON" }
    }
  ]
}
```

#### 2. `POST /api/v1/core/houses/cusps`
* **Description:** Computes 12 house cusps under `PLACIDUS`, `SRIPATI`, `EQUAL`, or `WHOLE_SIGN` systems.
* **Payload:** `BirthDataRequest`

#### 3. `POST /api/v1/core/planets/retrograde`
* **Description:** Provides Vakri (वक्री), Margi (मार्गी), and Stationary (स्थिर) statuses with daily angular speeds.
* **Payload:** `BirthDataRequest`

#### 4. `POST /api/v1/core/sun-moon/timings`
* **Description:** Local Sunrise, Sunset, Moonrise, Moonset and daylight duration with atmospheric refraction correction.
* **Payload:** `BirthDataRequest`

#### 5. `POST /api/v1/core/ayanamsa/all`
* **Description:** Comparative list of Lahiri, Raman, KP, and Fagan-Bradley ayanamsas.
* **Payload:** `BirthDataRequest`

---

### Module 2: Panchang & Muhurat (`/api/v1/panchang`)

#### 6. `POST /api/v1/panchang/daily`
* **Description:** 5 classical limbs of Panchang: Tithi (% elapsed), Vaar (Lord), Nakshatra (Pada, Lord), Yoga, Karana (Vishti/Bhadra flag).
* **Payload:** `BirthDataRequest`
* **Sample Output (`data`):**
```json
{
  "date": "1995-10-05",
  "time": "14:30",
  "vaar": { "id": "THURSDAY", "name": "Thursday", "lord": "JUPITER" },
  "tithi": { "id": "SHUKLA_DWADASHI", "name": "Shukla Dwadashi", "paksha": "SHUKLA", "number": 12, "percent_completed": 59.66 },
  "nakshatra": { "id": "SHATABHISHA", "name": "Shatabhisha", "number": 24, "pada": 1, "lord": "RAHU" },
  "yoga": { "id": "SHULA", "name": "Shula", "number": 9 },
  "karana": { "id": "BALAVA", "name": "Balava", "is_vishti_bhadra": false }
}
```

#### 7. `POST /api/v1/panchang/choghadiya`
* **Description:** 8 Day Choghadiya slots (Shubh, Amrit, Labh, Chal, Rog, Kaal, Udweg) based on local sunrise-sunset proportions.
* **Payload:** `BirthDataRequest`

---

### Module 3: Parashari Kundli & Divisional Charts (`/api/v1/parashari`)

#### 8. `POST /api/v1/parashari/chart/d1`
* **Description:** Primary Lagna Kundli with 12 Bhavas and occupant planets.
* **Payload:** `BirthDataRequest`

#### 9. `POST /api/v1/parashari/chart/d9`
* **Description:** Navamsha Kundli using elemental triplicities algorithm.
* **Payload:** `BirthDataRequest`

#### 10. `POST /api/v1/parashari/chart/divisional/{varga}`
* **Description:** Complete D2 to D60 harmonic divisional charts (`D2`, `D3`, `D4`, `D7`, `D10`, `D12`, `D16`, `D20`, `D24`, `D27`, `D30`, `D40`, `D45`, `D60`).
* **Path Parameter:** `varga` (`string`, e.g. `D10` for career)

#### 11. `POST /api/v1/parashari/chart/svg`
* **Description:** High-performance Vector SVG chart generator in North Indian Diamond format (`Content-Type: image/svg+xml`).
* **Payload:** `BirthDataRequest`

---

### Module 4: 120-Year Vimshottari Dasha Engine (`/api/v1/dasha`)

#### 12. `POST /api/v1/dasha/vimshottari/mahadasha`
* **Description:** Complete 120-year timeline starting with birth dasha balance.
* **Payload:** `BirthDataRequest`

#### 13. `POST /api/v1/dasha/vimshottari/current`
* **Description:** Live running Dasha hierarchy (`Mahadasha > Antardasha > Pratyantar Dasha`).
* **Payload:** `BirthDataRequest`
* **Sample Output (`data`):**
```json
{
  "as_of_date": "2026-09-16 17:07",
  "running_dasha": {
    "hierarchy": "JUPITER > MARS > VENUS",
    "mahadasha": { "planet_id": "JUPITER", "planet_name": "Jupiter", "start_date": "2013-04-16", "end_date": "2029-04-16" },
    "antardasha": { "antardasha": "MARS", "antardasha_name": "Mars", "start_date": "2026-03-10", "end_date": "2027-02-15" }
  }
}
```

#### 14. `POST /api/v1/dasha/vimshottari/antardasha`
* **Description:** Sub-cycle Level 2 Antardasha breakdown for any selected Mahadasha `(MD * AD) / 120`.
* **Payload:** `BirthDataRequest`

---

### Module 5: Krishnamurti Paddhati (KP System) (`/api/v1/kp`)

#### 15. `POST /api/v1/kp/planets`
* **Description:** KP Sign Lord, Star Lord (Nakshatra), and Sub-Lord using Krishnamurti Ayanamsa.
* **Payload:** `BirthDataRequest`

#### 16. `POST /api/v1/kp/cusps`
* **Description:** KP 12 Placidus House Cusps with Sign/Star/Sub-Lords.
* **Payload:** `BirthDataRequest`

#### 17. `POST /api/v1/kp/horary/1-249`
* **Description:** KP Horary (Prashna Kundli) query using seeds 1 to 249.
* **Query Parameter:** `seed` (`int`, 1 to 249)
* **Payload:** `BirthDataRequest`

---

### Module 6: Lal Kitab System (`/api/v1/lalkitab`)

#### 18. `POST /api/v1/lalkitab/chart/kundli`
* **Description:** Kalpurush conversion chart, sleeping/blind houses, and 6 ancestral debts (Rin).
* **Payload:** `BirthDataRequest`

#### 19. `POST /api/v1/lalkitab/varshphal/chart`
* **Description:** Annual planetary progression for age 1 to 120.
* **Query Parameter:** `age` (`int`, 1 to 120)
* **Payload:** `BirthDataRequest`

---

### Module 7: Jaimini & Tajik Varshphal (`/api/v1/advanced`)

#### 20. `POST /api/v1/advanced/jaimini/karakas`
* **Description:** 7 Jaimini Chara Karakas: Atmakaraka (AK), Amatyakaraka (AmK), BK, MK, PK, GK, DK sorted by degree.
* **Payload:** `BirthDataRequest`

#### 21. `POST /api/v1/advanced/tajik/varshphal-chart`
* **Description:** Tajik Solar Return chart analysis, Muntha house, and Varshesh candidates.
* **Query Parameter:** `target_year` (`int`)
* **Payload:** `BirthDataRequest`

---

### Module 8: Dosha Analysis & 36 Guna Matchmaking (`/api/v1/dosha-matching`)

#### 22. `POST /api/v1/dosha-matching/manglik`
* **Description:** Evaluated from Lagna, Moon, and Venus with 20+ classical cancellation rules.
* **Payload:** `BirthDataRequest`
* **Sample Output (`data`):**
```json
{
  "status": "MANGLIK",
  "severity": "HIGH",
  "is_manglik": true,
  "mars_placements": { "house_from_lagna": 10, "house_from_moon": 8, "house_from_venus": 1 },
  "is_cancelled": false,
  "cancellation_reasons": []
}
```

#### 23. `POST /api/v1/dosha-matching/kalsarpa`
* **Description:** Kaal Sarp status across all 12 types (Anant to Sheshnag).
* **Payload:** `BirthDataRequest`

#### 24. `POST /api/v1/dosha-matching/matchmaking/ashtakoot`
* **Description:** Complete 36 Guna Milan (8 Kootas: Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi).
* **Payload (`MatchmakingRequest`):**
```json
{
  "groom_dob": "1995-10-05",
  "groom_tob": "14:30",
  "groom_lat": 24.5854,
  "groom_lon": 73.7125,
  "groom_tz": 5.5,
  "bride_dob": "1997-12-18",
  "bride_tob": "09:15",
  "bride_lat": 28.6139,
  "bride_lon": 77.2090,
  "bride_tz": 5.5,
  "lang": "en"
}
```
* **Sample Output (`data`):**
```json
{
  "total_score": 14.5,
  "max_score": 36.0,
  "recommendation": "NOT_RECOMMENDED",
  "kootas": {
    "varna": { "points": 1.0, "max": 1.0 },
    "bhakoot": { "points": 0.0, "max": 7.0, "has_dosha": true },
    "nadi": { "points": 8.0, "max": 8.0, "has_dosha": false }
  }
}
```

---

### Module 9: Astrological Remedies (`/api/v1/remedies`)

#### 25. `POST /api/v1/remedies/gemstones`
* **Description:** Life Stone (Lagna), Lucky Stone (9th), Benefic Stone (5th) with Maraka/Badhaka cautions.
* **Payload:** `BirthDataRequest`

#### 26. `POST /api/v1/remedies/rudraksha`
* **Description:** 1 to 14 Mukhi Rudraksha prescription based on horoscope.
* **Payload:** `BirthDataRequest`

#### 27. `GET /api/v1/remedies/mantras`
* **Description:** Vedic and Tantrik Beej Mantras with chanting counts.

---

### Module 10: Numerology Engine (`/api/v1/numerology`)

#### 28. `POST /api/v1/numerology/core-numbers`
* **Description:** Mulank (Day), Bhagyank (Full DOB destiny sum), and Namank (Chaldean name reduction).
* **Query Parameter:** `name` (`string`, optional)
* **Payload:** `BirthDataRequest`

#### 29. `POST /api/v1/numerology/loshu-grid`
* **Description:** 3x3 Lo Shu Magic Grid evaluating Mental, Emotional, Practical, Thought, Will, and Action planes + missing numbers.
* **Payload:** `BirthDataRequest`

---

### Module 11: Western Astrology (`/api/v1/western`)

#### 30. `POST /api/v1/western/tropical-planets`
* **Description:** Pure Sayana/Tropical positions measured from Vernal Equinox 0° Aries.
* **Payload:** `BirthDataRequest`

#### 31. `POST /api/v1/western/big-three`
* **Description:** Core identity: Sun Sign, Moon Sign, and Ascendant Sign.
* **Payload:** `BirthDataRequest`

#### 32. `POST /api/v1/western/aspects/matrix`
* **Description:** Major Western aspects: Conjunction (0°), Sextile (60°), Square (90°), Trine (120°), Opposition (180°).
* **Payload:** `BirthDataRequest`

#### 33. `POST /api/v1/western/chart/wheel-svg`
* **Description:** Circular Western Natal Chart Wheel in Vector SVG format (`Content-Type: image/svg+xml`).
* **Payload:** `BirthDataRequest`

---

### Module 12: White-Label PDF Generation Suite (`/api/v1/pdf`)

#### 34. `POST /api/v1/pdf/kundli/basic` (HTTP 202 Accepted)
* **Description:** Asynchronous 15–20 page Basic Kundli generator with custom branding injection.
* **Payload (`PdfReportRequest`):**
```json
{
  "dob": "1995-10-05",
  "tob": "14:30",
  "lat": 24.5854,
  "lon": 73.7125,
  "tz": 5.5,
  "lang": "en",
  "branding": {
    "company_name": "Divine Jyotish Studio",
    "logo_url": "https://example.com/logo.png",
    "website": "www.divinejyotish.com",
    "contact_number": "+91 98765 43210",
    "primary_color": "#b45309"
  },
  "webhook_url": "https://your-app.com/api/webhooks/pdf"
}
```
* **Response (`HTTP 202`):**
```json
{
  "status": "PENDING",
  "job_id": "pdf_job_920c23032f26",
  "report_type": "kundli_basic",
  "poll_url": "/api/v1/pdf/status/pdf_job_920c23032f26",
  "message": "Basic Kundli PDF generation job queued successfully."
}
```

#### 35. `POST /api/v1/pdf/kundli/brihat` (HTTP 202 Accepted)
* **Description:** Asynchronous 60–100 page Grand Brihat Kundli generator with white-label branding.
* **Payload:** `PdfReportRequest`

#### 36. `GET /api/v1/pdf/status/{job_id}`
* **Description:** Polling status check (`PENDING` / `PROCESSING` / `COMPLETED` / `FAILED`) returning Cloudflare R2 download URL.
* **Sample Response when COMPLETED (`data`):**
```json
{
  "job_id": "pdf_job_920c23032f26",
  "report_type": "kundli_basic",
  "status": "COMPLETED",
  "file_url": "https://cdn.astroengine.io/reports/pdf_job_920c23032f26.pdf",
  "credits_cost": 5.0,
  "refunded": false
}
```

#### 37. `POST /api/v1/pdf/preview/html`
* **Description:** Instant HTML/SVG preview of branded report before rendering PDF (`Content-Type: text/html`).
* **Payload:** `PdfReportRequest`
