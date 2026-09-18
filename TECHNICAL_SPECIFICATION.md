# AstroEngine & Next.js SaaS Suite — Master Technical Specification

High-performance, multi-language (i18n) B2B Vedic + Western Astrology API suite, white-label PDF engine, and full-stack Next.js SaaS portal (wallet billing, API-key management, admin controls).

> **Document history:** Reconstructed from a Gemini chat export (`PDF से Markdown फ़ाइल रूपांतरण.pdf`) into a single canonical spec, deduplicated, with Docker removed per a later decision in that chat (native Python runtime instead). **Section 12 ("Enterprise-Readiness Review") is new** — an independent technical review identifying gaps the original chat didn't cover, with fixes applied directly into the schema/architecture below (not just listed as suggestions) so this document reflects the corrected design, not the original draft. **Database switched from PostgreSQL to MySQL** (project decision, post-review) — see §2 and §6.

---

## 1. System Architecture Overview

```
                    [ B2B Clients / Mobile Apps / Web Portals ]
                                      │
                                      ▼ (HTTPS + x-api-key)
                            [ Nginx Reverse Proxy ]
                                      │
                  ┌───────────────────┴───────────────────┐
                  ▼                                        ▼
        [ Next.js SaaS Portal ]                   [ FastAPI Gateway ]
        (Landing, Dashboards, ReDoc)               (Auth, Metering & Routing)
                  │                                        │
                  │                                        ▼
                  │                             [ Upstash Redis Cache ]
                  │                    (Rate-limits, Keys, Daily Quota,
                  │                     Result Cache — see §12.7)
                  │                                        │
                  ▼                                        ▼
        [ MySQL (PlanetScale/Railway) ]          [ Core Astronomy Engine ]
        (User, Billing, Usage Logs)              (pyswisseph C-bindings, Math)
                                                            │
                                ┌───────────────────────────┴───────────────────────────┐
                                ▼                                                        ▼
                    [ Realtime JSON APIs ]                                    [ Async PDF Worker ]
                    (115+ REST Endpoints)                                     (Celery / Background)
                                                                                          │
                                                                              [ Jinja2 + WeasyPrint ]
                                                                              (SVG Charts + Noto Fonts)
                                                                                          │
                                                                                          ▼
                                                                              [ Cloudflare R2 Bucket ]
                                                                              (24-hr Auto-expiring PDFs)
```

`GET /health` and `GET /ready` are exposed on the FastAPI gateway for uptime monitoring and platform health checks — see §12.4 (this document adds them; not in the original chat).

> **Note on the "Celery / Background" worker (§14.20):** if using real Celery, its broker needs persistent connections and constant polling — Upstash's free Redis tier is REST/serverless and billed per-command, which doesn't suit that access pattern well and can get expensive fast under Celery's polling. For MVP/Phase 1–5 scale, prefer FastAPI's own `BackgroundTasks` (already mentioned as an option in §5) instead of Celery — it needs no broker at all. Only introduce Celery (with a dedicated, non-serverless Redis or RabbitMQ instance) once concurrent PDF-job volume actually requires a real task queue.

---

## 2. Tech Stack & Zero-Cost Infrastructure

| Layer | Technology | Free-Tier Hosting / Limits |
| :--- | :--- | :--- |
| **Core Calculation Engine** | Python, FastAPI, `pyswisseph` | Render.com / Koyeb (512 MB Free Container) |
| **Frontend & SaaS Portal** | Next.js (App Router), Tailwind CSS, Shadcn UI | Vercel (hobby tier, free) |
| **Database & ORM** | MySQL, Prisma ORM | Railway / Aiven / Clever Cloud free-or-trial tier — see note below |
| **Caching & Metering** | Upstash Redis | 10,000 commands/day free |
| **Authentication & RBAC** | Clerk / NextAuth | 10,000 monthly active users free |
| **Object Storage (PDFs)** | Cloudflare R2 (S3-compatible) | 10 GB storage, 0 bandwidth/egress fee |
| **Geo Data (Cities DB)** | SQLite (bundled) / GeoNames dump | Local disk, 250k+ global cities |
| **Documentation UI** | ReDoc OpenAPI (`/docs`, `/openapi.json`) | Built into FastAPI, embedded in Next.js |
| **Error Tracking** | Sentry (free tier) | 5k events/month — **added, §12.10** |

**Database note:** switched from PostgreSQL to **MySQL** (per project decision) — Prisma's `provider = "mysql"` supports everything this schema uses (enums as native `ENUM`, `Json`, `@db.Text`, `BigInt`, `uuid()`/`cuid()`/`autoincrement()` defaults) with no schema changes beyond the datasource line (§6). Free-tier MySQL hosting is less standardized than Postgres's Neon/Supabase — Railway and Aiven currently offer trial credits rather than a permanent free tier, and Clever Cloud has a small always-free "Dev" plan; confirm current terms before committing, since these change. For local dev, this project can just point at the same local XAMPP/MySQL instance already used for other projects on this machine.

**Connection pooling (§14.19):** Vercel deploys Next.js API routes as stateless serverless functions — each concurrent invocation can open its own DB connection, and a plain MySQL server has a hard connection limit (often as low as ~15–50 on free/trial tiers) that a burst of traffic can exhaust in seconds, causing `Too many connections` errors. Put a connection pooler in front of MySQL (e.g. ProxySQL, or Prisma Accelerate/Data Proxy) before going to production — don't let Prisma connect directly from every serverless invocation.

**Deployment note:** No Dockerfile — both services deploy on native runtimes:
- **Backend (Render/Koyeb):** Build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Frontend (Vercel):** Standard Next.js build, zero config.
- Local dev: standard `venv` + `pip install` — no Docker needed (see §9 for exact commands).
- **WeasyPrint caveat:** works fine locally on Mac/Windows, but needs Pango/Cairo system libraries on Linux hosts. Without Docker to pre-install them, prefer Render's native Python buildpack only if it ships these libs (verify at setup time), otherwise fall back to a Puppeteer/HTML-to-PDF approach on the Next.js side (`@react-pdf/renderer`) as the original chat concluded.

---

## 3. Directory & Workspace Structure

```text
astro-saas-platform/
│
├── backend/                          # Python FastAPI Engine
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic Settings (.env loader)
│   │   │   ├── security.py           # API key hashing & verification (§12.1)
│   │   │   ├── idempotency.py        # Idempotency-Key middleware (§12.6)
│   │   │   ├── redis.py              # Upstash Redis client + result cache (§12.7)
│   │   │   └── swisseph.py           # Swiss Ephemeris C-bindings wrapper
│   │   ├── locales/                  # Multi-language translation dictionaries
│   │   │   ├── en.json / hi.json / gu.json / mr.json / ta.json / te.json
│   │   ├── modules/                  # Calculation Modules
│   │   │   ├── core_astronomy/ panchang/ parashari/ dasha/ kp/ lalkitab/
│   │   │   ├── advanced/ dosha_matching/ remedies/ numerology/ western/
│   │   ├── pdf_engine/
│   │   │   ├── templates/            # Modular Jinja2 HTML/CSS templates
│   │   │   ├── generator.py          # WeasyPrint / HTML-to-PDF worker
│   │   │   └── r2_uploader.py        # Cloudflare R2 boto3 client
│   │   ├── schemas/                  # Pydantic Request & Response Models
│   │   ├── tests/                    # golden-dataset accuracy tests (§12.9)
│   │   └── main.py                   # FastAPI entry point, routers, /health
│   ├── ephe/                         # Swiss Ephemeris data files (.se1, ~25-30MB span)
│   ├── requirements.txt
│   └── .env
│
└── frontend/                         # Next.js Full-Stack Application
    ├── prisma/
    │   └── schema.prisma             # MySQL Database Schema (§6)
    ├── src/
    │   ├── app/
    │   │   ├── (marketing)/          # page.tsx, pricing/page.tsx
    │   │   ├── (auth)/               # sign-in, sign-up (Clerk)
    │   │   ├── (dashboard)/          # dashboard, api-keys, usage, pdf-reports,
    │   │   │                         # branding, billing
    │   │   ├── (admin)/              # admin, admin/users, admin/billing,
    │   │   │                         # admin/audit-log (§12.5), admin/prompts
    │   │   ├── docs/page.tsx         # Embedded ReDoc + "Run in Postman"
    │   │   └── api/webhooks/
    │   │       ├── razorpay/route.ts # MUST verify signature — §12.2
    │   │       └── clerk/route.ts
    │   ├── components/
    │   ├── emails/                   # §14 — React Email templates, all 22 of them
    │   └── middleware.ts             # RBAC guard (/admin protected)
    ├── package.json
    └── .env.local
```

---

## 4. Complete Module-Wise API Endpoints (115+ APIs)

Every calculation endpoint accepts standard birth data in the request body and a language selector via query param:

```json
{ "dob": "1995-10-05", "tob": "14:30", "lat": 24.5854, "lon": 73.7125, "tz": 5.5 }
```

Supported `lang`: `en`, `hi`, `gu`, `mr`, `ta`, `te`.

### Module 1: Core Astronomy & Geolocation (`/api/v1/core`)
1. `POST /planets/positions` — 9 Vedic grahas + Uranus, Neptune, Pluto: exact degree, sign, nakshatra, pada, celestial speed.
2. `POST /planets/retrograde` — Vakri/Margi status, retrograde entry date, stationary phase, direct resumption.
3. `POST /houses/cusps` — 12 house cusps under Placidus, Sripati, Equal House, Whole Sign.
4. `POST /sun-moon/timings` — Sunrise, Sunset, Moonrise, Moonset, astronomical/nautical twilight.
5. `POST /ayanamsa/all` — Lahiri, Raman, KP, Krishnamurti, Fagan-Bradley comparison.
6. `GET /geo/search?q={city}` — City autocomplete → lat, lon, elevation.
7. `GET /geo/timezone?lat={lat}&lon={lon}` — Historical timezone + DST offset.

### Module 2: Panchang & Muhurat (`/api/v1/panchang`)
8. `POST /daily` — Tithi, Vaar, Nakshatra, Yoga, Karana with exact end times.
9. `POST /advanced` — Rahu Kaal, Yamaghanda, Gulika Kaal, Abhijit/Brahma/Nishita Muhurat.
10. `POST /choghadiya` — Day (8) + Night (8) Choghadiya slots.
11. `POST /hora` — 24-hr planetary Hora schedule from local sunrise.
12. `POST /bhadra` — Bhadra presence, Vishti Karana timing, Mukh/Puchh, Swarga/Patala/Mrityu Loka.
13. `POST /panchak` — Panchak type (Roga, Agni, Nripa, Chora, Mrityu).
14. `POST /monthly-calendar` — Month-wide tithi transitions, ekadashi, pradosh, sankranti.
15. `POST /muhurat/marriage` — Vivah muhurat, filtered by Guru/Shukra Asta, tribal dosha.
16. `POST /muhurat/griha-pravesh` — Home-entry auspicious timings.
17. `POST /muhurat/property-vehicle` — Property/vehicle purchase muhurats.

### Module 3: Parashari Kundli & Divisional Charts (`/api/v1/parashari`)
18. `POST /chart/d1` — Lagna Kundli.
19. `POST /chart/d9` — Navamsha chart.
20. `POST /chart/divisional/{varga}` — D2, D3, D4, D7, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60.
21. `POST /chart/svg` — North/South/East Indian SVG generator.
22. `POST /chart/bhav-chalit` — Sripati/KP-based Bhav Chalit.
23. `POST /chart/moon-lagna` — Chandra Lagna chart.
24. `POST /shadbala/details` — 6-fold planetary strength.
25. `POST /bhavabala` — 12-house strength analysis.
26. `POST /avasthas` — Baladi, Jagradadi, Deeptadi avasthas.
27. `POST /ashtakvarga/bhinnashtak` — Per-planet bindu matrix.
28. `POST /ashtakvarga/sarvashtak` — Composite scores + Shodhya Pinda.
29. `POST /special-points` — Pushkar Navamsha/Bhaga, Gandanta, Mrityu Bhaga.
30. `POST /yogas/find` — 100+ classical yoga scanner.

### Module 4: Dasha Systems (`/api/v1/dasha`)
31. `POST /vimshottari/mahadasha` — 120-year table.
32. `POST /vimshottari/antardasha` — Level 2.
33. `POST /vimshottari/pratyantar` — Level 3.
34. `POST /vimshottari/sookshma` — Level 4.
35. `POST /vimshottari/prana` — Level 5.
36. `POST /vimshottari/current` — Live running dasha tree.
37. `POST /yogini/complete` — 36-year Yogini Dasha cycle.
38. `POST /char/jaimini` — Jaimini Rashi-based Char Dasha.

### Module 5: KP System (`/api/v1/kp`)
39. `POST /planets` — Sign/Star/Sub/Sub-Sub Lord list.
40. `POST /cusps` — Placidus 12 cusps + Sub/Star Lord mapping.
41. `POST /significators/level-4` — 4-grade (A/B/C/D) significator table.
42. `POST /house-significators` — Per-house significator planets.
43. `POST /ruling-planets` — Real-time Ruling Planets.
44. `POST /horary/1-249` — KP Horary (seed 1–249).
45. `POST /horary/1-2193` — Advanced Sub-Sub Lord Horary.
46. `POST /event-analysis` — Career/marriage/litigation house-combination check.

### Module 6: Lal Kitab System (`/api/v1/lalkitab`)
47. `POST /chart/kundli` — Kalpurush conversion chart.
48. `POST /debts/rin` — 6 ancestral debts.
49. `POST /blind-halfblind` — Andhe/Dharmi/sleeping houses.
50. `POST /varshphal/chart` — Age-based progression (1–120 yrs).
51. `POST /remedies/planet-wise` — Classical remedies, Do's & Don'ts.

### Module 7: Jaimini, Upagraha & Tajik Varshphal (`/api/v1/advanced`)
52. `POST /jaimini/karakas` — 7/8 Chara Karaka models.
53. `POST /jaimini/karakamsha` — Karakamsha Lagna + Swamsha.
54. `POST /jaimini/arudhas` — 12 Arudha Padas (incl. AL, UL).
55. `POST /upagrahas` — Mandi, Gulika, Dhuma, Vyatipata, Parivesha, Indrachapa.
56. `POST /tajik/varshphal-chart` — Solar Return chart.
57. `POST /tajik/muntha` — Muntha house + lord.
58. `POST /tajik/varshesh` — Panchadhikari Year Lord.
59. `POST /tajik/yogas` — 16 Tajik yogas.
60. `POST /tajik/sahams` — 36 Arabic parts.

### Module 8: Dosha Analysis & Matchmaking (`/api/v1/dosha-matching`)
61. `POST /manglik` — Lagna/Moon/Venus check + 20+ cancellations.
62. `POST /kalsarpa` — 12 Kaal Sarp types + partial logic.
63. `POST /sade-sati/status` — Live phase (Rising/Peak/Setting/Dhaiya).
64. `POST /sade-sati/timeline` — Lifetime cycle dates.
65. `POST /pitra-dosha` — Sun-Rahu, 9th-house afflictions.
66. `POST /guru-chandal` — Jupiter-Rahu conjunction.
67. `POST /matchmaking/ashtakoot` — 36 Guna Milan (8 kootas).
68. `POST /matchmaking/exceptions` — Nadi/Bhakoot cancellations.
69. `POST /matchmaking/dashakoot` — South Indian 10-Porutham.
70. `POST /matchmaking/papasmya` — Relative dosha balance.

### Module 9: Astrological Remedies (`/api/v1/remedies`)
71. `POST /gemstones` — Life/lucky/benefic stones.
72. `POST /gemstones/restrictions` — Maraka/Badhaka warnings.
73. `POST /rudraksha` — 1–14 Mukhi mapping.
74. `POST /yantras` — Planetary/deity yantras.
75. `POST /mantras` — Vedic/Tantrik/Beej mantras with counts.
76. `POST /donations` — Planet-wise daan items.
77. `POST /fasting` — Weekly/tithi fasting schedule.

### Module 10: Numerology (`/api/v1/numerology`)
78. `POST /core-numbers` — Mulank, Bhagyank, Namank.
79. `POST /loshu-grid` — 3×3 grid + plane evaluation.
80. `POST /missing-numbers` — Balancing remedies.
81. `POST /name-analysis` — Chaldean + Pythagorean.
82. `POST /name-correction` — Letter-suggestion algorithm.
83. `POST /forecast` — Personal Year/Month/Day.
84. `POST /pinnacles-challenges` — 4 pinnacles + 4 challenges.
85. `POST /favorable` — Dates, colors, numbers.

### Module 11: Western Astrology (`/api/v1/western`)
86. `POST /tropical-planets` — Tropical placements.
87. `POST /chart/wheel-svg` — Circular wheel SVG.
88. `POST /big-three` — Sun/Moon/Ascendant.
89. `POST /aspects/matrix` — Major/minor aspects, custom orbs.
90. `POST /synastry/score` — Two-chart overlay + compatibility.
91. `POST /transits/daily` — Current transits vs natal.
92. `POST /solar-return` — Annual tropical solar return.

### Module 12: White-Label PDF Generation Suite (`/api/v1/pdf`)
All accept `branding: { logo_url, company_name, website, contact_number, primary_color }`, `lang`, and (added) an optional `Idempotency-Key` header + `webhook_url` field — see §12.6 and §12.13.

93. `POST /kundli/basic` — 15–20 page report.
94. `POST /kundli/brihat` — 60–100 page grand report.
95. `POST /matching/report` — 20–25 page compatibility report.
96. `POST /varshphal/annual` — 25–35 page solar return report.
97. `POST /lalkitab/full` — 35–45 page Lal Kitab report.
98. `POST /dosha/sade-sati` — 12–15 page Sade Sati guide.
99. `POST /numerology/report` — 15–25 page numerology blueprint.
100. `GET /status/{job_id}` — Async polling (`PENDING`/`PROCESSING`/`COMPLETED`/`FAILED` + R2 URL).

*(Doc is referred to as "115+ APIs" — the 100 above are the fully enumerated set from the original spec; remaining headroom covers minor variant/utility endpoints not individually named.)*

---

## 5. White-Label PDF Architecture & Async Worker Pipeline

PDF generation is CPU-heavy (3–6s for an 80-page report), so it runs off the FastAPI event loop as a background job:

```
Client POST /api/v1/pdf/kundli/brihat  (with optional Idempotency-Key header — §12.6)
        │
        ▼
FastAPI: validate auth → check wallet balance → deduct credits → create Job
        │
        ▼
Returns HTTP 202 Accepted  { "status": "PENDING", "job_id": "pdf_job_928374", "poll_url": "..." }
        │
        ▼  (Background Task / Celery)
  1. pyswisseph calculates full chart data + interpretations
  2. Fetch translated prediction paragraphs from MySQL
  3. Compile inline SVG charts (D1, D9, Bhav Chalit)
  4. Render Jinja2 HTML/CSS templates (Google Noto Sans for Indic scripts)
  5. WeasyPrint/Puppeteer renders PDF to memory buffer
  6. Upload buffer to Cloudflare R2: reports/{job_id}.pdf
  7. Generate pre-signed download URL
  8. Update Job status → COMPLETED
     — on any failure: status → FAILED AND auto-refund creditsCost to walletBalance (§12.6)
     — if webhook_url was provided: POST job result to it (§12.13), in addition to polling
        │
        ▼
Client polls GET /api/v1/pdf/status/{job_id} → "COMPLETED", download_url: "https://..."
```

> **⚠️ SSRF risk in `webhook_url` (§12.13) — fixed here, §14.17.** When the server POSTs the job result to a client-supplied URL, a malicious or compromised client can point it at internal infrastructure (e.g. `http://169.254.169.254/...` cloud metadata, or an internal Redis/MySQL admin port) and use the backend as a proxy to reach systems it shouldn't. Before dispatching: reject non-HTTPS URLs, resolve the hostname and reject if it lands in a private/link-local/loopback IP range (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `127.0.0.0/8`), and re-check on every dispatch (not just at job creation) to prevent DNS-rebinding between validation and the actual request.

### Storage Auto-Deletion Strategy
Cloudflare R2 Lifecycle Rule: `auto-delete-24h`, prefix `reports/`, action *Expire and Delete after 24 hours*. Keeps disk usage inside the 10 GB free tier permanently.

---

## 6. Complete Prisma Database Schema (`schema.prisma`)

> **Security fix applied (§12.1):** `apiKey` is no longer stored in plaintext. Only a SHA-256 hash is persisted; the raw key is shown to the user exactly once at creation time, with a stored `apiKeyPrefix` (e.g. `ak_live_a1b2`) for UI display/identification — the same pattern Stripe and GitHub use for API tokens.
>
> **New models added:** `AuditLog` (§12.5, admin action trail), `SecurityEventLog` (§8.3.11, external/security events — auth failures, webhook/SSRF rejections), `TeamMember` (§8.2.8, Enterprise sub-users), `Subscription` (§8.2.6, recurring monthly plans — separate from `Transaction`, which is one-time wallet top-ups), and `AstrologicalPrediction` (unchanged from original, listed for completeness).
>
> **§8.3.9:** `Role` split from a flat `USER`/`ADMIN` binary into scoped admin roles (`SUPPORT_ADMIN`, `BILLING_ADMIN`, `AUDITOR`, `SUPER_ADMIN`) so a compromised support account can't touch billing or other admins, and an external accountant can get real read-only access without a standing security hole.
>
> **Backups, disaster recovery, and log-retention policy are operational/infra-level, not schema — see §8.3.12 and §8.3.11.**

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  SUPPORT_ADMIN   // §8.3.9 — user lookup, "view as user", tickets. No billing/credits/config access.
  BILLING_ADMIN   // §8.3.9 — refunds, credit adjustments, transactions. No user-block/system-config access.
  AUDITOR         // §8.3.9 — read-only: reports, financials, full audit log. Cannot change anything.
  SUPER_ADMIN     // §8.3.9 — everything, including managing other admins and system config.
}

enum TeamMemberRole {
  VIEWER    // §8.2.8 — read-only usage/billing
  OPERATOR  // §8.2.8 — can generate PDFs and manage API keys, not billing/plan
}

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
}

enum PlanTier {
  STARTER
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE      // renewing normally
  PAST_DUE    // renewal payment failed, inside the 7-day grace period (§8.2.6)
  CANCELLED   // grace period expired, or user-cancelled — downgraded to wallet mode
}

enum PdfJobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model User {
  id               String   @id @default(uuid())
  clerkId          String   @unique                // §8.2.0 — links this row to Clerk's external identity; upsert on this, never blind-insert on the user.created webhook
  email            String   @unique
  emailVerified    Boolean  @default(false)         // §8.2.0 — no API key considered "live" until true
  name             String?
  role             Role     @default(USER)

  // §8.2.0 — onboarding/signup analytics
  signupSource         String?                       // 'pricing_page' | 'landing_page' | 'playground' | 'team_invite'
  signupIp             String?                       // abuse-detection input for SecurityEventLog (§8.3.11)
  onboardingCompletedAt DateTime?                    // null while the activation checklist is still showing

  // Security fix (§12.1): never store the raw key.
  apiKeyHash       String   @unique              // SHA-256 of the live raw key
  apiKeyPrefix     String                        // e.g. "ak_live_a1b2" — safe to display in UI
  apiKeyCreatedAt  DateTime @default(now())
  apiKeyLastUsedAt DateTime?
  allowedIps       Json?                         // §8.2.2 — optional IP allowlist, e.g. ["203.0.113.4"]

  // §8.2.2 Sandbox/test mode — separate key, never touches walletBalance or real quota.
  apiKeyTestHash   String?  @unique
  apiKeyTestPrefix String?

  walletBalance    Float    @default(100.00)     // ₹100 free test credits
  planTier         PlanTier @default(STARTER)
  monthlyQuota     Int      @default(35000)      // plan's included calls/month
  monthlyUsage     Int      @default(0)          // resets on billing cycle (§12.12)
  overageAllowed   Boolean  @default(true)        // fallback to wallet pay-as-you-go past quota (§12.12)
  rateLimitPerMin  Int      @default(60)
  isBlocked        Boolean  @default(false)
  brandingConfig   Json?                         // { logoUrl, brandName, website, primaryColor, contactPhone }
  piiRetentionDays Int      @default(365)        // §12.4 data-retention policy, configurable per plan

  // §8.2.6 Auto-recharge — prevents silent service interruption when the wallet hits zero.
  autoRechargeEnabled   Boolean @default(false)
  autoRechargeThreshold Float?                    // recharge when walletBalance drops below this
  autoRechargeAmount    Float?                    // amount to add per auto-recharge

  accountWebhookUrl String?                       // §8.2.7 — account-level events (low balance, quota warnings)

  transactions     Transaction[]
  apiLogs          ApiRequestLog[]
  pdfJobs          PdfGenerationJob[]
  teamMembers      TeamMember[]                   // §8.2.8 — Enterprise sub-users under this account
  subscription     Subscription?                  // §8.2.6 — null until a monthly plan is purchased

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

// §8.2.8 — Enterprise-tier sub-users. Draws from the parent account's shared walletBalance;
// per-member usage still shows separately in ApiRequestLog via memberEmail.
model TeamMember {
  id            String          @id @default(uuid())
  ownerId       String                              // the Enterprise User account this member belongs to
  owner         User            @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  email         String
  role          TeamMemberRole  @default(VIEWER)
  apiKeyHash    String?         @unique              // own scoped key, same pattern as User.apiKeyHash
  apiKeyPrefix  String?
  invitedAt     DateTime        @default(now())
  acceptedAt    DateTime?

  @@unique([ownerId, email])
}

model ApiRequestLog {
  id           BigInt   @id @default(autoincrement())
  userId       String
  endpoint     String
  module       String
  creditsCost  Float
  ipAddress    String?
  responseTime Int                                // milliseconds
  statusCode   Int
  idempotencyKey String?                           // §12.6 — dedupes retried requests
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())

  @@index([userId, createdAt])
  @@index([idempotencyKey])
}

model PdfGenerationJob {
  id             String       @id @default(uuid())
  userId         String
  reportType     String                            // 'brihat_kundli', 'matchmaking', etc.
  language       String       @default("hi")
  status         PdfJobStatus @default(PENDING)
  fileUrl        String?                           // Cloudflare R2 pre-signed URL
  creditsCost    Float
  idempotencyKey String?      @unique               // §12.6 — one job per key
  webhookUrl     String?                            // §12.13 — optional client callback
  failureReason  String?                            // set on FAILED, shown to client
  refunded       Boolean      @default(false)        // true once creditsCost auto-refunded on FAILED
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())

  @@index([userId, status])
}

model Transaction {
  id                String             @id @default(uuid())
  userId            String
  amount            Float
  creditsAdded      Float
  paymentGateway    String                          // 'RAZORPAY', 'STRIPE'
  gatewayOrderId    String?
  gatewayPaymentId  String?
  webhookVerified   Boolean            @default(false) // §12.2 — must be true before credits are added
  status            TransactionStatus  @default(PENDING)
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt         DateTime           @default(now())

  @@index([userId, status])
}

// §8.2.6 — Recurring monthly plan (Razorpay Subscriptions), distinct from Transaction
// (which is one-time wallet top-ups via Razorpay Orders — a different API/flow entirely).
model Subscription {
  id                String              @id @default(uuid())
  userId            String              @unique          // one active subscription per account
  user              User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  planTier          PlanTier
  gatewaySubId      String?             @unique          // Razorpay subscription_id; null if isComped
  status            SubscriptionStatus  @default(ACTIVE)
  currentPeriodEnd  DateTime                              // next renewal / grace-period deadline
  gracePeriodEndsAt DateTime?                              // set when status flips to PAST_DUE (§8.2.6)
  isComped          Boolean             @default(false)   // §8.3.3 — SUPER_ADMIN-granted, excluded from MRR reports
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([status, currentPeriodEnd])
}

// §12.5 — Admin audit trail: who did what, to whom, when.
// Required before any "enterprise" claim — admins can currently block users /
// add credits / change tiers with zero record of who did it or why.
model AuditLog {
  id          String   @id @default(uuid())
  actorUserId String                                // the admin performing the action
  actorRole   Role                                  // §8.3.9 — which admin role performed it (SUPPORT_ADMIN/BILLING_ADMIN/SUPER_ADMIN)
  action      String                                // e.g. 'USER_BLOCKED', 'CREDITS_ADDED', 'TIER_CHANGED', 'VIEWED_AS_USER'
  targetType  String                                // 'User', 'Transaction', 'PdfGenerationJob'
  targetId    String
  metadata    Json?                                 // before/after values
  createdAt   DateTime @default(now())

  @@index([actorUserId, createdAt])
  @@index([targetType, targetId])
}

// §8.3.11 — External/security-facing events, distinct from AuditLog (which is internal admin actions).
// Auth failures, webhook-verification failures, blocked SSRF attempts, rate-limit bans, etc.
model SecurityEventLog {
  id         String   @id @default(uuid())
  eventType  String                                 // 'AUTH_FAILED', 'WEBHOOK_SIGNATURE_INVALID', 'IP_BLOCKED', 'SSRF_BLOCKED', 'RATE_LIMIT_BANNED', 'SIGNUP_ABUSE_SUSPECTED'
  userId     String?                                 // null if the request never resolved to a known user (e.g. invalid key)
  ipAddress  String?
  detail     Json?                                   // endpoint, attempted key prefix, blocked URL, etc.
  createdAt  DateTime @default(now())

  @@index([eventType, createdAt])
  @@index([userId, createdAt])
  @@index([ipAddress, createdAt])
}

model AstrologicalPrediction {
  id          Int      @id @default(autoincrement())
  ruleKey     String                                // e.g. 'sun_in_house_1', 'manglik_dosha_high'
  lang        String                                // 'en','hi','gu','mr','ta','te'
  title       String
  description String   @db.Text
  remedy      String?  @db.Text
  createdAt   DateTime @default(now())

  @@unique([ruleKey, lang])
  @@index([ruleKey, lang])
}
```

---

## 7. Multi-Language (i18n) Engine Design

### Layer A — UI Labels & Planet/Sign Names (`app/locales/*.json`)
```json
// locales/hi.json
{
  "planets": { "Sun": "सूर्य", "Moon": "चंद्रमा", "Mars": "मंगल", "Mercury": "बुध", "Jupiter": "बृहस्पति", "Venus": "शुक्र" },
  "signs": { "Aries": "मेष", "Taurus": "वृषभ", "Gemini": "मिथुन", "Cancer": "कर्क" },
  "tithi": { "Shukla_Pratipada": "शुक्ल प्रतिपदा", "Krishna_Ashtami": "कृष्ण अष्टमी" }
}
```

### Layer B — Dynamic Predictions (MySQL table `AstrologicalPrediction`, §6)

### Layer C — Standard Dual-Key API Response Format
```json
{
  "status": "success",
  "language": "hi",
  "data": {
    "tithi": { "id": "SHUKLA_PRATIPADA", "name": "शुक्ल प्रतिपदा", "paksha": "शुक्ल पक्ष" },
    "nakshatra": { "id": "HASTA", "name": "हस्त", "pada": 2, "lord_id": "MOON", "lord_name": "चंद्रमा" },
    "planets": [
      {
        "id": "SUN", "name": "सूर्य", "sign_id": "LEO", "sign_name": "सिंह",
        "degree": 28.45, "house": 10, "is_retrograde": false,
        "prediction": {
          "title": "दशम भाव में सूर्य का प्रभाव",
          "description": "दशम भाव में सूर्य दिगबली होता है। यह करियर में प्रशासनिक अधिकार और नेतृत्व क्षमता प्रदान करता है।"
        }
      }
    ]
  }
}
```
Every `id` field is machine-stable (English constant); every `name` field is localized — lets frontend developers switch on `id` without parsing translated strings.

---

## 8. User Panel & Admin Panel — Complete Feature Specification

> **This section was expanded from 7 one-line bullets to full detail on request.** New fields/models this section needs are added to §6 (marked `§8.x`). Route list first, full feature breakdown per screen below.

### 8.1 Protected Route Architecture (`middleware.ts`)
- **Public:** `/`, `/pricing`, `/docs`, `/api/webhooks/*`
- **User Panel** (auth required): `/dashboard`, `/api-keys`, `/usage`, `/pdf-reports`, `/branding`, `/billing`, `/team` (Enterprise only), `/settings/notifications`, `/support`
- **Admin Panel** (role check, see §8.3.9 for sub-roles): `/admin`, `/admin/users`, `/admin/billing`, `/admin/traffic`, `/admin/pdf-queue`, `/admin/prompts`, `/admin/audit-log`, `/admin/settings`

---

### 8.2 User Panel (Customer-Facing)

#### 8.2.0 Onboarding & Signup Flow (before the panel exists)

> Not in the original spec at all — "Clerk handles auth" was assumed to be the whole story, but *what happens between signup and a working, activated account* is where most B2B API products lose new users. Full sequence below; new `User` fields added to §6.

**Entry points** — a new visitor can start the signup flow from four places, tracked via a `signupSource` field (§6) for funnel analysis in §8.3.10's reports:
1. `/pricing` — picked a plan already (goes into the plan-purchase flow, §8.2.6, right after signup).
2. `/` landing page CTA — no plan picked, defaults to free trial (wallet mode, ₹100 test credits).
3. The Live JSON Playground's "Sign up to get your own key" prompt, shown after a visitor runs a few demo calls (§8.1's playground proxy, §14.14) — highest-intent entry point, should pre-fill the quickstart with whatever endpoint they were already playing with.
4. A `TeamMember` invite link (§8.2.8) — a *different* flow, see below; this person is joining an existing paying account, not creating a new billable one.

**Step-by-step (paths 1–3, new independent account):**
1. **Sign up** via Clerk (email/password or Google/GitHub OAuth).
2. **Email verification required** before any API key is issued — Clerk handles the verify-email step; the account sits in an unactivated state until it's confirmed. This isn't just UX friction: free ₹100 test credits on signup is a real abuse vector (script mass-signups → free API calls) if a working key comes out before an email is ever proven to exist.
3. **Clerk webhook (`user.created`)** hits `api/webhooks/clerk/route.ts` (already in §3's directory tree) → creates the `User` row: `walletBalance = ₹100`, `planTier = STARTER`, **no `Subscription` row** (stays in free/wallet mode until they explicitly buy a plan, per §8.2.6's "nobody is silently charged" rule), generates **both** a live key and a sandbox/test key (§8.2.2) up front so they can start testing immediately without a separate "create your first key" step.
   - **Idempotency note (ties to §12.6):** this webhook handler must be idempotent — if Clerk retries the `user.created` event (network blip, timeout), it must not create two `User` rows for the same `clerkId`. Upsert on `clerkId`, don't blind-insert.
4. **Welcome email** — sandbox API key, a link to the quickstart, a link to `/docs`.
5. **In-app activation checklist** (shown on `/dashboard` until dismissed or completed, tracked via `onboardingCompletedAt`):
   - ☐ Copy your test API key
   - ☐ Make your first API call *(quickstart shows a ready-to-paste cURL/Python/Node snippet with their actual sandbox key already filled in, targeting a visually satisfying endpoint like `/api/v1/panchang/daily` rather than something obscure)*
   - ☐ View a sample PDF report
   - ☐ *(if arrived from path 3)* — pre-highlight whichever endpoint they were already testing in the playground
   - Soft, dismissible nudge once the checklist is done: "You're on ₹100 free test credits (~1,000 calls) — recharge or pick a plan whenever you're ready" (links to §8.2.6), never a forced paywall interrupting the checklist itself.

**Team-invite path (4) — different, shorter flow:** click invite link → Clerk signup/login → lands directly inside the *owner's* account scope. No `walletBalance`/`planTier` setup (they share the owner's), no free test credits (this isn't a new billable account), no activation checklist beyond "here's your scoped API key" — they're joining something already running, not bootstrapping a new one.

**Abuse handling (ties to `SecurityEventLog`, §8.3.11):** rate-limit signups per IP and per device fingerprint; log repeated signups from the same IP/fingerprint as a `SIGNUP_ABUSE_SUSPECTED` security event rather than silently handing out another ₹100 in test credits each time. A CAPTCHA on the signup form is a reasonable additional gate if abuse shows up in practice.

**Account deletion (the other end of the lifecycle, ties to §12.4's PII-retention policy):** a self-service "Delete my account" action in settings — soft-deletes immediately (blocks login, revokes API keys), then hard-deletes PII after `piiRetentionDays` (§6) unless legally required to keep billing records longer (India's GST rules require retaining invoices for years — the *transaction* records should outlive the *personal* data deletion, so this needs to selectively scrub PII fields rather than cascade-delete the whole account history).

**Password reset / account recovery (missing from the original spec entirely):**
- **Password reset:** fully handled by Clerk's own flow (email a reset link, no custom code needed) — nothing to build, but worth stating explicitly so it isn't assumed to need a custom `/forgot-password` page.
- **Lost API key (a different problem — this one *does* need custom handling):** since keys are stored hashed (§12.1), a lost/forgotten key **cannot be recovered, only regenerated.** The `/api-keys` page (§8.2.2) makes this the explicit, only path — "Regenerate" immediately invalidates the old key. For a client running production traffic, an *instant* invalidation is disruptive; consider a short-lived (e.g. 24h) overlap window where both the old and new key work, specifically to avoid an unplanned production outage on a client's side the moment they realize their key leaked and regenerate it under pressure.
- **Account recovery when the user has lost access to their signup email too** (email no longer exists, no 2FA device, etc.) — Clerk's own support flow covers identity-verified recovery, but for a paying B2B account this should also have a documented manual path: `SUPPORT_ADMIN` can, after identity verification through support (§8.2.9), trigger a Clerk-side email change on the user's behalf — logged to `AuditLog` (§12.5) like any other admin action touching a customer account.

#### Rate Limits — Per-Plan Table (§13, was previously just "high rate-limits" with no numbers)

| Plan | `rateLimitPerMin` (default) | Burst allowance | Notes |
|---|---:|---:|---|
| Starter | 60 | 10 | Matches `User.rateLimitPerMin` schema default (§6) |
| Pro | 300 | 50 | 5x Starter — matches the 100k/mo vs 35k/mo quota ratio roughly |
| Enterprise | 1,000 (soft) | 200 | "Unlimited calls" (§13) means no *monthly quota* ceiling, not no per-minute rate limit — a true per-minute limit still protects the shared infrastructure from a single account's traffic spike; Enterprise contracts needing a genuinely higher ceiling get a custom value set directly on their `User.rateLimitPerMin`, not a code change |
| Sandbox/test keys (§8.2.2) | 30 | 5 | Deliberately tight — sandbox traffic doesn't need production-grade throughput, and a tight limit here also caps the blast radius of the signup-abuse scenario in §8.2.0 |

All limits enforced via the sliding-window Redis pattern already specified in §10, gotcha #4 — a fixed-window counter would let any tier burst to ~2x its stated limit at a minute boundary.

#### 8.2.1 Overview (`/dashboard`)
- **Wallet balance** — large, always-visible header widget (also shown in the global nav bar on every page).
- **Plan usage bar** — calls used vs `monthlyQuota` this billing cycle, colored green→amber→red at the 80%/100% thresholds (§12.12).
- **Quick stats row** — API calls today / this week / this month; total spend this month; active PDF jobs in progress.
- **Recent activity feed** — last 10 API calls and PDF jobs, mixed chronologically, each linking to its detail view.
- **Quick actions** — "Recharge Wallet", "Generate Test PDF", "View Docs", "Invite Team Member" (Enterprise only).

#### 8.2.2 API Keys & Sandbox (`/api-keys`)
- Shows `apiKeyPrefix` only (e.g. `ak_live_a1b2***`) — raw key is shown exactly once, at creation/regeneration (§12.1).
- Key metadata: created date, last-used timestamp, "Regenerate" (with a confirmation modal warning the old key stops working immediately — no overlap window unless explicitly requested).
- **§8.2 IP allowlist (optional):** restrict the key to a list of server IPs — most B2B clients call from a fixed backend, not a browser, so this closes off key theft even if it leaks.
- **§8.2 Sandbox/test mode:** a separate `ak_test_...` key that returns realistic-but-fixed sample responses and never touches `walletBalance` — lets a new client build their integration end-to-end before going live, without the friction of a real recharge or the real quota being burned by test traffic.
- **Per-job webhook URL default** — pre-fill for the `webhook_url` field on PDF job creation (§4, §5) so it doesn't need to be passed on every request.

#### 8.2.3 Usage & Analytics (`/usage`)
- Line chart: API calls over time, filterable by date range (24h / 7d / 30d / custom).
- Breakdown by module (bar or pie: Panchang vs Dasha vs KP vs PDF, etc.) and by status code (2xx vs 4xx vs 5xx — helps the client debug their own integration, not just watch a number).
- Average response-time chart, per endpoint.
- Exportable CSV of raw `ApiRequestLog` rows for the client's own accounting/debugging.
- Filters: endpoint, date range, status code, module.

#### 8.2.4 PDF Reports (`/pdf-reports`)
- **Generate new report:** pick report type (Basic/Brihat Kundli, Matchmaking, Varshphal, Lal Kitab, Sade Sati, Numerology), enter birth data, optional per-job branding override, optional `webhook_url` override.
- **Job history table:** report type, status (`PENDING`/`PROCESSING`/`COMPLETED`/`FAILED`), created date, credits cost, download link (or "Expired" once past the 24-hr R2 lifecycle, §5), `refunded` flag shown on failed jobs (§12.6) so the client can see the credit came back without opening a support ticket.
- **Retry** button on failed jobs (creates a fresh job, doesn't resurrect the old one).
- **§8.2 Bulk generation:** upload a CSV of multiple birth details → batch-creates one job per row — valuable for B2B clients (astrology portals, matchmaking sites) processing many end-customers at once, rather than looping `POST` calls client-side.

#### 8.2.5 Branding / White-Label (`/branding`)
- Logo upload → Cloudflare R2, raster-only + magic-byte validated (§14.18).
- Company name, website, contact phone, primary/secondary color pickers.
- **Live preview button** — generates a sample PDF with the current branding applied before it's used on a real paid job, so a client doesn't burn credits testing their color choices.

#### 8.2.6 Billing, Wallet & Plan Subscription (`/billing`)

> **This is the gap that mattered most: the original spec (and the first pass of this document) covered one-time wallet recharges in detail, but the *monthly plans themselves* (Starter ₹2,999/mo, Pro ₹6,999/mo, Enterprise ₹19,999/mo — §13) had no actual purchase, renewal, or cancellation mechanism defined.** Razorpay's one-time **Orders API** (used for wallet top-ups) and its recurring **Subscriptions API** (needed for monthly plans) are genuinely different integrations, not the same flow reused. Both are specified below, and a new `Subscription` model is added to §6.

**A. Pay-as-you-Go Wallet (unchanged, one-time)**
- Current balance, recharge buttons (₹500 / ₹2,000 / ₹5,000 / ₹10,000 + custom amount) via Razorpay **Orders**.
- Transaction history table (date, amount, credits added, status, gateway) with per-transaction GST invoice download (§12.11).
- **Auto-recharge:** optional toggle — "when balance drops below ₹X, automatically charge my saved payment method ₹Y" — prevents a high-volume client's integration silently breaking mid-day because nobody noticed the balance hit zero.

**B. Monthly Plan Purchase (new — Razorpay Subscriptions, recurring)**
- **First-time purchase flow:** `/pricing` → pick Starter/Pro/Enterprise → Razorpay Subscription checkout (card/UPI autopay mandate) → on success, webhook (§12.2, signature-verified) creates a `Subscription` record and sets `User.planTier` + `monthlyQuota`. Until this completes, a new signup stays on the default free `STARTER`-tier test credits (`walletBalance` starts at ₹100, per §6) — nobody is silently charged before an explicit plan selection.
- **Dashboard view once subscribed:** current plan, "Renews on {date}" (from `Subscription.currentPeriodEnd`), included-quota usage bar (already in §8.2.1), a "Manage Subscription" button.
- **Plan change (upgrade/downgrade):** Razorpay's subscription-update API changes the plan mid-cycle with the proration Razorpay itself calculates — shown to the user before confirming, not computed manually.
- **Renewal:** happens automatically via Razorpay on `Subscription.currentPeriodEnd`; the renewal-payment webhook resets `monthlyUsage` to 0 and extends the period, all signature-verified same as §12.2.
- **Failed renewal payment (dunning) — undefined in the original spec, defined here:** on a failed renewal charge, `Subscription.status` → `PAST_DUE`, the account gets a **7-day grace period** (still fully functional, banner shown: "Payment failed — update your card by {date}") rather than an instant hard cutoff mid-integration for a paying client. If unresolved after the grace period, `status` → `CANCELLED` and the account auto-downgrades to pay-as-you-go wallet mode (not a full service cutoff — existing wallet balance, if any, still works).
- **Cancellation:** user-initiated cancel keeps the plan active through the already-paid `currentPeriodEnd` (no immediate loss of what they paid for), then auto-downgrades to wallet mode — mirrors how most SaaS subscription cancellations behave, and avoids support tickets from people who expect what they already paid for to keep working until the period ends.

#### 8.2.7 Notification Settings (`/settings/notifications`)
- Email toggles: low-balance warning, 80%/100% quota-reached warning, PDF job completed/failed, unusual error-rate spike on their account.
- **§8.2 Account-level webhook URL** (distinct from the per-job `webhook_url` in §5) — for these account events, not individual PDF completions.

#### 8.2.8 Team Members (`/team`, **Enterprise tier only**)
- Invite teammates by email with a role: `VIEWER` (read-only usage/billing) or `OPERATOR` (can also generate PDFs and manage API keys) — neither can touch billing/plan changes, which stay with the account owner.
- Each team member can get their own scoped API key that draws from the same shared `walletBalance`, so per-person usage is still visible in `/usage` without splitting the wallet.
- Needs a new `TeamMember` model — see §6 update.

#### 8.2.9 Support (`/support`)
- Ticket submission form (subject, description, optional screenshot).
- FAQ / knowledge-base link.
- Enterprise-tier accounts see a direct contact channel, consistent with the SLA promise in §13.

---

### 8.3 Admin Panel (Internal Operations Team Only)

#### 8.3.1 Overview (`/admin`)
- Platform stats: total registered users, active users (last 30 days), MRR + one-time revenue, total API calls today/this month.
- Server health widgets: API latency p50/p95/p99, error rate, uptime %, current PDF-job queue depth.
- Revenue trend chart (daily/monthly) and new-signups chart.

#### 8.3.2 User Management (`/admin/users`)
- Searchable/filterable table: email, plan tier, wallet balance, status, signup date, last active.
- Per-user detail view: full usage history, all transactions, all PDF jobs. **Admin sees `apiKeyPrefix` only — never the raw key**, consistent with the hashing in §12.1 (an admin who can see raw keys is as dangerous as a plaintext-key database).
- Actions: block/unblock, manually adjust wallet credits, change plan tier, reset monthly quota. **Every one of these requires a reason field and is written to `AuditLog` (§12.5)** — no silent admin action against a user account.
- **§8.3 Read-only "view as user" mode** for support debugging — also logged to `AuditLog`, since it's still access to a customer's account.
- Bulk actions: export user list (CSV), bulk email.

#### 8.3.3 Billing & Revenue (`/admin/billing`)
- All transactions, filterable by status/gateway/date.
- Failed-payment retry queue.
- Refund processing (reason required, logged).
- Revenue breakdown by plan tier and by module usage; GST/tax export for accounting (§12.11).
- **§8.2.6 Subscriptions tab:** every `Subscription` record — plan, status (`ACTIVE`/`PAST_DUE`/`CANCELLED`), `currentPeriodEnd`, MRR contribution. Filter by `PAST_DUE` to see who's mid-dunning-grace-period right now. **Manual override:** `SUPER_ADMIN` can comp a plan (e.g. a partner/pilot account) without a real Razorpay subscription behind it — flagged clearly in the UI (`isComped: true`) so revenue reports (§8.3.10) don't count it as real MRR.

#### 8.3.4 API Traffic Monitor (`/admin/traffic`)
- Near-real-time request log: endpoint, user, status code, response time, timestamp — filterable/searchable by user, endpoint, error type.
- Error log integrated with Sentry (§12.10, §2) for stack traces, not just status codes.
- Rate-limit hit log — who's actually getting throttled, useful for tuning `rateLimitPerMin` defaults.

#### 8.3.5 PDF Job Queue Monitor (`/admin/pdf-queue`)
- All jobs across all users: status, queue wait time, processing time, failure reason.
- Manual retry/cancel for stuck jobs.
- Cloudflare R2 storage usage gauge (approaching-the-10GB-free-limit warning, ties to §5's auto-delete lifecycle).

#### 8.3.6 Content / Prediction Management (`/admin/prompts`)
- CRUD interface for the `AstrologicalPrediction` table (§6): add/edit `ruleKey` + per-language title/description/remedy.
- Bulk import (CSV/JSON) for seeding — pairs with the `seed_rules.py` script in §10, gotcha #5.
- **§8.3 Missing-translation report** — which `ruleKey`s exist in English but not Hindi/Gujarati/etc., so gaps in localization are visible instead of silently falling back.
- Preview: render a given prediction in context before publishing it live.

#### 8.3.7 Audit Log Viewer (`/admin/audit-log`, §12.5)
- Filterable by actor (which admin), action type, date range, target user.
- Shows before/after values for every change (credits, tier, block status, "view as user" access).

#### 8.3.8 System Configuration (`/admin/settings`)
- Plan-tier settings (pricing, quotas) editable without a code deploy.
- Feature flags — e.g. temporarily disable the Western Astrology module for maintenance without taking the whole API down.
- Default rate-limit tiers.
- **Maintenance-mode toggle** — shows a banner to all users and rejects new requests gracefully (503 with a clear message) instead of a hard outage during planned maintenance.

#### 8.3.9 Admin Roles & Permissions (§14 addition — security, expanded)
The original `Role { USER, ADMIN }` enum makes every admin equally powerful — anyone with `ADMIN` can touch billing, credits, and other admins' access alike. Split it, plus a 4th read-only role for external accountants/auditors:

| Capability | `SUPPORT_ADMIN` | `BILLING_ADMIN` | `AUDITOR` | `SUPER_ADMIN` |
|---|:---:|:---:|:---:|:---:|
| View user list / usage / logs | ✅ | ✅ | ✅ | ✅ |
| "View as user" (support debugging) | ✅ | ❌ | ❌ | ✅ |
| Block / unblock a user | ✅ | ❌ | ❌ | ✅ |
| Manually adjust wallet credits | ❌ | ✅ | ❌ | ✅ |
| Process refunds | ❌ | ✅ | ❌ | ✅ |
| View financial/GST reports | ❌ | ✅ | ✅ | ✅ |
| Export data (CSV/reports) | ❌ | ✅ | ✅ | ✅ |
| View Audit Log | ✅ (own actions + user-related) | ✅ (billing actions) | ✅ (everything) | ✅ (everything) |
| Change plan tiers / pricing | ❌ | ❌ | ❌ | ✅ |
| System config / feature flags / maintenance mode | ❌ | ❌ | ❌ | ✅ |
| Manage other admins' roles | ❌ | ❌ | ❌ | ✅ |

- `AUDITOR` exists specifically so an external accountant or compliance reviewer can be given real access to financial reports and the full audit trail **without** being able to change anything — a pure read-only role, distinct from giving them a `BILLING_ADMIN` account "temporarily" (which is how audit access usually turns into a standing security hole).
- **Changing anyone's admin role is itself a `SUPER_ADMIN`-only, `AuditLog`-flagged action** (`action: 'ADMIN_ROLE_CHANGED'`) — never a silent database edit.
- **Session policy:** admin sessions (via Clerk) should auto-expire after a short idle period (e.g. 30 min) — much shorter than regular user sessions — and a role downgrade/revocation must invalidate that admin's *existing* sessions immediately, not just block future logins (Clerk supports force-revoking sessions on a user; wire this into the role-change action).

This isn't just tidiness — it limits blast radius if one internal account is phished: a compromised `SUPPORT_ADMIN` can't drain wallets or change pricing, and a compromised `AUDITOR` account can't change anything at all. See the `Role` enum update in §6 (add `AUDITOR` there too).

#### 8.3.10 Reports & Exports (`/admin/reports`)
Beyond the raw tables already in §8.3.2/§8.3.3, these are the actual periodic/decision-making reports a running SaaS needs — most B2B tools bury this and then someone builds it ad-hoc in a spreadsheet six months in:
- **Automated founder digest** — scheduled (daily/weekly) email summary: new signups, MRR delta, churned accounts, total API volume, top error types. Doesn't require anyone to open the dashboard to know if something's wrong.
- **Module popularity report** — which of the 12 modules actually gets called, and how often — informs pricing/roadmap far better than guessing (e.g. if KP System is 40% of all calls, it deserves more product attention than its "Module 5 of 12" position in the spec suggests).
- **Churn / usage-drop report** — accounts whose weekly call volume dropped >50% vs their trailing average — an early warning list for proactive customer-success outreach, not just a post-mortem after they cancel.
- **Cohort retention report** — signup month vs still-active N months later — the standard SaaS health metric, needed before this can credibly be pitched to investors or judged as "enterprise-ready."
- **Top-consumer report** — which accounts drive the most revenue/volume — for account management and to catch a single client that's disproportionately loading the infrastructure relative to what they're paying.
- **GST/financial export** — GSTR-1-compatible CSV for the accounting/compliance need already flagged in §12.11, generated per tax period rather than only per-transaction.

#### 8.3.11 System & Security Logs (`/admin/logs`)
Distinct from the **business-level** API Traffic Monitor (§8.3.4, which is about customer request volume/latency) — this is **infrastructure and security** logging:
- **Application logs** — structured JSON logs from FastAPI and the Next.js server (request lifecycle, background-worker/PDF-pipeline step-by-step output, startup/shutdown events) — needed to debug *why* a specific PDF job failed, not just *that* it failed. At MVP scale, Render/Vercel's own captured stdout is enough; note the upgrade path (a log drain to something like Better Stack/Axiom) once volume makes grepping raw logs impractical.
- **Security event log — a new `SecurityEventLog` model (§6 addition), separate from `AuditLog` (which is *admin* actions, not external/attacker-facing events).** Records: failed API-key auth attempts (repeated failures from one IP = possible brute-force/credential-stuffing), requests blocked by the IP allowlist (§8.2.2), Razorpay webhook signature-verification failures (§12.2 — every failed one is either a bug or a real attack attempt and should never be silently dropped), rate-limit bans, and blocked SSRF attempts on `webhook_url` (§14.17).
- **Retention & export** — define how long each log type is kept (e.g. 90 days for app logs, 1 year for security events to support incident investigation) and make security events exportable for a real incident response, not just visible in a UI table.

#### 8.3.12 Backup, Disaster Recovery & Data Retention
**Not present anywhere in the original spec — a real gap** for a platform storing customer billing data and PII. Minimum bar before calling this "enterprise-ready":
- **Automated daily database backups**, retained 30 days, with point-in-time recovery if the MySQL host supports it (verify — this varies a lot between the free/trial-tier MySQL hosts discussed in §2, and is often a paid-tier-only feature; if the chosen host doesn't support PITR, that itself is a reason to pick a different host once real customer data exists).
- **A second, independent backup copy** — a periodic `mysqldump` (or equivalent) pushed to Cloudflare R2 in a separate bucket/prefix from the PDF reports — so an incident on the DB provider's own account/infrastructure doesn't take out the only copy of the data along with the primary.
- **Backups must be encrypted at rest** — they contain the same sensitive data as the live DB (hashed API keys, billing details, PII) and are frequently the *least* protected copy of a dataset in a real breach.
- **Restore drills** — a backup that's never been test-restored isn't a verified backup. Schedule an actual restore-to-a-scratch-database exercise periodically (e.g. quarterly), not just trust that the backup job "ran successfully."
- **Explicit RTO/RPO targets** — how long to restore (Recovery Time Objective) and how much data loss is acceptable (Recovery Point Objective) — needed before the Enterprise tier's "SLA guarantee" (§13) means anything concrete.
- **Admin visibility** — a simple "last successful backup: [timestamp]" status indicator somewhere in `/admin` (even just in §8.3.1's overview widgets) so backup health is a visible fact, not something nobody thinks about until the day it's needed and turns out to have been silently failing.

---

## 9. Local Development & Deployment (No Docker)

### Local dev
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\Activate.ps1     Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Production (Render / Koyeb, native Python — no Dockerfile)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health check path (add in Render dashboard):** `/health` (§12.4)
- **CORS (§14.14):** allow only the production Next.js origin (`https://app.astroengine.io`) and `localhost` during dev — never `allow_origins=["*"]` on FastAPI's `CORSMiddleware`, since that would let any website's frontend JS call the API using a visitor's browser session.
- **Staging environment (§14.21):** run a second, smaller instance of both services (Render/Vercel both support preview/staging environments on their free tiers) pointed at a separate staging database — every Prisma migration, payment-webhook change, and PDF-template change should go through staging before production, not straight from local dev.

### Environment Configurations

**Frontend `.env.local`**
```bash
DATABASE_URL="mysql://user:password@your-mysql-host.example.com:3306/astro_saas"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
ASTRO_ENGINE_URL="http://localhost:8000"          # Prod: https://api.astroengine.io
ASTRO_INTERNAL_SECRET="c9f82d1a6e3b5c7f8a9e0d1b2"  # rotate per §12.3
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_signing_secret"  # NEW — required for §12.2
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Backend `.env`**
```bash
PORT=8000
ENVIRONMENT="production"
INTERNAL_SECRET_KEY="c9f82d1a6e3b5c7f8a9e0d1b2"
INTERNAL_SECRET_KEY_PREVIOUS=""                    # NEW — for rotation overlap, §12.3
EPHE_PATH="./ephe"
REDIS_HOST="your-redis.upstash.io"
REDIS_PORT=6379
REDIS_PASSWORD="your_upstash_redis_password"
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_r2_access_key"
R2_SECRET_ACCESS_KEY="your_r2_secret_key"
R2_BUCKET_NAME="astro-pdf-reports"
R2_PUBLIC_DOMAIN="https://cdn.astroengine.io"
DATABASE_URL="mysql://user:password@your-mysql-host.example.com:3306/astro_saas"
SENTRY_DSN=""                                       # NEW — §12.10
```

---

## 10. Known Practical Gotchas (carried over from the original chat)

1. **Swiss Ephemeris file size** — bundle only the 1800–2100 CE span (~25–30 MB) so Render's 512 MB disk isn't strained.
2. **Timezone/DST trap** — don't trust manual `tz` input alone for historical dates; cross-check with `timezonefinder` + `pytz` from lat/lon.
3. **WeasyPrint Linux deps** — Pango/Cairo/font libs are missing by default on most native Linux buildpacks; verify before relying on WeasyPrint in production, or use a Puppeteer/`@react-pdf/renderer` fallback (see §2).
4. **Redis rate-limiting** — use a sliding-window limiter (not a naive fixed counter), otherwise a client can double their effective rate by bursting at a minute boundary.
5. **Prediction content seeding** — write a `seed_rules.py` script early (Phase 1) to populate `AstrologicalPrediction` with the ~108+ base combinations (12 houses × 9 planets, etc.) in Hindi and English before the API is useful end-to-end.

---

## 11. 12-Week Implementation Roadmap

| Phase | Timeline | Focus | Key Deliverables |
|---|---|---|---|
| 1 | Week 1–2 | Foundation & Core Astronomy | FastAPI setup, `pyswisseph`, GeoNames search, Module 1 & 2 |
| 2 | Week 3–4 | Parashari Engine & Dasha | D1–D60 Vargas, Shadbala, Ashtakvarga, 5-level Vimshottari, SVG charts |
| 3 | Week 5–6 | Advanced Astrological Systems | KP Sub-Lords & Horary, Lal Kitab, Jaimini/Tajik, Manglik/36-Guna Milan |
| 4 | Week 7 | Remedies, Numerology & Western | Gemstones/Rudraksha/Mantras, full Numerology, Western tropical + Synastry |
| 5 | Week 8–9 | White-Label PDF Engine | Jinja2 templates, Noto Indic fonts, async worker, R2 24-hr lifecycle |
| 6 | Week 10–11 | Next.js SaaS & Dashboards | App Router + Tailwind/Shadcn, Clerk Auth, User + Admin dashboards, ReDoc embed |
| 7 | Week 12 | Billing, Security & Deployment | Razorpay **+ webhook signature verification (§12.2)**, Redis rate-limiting, deploy |

**Recommended re-sequencing (this document's addition):** move the security items in §12.1–§12.6 into **Phase 1**, not Phase 7 — API-key hashing and webhook verification are far cheaper to build in from day one than to retrofit after real user data and real payments exist. See §12.14 for the suggested revised phase-by-phase insertion.

---

## 12. Enterprise-Readiness Review — Gaps & Recommendations (independent addition)

The original chat covered architecture and endpoints thoroughly but left the following gaps — each is fixed directly in the sections above where it has a natural home (schema, architecture, env vars); this section is the index of *why*.

### Security
1. **API keys stored in plaintext** (original schema: `apiKey String @unique @default(cuid())`). Anyone with read access to the database (or a leaked backup) gets every customer's live API key. **Fixed in §6**: store only a SHA-256 hash + a display-safe prefix, show the raw key once at creation.
2. **No Razorpay webhook signature verification.** As originally specced, `POST /api/webhooks/razorpay/route.ts` would credit a user's wallet on any POST to that URL — an attacker who finds the endpoint can top up their own wallet for free. **Fixed:** verify the `X-Razorpay-Signature` header (HMAC-SHA256 against `RAZORPAY_WEBHOOK_SECRET`) before touching `walletBalance`; added `webhookVerified` flag on `Transaction` in §6 so credits can never be added on an unverified payload.
3. **No secret-rotation story** for `INTERNAL_SECRET_KEY` (Next.js ↔ FastAPI handshake). A single static value means rotating it requires simultaneous downtime on both services. **Fixed:** added `INTERNAL_SECRET_KEY_PREVIOUS` (§9) so the gateway accepts either value during a rotation window.
4. **No PII/data-retention policy.** Birth date, time, and place are sensitive personal data (can reveal religion, family events) and the original spec never states how long it's kept or how a user can request deletion. **Fixed:** added `piiRetentionDays` on `User` (§6) as an explicit, plan-configurable policy — still needs a real deletion job wired to it before launch.

### Reliability
5. **No idempotency keys** on `POST /api/v1/pdf/*` or wallet-recharge endpoints. A client retry after a network timeout can double-deduct credits or spin up a duplicate PDF job. **Fixed:** added `Idempotency-Key` header support, `idempotencyKey` field (unique) on `PdfGenerationJob` and `ApiRequestLog` in §6.
6. **No refund path when a paid PDF job fails.** Original schema has a `FAILED` status but no described compensation. **Fixed:** added `refunded` boolean + explicit rule in the worker pipeline (§5) — on `FAILED`, `creditsCost` is auto-returned to `walletBalance`.
7. **No result caching for deterministic, expensive calculations** (Shadbala, Ashtakvarga, 120-year Dasha tables). Same birth data always produces the same output — at real B2B volume, this is wasted CPU on every repeat request. **Added:** Redis result cache keyed by `hash(endpoint + normalized_birth_data)`, noted in §1 architecture diagram and `core/redis.py` in §3.
8. **No `/health` / `/ready` endpoints.** Render/any load balancer needs these to know the instance is alive before routing traffic — missing from the original spec entirely. **Added** to `main.py` (§3) and referenced in the deploy steps (§9).

### Testing & Quality
9. **No accuracy-validation strategy for the astrology engine itself — the single highest-risk gap in the whole plan.** This is a paid product where the entire value proposition is calculation correctness; a wrong Dasha date or wrong Panchang is a product-breaking bug, not a technical one, and nothing in the original chat addresses how correctness gets verified before shipping. **Recommendation:** build a golden-dataset test suite (`backend/app/tests/`, §3) — a fixed set of real birth details with known-correct outputs (cross-checked against an established reference tool such as Jagannatha Hora or Parashara's Light) that every module's output is diffed against on every CI run, not just unit tests of code paths.
10. **No CI pipeline or error tracking.** Added Sentry to the stack table (§2) and an `SENTRY_DSN` env var (§9); recommend a GitHub Actions workflow running lint + the golden-dataset suite on every PR before this goes further than Phase 1.

### Business / Compliance
11. **GST invoices mentioned as a bullet with no actual tax logic.** For real Indian B2B billing, invoices need HSN/SAC codes and correct GST-rate application (18% for SaaS/digital services), not just a PDF with a total — flagged here since it's a compliance requirement, not an engineering nice-to-have, before charging real customers.
12. **No defined behavior when a Starter/Pro plan exceeds its monthly quota.** Original spec lists quotas (35,000 / 100,000 calls) but never says what happens at call 35,001 — hard block (bad for a paying client mid-integration) or silent overage billing (bad if the client didn't opt in)? **Fixed:** added `monthlyQuota`, `monthlyUsage`, `overageAllowed` to `User` (§6) — default behavior is auto-fallback to wallet pay-as-you-go past quota, with an 80%/100% warning shown in the dashboard (§8).
13. **No outbound webhook option for PDF completion — polling-only isn't how serious B2B API partners expect to integrate.** **Added:** optional `webhook_url` field on PDF job creation (§4, §6) — on job completion, POST the result to the client's URL in addition to (not instead of) the existing polling endpoint, so both integration styles work.

### Second-Pass Review (Security & Architecture) — 2026-09-16

The first pass covered the biggest, most obvious gaps. On a deeper security/architecture-focused re-read, these are new — none overlap with items 1–13 above:

**Security**
14. **Live JSON Playground would expose a real API key to every anonymous visitor's browser Network tab** if it calls FastAPI directly client-side. **Fixed in §8**: playground traffic routes through a Next.js server-side proxy using a separate, tightly-rate-limited demo key — no real customer key is ever sent to a browser.
15. **API key transport wasn't pinned to headers only.** A `?api_key=...` query-string variant is an easy mistake to allow and a classic leak vector (proxies/CDNs/access logs capture full URLs). **Fixed in §8**: explicitly header-only (`x-api-key`), never accepted as a query param.
16. **Admin accounts had no MFA requirement**, despite being able to add unlimited credits, block any user, and read all billing/usage data — the single highest-value account on the whole platform. **Fixed in §8**: MFA enforced on every `ADMIN`-role account via Clerk.
17. **The outbound webhook feature added in item 13 (this document's own addition) is itself an SSRF vector** — a client-supplied `webhook_url` that the server blindly POSTs to can be pointed at internal infrastructure (cloud metadata endpoints, internal admin ports). **Fixed in §5**: validate scheme (HTTPS only) and resolved IP (reject private/link-local/loopback ranges) on every dispatch, not just once at job creation.
18. **Branding logo upload had no file-type/content validation** — accepting arbitrary uploads (especially SVG) into a page that later gets embedded in PDFs is a stored-XSS/XXE risk. **Fixed in §8**: raster formats only, validated by content (magic bytes), not filename extension or client-claimed MIME type.

**Architecture / Scalability**
19. **No database connection pooling for serverless.** Vercel's stateless Next.js functions can each open their own MySQL connection; under any real traffic burst this exhausts a typical free/trial-tier connection limit (`Too many connections`). **Fixed in §2**: pool in front of MySQL (ProxySQL / Prisma Accelerate) before production traffic, not after the first outage.
20. **Celery's assumed broker (Upstash Redis) doesn't fit Celery's access pattern.** Upstash's free tier is REST/serverless and billed per-command; Celery wants a persistent, constantly-polled connection. **Fixed in §1**: use FastAPI's own `BackgroundTasks` at MVP scale (no broker needed at all) and only bring in real Celery, with a dedicated non-serverless Redis/RabbitMQ, once PDF-job concurrency actually demands a task queue.
21. **No staging environment or migration-promotion workflow** — the original plan goes straight from local dev to production for every Prisma migration, webhook change, and template update. **Fixed in §9**: a second, smaller staging instance of both services against a separate staging database, sitting between local dev and production.

**Business / Ops**
22. **No load-testing before selling "unlimited calls" on the Enterprise tier.** The heavy calculations (Shadbala, Ashtakvarga, 120-year Dasha trees) are CPU-bound; without knowing the real requests/sec ceiling of a 512 MB container, "unlimited" is a promise with no capacity plan behind it. **Fixed in §13**: load-test before that tier is sold to a real high-volume client.

### 12.23 Suggested Phase Re-Sequencing (updated)
From the first pass: move items 1, 2, 4, 5, 6, 8 into **Phase 1**; start the item-9/10 test harness in Phase 1 too rather than Phase 7. From the second pass: items 14, 15, 17, 18 (all auth/input-boundary hardening) belong in Phase 1 alongside items 1–2 for the same reason — they're cheap now, expensive to retrofit once real traffic exists. Item 19 (connection pooling) and 20 (broker choice) are Phase 6 decisions (they only matter once the Next.js/Celery pieces are actually being built) but should be *decided* before Phase 6 starts, not discovered mid-build. Item 21 (staging) should exist before Phase 7's first real Razorpay webhook test — that's the first point real payment data flows through the system. Item 22 (load testing) is a Phase 7 gate: don't advertise the Enterprise tier publicly until it's been run.

---

## 13. Commercial Monetization Strategy

1. **Pay-as-you-Go API Wallet**
   - Minimum recharge: ₹500
   - Standard JSON API call: ₹0.10/call
   - Complex calculations (KP Horary / 120-year Dasha tree): ₹0.25/call

2. **Monthly API Subscriptions**
   - **Starter:** ₹2,999/mo — 35,000 calls, standard support
   - **Pro:** ₹6,999/mo — 100,000 calls, all 12 modules, high rate-limits
   - **Enterprise:** ₹19,999/mo — unlimited calls, dedicated IP, SLA guarantee *(§12.11: define the actual SLA number — e.g. 99.9% uptime, <500ms p95 — before selling this; "SLA guarantee" with no stated number isn't a sellable SLA)* *(§14.22: also load-test the actual engine — Shadbala/Ashtakvarga/120-year-Dasha calculations are CPU-heavy — before selling "unlimited calls" to any single customer; know the real requests/sec ceiling on a 512 MB Render container so a hobbyist and a genuine high-volume Enterprise client don't get sold the same infrastructure with no capacity plan behind it.)*

3. **White-Label PDF Reports** (high margin)
   - Basic 15-page Kundli PDF: ₹5.00
   - Grand 80-page Brihat Kundli PDF: ₹12.00
   - Marriage Matchmaking 25-page PDF: ₹8.00
   - *(End astrologers/portals resell these to their own customers at ₹150–₹500.)*

---

## 14. Email Notification Templates

> Every trigger referenced earlier in this document (§8.2.0 onboarding, §8.2.7 notification settings, §8.2.6 billing/subscription, §12.1/§14.1 security) finally gets actual copy here — these were all *mentioned* as email events but never written out. English is the canonical/base copy, consistent with §7's i18n architecture (Layer A locale files) — the same `{{variable}}` templates get translated into hi/gu/mr/ta/te, not rewritten per language. Password reset itself has no template here since Clerk sends that one natively (§8.2.0).
>
> **Implementation note:** templates live in `frontend/src/emails/` (React Email components are the standard fit for a Next.js stack); FastAPI-triggered events (PDF ready/failed, quota warnings) call a small internal Next.js API route to render+send rather than duplicating template logic in Python.

### A. Onboarding

**1. Welcome Email** — *Trigger: email verified, account provisioned (§8.2.0 step 3–4)*
> **Subject:** Your AstroEngine API key is ready
>
> Hi {{name}}, you're in. Here's your **sandbox key** to start testing right away — no card required: `{{sandboxKeyPrefix}}...`
>
> Your first call, ready to paste:
> ```
> curl -X POST https://api.astroengine.io/api/v1/panchang/daily \
>   -H "x-api-key: {{sandboxKey}}" \
>   -d '{"dob":"1995-10-05","tob":"14:30","lat":24.5854,"lon":73.7125,"tz":5.5}'
> ```
> You've got ₹100 in free test credits (~1,000 calls) once you switch to your live key. [View the docs]({{docsUrl}}) · [See your dashboard]({{dashboardUrl}})

**2. Team Invite** — *Trigger: owner invites a teammate (§8.2.8)*
> **Subject:** {{ownerName}} invited you to their AstroEngine account
>
> {{ownerName}} added you to their AstroEngine workspace as a **{{role}}**. Accept the invite to get your own scoped API key under their account — no separate billing setup needed.
>
> [Accept invite]({{inviteUrl}}) *(expires in 7 days)*

### B. Usage & Quota

**3. Low Wallet Balance** — *Trigger: `walletBalance` crosses below ₹100 (or a configurable threshold)*
> **Subject:** ⚠️ Your AstroEngine wallet is running low
>
> Your balance is **₹{{balance}}** — at your current usage that's roughly {{estimatedCallsLeft}} calls left. [Recharge now]({{billingUrl}}) or turn on [auto-recharge]({{billingUrl}}#auto-recharge) so this doesn't interrupt your integration.

**4. Quota 80% Reached** — *Trigger: `monthlyUsage` ≥ 80% of `monthlyQuota` (§12.12)*
> **Subject:** You've used 80% of your {{planTier}} plan's monthly calls
>
> {{monthlyUsage}} of {{monthlyQuota}} calls used this cycle (resets {{cycleResetDate}}). Once you hit 100%, calls continue automatically from your wallet balance at pay-as-you-go rates — no interruption, just billed differently. [Review your plan]({{billingUrl}})

**5. Quota 100% Reached — Overage Started** — *Trigger: `monthlyUsage` ≥ `monthlyQuota`, `overageAllowed = true` (§12.12)*
> **Subject:** You've hit your {{planTier}} plan's included calls — now billing from your wallet
>
> You're past your {{monthlyQuota}}-call monthly allowance. Every call from here is now billed at ₹0.10 (or ₹0.25 for complex calculations) from your wallet balance (**₹{{balance}}** remaining). [Upgrade your plan]({{billingUrl}}) if this is a regular pattern — it's usually cheaper than sustained overage.

**6. Unusual Error-Rate Spike** — *Trigger: an account's 5xx/4xx rate crosses an anomaly threshold*
> **Subject:** We're seeing a higher-than-usual error rate on your account
>
> {{errorRatePercent}}% of your calls in the last hour returned an error (usually under {{normalRatePercent}}%). This is often a client-side integration issue (bad request shape, expired key) rather than an outage on our end — [check recent request logs]({{usageUrl}}) to see the specific failures. If this looks like it's on our side, [contact support]({{supportUrl}}).

### C. PDF Reports

**7. PDF Report Ready** — *Trigger: `PdfGenerationJob.status → COMPLETED` (§5)*
> **Subject:** Your {{reportType}} report is ready
>
> Your **{{reportType}}** report (job `{{jobId}}`) finished generating. [Download PDF]({{downloadUrl}}) — this link expires in 24 hours (§5's R2 lifecycle rule), so save a copy if you need it longer.

**8. PDF Report Failed — Credits Refunded** — *Trigger: `PdfGenerationJob.status → FAILED`, `refunded = true` (§12.6)*
> **Subject:** Your {{reportType}} report failed — credits refunded
>
> We couldn't generate your **{{reportType}}** report (job `{{jobId}}`): {{failureReason}}. **₹{{creditsCost}} has already been refunded** to your wallet — no action needed on your end. [Try again]({{pdfReportsUrl}}) or [contact support]({{supportUrl}}) if this keeps happening.

### D. Billing & Subscription

**9. Wallet Recharge Successful** — *Trigger: `Transaction.status → SUCCESS` (one-time, §8.2.6-A)*
> **Subject:** Payment received — ₹{{amount}} added to your wallet
>
> Your recharge of ₹{{amount}} added **₹{{creditsAdded}} in credits**. New balance: ₹{{newBalance}}. [Download GST invoice]({{invoiceUrl}})

**10. Auto-Recharge Triggered** — *Trigger: `autoRechargeEnabled` fires (§8.2.6-A)*
> **Subject:** Auto-recharge: we added ₹{{amount}} to your wallet
>
> Your balance dropped below your ₹{{threshold}} threshold, so we charged your saved payment method ₹{{amount}} automatically, per your auto-recharge setting. New balance: ₹{{newBalance}}. [Turn off auto-recharge]({{billingUrl}}#auto-recharge) any time.

**11. Subscription Activated** — *Trigger: first `Subscription` created, `status = ACTIVE` (§8.2.6-B)*
> **Subject:** Welcome to the {{planTier}} plan
>
> Your subscription is active: **{{monthlyQuota}} calls/month**, renewing on **{{currentPeriodEnd}}**. [Manage your subscription]({{billingUrl}})

**12. Subscription Renewal Successful** — *Trigger: renewal webhook succeeds*
> **Subject:** Your {{planTier}} plan renewed
>
> ₹{{amount}} charged, quota reset to {{monthlyQuota}} calls, next renewal **{{currentPeriodEnd}}**. [Download invoice]({{invoiceUrl}})

**13. Subscription Renewal Failed (Dunning, Day 1)** — *Trigger: `status → PAST_DUE` (§8.2.6-B)*
> **Subject:** ⚠️ Payment failed — please update your card
>
> We couldn't charge your card for your {{planTier}} plan renewal. **Your account keeps working normally for the next 7 days** while you sort this out — no service interruption yet. [Update payment method]({{billingUrl}}) before **{{gracePeriodEndsAt}}** to avoid being moved to pay-as-you-go wallet billing.

**14. Grace Period Ending Soon (Day 5 of 7)** — *Trigger: 2 days before `gracePeriodEndsAt`*
> **Subject:** 2 days left to fix your payment before your plan downgrades
>
> Your {{planTier}} subscription is still unpaid. On **{{gracePeriodEndsAt}}** your account automatically switches to pay-as-you-go wallet billing (still fully functional — just no monthly plan discount). [Update payment method]({{billingUrl}}) to stay on {{planTier}}.

**15. Subscription Cancelled / Downgraded** — *Trigger: `status → CANCELLED`, user-initiated or grace-period expiry (§8.2.6-B)*
> **Subject:** Your {{planTier}} plan has ended
>
> {{cancellationReason}} — your account is now on pay-as-you-go wallet billing (current balance: ₹{{balance}}). Your API keys keep working exactly the same; you're just billed per-call instead of a flat monthly rate. [Resubscribe any time]({{pricingUrl}})

**16. Plan Changed** — *Trigger: upgrade/downgrade via Razorpay subscription-update (§8.2.6-B)*
> **Subject:** Your plan changed to {{newPlanTier}}
>
> {{proratedAmountText}}. New monthly quota: **{{newMonthlyQuota}} calls**, effective immediately. [View billing details]({{billingUrl}})

### E. Security & Account

**17. API Key Regenerated** — *Trigger: key regenerated (§8.2.2, §12.1)*
> **Subject:** Your AstroEngine API key was just regenerated
>
> A new live key (`{{newKeyPrefix}}...`) was generated at {{timestamp}} from IP {{ipAddress}}. **Your old key stops working {{overlapWindowText}}.** If this wasn't you, [contact support immediately]({{supportUrl}}) and secure your account login.

**18. Account Blocked** — *Trigger: admin sets `isBlocked = true` (§8.3.2)*
> **Subject:** Your AstroEngine account has been suspended
>
> Your account was suspended on {{timestamp}}. Reason: {{reason}}. If you believe this is a mistake, [contact support]({{supportUrl}}) — reference account {{userId}}.

**19. Admin Adjusted Your Credits** — *Trigger: `SUPER_ADMIN`/`BILLING_ADMIN` manually changes `walletBalance` (§8.3.2, §12.5 — transparency for an action that's already audit-logged internally)*
> **Subject:** Your wallet balance was adjusted by AstroEngine support
>
> {{adminAdjustmentAmount}} ({{reasonGivenByAdmin}}). New balance: ₹{{newBalance}}. Questions? [Contact support]({{supportUrl}}) and reference this email.

**20. Account Deletion Requested** — *Trigger: self-service delete initiated (§8.2.0)*
> **Subject:** Your account deletion is scheduled
>
> Your account is deactivated immediately (API keys revoked now). Your personal data will be permanently deleted on **{{piiDeletionDate}}** ({{piiRetentionDays}} days from today), per our data-retention policy. Billing/invoice records are kept longer as required by Indian tax law, with personal identifiers removed. Changed your mind? [Reactivate before {{piiDeletionDate}}]({{reactivateUrl}}).

**21. Support-Assisted Account Recovery Completed** — *Trigger: `SUPPORT_ADMIN` completes an identity-verified recovery (§8.2.0)*
> **Subject:** Your account recovery is complete
>
> Following your support request, the email on your account has been updated to {{newEmail}}. This change was made by our support team after identity verification — if you didn't request this, [contact support]({{supportUrl}}) immediately.

### F. Internal (Admin-Facing)

**22. Founder Digest** — *Trigger: scheduled daily/weekly (§8.3.10) — sent to `SUPER_ADMIN`/`AUDITOR` roles only*
> **Subject:** AstroEngine: {{period}} summary — {{newSignups}} new signups, ₹{{mrrDelta}} MRR change
>
> **Signups:** {{newSignups}} ({{signupSourceBreakdown}}) · **Revenue:** ₹{{totalRevenue}} ({{mrrDeltaText}} vs last period) · **API volume:** {{totalApiCalls}} calls · **Top error:** {{topErrorType}} ({{topErrorCount}} occurrences) · **Churned:** {{churnedCount}} accounts. [Full report]({{adminReportsUrl}})
