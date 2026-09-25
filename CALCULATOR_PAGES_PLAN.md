# Dedicated calculator pages + language-selection fixes

## Update: calculator UX completion, shared profile, PDF refresh, and proxy rename ✅

- The browser-facing backend bridge moved out of the demo route and now lives at
  `src/app/api/proxy/route.ts`. All calculator, hero, city-search, PDF polling/download,
  and developer-console calls now use `/api/proxy`; the legacy proxy URL is gone.
- Removed the remaining public "Live Demo" links from the navbar, ticker, calculator
  directory banner, and footer. They now lead to the relevant dedicated calculator or
  calculator directory; `/demo` remains available only as a direct developer surface.
- `BirthDataFields.tsx` now keeps the primary person's complete birth profile in local
  storage and hydrates it on every calculator. Filling one calculator therefore
  auto-fills all other birth-data calculators on the same device. Secondary bride /
  partner fields stay isolated and never overwrite the primary profile.
- Added a shared post-result reading guide to every calculator page so a result is not
  presented as an unexplained mini data block, and clarified that indicators should be
  interpreted together.
- The PDF Reports page now follows the URL locale directly (no conflicting in-form
  language selector) and its complete job/empty/error/download UI is single-language.
- Refreshed the shared PDF visual system: editorial masthead, brand side rail, compact
  page folio, calmer title hierarchy, higher-legibility tables, and a confidential
  footer. Generated and rendered a real 15-page Kundli PDF; first and final pages were
  visually checked with no clipping, overlap, or broken chart/table layout.
- Verification: `next typegen` succeeded and `tsc --noEmit` is clean after the route
  move and UI changes.

## Update: full Panchang/Kundli results and cleaner consumer header ✅

- Daily Panchang no longer stops at the five basic Angas. One submission now combines
  seven existing APIs (`daily`, `sun-moon/timings`, `advanced`, `choghadiya`, `hora`,
  `bhadra`, and `panchak`) with partial-failure tolerance. The result includes sunrise,
  sunset, moonrise, moonset, day length, Abhijit/Brahma Muhurta, Rahu/Yamaganda/Gulika,
  Bhadra/Panchak status, all day/night Choghadiya slots, and all 24 planetary Horas.
- Lagna Kundli now fetches D1 data/SVG together with the 12-house prediction, classical
  Yoga, and Shadbala APIs. The page presents the chart, full planet table, Yoga cards,
  strength comparison, and expandable prediction/remedy cards for all twelve houses.
- Removed the API version badge, duplicate external API Reference link, and Console CTA
  from the public header. Documentation remains the single API-information destination;
  the header now keeps only consumer navigation, locale, calculators, and sign-in.
- Verification: `tsc --noEmit` passes; targeted ESLint has zero errors (one pre-existing
  Next Image optimization warning remains for the configurable company logo).

## Update: wide result layouts and PDF collision/language redesign ✅

- Increased the shared calculator shell from a narrow `max-w-4xl` column to the full
  `max-w-7xl` content grid. Kundli and Daily Panchang switch to full-width form/result
  rows after calculation, so long tables/cards use the page instead of leaving a tall
  blank column under the form.
- PDF Reports now follow the selected site language end-to-end: Hindi reports use
  Hindi headings, table labels, planet/sign names, narratives, status text and dashas;
  English reports remain fully English. This removes the previous mixed-language PDF.
- Reduced the D1 and D9 chart footprints so both charts stay visually balanced with
  the surrounding report content instead of dominating the page.
- Redesigned the shared PDF hierarchy with brand-color table headers, softly tinted
  section bands and alternating rows, while preserving high-contrast print output.
- Fixed the dense page-2 ephemeris/dignity collision by shortening column headers and
  reflowing the second table and interpretation block. Regenerated the 15-page Hindi
  sample and visually verified the cover, dense tables, dashas, remedies, and final
  page; no text overlap or clipping remains.

## Update: bilingual locale routing (all 29 calculators + homepage) ✅
A separate, later effort added real Hindi/English URL routing on top of everything
below — Hindi stays at the bare URLs documented in this file (`/calculators/<slug>`),
English is now also served at `/en/calculators/<slug>` for **all 29 calculators**
(started as a 2-page proof on `lagna-kundli`/`moon-sign`, then mechanically repeated
across the remaining 27 via a scripted move, so every page kept its exact existing
logic/JSX — only the file location, function signature, and lang-seeding changed).
Each migrated route moved from `src/app/calculators/<slug>/page.tsx` to
`src/app/[locale]/calculators/<slug>/{page.tsx,<Slug>Client.tsx}` — `page.tsx` is now a
thin Server Component with per-locale `generateMetadata()` (distinct `<title>`/meta
description per language, hreflang `hi`/`en`/`x-default` alternates) and JSON-LD
(`SoftwareApplication` + `BreadcrumbList`); the original client logic moved into
`<Slug>Client.tsx` unchanged except accepting a `locale` prop that seeds the page's
existing hi/en API-language toggle instead of hardcoding `"hi"`. `src/middleware.ts`
(deprecated in this Next.js version, renamed `proxy.ts`) now rewrites bare Hindi
requests to `/hi` internally and redirects stray `/hi/*` → bare; auth-gating logic is
carried over verbatim and was re-verified unchanged. New `sitemap.ts`/`robots.ts`
enumerate both language variants for every migrated path, and a Hindi/English switcher
was added to `Navbar.tsx`. `CALCULATOR_TOOLS` entries in `calculatorsData.ts` gained an
optional `seo: {hi, en}` field (title + description) for all 29.

## Update: Single-Language Enforcement & 404 Routing Fix (Completed) ✅
Following the initial migration, two critical production-readiness issues were resolved:
1. **Next.js 16 Proxy / Middleware Conflict (404s)**:
   - Removed deprecated `src/middleware.ts` in favor of Next.js 16 `src/proxy.ts`.
   - Updated `proxy.ts` matcher to comprehensively cover bare paths, `/hi`, `/en`, `/calculators/:path*`, and added `x-locale-rewrite` header protection to eliminate infinite redirect/rewrite loops.
   - All calculator URLs (`/calculators/<slug>` and `/en/calculators/<slug>`) now resolve cleanly with zero 404s.

2. **Single-Language English Enforcement on `/en/*`**:
   - `CalculatorPageShell.tsx`: Subtitles (`description`), breadcrumbs, and bottom "Related Calculators" cards now dynamically adapt to `locale === "en"` without hardcoded Hindi fallback strings.
   - In-form duplicate language toggles were removed or aligned with the route `locale` so user selection doesn't fight URL routing.
   - Default city strings set dynamically based on locale (e.g. `"New Delhi, India"` on English vs `"नई दिल्ली, भारत"` on Hindi).

## Execution Status: Built, bugs found via live testing, fixed and re-verified ✅

Part 1, the shared components, all 29 pages, and the link-rewiring pass below were all
built (by an earlier/background session) and `tsc --noEmit` was clean throughout. But a
**clean `tsc` only proves the types line up — it does not prove the pages work**, since
almost every page guesses at the shape of the backend's JSON response with `||` fallback
chains (`p.rashi_name || p.sign`, `data.exceptions || data.rules_applied`, etc.) with no
compile-time check against what the backend actually returns. A follow-up verification
pass (start backend + frontend for real, click through pages, cross-check against direct
`curl` calls to the backend) found that several of those guesses were wrong — including
some that outright crashed the page. All of the below were found this way and fixed in
this same pass; each fix was re-verified live in the browser afterward (not just tsc).

### 1. The 3 originally-flagged bugs — fixed & verified live
- **`kundli-matching`, `nadi-exceptions`, `dashakoot-porutham`** — payload sent
  `boy_dob`/`girl_dob`/... but the backend's `MatchmakingRequest` schema requires
  `groom_dob`/`bride_dob`/... → every submit 422'd. Renamed the payload keys in all 3
  pages. (This exact wrong-field-name bug was inherited from `demo/page.tsx`'s
  pre-existing `runMatchmaking`, which is *also* still broken today — out of scope to
  touch since `/demo` itself is explicitly not part of this plan, but worth knowing.)
- **`name-correction`** — payload only sent `{current_name, target_number, lang}`, but
  the backend endpoint requires a full `BirthDataRequest` body (`dob`/`tob`/`lat`/`lon`
  all required, even though the endpoint doesn't use them) → 422 every time. Added the
  same dummy-birth-data pattern `core-numerology`/`loshu-grid` already used correctly.
- **`pdf-reports`** — the plan itself flagged that "Matchmaking Dossier" and "Tajik
  Varshphal" report types need extra `girl_*`/`target_year` fields, but the page never
  added them. Added a conditional second `BirthDataFields` (Bride) for the matching
  report type and a Target Year input for varshphal, wired into the payload. Verified
  end-to-end: matching-report job actually completed and produced a downloadable PDF.

### 2. 8 more bugs found during the same live-testing pass — fixed & verified live
Found by curling each real endpoint and diffing the actual JSON shape against what each
page's rendering code assumed:
- **`lagna-kundli`, `moon-sign`, `planetary-positions`, `navamsha-d9`** — all rendered
  `p.sign` directly as a JSX child, but the real API returns `sign` as an object
  (`{id, name, number}`), not a string → **hard React crash** ("This page couldn't
  load") the moment you submitted the form. Fixed to read `.sign?.name`. Same object
  shape applied to `nakshatra` (`{id, name, pada, lord}`) — fixed alongside.
- **`moon-sign`** — separately, its `planets.find()` looked for the literal Hindi
  substring `"चन्द्र"` inside the API's real value `"चंद्रमा"` — these are different
  Unicode spellings, so the match always failed in Hindi (the page's default language),
  silently showing the empty state forever. Fixed to match on the stable `p.id==="MOON"`
  instead of guessing at localized text.
- **`kp-system`** — planet name and sign read from the wrong fields (`p.name`/`p.sign`
  instead of `p.planet_name`/`p.sign.name`); cusp degree read from a field that doesn't
  exist (`c.degree` instead of `c.degree_in_sign`), so it always showed 0.00°.
- **`sade-sati`** — status flags (`is_under_sade_sati`, `is_dhaiya`, `moon_sign`,
  `saturn_sign`) all used field names that don't exist on the real response (real names:
  `is_sadesati_active`, `is_dhaiya_active`, `natal_moon_sign`, `transit_saturn_sign`) —
  the page always showed "मुक्त" (not-in-sade-sati) regardless of the real status. The
  lifetime timeline table was worse: it read `data.timeline`, but the real field is a
  nested `data.lifetime_cycles[].phases[]` — so the "जीवनपर्यन्त" table was permanently
  empty. Flattened the nested structure into rows and fixed all four status fields.
- **`western-astrology`** — Rising sign read `data.ascendant`, but the real field is
  `data.ascendant_sign` — always fell back to the hardcoded "Sagittarius" placeholder.
- **`kundli-matching`** — the "8 Koot Breakdown" table read `data.gunas`/
  `data.ashtakoota`, neither of which exist; the real response is a `data.kootas` object
  keyed by koot name (`varna`, `vashya`, `tara`, ...), so the breakdown section was
  permanently empty and the nadi/bhakoot dosha rows never showed. Rebuilt the derivation
  to read `kootas` and map each entry to a display row with Hindi labels.
- **`nadi-exceptions`, `dashakoot-porutham`** — same "guessed the wrong field names"
  problem against their own (different) real response shapes — `nadi_analysis`/
  `bhakoot_analysis` nested objects for exceptions, and `poruthams_breakdown`/
  `passed_poruthams_count`/`is_rajju_porutham_passed` for dashakoot. Fixed both to match
  the real payload; dashakoot-porutham's per-row list also read `p.significance` instead
  of the real `p.aspect`.

### 4. The remaining 16 pages — live-tested and fixed in a follow-up pass
The 16 pages the earlier pass flagged as "not yet live-tested" were each checked by
curling the real backend endpoint and diffing the actual JSON shape against what the
page's rendering code assumed, then spot-verified live in the browser (backend +
frontend both running, `tsc --noEmit` clean throughout). Bugs found and fixed:
- **`kaalsarp-dosha`** — `isPresent` read `data.is_present`/`data.has_kalsarpa`, neither
  of which exist; the real field is `is_kaal_sarp`. The page **always showed "no dosha"
  regardless of the real chart**. Verified live with a chart that actually has the dosha
  (DOB 1985-03-20): now correctly shows "कालसर्प दोष उपस्थित है" (type Ghatak). Also added
  a derived `ketu_house` (always exactly opposite `rahu_house`, which the API doesn't
  return directly).
- **`marriage-muhurat`** — `status` read fields that don't exist, so the green "शुभ
  मुहूर्त उपलब्ध" banner **always showed regardless of whether any dates were found**.
  Each muhurat row fell back to a meaningless "मुहूर्त 1/2/3..." placeholder (real field
  is `date`/`day`, not `lagna`/`name`) with a blank time range (real field is a formatted
  `recommended_window` string, not `start`/`end`). Rewrote the whole list to use the real
  shape (`date`, `day`, `tithi`, `nakshatra`, `quality`, `recommended_window`,
  `abhijit_muhurat`, `avoid_periods`) and derive `status` from whether any muhurats came
  back. Verified live: 8 real dates now render with full detail.
- **`loshu-grid`** — `getCellDigits` read from `data.grid`/`data.loshu_grid`, neither of
  which exist; the real field is a positional `grid_matrix` 3x3 array (confirmed against
  `backend/app/modules/numerology/calculator.py:252-256`). **The grid always rendered
  empty.** Separately, `planes` is a plain object (`{mental_plane_4_9_2: bool, ...}`),
  not an array, so `Array.isArray(planes)` was always false and the whole planes section
  never rendered. Fixed both, added a missing-numbers row. Verified live and
  cross-checked digit-for-digit against a direct curl.
- **`vimshottari-dasha`** — `/dasha/vimshottari/current`'s real response nests
  everything under `running_dasha` (`running_dasha.mahadasha.planet_name`,
  `.antardasha.antardasha_name`, `.pratyantar_dasha.pratyantar_name`); the page read
  top-level fields that don't exist, so the current-dasha panel **always showed the
  hardcoded "सूर्य" fallback** and antardasha/pratyantardasha never rendered. The full
  mahadasha table read `m.planet`/`m.lord`/`m.name` — none exist (`planet_name` is real)
  — so every row's planet-name cell was blank. `is_current` doesn't exist in the API
  either; now derived client-side from today's date against each period's start/end.
  Verified live: current dasha correctly shows राहु → चंद्रमा → राहु chain matching a
  direct curl to `/dasha/vimshottari/current`.
- **`yogini-dasha`** — table read `data.cycles`/`yoginis`/`dashas`; real field is
  `periods` — table always empty. Row mapping read `y.lord`/`y.planet` (real:
  `ruling_planet`) and `y.duration_years` (real: `actual_duration_years`), which fell
  back to `idx + 1` — **every row showed a fake sequential duration** ("1 वर्ष, 2 वर्ष...")
  instead of the real value. No "current yogini" field exists in the API at all; now
  derived client-side the same way as vimshottari.
- **`char-dasha`** — table read `data.char_dasha`/`periods`/`dashas`; real field is
  `char_dasha_timeline` — table always empty.
- **`manglik-dosha`** — "Mars house" read `data.mars_house` (doesn't exist), always
  falling back to "1, 4, 7, 8, 12 से बाहर" **regardless of the real placement**; fixed to
  `mars_placements.house_from_lagna`. Cancellation reasons read `exceptions_applied`/
  `cancellations` (real: `cancellation_reasons`) — that section never showed.
- **`pitra-dosha`** — factor list read `data.factors` (real: `reasons`) — never showed
  even when real reasons existed.
- **`dhan-yogas`** — related-planets line read `y.planets_involved` (real: `planets`) —
  never showed.
- **`navamsha-d9`** — the API returns no vargottama flag at all, so `p.is_vargottama`/
  `p.vargottama` were always undefined and the "वर्गोत्तम" badge never appeared even for
  a genuinely vargottama planet. Now fetches the D1 chart alongside D9 (a 3rd parallel
  call) and derives vargottama by comparing D1 vs D9 sign per planet. Verified live:
  चंद्रमा and शनि both correctly flagged वर्गोत्तम for a chart where D1 and D9 signs match.
- **`gemstone-suggestion`** — "वर्जित रत्न" (restricted stones) section read
  `data.restrictions`/`forbidden_gemstones`, neither of which exist; real data is a
  nested `maraka_caution.{maraka_lords, warning}` — section never showed. Stone card
  headers were hardcoded Hindi labels that didn't always match which lordship the field
  actually represents; now use the API's own `type` string per card.
- **`lal-kitab-debts`** — each debt card's title read `d.debt_name`/`d.name` (real:
  `debt`) — every card header was blank.
- **`planetary-positions`** — ayanamsa read `data.ayanamsa_value`/`ayanamsa` (real:
  `ayanamsa_degree`) — never displayed.
- **`choghadiya`** — time column read `c.start`/`c.end` (real: `start_time`/`end_time`)
  — always blank. Separately, the good/neutral/bad tone heuristic checked for `"char"`
  but the API returns `"CHAL"` (different transliteration), so the neutral चल period
  incorrectly rendered red/bad; fixed the substring check.
- **`rudraksha-mapping`, `core-numerology`** — checked against real response shapes,
  no bugs found.

Local dev setup for this pass: `frontend/.env.local` and `.claude/launch.json` had to be
recreated (both gitignored, didn't survive to this checkout) using the same values
documented in the section below. Backend run the same way as before.

### 3. Verified live in the browser (backend + frontend both actually running)
Navbar (all dropdown items), Footer (all columns), zero remaining `/demo?tab=`
navigations (only the 2 intentionally-kept bare links remain, confirmed by grep), the
Hero AI chat widget (real dynamic `prediction_answer` content, not the hardcoded
fallback sentence), and at least one representative page from every group:
Group A — `lagna-kundli`, `moon-sign`, `western-astrology`, `kp-system`, `sade-sati`;
Group B — all 3 matching pages; Group C — `name-correction`; Group D — `daily-panchang`;
Group E — `tarot-reading`, `vastu-shastra`; Group F — `pdf-reports` (both the basic flow
and the matching/varshphal conditional-fields flow, including a full PDF job completing).

**Update:** all 16 of the above were live-tested and fixed in a follow-up pass — see
section 4 below for the full list of bugs found and fixed (several were serious:
always-wrong status flags, permanently-empty tables, blank cells).

### Local dev setup notes (for whoever resumes testing)
- `frontend/.env.local` was created (gitignored) with `ASTRO_BACKEND_URL` and
  `ASTRO_INTERNAL_API_KEY=dev_test_key` so `/api/proxy` can actually reach a
  backend — it didn't exist before, so every page would have 500'd with
  "ASTRO_INTERNAL_API_KEY is not configured" even before reaching the real bugs above.
- Backend was run with `ENVIRONMENT=development NEXT_APP_URL=http://127.0.0.1:59999
  INTERNAL_SECRET_KEY=dev_test_secret` (port 59999 deliberately unreachable so the
  Next.js quota-check call fails fast and falls through to the dev bypass) and an
  `x-api-key` containing `"test"`.
- Port 3000 got taken over mid-session by an unrelated project's dev server
  ("MRP Bot Console") — `.claude/launch.json` now has `"autoPort": true` on the
  `astroengine-frontend` config so it no longer collides; it'll just run on whatever
  port is free.
- `npx tsc --noEmit` — clean (0 errors) after every fix above.
- `git status` still shows only the expected files: the 3 originally-modified files,
  the 2 new `calculators/` folders, plus (now) `Footer.tsx`, `Navbar.tsx`,
  `PanchangWidget.tsx`, `HoroscopeSection.tsx`, `LivePlayground.tsx`, and
  `demo/page.tsx` for the link-rewiring/language work — `backend/app/**` and the
  `(dashboard)`/`(admin)` routes remain untouched.

---

## Context

The public AstroEngine site (the Phase 1-9 redesign already shipped) advertises 24
"instant, no-signup" calculators plus Western/KP/Tarot/Vastu/Reports categories in its
Navbar, Footer, and homepage sections — but every single CTA for them
(`Navbar.tsx`, `Footer.tsx`, `CalculatorsSection.tsx`, `HeroSection.tsx`'s modal CTA,
`PanchangWidget.tsx`, `HoroscopeSection.tsx`) actually deep-links into `/demo?tab=xxx`,
the internal developer test console (raw JSON textboxes, a single shared 50-field
state blob, meant for API evaluation, not a consumer flow). A visitor clicking
"Manglik Dosha Analyser" expecting an instant result lands in a developer tool instead.
This plan replaces every one of those links with a real, focused, dedicated page per
calculator (and 5 new categories that had no calculator-card equivalent at all:
Western, KP, Tarot, Vastu, PDF Reports), while leaving `/demo` itself untouched as the
intentional developer/API-testing surface (its own "Live App Demo" bare links stay).

Separately, while testing, three places were found where the user's language choice
doesn't reach the actual response text — fixed as part of the same pass since the new
calculator pages will inherit whichever pattern is used.

---

## Part 1 — Language-selection fixes (do first, isolated, no dependency on Part 2)

1. **`frontend/src/components/HeroSection.tsx`** — `handleSendAiMessage` (~line 245-246)
   reads `responseData?.response_text || responseData?.summary`, but the backend
   (`backend/app/modules/ai_astrologer/engine.py:147-167`) returns neither field — the
   real field is `prediction_answer`. Result: the Hero chat widget **always** shows the
   same hardcoded Hindi fallback sentence, never the real AI answer, regardless of
   language. Fix: read `responseData?.prediction_answer`. **[DONE]**

2. **`frontend/src/components/LivePlayground.tsx`** — the "Interactive Test Console"
   widget has no language control at all; its 3 JSON templates hardcode
   `lang: "en"` (kundli, line 19; matching, line 58) or `lang: "hi"` (panchang, line 34).
   Fix: add a small हिन्दी/English toggle to the widget (same pattern as
   `HeroSection.tsx`'s toggle) and interpolate the chosen value into whichever
   template's payload is sent in `handleExecute`.

3. **`frontend/src/app/demo/page.tsx`** — `handleDrawTarot` (~line 1036-1046) and
   `handleEvaluateVastu` (~line 1060-1064) build payloads without a `lang` key at all,
   unlike every other handler in this file (`calculateAllData`, `drillIntoAd/Pd/Sd/Pr`,
   `runMatchmaking`, `handleAskAiAstrologer`, `generatePdf` all include
   `lang: profile.lang`). Fix: add `lang: profile.lang || "hi"` to both payloads.

---

## Part 2 — Dedicated calculator pages

### Shared building blocks (build these first, everything else consumes them) — DONE

- **`frontend/src/components/calculators/BirthDataFields.tsx`** — extract the existing
  name/gender/DOB/TOB/city-autocomplete form out of `HeroSection.tsx` (lines ~322-427,
  including the `/api/proxy` → `core/geo/search` autocomplete logic at lines
  109-142) into a standalone controlled component: `value`, `onChange`, and boolean
  props `requireName`, `requireTime`, `requireGender` (default all true) so pages that
  need less (e.g. DOB-only, or date-only) can render a trimmed version. Accepts a
  `personLabel` prop so it can be rendered twice (Groom/Bride) for matching pages.
- **`frontend/src/components/calculators/CalculatorPageShell.tsx`** — page chrome
  reused by all 29 pages: breadcrumb (Home / Calculators / <Title>), header (title +
  1-line description, pulled from the meta registry below), the Phase-1 warm tokens
  (`bg-surface`, `bg-card`, `border-line`, `text-ink`, `text-accent`), a "related
  calculators" strip (2-3 other tools from the same `category`), and a loading/error
  slot around the result area.
- **`frontend/src/components/calculators/ResultRows.tsx`** — tiny presentational
  primitives (label/value row, badge, section heading) so each page's bespoke result
  renderer stays short (most pages: 20-40 lines of JSX over these primitives).
- **`frontend/src/data/calculatorsData.ts`** (edited in place, see correction note
  above) — `tabTarget: string` field replaced with `href: string`
  (`/calculators/<slug>`) across all 24 existing entries, and 5 new entries added
  (western-astrology, kp-system, tarot-reading, vastu-shastra, pdf-reports) in the
  same shape so `CalculatorsSection.tsx` needed only a one-line change
  (`tool.tabTarget` → `tool.href`, `CalculatorsSection.tsx:95`).
- All pages call the backend the same way `HeroSection.tsx` already does today —
  `axios.post("/api/proxy", {endpoint, payload, method})` — this route
  (`frontend/src/app/api/proxy/route.ts`) is already confirmed to work from
  outside `/demo` with no changes needed (no referrer/origin restriction; SVG
  endpoints already get special raw-text handling for `/svg` and `/wheel-svg` paths).

### The 29 pages (`frontend/src/app/calculators/<slug>/page.tsx`)

Grouped by input shape (which determines which `BirthDataFields` config each uses).
Request body for every "birth data" endpoint is the standard
`{dob, tob, lat, lon, tz, lang}` shape unless noted.

**Group A — full birth data (name/gender optional, DOB+TOB+place required) — 17 pages**

| slug | endpoint(s) |
|---|---|
| lagna-kundli | `parashari/chart/d1`, `parashari/chart/svg` |
| navamsha-d9 | `parashari/chart/svg?varga=D9` (+ D9 divisional data) |
| moon-sign | `core/planets/positions` |
| planetary-positions | `core/planets/positions` |
| manglik-dosha | `dosha-matching/manglik` |
| sade-sati | `dosha-matching/sade-sati/status` + `/timeline` |
| kaalsarp-dosha | `dosha-matching/kalsarpa` |
| pitra-dosha | `dosha-matching/pitra-dosha` |
| vimshottari-dasha | `dasha/vimshottari/mahadasha` (9-entry full list) |
| yogini-dasha | `dasha/yogini/complete` |
| char-dasha | `dasha/char/jaimini` |
| gemstone-suggestion | `remedies/gemstones` |
| rudraksha-mapping | `remedies/rudraksha` |
| lal-kitab-debts | `lalkitab/chart/kundli` → render `data.kudrati_debts` (the real chart-evaluated active/inactive list — **not** `lalkitab/debts/rin`, which only returns the static always-6 list with no `is_active`) |
| dhan-yogas | `parashari/yogas/find` |
| western-astrology | `western/big-three` (+ optionally `western/chart/wheel-svg`) |
| kp-system | `kp/planets` + `kp/cusps` |

**Group B — two-person birth data (Groom + Bride, via two `BirthDataFields`) — 3 pages**

| slug | endpoint |
|---|---|
| kundli-matching | `dosha-matching/matchmaking/ashtakoot` |
| nadi-exceptions | `dosha-matching/matchmaking/exceptions` |
| dashakoot-porutham | `dosha-matching/matchmaking/dashakoot` |

**Group C — DOB-only or name-only (no time/place) — 3 pages**

| slug | endpoint | notes |
|---|---|---|
| core-numerology | `numerology/core-numbers` | DOB required, optional name field feeds `name` query param |
| loshu-grid | `numerology/loshu-grid` | DOB only |
| name-correction | `numerology/name-correction` | text input (`current_name` query param) — no DOB field at all |

**Group D — date + place only — 3 pages**

| slug | endpoint |
|---|---|
| daily-panchang | `panchang/daily` |
| choghadiya | `panchang/choghadiya` |
| marriage-muhurat | `panchang/muhurat/marriage` |

**Group E — no birth data (question/options picker) — 2 pages**

| slug | endpoint(s) | input |
|---|---|---|
| tarot-reading | `tarot/daily-card`, `tarot/spread/3-card`, `tarot/spread/celtic-cross` | free-text question + spread-mode picker |
| vastu-shastra | `vastu/evaluate` | property type / facing direction selects + a room list builder (reuse the same room presets `demo/page.tsx`'s `handleApplyVastuPreset` uses) |

**Group F — async job flow — 1 page**

| slug | flow |
|---|---|
| pdf-reports | Port `demo/page.tsx`'s existing `generatePdf`/`pollPdfStatus` orchestration (create job → `GET pdf/status/{job_id}` poll every 3s, up to 60 tries → `window.open("/api/proxy?dl=pdf&job_id=...")` once `COMPLETED`) into the new page, offering the 7 report types (`pdf/kundli/basic`, `/kundli/brihat`, `/matching/report`, `/varshphal/annual`, `/lalkitab/full`, `/dosha/sade-sati`, `/numerology/report`) as a picker — matching-type and varshphal-type need the extra `girl_*`/`target_year` fields respectively. |

### Link rewiring (remove every `/demo?tab=` reference on the public site)

Every file below currently builds a `/demo?tab=<value>` href — update each `href`/
`Link` to point at the matching `/calculators/<slug>` (or the anchors noted below).
The full current inventory (every file/line) was already catalogued this session; the
pattern is identical everywhere (`href={\`/demo?tab=${x}\`}` → `href="/calculators/<slug>"`
or a static import from `calculatorsData.ts`), so it's listed once here rather than
per-line:

- **`frontend/src/components/CalculatorsSection.tsx:95`** — **[DONE]** `tool.tabTarget`
  → `tool.href`.
- **`frontend/src/components/Navbar.tsx`** (`NAV_GROUPS`, lines 25-64) — each
  `{label, href}` pair's `/demo?tab=x` becomes the representative dedicated page for
  that category (e.g. "Kundli & Divisional Charts"→`/calculators/lagna-kundli`,
  "Yogas & Ashtakvarga"→`/calculators/dhan-yogas`, "Western Astrology"→
  `/calculators/western-astrology`, "KP System"→`/calculators/kp-system`, "Lal
  Kitab"→`/calculators/lal-kitab-debts`, "Jaimini & Tajik"→`/calculators/char-dasha`,
  "Dosha Analysis"→`/calculators/manglik-dosha`, "Reports"→`/calculators/pdf-reports`,
  "Numerology"→`/calculators/core-numerology`, "Tarot"→`/calculators/tarot-reading`,
  "Vastu"→`/calculators/vastu-shastra`, "Remedies"→`/calculators/gemstone-suggestion`).
  "Chat" → `/#ai-chat` (anchor to the Hero AI widget, already on the homepage — add
  an `id="ai-chat"` to that section). "Daily Panchang"→`/calculators/daily-panchang`,
  "Today's Horoscope"→`/#horoscope` (anchor to the existing `HoroscopeSection`, already
  has `id="horoscope"`). The InfoTicker's "Full Panchang →" and the bare "Live App
  Demo" link are **not changed** (kept as-is per explicit decision).
- **`frontend/src/components/Footer.tsx`** — same treatment; most entries already map
  1:1 to a single tool (e.g. each of the 4 dosha links, each of the 3 numerology
  links) so those become direct `/calculators/<slug>` links; the bare "लाइव वैदिक ऐप
  डेमो" link is kept as-is.
- **`frontend/src/components/HeroSection.tsx:660`** — modal CTA → `/calculators/lagna-kundli`.
- **`frontend/src/components/PanchangWidget.tsx:228,363`** → `/calculators/daily-panchang`.
- **`frontend/src/components/HoroscopeSection.tsx:216,317`** — Horoscope has no
  calculator-card equivalent (it's already a full homepage section, per the earlier
  decision to anchor- rather than page-link it). Since the user is already on/in that
  section when they'd see these two CTAs, and the per-rashi modal already shows the
  full reading, both `/demo?tab=horoscope` links are simply removed (drop the CTA
  buttons; the bottom one at line 216 and the in-modal one at line 317) rather than
  pointed at a redundant self-reference.

---

## Verification

1. `cd frontend && npx tsc --noEmit` after each batch of new pages — must stay clean
   (matches how every fix this session was checked).
2. Start the backend locally the same way already validated this session
   (`ENVIRONMENT=development NEXT_APP_URL=http://127.0.0.1:59999
   INTERNAL_SECRET_KEY=dev_test_secret python -m uvicorn app.main:app --port 8000`,
   then call with an `x-api-key` containing `"test"` to hit the dev bypass) plus the
   frontend dev server, then in the Browser pane:
   - Click through Navbar (every dropdown item), Footer (every column), the 24
     `CalculatorsSection` cards, Hero's modal CTA, and Panchang's CTA — confirm **zero**
     remaining `/demo?tab=` navigations (grep the built output too:
     `grep -rn "demo?tab=" frontend/src` should only show the two intentionally-kept
     bare `/demo` links, if even that pattern matches them at all).
   - For a representative page from each of the 6 groups (A-F), submit the form and
     confirm a real, non-fallback result renders (same technique used earlier this
     session: cross-check the rendered value against a direct `curl` to the backend
     endpoint with the same inputs).
   - Toggle Hindi/English on `LivePlayground` and on 2-3 new calculator pages, confirm
     the response text actually changes language (not just the UI chrome).
   - Ask the Hero AI chat widget a question in Hindi and in English, confirm the reply
     is no longer the static fallback sentence.
3. Confirm `(dashboard)`, `(admin)`, and all `backend/app/**` files remain untouched
   (per the original redesign's scope boundary) — only `frontend/src/app/calculators/**`
   (new), `frontend/src/components/calculators/**` (new), the edits to
   `frontend/src/data/calculatorsData.ts`, and the link-rewiring edits to the files
   listed above should show in `git status`.
