# AstroEngine

High-performance, multi-language (i18n) B2B Vedic + Western Astrology REST API suite, white-label PDF report engine, and a full-stack Next.js consumer + SaaS portal (wallet billing, API-key management, admin console).

This is the repository's single maintained Markdown document. It consolidates the former API reference, installation guide, technical specification, repository review, backend progress, calculator plan, post-review fix log, and dashboard/admin fix log. Those files overlapped and sometimes contradicted one another; the reconciled current state is documented here instead of preserving every historical note verbatim.

---

## 1. Architecture

```
                [ B2B Clients / Mobile Apps / Web Portals ]
                                  │
                                  ▼ (HTTPS + x-api-key)
                        [ Nginx Reverse Proxy ]
                ┌───────────────────┴───────────────────┐
                ▼                                        ▼
      [ Next.js SaaS Portal ]                   [ FastAPI Gateway ]
      (Public site, dashboards, ReDoc)          (Auth, metering, routing)
                │                                        │
                │                                        ▼
                │                             [ Upstash Redis ]
                │                    (rate-limits, keys, quota, cache)
                ▼                                        ▼
      [ MySQL + Prisma ]                       [ Core Astronomy Engine ]
      (users, billing, usage logs)             (pyswisseph C-bindings)
                                                          │
                                    ┌─────────────────────┴─────────────────────┐
                                    ▼                                           ▼
                        [ Realtime JSON APIs ]                        [ Async PDF Worker ]
                        (100+ REST endpoints)                         (FastAPI BackgroundTasks)
                                                                                │
                                                                    [ Jinja2 + ReportLab ]
                                                                    (SVG charts + Noto fonts,
                                                                     6 languages)
                                                                                │
                                                                                ▼
                                                                    [ Cloudflare R2 ]
                                                                    (24h auto-expiring PDFs)
```

`GET /health` and `GET /ready` are exposed on the FastAPI gateway for uptime/health checks.

## 2. Tech stack

| Layer | Technology |
| :--- | :--- |
| Core calculation engine | Python 3.11, FastAPI, `pyswisseph` |
| Frontend & SaaS portal | Next.js (App Router), Tailwind CSS |
| Database & ORM | MySQL, Prisma |
| Caching & metering | Upstash Redis |
| Object storage (PDFs) | Cloudflare R2 (S3-compatible), 24h lifecycle rule |
| Geo data (cities) | SQLite / GeoNames dump |
| API docs | Custom-themed ReDoc UI at `/documentation` (and `/redoc`), OpenAPI spec at `/openapi.json` |
| Error tracking | Sentry |

No Docker — both services deploy on native runtimes (`pip install` + `uvicorn` for the backend, standard Next.js build for the frontend). WeasyPrint was replaced by ReportLab for PDF rendering (see §5) specifically to avoid needing Pango/Cairo system libraries on Linux hosts.

## 3. API surface

The backend exposes REST endpoints across these modules: Core Astronomy, Panchang & Muhurat, Parashari Kundli & Divisional Charts (Vargas), Dasha Systems (Vimshottari, Yogini, Char/Jaimini), KP System, Lal Kitab, Jaimini & Tajik Varshphal, Dosha Analysis & Matchmaking, Astrological Remedies, Numerology, Western Astrology, AI Astrologer, Tarot, Vastu Shastra, and White-Label PDF Reports.

Standard request body (`BirthDataRequest`): `dob, tob, lat, lon, tz (default 5.5), ayanamsa (default LAHIRI), lang (default en)`. Auth via `x-api-key` header only (never a query param). Standard response envelopes: `200` success `{status, language, data}`; `202` async job `{status:"PENDING", job_id, poll_url}`.

**Endpoint count:** treat the live `app.openapi()` route count as the only source of truth — historical docs quoted 37, ~115, and 135 in different places (see §8). Confirm the current number by hitting `/openapi.json` rather than trusting any document, including this one.

## 4. Local setup

**Backend:**
```bash
cd backend
python -m venv venv && venv\Scripts\activate   # or source venv/bin/activate on Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- Swiss Ephemeris `.se1` data files (1800–2100 CE, ~25MB) go in `backend/ephe/` — falls back to the lower-accuracy Moshier analytical engine if missing.
- `.env` needs: `PORT, ENVIRONMENT, INTERNAL_SECRET_KEY(+_PREVIOUS), EPHE_PATH, REDIS_HOST/PORT/PASSWORD, R2_ACCOUNT_ID/ACCESS_KEY/SECRET/BUCKET/PUBLIC_DOMAIN, DATABASE_URL, SENTRY_DSN`.
- **Also required, not in the old install guide:** `NEXT_APP_URL`, `ASTRO_INTERNAL_SECRET`/`ASTRO_INTERNAL_API_KEY`, `ASTRO_BACKEND_URL` for the Next.js↔FastAPI wiring — without these, most endpoints 500 on a fresh clone via `/api/proxy`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
- `frontend/.env.local` (gitignored) needs `ASTRO_BACKEND_URL` and `ASTRO_INTERNAL_API_KEY` at minimum for the demo/calculator pages to reach the backend.
- Linux hosts need `build-essential`, `python3-dev`, and Noto fonts for PDF rendering.

**Pricing:** Reconciled to a single standard across DB seeds, docs, and backend fallback: Starter ₹4,999/mo (35k calls), Pro ₹14,999/mo (300k calls), Enterprise ₹39,999/mo (1.5M calls).

## 5. Backend calculation status (verified live, not just read as code)

Core astronomy (planetary positions, ascendant, Panchang) matches raw `pyswisseph` output exactly (Lahiri ayanamsa, mean node). The following have been specifically verified correct through live testing against direct backend calls, after an earlier independent review found real bugs in several of them:

- Ashtakoot Guna Milan — all 8 kootas now classical (previously 7/8 were wrong).
- Divisional/Varga chart rules, geo search, timezone/DST — verified already correct.
- Running Dasha (birth-Mahadasha edge case), KP horary table (float-precision bug), Kaal Sarp type (Rahu house from Lagna).
- Panchang: sunrise-based weekday, Panchak, night Choghadiya, temporal Horas, tithi end-times.
- Lal Kitab debts, rudraksha language bug, numerology (favorable numbers, forecast, missing-numbers).
- PDF engine: now a real ReportLab render (was previously simulated with `asyncio.sleep` and a fake URL), with per-request-key ownership checks on both `/pdf/status/{job_id}` and `/pdf/download/{job_id}`. The report form exposes six output languages (`en`, `hi`, `mr`, `gu`, `ta`, `te`), each backed by an embedded Noto font and localized headings, tables, planet/sign/nakshatra names, narrative fallbacks, remedies, and disclaimer copy. Table cells and titles use measured auto-fit/ellipsis bounds, and paragraph wrapping prevents the previous page-2 and translated-text collisions. Six rendered 15-page samples (90 pages total) were checked with zero out-of-page or overlapping word boxes. All seven report routes were also smoke-tested across all six languages (42 valid PDF combinations).
- A deep formula audit (beyond the original review's scope) fixed real bugs in Avasthas (unreachable Swapna state) and rewrote Shadbala/Bhavabala's Dig/Kaala/Chesta/Drik Bala components against classical reference sources (Saravali, PyJHora) — some components remain documented approximations rather than exact (e.g. Chesta Bala for non-Sun/Moon planets), not silently claimed as fully exact.

- **Endpoint calculation implementation completed:** Commit `f475bc5` implemented classical astrological calculations across all modules (including Tajik Sahams, Karakamsha, Muntha, Arudhas, Dasha systems, Sade Sati transits, Ashtakvarga, KP horary, 12 Houses predictions, etc.). The automated test suite (`backend/tests/verify_117_endpoints.py`) executed against all live paths confirmed **125 endpoints REAL & VALIDATED**, 7 Real Async PDF jobs, and 0 fake stopgap responses.
- Historical reports that `frontend/src/lib` was missing are no longer current; locale, PDF dispatch, and R2 upload helpers now live there.
- The dashboard PDF queue now dispatches through `frontend/src/lib/pdfEngine.ts`, persists the original request payload, and supports a real admin retry route instead of a dead UI action.

## 6. Security & billing — re-verified this session (2026-09-28)

The six items below were re-checked directly against the current code (not just re-read from the old review). Four were already fixed by earlier work; two were genuinely still open and have now been fixed in this session:

- `POST /api/plans` — **already fixed.** Guarded by `requireAdminSession()` in [plans/route.ts](frontend/src/app/api/plans/route.ts).
- Wallet recharge — **already fixed.** Real Razorpay Orders API call, HMAC-SHA256 signature verification with `crypto.timingSafeEqual`, replay protection via `gatewayPaymentId` lookup, and an atomic `$transaction` settlement in [billing/recharge/route.ts](frontend/src/app/api/billing/recharge/route.ts).
- Invoice stored XSS — **already fixed.** Every interpolated field goes through an `escapeHtml()` helper before being embedded in the generated HTML in [billing/invoice/[id]/route.ts](frontend/src/app/api/billing/invoice/%5Bid%5D/route.ts).
- `GET /api/user/me` password leak — **already fixed.** `password`, `apiKeyHash`, and `accountWebhookSecret` are destructured out of the response in [user/me/route.ts](frontend/src/app/api/user/me/route.ts).
- Rate limiting — **enforced with Redis + in-memory fallback.** Backend: a sliding-window limiter (`backend/app/core/rate_limiter.py`) now connects directly to Upstash/Redis (`REDIS_HOST`) with atomic ZSET pipelines, while gracefully falling back to local sliding-window in-memory storage if Redis is offline. Enforced via `Depends(verify_api_key)` across astrology module routers. Frontend: login is capped at 6 attempts/5min per IP and OTP requests at 4/10min per email, both in `frontend/src/app/api/auth/*`.
- Hardcoded seed credentials — **fixed this session.** `prisma/seed.ts` and `prisma/seed_users.ts` both hashed `admin@astroengine.io` / `Admin@12345` with a bare unsalted SHA-256 instead of the real scrypt `hashPassword` in `src/lib/session.ts`, and `seed_users.ts` had no production guard and reset the admin password on every run. Both now import the real scrypt hasher, both skip entirely when `NODE_ENV=production`, neither overwrites an existing password on `update`, and the password is overridable via `SEED_ADMIN_PASSWORD`/`SEED_DEV_PASSWORD` env vars.
- Money as `Float` — **fixed this session.** Every money field in `schema.prisma` (`walletBalance`, `priceMonthly`, `overageCost`, `creditsCost`, `creditsAdded`, transaction/offer amounts — 19 fields across 8 models) is now `Decimal @db.Decimal(12, 4)`. This touched 15 API route files: reading a Decimal field and using it in `===`, `>=`/`<=` against another Decimal, or returning it raw in `NextResponse.json()` are all silently wrong (Decimal.js objects coerce to strings, so `===` fails, cross-Decimal comparisons become lexicographic string compares, and JSON serialization emits a decimal-string instead of a number) — found and fixed several live instances of this, including a Decimal-vs-Decimal wallet balance comparison in the hot-path `internal/verify-key/route.ts` that would have inverted quota/overage checks. Added `frontend/src/lib/money.ts` (`toMoney`, `toJsonSafe`, `scaleMoney`, `splitInclusiveTax`) as the single conversion point, applied at every Prisma read/response boundary that touches a money field.
  - **Not yet done:** the actual DB migration. This session has no `.env`/`DATABASE_URL` configured, so the schema and code changes could only be verified by regenerating the Prisma client and full-project `tsc --noEmit` (both clean, 0 errors) — not against a live MySQL instance. Run `npx prisma db push` (or generate a proper migration if you want migration history) once you have a DB connection, then smoke-test a wallet recharge and a plan purchase end-to-end.

If picking this back up further, the verification harness at `C:\xampp\htdocs\my-app\docs\astroengine_review_scripts\run_all.py` (lives one level up, outside this repo — see its own README there) is a from-code-evidence differential test suite, not a changelog.

## 7. Frontend: public-site redesign & i18n

The public marketing site (structural reference: a competitor's layout, not its colors/branding) went through a 9-phase visual redesign, now fully committed on `main`:

1. **Design tokens** (`globals.css`) — warm amber accent (`#b45309`) + cream surface palette (`--surface`, `--card`, `--line`, `--ink*`), replacing the dashboard's cold defaults on public pages only.
2. **Navbar** — dropdown nav groups, promo banner, live Panchang info ticker.
3. **Hero** — DOB-entry Kundli form + AI Astrologer chat widget.
4. **Calculators directory** — 24+ calculator cards with search/filter.
5. **Panchang & Muhurat widget** on the homepage.
6. **12-Rashi horoscope section**.
7. **Footer** rebuild — 5-column link directory.
8. **Pricing & documentation pages** restyled to the design tokens.
9. **Final QA pass** — confirmed `(dashboard)`, `(admin)`, and all `backend/**` routes were left untouched by the redesign.

**Second design pass (this session): full rebrand matched to an external reference (claudeskills.info)** — supersedes the amber palette from Phase 1 above:
- **Palette swap.** `globals.css` tokens moved from the amber accent (`#b45309`/`#92400e`) to a red-orange accent extracted from the reference site via `getComputedStyle()`: `--accent:#c23400`, `--accent-hover:#9c2a00`, `--accent-soft:#fdeee7`, warm-stone ink scale `--ink:#2c2421`/`--ink-soft:#6b5e57`/`--ink-muted:#8a7d76`, surfaces `--surface:#fcfaf8`/`--surface-alt:#f5f1ed`/`--card:#f7f5f2`, `--line:#e5e0dc`. Every consuming component picks this up automatically through the token system — no component-level color literals needed changing except in raw (non-Tailwind) HTML/CSS templates (see ReDoc, below).
- **Typography swap.** The earlier Newsreader/Plus Jakarta Sans/Fraunces/Figtree pairing was replaced site-wide with a single Inter (400–800, incl. italics) + JetBrains Mono pairing via `next/font/google`, matching the reference exactly.
- **Real bug found and fixed, not a false report:** the user repeatedly perceived the "Sign in" button as darker than the reference despite matching computed styles; pixel-sampling the user's own screenshots (Python PIL) traced it to `Navbar.tsx`'s promo banner using a `bg-linear-to-r from-accent to-accent-hover` gradient next to the flat-accent button, not the button itself. Flattened to solid `bg-accent`.
- Removed remaining banned visual tropes: Hero's ambient `blur-3xl` blobs, the "Architecture Pillars" 3-icon-card grid (rebuilt as an editorial numbered list), and purple-tinted pricing badges (now emerald).
- **Pricing page rebuilt as a comparison table.** `PricingClient.tsx` converted from a 3-card grid into a single `<table>` (one column per plan, rows for quota/rate-limit/overage/features/CTA), matching the reference's editorial table style instead of generic pricing cards.
- **ReDoc re-themed a second time.** `backend/app/main.py`'s hand-rolled `/redoc` page (raw HTML/CSS/JS, not driven by CSS tokens) had its Phase-7 amber values (`#b45309`/`#92400e`/`#78350f`/`#ece1d1`/`#f7efe2`/`#241a12`/etc.) replaced with the new red-orange/warm-stone palette across the favicon, nav bar, sidebar, active states, loading spinner, tables, scrollbars, and the `Redoc.init()` theme config's `primary`/`text`/`border`/`sidebar`/`rightPanel`/`schema` colors. Semantic REST colors (GET/POST/PUT/DELETE method badges, success/warning/error) were deliberately left untouched — standard API-doc convention, not tied to brand identity. The Next.js `/documentation` page needed no manual color edits since it already consumes the CSS token system.
- **Locale sweep completed.** ~185 previously hardcoded Hindi strings across 27 of the 29 calculator client files (3 already had bilingual dictionaries) were replaced with a per-file `const STRINGS = { hi: {...}, en: {...} } as const` dictionary — covering submit buttons, loading/empty states, result titles, row labels, table headers, and badges. `CalculatorsSection.tsx` and `lib/schema.ts` were also fixed to read `tool.seo.en.description` on the English locale instead of always showing the Hindi `tool.description`. Verified via `tsc --noEmit` (0 errors) after each batch; not independently re-confirmed by toggling the language switcher on every single page in a browser.

**Dedicated calculator pages:** all 29 calculators moved off the internal `/demo` test console onto real pages at `frontend/src/app/[locale]/calculators/<slug>/`, each with its own `BirthDataFields`, `CalculatorPageShell`, live-tested against real backend responses (multiple field-name mismatches between assumed and actual API response shapes were found and fixed this way — e.g. `sign` being an object not a string, `kootas` vs `gunas`, nested `lifetime_cycles[].phases[]`, etc.).

**Calculator Data Enrichment & Layout Standardization (2026-09-28 Session):**
- **Eliminated UI Grid Breakage & Layout Standardization:** Resolved the layout-shift bug where calculating results caused the input form container to jump to 12 columns (`lg:col-span-12`), pushing results far below. Standardized all single-chart calculators to an asymmetric `lg:grid-cols-12` layout with a sticky 4-column sidebar (`lg:col-span-4 lg:sticky lg:top-24`) and an 8-column results panel (`lg:col-span-8 items-start`). Standardized `kundli-matching` (which requires dual birth inputs for Groom and Bride) with a sticky 5-column sidebar (`lg:col-span-5 h-fit lg:sticky lg:top-24`) and a 7-column results panel (`lg:col-span-7 space-y-6`), completely eliminating dead scroll gaps and form jumping.
- **Deep Backend API Utilization across Calculators:** Replaced minimal 2-to-3 field responses with rich parallel fetches leveraging the 135 registered backend endpoints:
  1. `lagna-kundli`: Added parallel calls for real-time Vimshottari running Dasha (`/dasha/vimshottari/current`), 3-way Manglik Dosha (`/dosha-matching/manglik`), Avakahada Panchang, Shadbala ratios, Retrograde/Combust status, and 12-house life predictions.
  2. `core-numerology`: Replaced 3-card display with parallel fetches for Core Numbers (`/core-numbers`), Favorable Profile (`/favorable`), Lo Shu 3x3 Grid (`/loshu-grid`), 4 Life Pinnacles (`/pinnacles-challenges`), and Personal Year Forecast (`/forecast`).
  3. `loshu-grid`: Integrated Missing Numbers Remedies (`/missing-numbers`) alongside Driver/Conductor numbers and the 3x3 plane evaluation.
  4. `kundli-matching`: Added dual parallel Manglik Dosha checks for Groom and Bride with side-by-side cancellation breakdown and sticky dual-input form.
  5. `gemstone-suggestion`: Integrated Maraka/Dusthana prohibitions table (`/remedies/gemstones/restrictions`), consecration Beej Mantras (`/remedies/mantras`), Sacred Yantras (`/remedies/yantras`), and weekly Vrat discipline (`/remedies/fasting`).
  6. `sade-sati`: Integrated Saturn Beej Mantra with 23,000 japa frequency (`/remedies/mantras`), Saturday fasting rules (`/remedies/fasting`), and lifecycle transit timeline.
  7. `manglik-dosha`: Added 3-way reference evaluation (Lagna, Moon, Venus), 12 classical cancellations, Bhauma Beej Mantra (10,000 japa), and fully bilingual fallback Kumbh Vivah / Tuesday Vrat remedies while preserving dynamic backend `data.remedies`.
  8. `kaalsarp-dosha`: Added exact Rahu-Ketu nodal axis degrees, Udit/Anudit direction, Rahu (18,000) & Ketu (17,000) Beej Mantras, dynamic `data.description` & `data.remedies` restoration, and bilingual classical Mahamrityunjaya shanti guidance.
  9. `pitra-dosha`: Added Surya Beej Mantra (7,000 japa), ancestral debt factors, dynamic backend `data.description` & `data.remedies` restoration, and fully bilingual Amavasya tarpan / Narayan Bali ritual guidance.
  10. `rudraksha-mapping`: Combined 1–14 Mukhi prescription with complementary Life Stone synergy (`/remedies/gemstones`) and Shiva consecration rules.
  11. `vimshottari-dasha`: Added live running Dasha hierarchy (MD > AD > PD) badge and full 36-year Yogini Dasha cycle (`/dasha/yogini/complete`).
  12. `kp-system`: Added real-time KP Ruling Planets (`/kp/ruling-planets`) and 4-Grade (A/B/C/D) planetary significators (`/kp/significators/level-4`).
  13. `navamsha-d9`: Added Pushkar Navamsha detection and Nakshatra Gandanta checks (`/parashari/special-points`) alongside Vargottama planet status.
- **Rate Limiter Hardening (`rate_limiter.py`):** Fixed Redis ZSET member collision where `pipe.zadd(redis_key, {str(now): now})` could collide under identical sub-millisecond timestamps (e.g. coarse ~15ms clock on Windows). Replaced with nanosecond-resolution unique member `f"{now:.6f}:{time.perf_counter_ns()}"`. Isolated the rollback removal in its own resilient `try/except` block with error logging.
- **Calculator Layout Architecture Deduplication (`CalculatorPageShell.tsx`):** Eliminated copy-pasted grid boilerplate across calculator client files by introducing first-class `form` and `results` slots on `CalculatorPageShell` with configurable `layout?: "4-8" | "5-7" | "6-6"`. The shell now manages the sticky responsive sidebar (`h-fit lg:sticky lg:top-24`), sticky top offset, column spans, and results container centrally. Individual calculator client files now only provide pure `formContent` and `resultsContent` nodes, achieving DRY design and uniform layout behavior everywhere.
- **Unified Resilient Fetch Architecture (`calculatorApi.ts`):** Resolved divergent fetch styles (`Promise.all + .catch(() => null)` vs raw `Promise.allSettled`). Introduced `fetchParallelSettled(requests)` and `unwrapData(res)` in `@/lib/calculatorApi` which runs all requests concurrently with `Promise.allSettled`, isolates endpoint failures without crashing whole-page data, and automatically normalizes `{ data: ... }` envelopes across all multi-endpoint calculators.
- Validated via full TypeScript check (`npx tsc --noEmit`) with 0 errors.

**Locale-routing status:** the ~185-string sweep described in the second design pass above is done. Nothing further is known to be un-routed, but this was verified by code review (`tsc --noEmit`, grep for remaining hardcoded Hindi literals) rather than by toggling the language switcher on every page in a browser — treat that as the remaining verification step if a hardcoded string turns up later.

## 8. Dashboard and admin: static-to-dynamic fixes

The authenticated dashboard and admin panel were audited for hardcoded data, dead buttons, and schema/UI mismatches. The following are implemented:

1. Admin health cards and sidebar status now call the real FastAPI `/health` endpoint and show the real runtime environment instead of fictional online/node values.
2. API-key creation and last-used dates render real `User` data.
3. Razorpay checkout prefill uses the signed-in user's name and email instead of sample credentials.
4. Audit logs use the real admin identity and request IP; frontend fields now match `targetType`, `targetId`, and `metadata`, and user targets resolve to an email.
5. Failed PDF jobs can be retried using the stored original `requestPayload`; legacy jobs without a payload are reported as non-retryable.
6. Dashboard PDF generation has a complete birth-data form, report type, language, second-person matchmaking inputs, Varshphal year, and a persisted `subjectName`.
7. Tenant logo upload uses the shared Cloudflare R2 signer. Branding saves preserve `logoUrl` and return real errors instead of fake success responses.
8. Admin interpretation rules have working create, edit, and delete endpoints and UI actions backed by `AstrologicalPrediction`.
9. Offers are database-driven rather than hardcoded: admins can create global or single-user personalized codes for a plan or add-on, configure percentage/fixed discounts, minimum spend, maximum discount, validity and status. Eligible one-time offers appear directly on public Pricing/Plans cards with original price, discounted price and savings; the selected code is carried into Billing and auto-applied. Checkout validates it server-side for wallet and Razorpay flows, and `OfferRedemption` enforces one redemption per offer per user.
10. PDF page-count labels now match the renderer everywhere: Basic 15, Brihat 60, Matchmaking 20, Lal Kitab 30, Varshphal 20, Numerology 12 and Sade Sati 15 pages.

Relevant schema additions:

```prisma
model AuditLog {
  ipAddress String?
}

model PdfGenerationJob {
  requestPayload Json?
  subjectName    String?
}

model OfferRedemption {
  offerId String
  userId  String
  @@unique([offerId, userId])
}
```

These changes were verified against a local MySQL development database and through authenticated UI flows. One follow-up remains: per-team-member cost attribution needs an `ApiRequestLog` relation/migration. (The admin billing table fallback email has been fixed to avoid mock credentials).

## 9. Reconciled numbers that used to conflict

The old docs disagreed with each other on several numbers. Resolutions:

- **Endpoint count:** don't trust 37, ~115, or 135 — check `/openapi.json` directly.
- **Test count:** "37 passed, 100%" (old install guide) was wrong; an independent count found 39 tests collected (38 pass + 1 fail on a clean clone missing `NEXT_APP_URL`).
- **Pricing:** Unified across DB seeds, docs, and backend fallback: Starter ₹4,999/mo (35k calls), Pro ₹14,999/mo (300k calls), Enterprise ₹39,999/mo (1.5M calls).
- **Frontend redesign phase count:** confirmed via `git log` that all 9 phases are actually committed on `main` (Phases 1–2 have descriptive commit messages `945bcee`/`24d89a6`; Phases 3–9 landed in later, generically-messaged commits) — not just claimed in the fix log.

## 10. Where things live

- `backend/app/` — FastAPI app, one module per astrology domain under `modules/`.
- `frontend/src/app/[locale]/` — locale-routed public pages (homepage, calculators, pricing, documentation).
- `frontend/src/app/(dashboard)/`, `frontend/src/app/(admin)/` — authenticated SaaS portal, untouched by the public redesign.
- `frontend/src/app/demo/` — internal API-testing console, intentionally left as-is (not part of the redesign).
- `frontend/src/dictionaries/dictionary.ts` — shared hi/en translation dictionary for public-site chrome.
- `frontend/src/lib/locale.ts` — locale routing source of truth (`DEFAULT_LOCALE`, migrated-paths list, path helpers).
- `frontend/src/lib/pdfEngine.ts` — shared PDF report dispatch used by creation and retry flows.
- `frontend/src/lib/offers.ts` — shared server-side offer validation, price calculation, and one-time redemption recording.
- `frontend/src/lib/r2Upload.ts` — shared Cloudflare R2 upload/signing helper.
- `C:\xampp\htdocs\my-app\docs\astroengine_review_scripts\` (outside this repo) — the independent verification harness referenced in §6.

## Environment variables

Never commit real values: `.env` files are git-ignored. Only the variable names are listed here.

### Frontend (`frontend/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | MySQL connection string used by Prisma. |
| `SESSION_SECRET` | **yes (prod)** | Signs session cookies. No fallback outside `next dev`. Use 32+ random bytes; keep it different from `ASTRO_INTERNAL_SECRET`. |
| `ASTRO_INTERNAL_SECRET` | yes | Service-to-service secret. Must equal the backend's `INTERNAL_SECRET_KEY`. |
| `ASTRO_BACKEND_URL` | yes | FastAPI base URL (default `http://127.0.0.1:8000`). |
| `ASTRO_INTERNAL_API_KEY` | yes | API key of an **ADMIN** account, used by the public calculator proxy and playground. |
| `NEXT_PUBLIC_APP_URL` | yes | Public site URL (links in emails, billing redirects). |
| `NEXT_PUBLIC_ASTRO_ENGINE_URL` | optional | Public API base URL shown in the docs. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | yes (billing) | Razorpay credentials. Admin > Settings values take priority; dummy/placeholder values are ignored. |
| `RAZORPAY_WEBHOOK_SECRET` | yes (billing) | Webhook signing secret. Webhooks are refused (503) until it is set. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_DOMAIN` | for logo/PDF storage | Cloudflare R2 (Admin > Settings overrides these). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` (or `SMTP_PASS`), `SMTP_FROM`, `SMTP_FROM_NAME` | for email | Outgoing mail (OTP, notifications). |
| `REDIS_URL` | recommended (prod) | e.g. `redis://:password@host:6379`. Makes rate limits (login, OTP, reset, proxy) shared across instances. Without it limits are per process. |
| `SETTINGS_ENCRYPTION_KEY` | recommended (prod) | Encrypts Razorpay / R2 / SMTP secrets stored in the DB (AES-256-GCM). After setting it run `npm run encrypt-settings` once to encrypt existing values. **Back this key up**: losing it makes the stored secrets unreadable. |
| `TRUSTED_PROXY_HOPS` | optional (default `1`) | Number of reverse proxies in front of Next.js; used to read the real client IP. |
| `PROXY_ANON_RPM`, `PROXY_USER_RPM`, `PROXY_HEAVY_RPM`, `PLAYGROUND_RPM` | optional | Rate-limit tuning (defaults 120 / 600 / 10 / 20 per minute). |
| `ADMIN_INITIAL_PASSWORD`, `ASTRO_MASTER_API_KEY` | seed only | Used by `/api/admin/seed` and `npm run seed`. If unset, a random password / API key is generated and shown once. |
| `ALLOW_PROD_SEED` | seed only | Must be `true` to run the seed endpoint in production. |
| `SEED_ADMIN_PASSWORD`, `SEED_DEV_PASSWORD` | seed scripts only | Used by `prisma/seed*.mts`. Unset = random password printed once (there are no default passwords). |

### Backend (`backend/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `INTERNAL_SECRET_KEY` | yes | Must equal the frontend's `ASTRO_INTERNAL_SECRET`. |
| `NEXT_APP_URL` | yes | Frontend base URL (API-key verification, settings, plans). |
| `ENVIRONMENT` | recommended | `production` in prod. `development` enables the local test-key bypass. |
| `CORS_ORIGINS` | optional | Comma-separated allowed origins (defaults to `NEXT_APP_URL`). |
| `EPHE_PATH` | yes | Swiss Ephemeris data directory (default `./ephe`). |
| `PORT` | optional | Default `8000`. |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | optional | Shared rate limiting; without Redis limits are per process (keep a single worker). |
| `R2_*` | optional | Fallback R2 settings if not provided by the frontend settings API. |
| `SENTRY_DSN` | optional | Error monitoring. Also `pip install "sentry-sdk[fastapi]"`; no personal data is sent. |
| `BILLING_LOG_LATENCY` | optional (default `true`) | Set `false` to skip the per-request call that records real latency in the usage log. |
| `PDF_MAX_CONCURRENCY` | optional (default `2`) | How many PDF reports render at the same time (CPU bound, runs in threads). |

### Production notes

- Build and run: `npm run build && npm run start`, and `uvicorn` without `--reload` (see `ecosystem.config.js`).
- Tests: `pip install -r backend/requirements-dev.txt && pytest`.
- Rotate any Razorpay / R2 / SMTP credentials that were ever seeded with dummy values (they exist in git history).
- Backups: `scripts/backup.ps1` dumps MySQL and the PDF job SQLite DB with retention (`-KeepDays`); schedule it with Task Scheduler (example in the script header) and copy the output off the machine.
- Password reset: users can use **Forgot password?** on the sign-in page (`/forgot-password`, email code, 10 minute validity). Existing sessions stay valid until they expire (72h).
- Config caching: plan, add-on and maintenance-mode lookups used by API-key verification are cached for 10-30 seconds per server process, so admin changes can take that long to apply.

### Database changes (run once after pulling)

```bash
cd frontend
npx prisma db push        # adds the new columns below (all nullable / defaulted, existing rows are fine)
npx prisma generate
```

New tables: `Invoice` and `InvoiceCounter` (consecutive GST invoice numbers).
New columns: `EmailOtp.attempts` (OTP guess counter stored with the code), and on `User`:
`passwordChangedAt` (sessions issued before it are rejected), `totpSecret`, `totpEnabled`, `totpLastStep` (two-factor auth).
Deploy the new code **after** `db push`, otherwise sign-up / login queries reference columns that do not exist yet.

### Seeding

Seed scripts run on plain Node 22+ (no ts-node) and refuse to run when `NODE_ENV=production`:

```bash
npm run seed            # admin, settings (empty credential placeholders), plans, plan-module switches
npm run seed:users      # demo admin + developer accounts
npm run seed:company    # company / social settings
```

They never overwrite an existing account. Passwords and API keys that were generated are printed **once**: copy the admin API key into `ASTRO_INTERNAL_API_KEY`.

### Two-factor authentication

Any user can enable TOTP (Google Authenticator, Authy, 1Password) under **Dashboard > Profile**. Once enabled, sign-in asks for the 6-digit code after the password; each code works only once. Turn it on for every admin account.

### Billing, invoices and reports: how it works

- **Every report is billed to the customer who asked for it**, whether it is started from the dashboard (`/api/pdf/queue`), the calculators page (`/api/proxy`) or the public API. The internal admin key is only used to talk to the engine, never to pay. A failed report (engine down, immediate or later failure) gives the quota / wallet credit back exactly once. Open dashboard reports are re-synced with the engine when the list is loaded.
- **GST policy: top-ups carry no GST, purchases do.** A wallet recharge is a prepaid deposit, so it gets a **payment receipt** (`REC-<year>-<id>`, no tax lines, no invoice number). GST (18% inclusive; CGST+SGST in the seller's state, IGST otherwise) is invoiced when the money is used.
- **Tax invoices have consecutive numbers**, per financial year (April-March, IST): `AE/25-26/000001` (15 characters, within the 16-character GST limit). The number is taken from `InvoiceCounter` inside the same database transaction that creates the invoice, so there are no gaps and no duplicates even under concurrency. Seller and buyer details are copied onto the invoice when it is issued, so later profile edits never change it. A purchase (plan, add-on; wallet or gateway) gets its invoice at the moment it is paid; older purchases get theirs the first time they are viewed or exported (oldest first).
- **Per-call overage and report charges: deducted on every call, invoiced once a month.** The wallet is debited per call as before, but the customer receives **one consolidated GST usage invoice per month** (all billed calls + reports of that calendar month, IST; refunded calls are excluded). Run it on the 1st of every month: `scripts/monthly-invoices.ps1 -BaseUrl https://your-app` (Task Scheduler example inside), or `POST /api/internal/invoices/monthly {"month":"2026-03"}` with the internal secret or as admin. It is idempotent: running it twice creates nothing new. Customers see all invoices under **Dashboard > Invoices**.
- **GSTR-1 export** (`/api/admin/reports?export=gstr1_returns&from=YYYY-MM-DD&to=YYYY-MM-DD`): the issued tax invoices (purchases + monthly usage invoices) in number order, with buyer GSTIN/state and a totals row. Every export is written to the audit log.
- **Admin revenue** = plans/add-ons sold + usage charges (`revenueBreakdown`); wallet top-ups are reported separately as `walletTopUps`, so one rupee is never counted as both a deposit and a sale.
- **Admin retry of a failed report:** the customer was refunded when it failed, so a retry **charges them again** (report price) before it runs, and refunds again if the retry fails too. If the customer's wallet cannot cover it the retry is refused with a message. A report that was never refunded is already paid for, so its retry is free.
- **Report prices (INR, GST-inclusive):** each report type has its own price, between Rs 4 and Rs 12 (Sade Sati 4, Basic Kundli / Numerology 5, Matchmaking 6, Varshphal 8, Lal Kitab 9, Brihat Kundli 12), taken from the customer's wallet whether the report is started from the dashboard, the calculators page or the API. Customers with the PDF add-on get its monthly included reports (500) free, then pay the report price. Status polls and downloads are free. A failed report is refunded automatically. The price list lives in one place: `REPORT_ENDPOINTS` in `src/lib/pdfEngine.ts`.
