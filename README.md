# AstroEngine

High-performance, multi-language (i18n) B2B Vedic + Western Astrology REST API suite, white-label PDF report engine, and a full-stack Next.js consumer + SaaS portal (wallet billing, API-key management, admin console).

This file replaces the previous set of 8 root-level markdown docs (`README.md`, `API_DOCUMENTATION.md`, `INSTALLATION_GUIDE.md`, `TECHNICAL_SPECIFICATION.md`, `ASTROENGINE_REPO_REVIEW.md`, `BACKEND_PROGRESS.md`, `CALCULATOR_PAGES_PLAN.md`, `POST_REVIEW_FIX_LOG.md`), which had overlapping and in places contradictory content (see [§8 Reconciled numbers](#8-reconciled-numbers-that-used-to-conflict)). It is a condensed, current-as-of-this-edit summary, not a full reproduction — historical per-finding detail from those files is not preserved verbatim.

See [DASHBOARD_ADMIN_FIXES.md](DASHBOARD_ADMIN_FIXES.md) for a detailed log of a pass that replaced hardcoded/fake data and dead buttons in the user dashboard and admin panel with real implementations.

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
- **Also required, not in the old install guide:** `NEXT_APP_URL`, `ASTRO_INTERNAL_SECRET`/`ASTRO_INTERNAL_API_KEY`, `ASTRO_BACKEND_URL` for the Next.js↔FastAPI wiring — without these, most endpoints 500 on a fresh clone via `/api/demo/proxy`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
- `frontend/.env.local` (gitignored) needs `ASTRO_BACKEND_URL` and `ASTRO_INTERNAL_API_KEY` at minimum for the demo/calculator pages to reach the backend.
- Linux hosts need `build-essential`, `python3-dev`, and Noto fonts for PDF rendering.

**Pricing:** three different price tables exist across the codebase (design spec, DB seed data, and `main.py`'s docs fallback) — pick one and reconcile before relying on displayed prices anywhere (dashboard, pricing page, docs).

## 5. Backend calculation status (verified live, not just read as code)

Core astronomy (planetary positions, ascendant, Panchang) matches raw `pyswisseph` output exactly (Lahiri ayanamsa, mean node). The following have been specifically verified correct through live testing against direct backend calls, after an earlier independent review found real bugs in several of them:

- Ashtakoot Guna Milan — all 8 kootas now classical (previously 7/8 were wrong).
- Divisional/Varga chart rules, geo search, timezone/DST — verified already correct.
- Running Dasha (birth-Mahadasha edge case), KP horary table (float-precision bug), Kaal Sarp type (Rahu house from Lagna).
- Panchang: sunrise-based weekday, Panchak, night Choghadiya, temporal Horas, tithi end-times.
- Lal Kitab debts, rudraksha language bug, numerology (favorable numbers, forecast, missing-numbers).
- PDF engine: now a real ReportLab render (was previously simulated with `asyncio.sleep` and a fake URL) — verified for all report types across all 6 supported languages, with per-request-key ownership checks added on both `/pdf/status/{job_id}` and `/pdf/download/{job_id}` (the latter had **no auth at all** before this fix).
- A deep formula audit (beyond the original review's scope) fixed real bugs in Avasthas (unreachable Swapna state) and rewrote Shadbala/Bhavabala's Dig/Kaala/Chesta/Drik Bala components against classical reference sources (Saravali, PyJHora) — some components remain documented approximations rather than exact (e.g. Chesta Bala for non-Sun/Moon planets), not silently claimed as fully exact.

**Still open / not yet re-verified since the last review:**
- Roughly 40 of the ~45 originally-fabricated/hardcoded endpoints identified by the independent review have not been confirmed fixed (only 5 named ones were: `pinnacles-challenges`, `transits/daily`, `synastry/score`, `solar-return`, `tajik/varshesh`).
- `frontend/src/lib` was reported missing from the repo at review time, blocking a from-scratch build and auditing of auth/session code — confirm this still applies before relying on it.
- Next.js `pdf/queue/route.ts` calling a nonexistent `/api/v1/pdf/generate` FastAPI endpoint (404 in production) was flagged and not yet fixed as of the last calculation-focused pass.

## 6. Security & billing — known open findings

These were identified by an independent code review and, as far as the calculation-fix work above documents, **have not been confirmed fixed**. Treat all of these as still open until re-verified:

- `POST /api/plans` had no authentication — anyone could rewrite pricing/quotas.
- Wallet recharge could be credited without a real payment — no actual Razorpay Orders API call or webhook signature verification, fake local order IDs accepted.
- Stored XSS in the invoice page (exploitable against admin sessions).
- `GET /api/user/me` returned the password hash to the browser.
- Hardcoded default admin credentials in seed scripts, reset on every seed run.
- No rate limiting actually implemented (docs described it, code didn't enforce it), no recurring billing/quota-reset job, money stored as `Float` instead of `Decimal`, Team feature is schema-only/inert, GST/accounting math had errors.

If picking this back up, re-run the verification harness at `C:\xampp\htdocs\my-app\docs\astroengine_review_scripts\run_all.py` (lives one level up, outside this repo — see its own README there) before assuming anything above is still accurate; it's a from-code-evidence differential test suite, not a changelog.

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

**Dedicated calculator pages:** all 29 calculators moved off the internal `/demo` test console onto real pages at `frontend/src/app/[locale]/calculators/<slug>/`, each with its own `BirthDataFields`, `CalculatorPageShell`, live-tested against real backend responses (multiple field-name mismatches between assumed and actual API response shapes were found and fixed this way — e.g. `sign` being an object not a string, `kootas` vs `gunas`, nested `lifetime_cycles[].phases[]`, etc.).

**Bilingual locale routing (this session, on top of the above):**
- Full `hi`/`en` URL routing for the homepage, all 29 calculators, and `/pricing` + `/documentation`, via `app/[locale]/**` + a `proxy.ts` rewrite (bare path ↔ prefixed path).
- **Default locale is English** (`DEFAULT_LOCALE = "en"` in `lib/locale.ts`) — bare URLs (`/`, `/calculators/lagna-kundli`, `/pricing`, …) serve English; Hindi lives at the `/hi/*` prefix. (This was previously the reverse — Hindi bare, `/en/*` prefixed — and was swapped project-wide across `proxy.ts`, every locale-aware page/component, `sitemap.ts`, and `schema.ts`.)
- A shared translation dictionary (`src/dictionaries/dictionary.ts`) now actually drives the Navbar (nav groups, promo banner, info ticker, sign-in), Footer, Hero, Panchang widget, and Horoscope section — the Navbar previously hardcoded English regardless of locale despite the dictionary comment claiming it was covered.
- The custom ReDoc API documentation page (`backend/app/main.py`) and the Next.js `/documentation` page's code-sample panel were retheme'd from an indigo/zinc palette to the site's amber-accent/warm-ink palette, leaving semantic HTTP-method and status colors (GET/POST/error/success) untouched.

**Still not locale-routed:** the ~185 hardcoded strings in a few remaining shared-chrome edge cases beyond what's listed above, if any turn up — verify by toggling the language switcher across the site rather than assuming full coverage.

## 8. Reconciled numbers that used to conflict

The old docs disagreed with each other on several numbers. Resolutions:

- **Endpoint count:** don't trust 37, ~115, or 135 — check `/openapi.json` directly.
- **Test count:** "37 passed, 100%" (old install guide) was wrong; an independent count found 39 tests collected (38 pass + 1 fail on a clean clone missing `NEXT_APP_URL`).
- **Pricing:** three different tables existed (design spec vs. DB seed vs. backend fallback) — needs a single source of truth, not yet reconciled.
- **Frontend redesign phase count:** confirmed via `git log` that all 9 phases are actually committed on `main` (Phases 1–2 have descriptive commit messages `945bcee`/`24d89a6`; Phases 3–9 landed in later, generically-messaged commits) — not just claimed in the fix log.

## 9. Where things live

- `backend/app/` — FastAPI app, one module per astrology domain under `modules/`.
- `frontend/src/app/[locale]/` — locale-routed public pages (homepage, calculators, pricing, documentation).
- `frontend/src/app/(dashboard)/`, `frontend/src/app/(admin)/` — authenticated SaaS portal, untouched by the public redesign.
- `frontend/src/app/demo/` — internal API-testing console, intentionally left as-is (not part of the redesign).
- `frontend/src/dictionaries/dictionary.ts` — shared hi/en translation dictionary for public-site chrome.
- `frontend/src/lib/locale.ts` — locale routing source of truth (`DEFAULT_LOCALE`, migrated-paths list, path helpers).
- `C:\xampp\htdocs\my-app\docs\astroengine_review_scripts\` (outside this repo) — the independent verification harness referenced in §6.
