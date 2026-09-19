# AstroEngine — GitHub Repo Review (vs `TECHNICAL_SPECIFICATION.md`)

| | |
|---|---|
| Repo | https://github.com/Vikram662/AstroEngine (public) |
| Commit reviewed | `ad5a23e` — "securiy=ty bug fix", branch `main` |
| Review date | 2026-09-19 |
| Method | **Pass 1:** full clone → code read → probe of all 117 routes → differential test → independent accuracy checks vs raw `pyswisseph` → git-history secret scan. **Pass 2 (baaki calculators):** har router + calculator ka source padha, phir ad-hoc numerical checks (KP 249-table, Kaal Sarp, running dasha, Panchang/Panchak, geo, validation) — Appendix B. **Pass 3 (bache hue files):** Next.js ke saare 25 API routes, Prisma schema + seeds, PDF engine/template, locales, saare tests, guides/docs padhe; checks ab **scripts 14–17** me saved (auth map, security patterns, `lang` traversal / ephemeris, docs / tests / hygiene, `npm audit`) — Appendix B, D, E. **Blocked:** `frontend/src/lib` repo me nahi (C5), isliye session/authGuard/apiKey/ssrf/email ka code audit hi nahi ho sakta |
| Repo modified? | **Nahi.** Sab checks ek local scratch clone par hue. |
| Ye doc kis liye | Requirements/fix-list. Code dusre system par likha jata hai, isliye har finding ke saath file:line aur "done kab maane" (acceptance) diya hai. |

---

## 1. Verdict

Foundation achchi hai (core astronomy exact, auth/billing ka design sahi direction me), lekin **repo ke docs jo claim karte hain (117 live endpoints, 38/38 tests, PDF engine, rate limiting, recurring billing) wo code me nahi hai.** Sabse bada risk: **customers ko fake ya galat astrology result jana** (45 fabricated endpoints, galat Ashtakoot/Varga/KP horary, galat city coordinates/timezone). Pass 2 ke baad poori tasveer: **112 POST endpoints me se sirf 18 clean, 39 real par defective, 45 fabricated, 2 legit catalog, 8 PDF (simulated)** — per-endpoint table Appendix C me.

> §8 ki fix list zaroori hai par **production-ready ke liye kaafi nahi** — uske liye §9 ke Production Readiness Gates (G0–G7) pass hone chahiye.

> **Pass 3 (Next.js + baaki files) ke baad sabse urgent:** (1) `POST /api/plans` par **koi auth nahi** — anonymous user prices / quotas / module permissions badal sakta hai (S14); (2) wallet recharge ka verification ek **public placeholder secret** par tika hai jo DB me env se pehle aata hai, aur order Razorpay ka hai hi nahi → free credit (S15); (3) invoice page me **stored XSS** jo admin par chal sakta hai (S16); (4) `GET /api/user/me` **password hash** browser ko bhejta hai (S17). Ye 4 fix hone tak recharge/plan/invoice flows public traffic ke liye band rakho. Auth ka core (`src/lib`) repo me nahi hai — uska review baaki (C5).

| Area | Status | Short reason |
|---|---|---|
| Core astronomy (planets, Asc, Panchang, Vimshottari, D9) | ✅ | Raw pyswisseph se exact match |
| 117 routes exist | ✅ | OpenAPI me hain (112 POST + 5 GET) |
| Endpoint outputs are real | ❌ | **45** POST endpoints fabricated/hardcoded (per-endpoint verified, C1), 39 real par defective (C3/C6), sirf 18 clean |
| Ashtakoot Guna Milan | ❌ | 7/8 kootas non-classical |
| Divisional charts (16 vargas) | ❌ | Sirf 4/16 sahi (D1, D9, D12, D60) |
| KP horary, Kaal Sarp type, running dasha (birth MD), Panchak/Bhadra/Hora | ❌ | Verified galat (C6) |
| Geo (city search + timezone) | ❌ | Unknown city → Delhi coordinates; DST hamesha False (C7) |
| Input validation | ⚠️ | Invalid dob → HTTP 500; `tob` 25:99 aur `tz` 99 accept (S13) |
| PDF engine | ❌ | Simulated — koi PDF nahi banta |
| Rate limiting | ❌ | Sirf docs me, code me nahi |
| Recurring billing / expiry / usage reset | ❌ | Nahi hai |
| Clean-clone build (frontend) | ❌ | `lib/` gitignored → `src/lib` repo me nahi |
| API-key auth design | ⚠️ | SHA-256 lookup sahi; dev backdoor + hardcoded fallback key |
| Payments (Razorpay) | ❌ | HMAC timing-safe par secret public placeholder ho sakta hai (DB > env), order Razorpay ka nahi, webhook nahi, non-prod bypass, non-atomic wallet (S3, S4, S15, S26) |
| Next.js API authorization (25 routes) | ❌ | 1 write endpoint bina auth (`POST /api/plans`, S14); baaki me guards + IDOR checks sahi; playground public by design (S21) |
| Data exposure / XSS (Next.js) | ❌ | `user/me` password hash bhejta hai (S17); invoice HTML unescaped → stored XSS (S16); secrets admin UI ko plaintext (S18) |
| Team / sandbox key / IP allowlist / auto-recharge / PII retention | ❌ | Sirf schema me (0 code usage) ya inert (B5, B6) |
| Tests / CI / deps | ⚠️ | 39 tests, ~11 me value assert; frontend tests, CI, Docker, migrations nahi; deps unpinned (S27, Appendix E); `npm audit` = 0 vulns |
| Tests | ⚠️ | 117-endpoint test sirf "route exist karta hai" prove karta hai |
| Docs accuracy | ❌ | Multiple false / inconsistent claims |

---

## 2. Verified working (evidence ke saath)

- **Planet longitudes + Ascendant**: `calculate_planetary_positions` vs raw `swe.calc_ut` (Lahiri, `FLG_SWIEPH|SIDEREAL|SPEED`, `MEAN_NODE`) — Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu, Asc sab par **diff 0.0000°** (test birth: 1995-10-05 14:30, Udaipur, JD 2449995.875, ayanamsa 23.7978).
- **Panchang**: tithi 12 (Shukla Dwadashi), nakshatra 24 (Shatabhisha), yoga 9 (Shula), vaar Thursday — sab independent formula se match.
- **Vimshottari**: birth lord RAHU, balance 17.532 yrs, first MD end 2013-04-16 — reference calc se match; next MD JUPITER 2013-04-16 → 2029-04-16.
- **D1, D9 (Navamsha), D12, D60**: classical rule se 39/39 placements match, aur exhaustive sweep me boundary points samet 100% (`05_varga_check.py` sections A, B). D9 ke liye `compute_d9_navamsha_sign` ka fire/earth/air/water start rule sahi. (Par d12 / d60 routes par `lang` param ignore hota hai — C3.)
- **Routes**: 117 paths OpenAPI me; `/health`, `/ready` hain; CORS env se (wildcard nahi).
- **API key**: raw key DB me nahi, SHA-256 hash se lookup (`internal/verify-key/route.ts`); Next side `ASTRO_INTERNAL_SECRET` unset ho to fail-fast.
- **Razorpay**: `crypto.timingSafeEqual` se HMAC-SHA256 (`order|payment`) verify (`billing/recharge/route.ts`).
- **Secrets**: git history scan me koi real secret commit nahi mila (par hardcoded fallback key — S1 dekho).
- **Admin/User panels**: Next.js routes broadly spec ke §8 se match karte hain.

**Pass 2 me bhi sahi nikla (source + numerical check):**
- **KP core**: `get_kp_sub_lord` reference 249-table se **0 mismatches / 20,000 random longitudes**; KP ayanamsa (Krishnamurti) aur Placidus cusps sahi. (Sirf horary numbering galat hai — C6.1.)
- **Vimshottari sub-periods** (`antardasha` / `pratyantar` / `sookshma` / `prana` calculators): formula (MD×AD/120, …/120², …) aur sequence sahi. (Birth-MD par running-tree galat hai — C6.3.)
- **Panchang**: Karana mapping (Kintughna, 7 repeating, 3 fixed), 27 Yoga names, Choghadiya day patterns (7 weekdays), Rahu Kaal / Yamaghanda / Gulika part-tables, Brahma Muhurat window — sab standard tables se match.
- **Jaimini Chara Karakas**: 7-karaka order independent sort se match (Saturn, Mars, Sun, Jupiter, Mercury, Moon, Venus @ 1995-10-05 14:30).
- **Western**: tropical Sun/Moon longitude raw swisseph se exact; Big Three (Sun Libra 11.65°, Moon Pisces 0.81°, Asc Aquarius 0.47° tropical); 12 bodies (Uranus/Neptune/Pluto included); aspect orbs reasonable.
- **Numerology core**: Chaldean map standard; `1995-10-05` → Mulank 5, Bhagyank 3; "Rahul" → 8; Lo Shu grid layout consistent.
- **Remedies catalogs**: planetary mantra japa counts (7000/11000/10000/9000/19000/16000/23000/18000/17000) commonly cited Kali-yuga values se match (Sanskrit text ka proofreading nahi kiya).

**Pass 3 me bhi sahi nikla (Next.js, PDF, i18n, tooling):**
- **Authorization pattern:** admin routes (5) sab `requireAdminSession()` ke andar, user routes `getVerifiedSession()`; IDOR checks sahi — invoice (owner ya admin), support reply (owner ya admin), team delete (`ownerId`), pdf jobs (`userId`). Register par role hamesha `USER` (mass-assignment nahi); `PATCH /api/user/me` sirf whitelisted fields leta hai (role / wallet nahi badal sakta).
- **Payment settlement pattern:** `$transaction` + `updateMany({status:"PENDING"})` conditional (double-credit se bachata hai), server-side pending order se amount bind, `timingSafeEqual` — pattern sahi hai, secret / order-source ka masla alag hai (S15).
- **Session cookies** httpOnly + SameSite=Lax + secure(prod); UI me `dangerouslySetInnerHTML` / `localStorage` nahi; API routes me `console.log` nahi; `.env*` gitignored; `postman_collection.json` me sirf placeholder key.
- **`npm audit`** (package-lock, 2026-09-19): 0 known vulnerabilities (info / low / moderate / high / critical sab 0).
- **Prisma indexes** hot queries par (`ApiRequestLog[userId, createdAt]`, `Transaction[userId, status]`, `SupportTicket[userId, status]` …).
- **Jinja2 `autoescape=True`** (PDF HTML injection band); **locales**: 6 languages × (12 planets, 12 signs, 27 nakshatras) complete, IDs code se match, koi untranslated entry nahi.
- **Webhook signing** (`x-astroengine-signature` HMAC-SHA256) aur account-webhook SSRF check *save-time par* — design sahi direction me (gaps S23).

> Caveat: accuracy check *same library* (pyswisseph) se hai — ye prove karta hai ki wrapper sahi hai; astrological convention (ayanamsa/house system choice) spec ka decision hai.

---

## 3. Critical findings — wrong / fake output

### C1. 45 POST endpoints fabricated hain (hardcoded / synthetic output) — per-endpoint verified
**Pass 1** me differential test (2 alag births: Udaipur 1995-10-05 14:30 vs Mumbai 1970-03-21 06:10; matchmaking ke liye 2 couples) ne 60 differ / 45 identical / 7 non-200 diya. **Pass 2 me har router ka source padha** — ye test sirf ek *heuristic* nikla aur dono taraf galat tha:

- **45 flagged me se 36 sach me static** hain. **9 false positive:** 4 Dasha sub-period expanders (`antardasha` / `pratyantar` / `sookshma` / `prana` — real formulas, design se birth-independent; parent `planet` / `start_date` query params lete hain, `req` body unused), 2 legit catalogs (`remedies/mantras`, `lalkitab/remedies/planet-wise`), aur 3 test-data coincidence (`remedies/rudraksha` — dono test births ka Lagna lord Saturn tha; `numerology/forecast` — dono ka personal year 7; `numerology/name-analysis` — `name` query param tha, vary nahi kiya).
- **9 fabricated endpoints test se chhoot gaye** kyunki wo input ki date/name ko echo karte hain (isliye "input-dependent" dikhe): `panchang/monthly-calendar`, `panchang/muhurat/marriage`, `panchang/muhurat/griha-pravesh`, `panchang/muhurat/property-vehicle`, `dasha/char/jaimini`, `lalkitab/varshphal/chart`, `advanced/jaimini/karakamsha`, `advanced/tajik/varshphal-chart`, `advanced/tajik/muntha`.
- Final (104 non-PDF POST): **18 clean · 39 real par defective (C3/C6/C7) · 45 fabricated · 2 legit catalog.** (+8 PDF: C4.) Endpoint-wise table: **Appendix C**.

**Sabse risky fabricated content** (users isse decision le sakte hain) — sab ad-hoc API calls se confirm:

| Endpoint | Kya return karta hai (kisi bhi input par) |
|---|---|
| `panchang/monthly-calendar` | Purnima **`2026-02-30`** (Feb 2026 me nahi hoti); Amavasya har mahine 15 ko, Ekadashi 11/26 ko |
| `panchang/muhurat/marriage` | Har date par "Vrishabha 19:30–23:45, score 92", `guru_asta: false`, `shukra_asta: false` |
| `dosha-matching/matchmaking/exceptions` | Har couple par `nadi_cancellation: true`, `bhakoot_cancellation: true` |
| `dosha-matching/guru-chandal`, `pitra-dosha` | Hamesha "koi dosha nahi" |
| `dosha-matching/sade-sati/timeline` | Sab ke liye fixed dates 2002–2009 aur 2032–2034 |
| `kp/event-analysis` (LITIGATION) | "Clear victory in legal dispute indicated." — chart use hi nahi hota |
| `parashari/chart/bhav-chalit` | Har planet house 1 me (`house` key exist hi nahi karti) |
| `remedies/gemstones/restrictions` | Sab ko "Diamond prohibited (Venus 6th & 11th lord)" |
| `dasha/char/jaimini` | Sirf 2 periods (Aries 9y, Taurus 8y), start = dob |
| `parashari/yogas/find`, `shadbala/details`, `sade-sati/status`, `matchmaking/dashakoot` | 3 fixed yogas / literal rupas / literal dict / hamesha score 8.5 (Pass 1 me source padha) |

**Fix:** har fabricated endpoint ko real implement karo, ya turant `501 Not Implemented` (+ docs/marketing se hatao). **Stopgap (P0 quick win):** sab 45 par abhi 501 lagao — fake prediction dene se error dena kam nuksan karta hai.
**Done kab:** har endpoint ya to golden tests (reference software se) ke saath real, ya 501 (`10_fabricated_endpoints_probe.py --require-501` PASS). Note: `02_differential_test.py` fake-but-input-dependent endpoints nahi pakad sakta (upar ke 9) — isliye G2 ke per-endpoint golden tests hi asli gate hain; `10_...probe.py` unme se sabse risky 13 ke behaviour probes deta hai.

### C2. Ashtakoot Guna Milan classical nahi hai
File: `backend/app/modules/dosha_matching/calculator.py:165-242`

| Koota | Code | Status |
|---|---|---|
| Varna | Sign-based rank, groom ≥ bride | ✅ classical |
| Vashya | `abs(g_sign - b_sign)` | ❌ invented (classical: Vashya groups) |
| Tara | `abs(b_nak-g_nak) % 9 in [1,2,4,6,8]` | ❌ ek direction, remainder 0 ko galat bucket, 0 pts case nahi |
| Yoni | `abs(g_nak-b_nak) % 14` | ❌ invented (classical: 14 yoni animals + matrix) |
| Graha Maitri | sign diff 0/4/8 | ❌ invented (classical: sign-lord friendship table) |
| Gana | `nak % 3` | ❌ **15/27** nakshatras galat |
| Bhakoot | dosha iff dist ∈ {2,6,8,12} | ❌ 5-9 miss (Aries groom × Leo bride → dosha False, classical True) |
| Nadi | `nak % 3` | ❌ **8/27** nakshatras galat |

Concrete failures (Nadi verdict): Ashwini×Rohini → theirs dosha=True, classical False; Ashwini×Shatabhisha → theirs False, classical True (dono Aadi); Shatabhisha×Hasta → theirs False, classical True (dono Aadi).
Galat Gana: Rohini, Mrigashira, Ardra, Pushya, Magha, U.Phalguni, Chitra, Swati, Vishakha, Anuradha, Moola, U.Ashadha, Dhanishta, P.Bhadrapada, Revati.

Pair-level (API ko sach me call karke, `04_ashtakoot_vimshottari_check.py`): **Nadi 160/729** nakshatra pairs galat verdict, **Gana 242/729** (sirf unambiguous cases: same-gana = 6 pts, Deva↔Rakshasa ≠ 5/6 pts), **Bhakoot 24/144** sign pairs galat (missed distances: 5 aur 9). Vimshottari isi script me PASS (first MD RAHU → 2013-04-16).

**Fix:** classical lookup tables (Appendix A). **Done kab:** 27×27 nakshatra pairs par reference tables ke saath 100% match + 5–10 known kundli-pair golden tests.

### C3. Divisional charts (Varga) — 12/16 galat
File: `backend/app/modules/parashari/calculator.py:58-126`. Sirf D1 aur D9 special-cased hain; baaki sab ek generic `(sign + part) % 12` formula se bante hain.

3 births × (Ascendant + 12 bodies: 9 grahas + Uranus, Neptune, Pluto) = 39 placements/varga, classical rule se compare:

| Varga | Match | | Varga | Match |
|---|---|---|---|---|
| D2 | 2/39 | | D24 | 4/39 |
| D3 | 15/39 | | D27 | 9/39 |
| D4 | 14/39 | | D40 | 3/39 |
| D7 | 21/39 | | D45 | 10/39 |
| D10 | 21/39 | | D60 | **39/39** |
| D12 | **39/39** | | D16 | 10/39 |
| D20 | 3/39 | | D30 | 1/39* |

D1 aur D9 bhi **39/39** (sahi). Total: 4/16 vargas sahi (D1, D9, D12, D60), 12/16 galat.
\*D30 (Trimshamsha, unequal divisions) generic formula se ban hi nahi sakta → galat by construction; reference standard BPHS mapping hai (Appendix A6), apne reference software se cross-check karo.
Partial matches (D3/D7/D10) coincidence hain.

**Exhaustive sweep (`05_varga_check.py` section B):** swisseph ko script ke process me fake longitudes se replace karke **har sign × har varga-segment (start+ε, mid, end−ε)** test kiya — natural births ke coverage gap (3 births me 11/12 signs) ke bina. Nateeja wahi 12 vargas galat (D2 13/78, D3 39/117, D4 36/156, D7 138/273, D10 192/390, D16 156/624, D20 65/780, D24 156/936, D27 176/1053, D30 18/273, D40 130/1560, D45 441/1755); **D1, D9, D12, D60 boundary points (±1e-6) samet 100% sahi.** House / `houses` overview (1728 facts) internally consistent — `house` field sahi hai.

**Extra bugs (Pass 2 ke script se runtime confirm):**
- **`ayanamsa` ignore** — function me `swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)` hardcoded (line 76) **aur** router `req.ayanamsa` function ko pass hi nahi karta. Verified: RAMAN aur LAHIRI dono ka Ascendant 276.6729 (function aur API dono par; `/d1`, `/d9`, `/divisional/D10`); 24 births × 12 bodies me se 0 planet sign badla. Sirf calculator theek karne se API theek nahi hogi.
- **`lang` ignore, 30 / 32 routes par** — `parashari/router.py` me `compute_varga_chart(req.dob, req.tob, req.lat, req.lon, req.tz, "D2", req.lang)` positional call hai; function signature `(dob, tob, lat, lon, tz, varga, ayanamsa, lang)` hai, isliye `lang` `ayanamsa` ke slot me chala jata hai aur names hamesha English aate hain (`lang=hi` par bhi). Sirf `/d1` aur `/d9` (keyword call) sahi hain; d12 / d60 samet baaki 14 individual routes + saare 16 `divisional/{varga}` prabhavit (runtime); `moon-lagna` bhi same positional call use karta hai (code reading).
- **Unknown varga silently chalta hai** — `VARGA_FACTORS.get(varga, 1)`; `divisional/D99`, `D5`, `D6`, `D8`, `D11`, `D0`, `X1` (aur `chart/svg?varga=…`) sab **HTTP 200** dete hain (D1-jaisa chart, varga label ke saath), jabki docs "D2 to D60" kehte hain. Rahu/Ketu logic `rahu_deg` par depend karta hai (RAHU list me KETU se pehle hona zaroori) — fragile.
- Route mapping theek hai: 16 individual + 16 divisional + 16 svg routes sahi varga dete hain aur function se same signs.

**Fix:** Appendix A ke rules; router me keyword args (`lang=`, `ayanamsa=`); unknown varga par 422. **Done kab:** `05_varga_check.py` ke saare sections (A–E) PASS.

### C4. PDF engine asli nahi hai
File: `backend/app/pdf_engine/generator.py`

- `:67` `await asyncio.sleep(0.5)  # Simulate render & R2 upload time`
- `:70` `download_url = f"https://cdn.astroengine.io/reports/{job_id}.pdf"` — banawati URL, koi file upload nahi hoti.
- `:79` webhook branch `pass`.
- `:84` failure par `PDF_JOBS[job_id]["refunded"] = True` — actual refund/wallet credit nahi hota.
- `PDF_JOBS` in-memory dict → restart par saare jobs gayab; multi-worker me kaam nahi karega.
- `requirements.txt` me **weasyprint / boto3 hain hi nahi** (docs me WeasyPrint + R2 ka claim hai).
- `pdf_engine/router.py`: `matching/report`, `varshphal/annual`, `lalkitab/full`, `dosha/sade-sati`, `numerology/report` kaam schedule hi nahi karte (sirf response return).
- `GET /status/{job_id}` par ownership check nahi — koi bhi job id guess karke status dekh sakta hai.
- `schemas/pdf.py`: `BrandingConfig.logo_url` / `primary_color` unvalidated (jab real render aayega to SSRF / HTML-CSS injection).

**Fix:** jobs DB me (Prisma `PdfJob`), real render (WeasyPrint) + object storage (R2/S3), signed URL, real refund transaction, per-user ownership check, branding validation (https + allowlist, color regex).

### C5. `frontend/src/lib` repo me hai hi nahi
Root `.gitignore:30` me `lib/` (Python template line) → `frontend/src/lib/**` (`webSession`, `prisma`, …) commit nahi hua. `frontend/src/middleware.ts` `@/lib/webSession` import karta hai → **fresh clone build nahi hoga.**
**Fix:** `.gitignore` me `lib/` ko `/backend/lib/` jaisa scoped karo (ya `!frontend/src/lib/`) aur `frontend/src/lib` commit karo. **Done kab:** fresh clone + `npm ci && npm run build` pass.

### C6. Real endpoints me verified defects (39 endpoints, C3 ke saath) — Pass 2
Ye endpoints asli calculation karte hain par neeche ke defect / simplification verify hue. "Verified" = API/function call se confirm (ab scripts me: C6.1 → `06`, C6.2 → `07`, C6.3 → `08`, C6.4–C6.7 → `09`, baaki probes → `10`, regression → `13`; C7 → `11`); "code reading" = source se, runtime confirm nahi.

| ID | Area | Finding | Evidence | Fix |
|---|---|---|---|---|
| C6.1 | **KP horary 1–249** | `approx_asc_deg = (n-1)/249*360` — equal division. Asli 249 sub-divisions **unequal** hain (Vimshottari-proportional, sign boundary par split) | `kp/calculator.py:158`. Reference 249-table (27 nakshatra × 9 sub, 30° par split = 249 ✓) se: **137/249** numbers ka (sign, star, sub) lord galat, sub-lord **131/249** galat, start-degree error **2.26°** tak (e.g. #3 true 3.000° Sun-sub; API 2.892° Venus-sub). `1-2193` endpoint bhi fake (C1) | 249-table (aur 2193 sub-sub) precompute karo; number → start degree lookup |
| C6.2 | **Kaal Sarp type** | 12 types Rahu ki **house (Lagna se)** se hote hain; code Rahu ki **sign** se deta hai, aur function me lat/lon hai hi nahi | `dosha_matching/calculator.py:154-155`. 1995-11-04, Rahu 181.69°: Delhi Lagna se 06:00 par Rahu 1st house (classical *Anant*), 18:00 par 7th (*Takshak*) — API dono me **Takshak**; 12 time slots me se **11 mismatch**. Dosha *detection* (saare 7 grah Rahu–Ketu ke beech) sahi hai | Lagna compute karo, type = Rahu ka house |
| C6.3 | **Running dasha (birth Mahadasha)** | Birth MD partial hota hai; AD/PD sequence MD ke *notional start* (MD end − poore saal) se chalni chahiye, code birth date se poora sequence chalata hai | `dasha/calculator.py:305-379`, `calculate_antardashas`. Birth 1995-10-05 (RAHU MD, 17.532y balance): 1998-01-01 ko API **RAHU>RAHU**, sahi **RAHU>JUPITER**; birth-MD ke AD list ka end **2013-10-04**, MD end **2013-04-16** (171 din overshoot); birth MD me har 45 din par 141 sampled dates me se **30 par AD galat**. Bache/jawan (birth MD me chal rahe) users prabhavit | Birth MD ke liye full sequence notional start se banao, phir birth se pehle ka hissa kaato |
| C6.4 | **Vaar (weekday)** | Civil weekday use hota hai; Vedic din sunrise par badalta hai | `panchang/calculator.py:119-121`. Delhi 2026-09-19 sunrise 06:09:08; birth 03:00 → API **SATURDAY**, Vedic **FRIDAY** | Sunrise-based vaar |
| C6.5 | **Panchak** | (a) ID typo: list me `"DHANISHTA"` vs data me `"DHANISHTHA"` → Dhanishta kabhi match nahi hota; (b) poora nakshatra li jati hai (Panchak Moon Kumbha me = Dhanishta pada 3–4 se); (c) type sirf Rog (Sun) / Agni (Tue) — Raj / Chor / Mrityu missing, aur type Panchak *shuru hone wale din* se hona chahiye | `panchang/calculator.py:314` vs `core/swisseph.py:77`. Verified: 2026-09-23 22:00 (pada 3) aur 09-24 06:00 (pada 4) → API `is_active: false`, classical **true** | ID fix + pada-based check + full type map |
| C6.6 | **Bhadra loka** | Loka Paksha se decide hota hai; muhurta texts me Moon ki sign se (Karka/Simha/Kumbha/Meena = Bhu/Mrityu loka, Mesha/Vrishabha/Mithuna/Vrischika = Swarga, Kanya/Tula/Dhanu/Makara = Patala) | `panchang/calculator.py:311` (code reading) | Moon-sign based |
| C6.7 | **Hora / Choghadiya / Abhijit / Sunrise** | Hora: 24 equal 1-hour slots — traditional day horas = (sunset−sunrise)/12, night alag. Choghadiya: docstring "8 Day + 8 Night", sirf **day** return hota hai. Abhijit fixed ±24 min (traditional = day/15). Sunrise `BIT_DISC_CENTER` — upper-limb convention se **73 s** late (Delhi 2026-09-19). `panchang/daily` me tithi/nakshatra/yoga/karana **end time** nahi | `panchang/calculator.py:168-301`, `core_astronomy/advanced_astronomy.py:160` | Temporal-hour horas, night choghadiya, end-times; sunrise convention spec me decide karo |
| C6.8 | **Manglik** | Docstring/router "20+ classical cancellation checks", code me **5** checks; own-sign cancellation house-specific nahi; Jupiter sirf conjunction/7th (sign diff 0/6) — 5th/9th aspect nahi; Venus-based Manglik aur 2nd house ko dosha maana gaya (conventions) | `dosha_matching/calculator.py:12-104` (code reading) | Rules spec me likho (house-wise exceptions), claim sudhaaro |
| C6.9 | **Lal Kitab** | `kudrati_debts` = 6 debts ki **constant list, sab ke liye** (dono test births me 6/6); `debts/rin` `ancestral_debts` key padhta hai jo exist nahi karti → hamesha `[]`; sleeping house = koi bhi khaali house (LK me drishti bhi dekhte hain); `blind-halfblind` flags constant; `varshphal` stub (`age//35`, constant advice, Saala Grah table nahi) | `lalkitab/calculator.py:6-13, 67-90`, `lalkitab/router.py:42-50, 52-69` | Debts chart-based evaluate karo; key mismatch fix; varshphal table |
| C6.10 | **Charts** | `moon-lagna`: houses Lagna se hi rehte hain — "Chandra Kundli" me Moon **house 2** aaya (1 hona chahiye). `chart/svg` sirf North Indian (param unused). `houses/cusps` router me `"PLACIDUS"` hardcoded → Sripati / Equal / Whole-sign unreachable; `SRIPATI` → swisseph `'O'` = Porphyry; unknown house-system/ayanamsa silent fallback par response requested naam echo karta hai | `parashari/router.py:169-183`, `core/router.py:49`, `advanced_astronomy.py:13-35` | Houses re-base, house_system request field, 422 for unknown |
| C6.11 | **Remedies** | `rudraksha`: Lagna lord ka *localized* naam padhta hai → `lang=hi` par match fail, sirf `['10 Mukhi','5 Mukhi']` (English: Saturn Lagna → 7/10/5 Mukhi). Gemstone rule simple (Lagna/5th/9th lord; strength / functional benefic–malefic nahi) — high-value advice hai, disclaimer + expert review | `remedies/router.py:45`, `remedies/calculator.py:47-114` | Planet **id** use karo, translate sirf display ke liye |
| C6.12 | **Numerology** | `name-analysis`: `chaldean_number` ek **object** (`{number, ruler, calculated_from}`) jabki `pythagorean_number` hardcoded `6` — inconsistent types + fake value; `favorable`: sirf lucky dates Mulank se, colors/days/"avoid 8" sab ke liye constant; Chaldean compound (10–52) turant single digit me reduce; `missing-numbers` remedies generic template | `numerology/router.py:51-68, 128-148` | Pythagorean real, compound numbers rakho |
| C6.13 | **Western wheel** | `chart/wheel-svg` decorative — Ascendant, houses, sign labels, aspect lines nahi | `western/calculator.py:135-169` | Full wheel ya endpoint hatao |

### C7. Geo endpoints galat — 🔴 High (har chart ka input yahin se aata hai)
- **`GET /api/v1/core/geo/search`** (`core/router.py:116-144`): sirf **10 hardcoded cities**; unknown query par **New Delhi ke coordinates (28.6139, 77.2090, tz 5.5) `country: "Unknown"` ke saath** return hote hain. Verified: "Udaipur" aur "Kathmandu" dono Delhi aaye. Client autocomplete par bharosa kare to Lagna/Panchang sab galat.
- **`GET /api/v1/core/geo/timezone`** (`core/router.py:146-168`): `tz = round(lon/15*2)/2`, India-box (68–97°E, 8–37°N) me hamesha 5.5; `dst_active` hamesha `false`; naam "UTC+8.0" jaisa (sirf 5.5 par `Asia/Kolkata`). Verified (`11_geo_check.py`, expected offsets `pytz` se): Kathmandu → **5.5** (asli 5.75, aur "Asia/Kolkata" bataya), Kabul → **5.5** (asli 4.5 — India-box me aa jata hai), New York Sept → **−5.0** (EDT −4), London Jul → **0** (BST +1), Sydney Jan → **+10** (+11), Adelaide Jan → **+9** (+10.5), Delhi 1943-06-01 → **5.5** (war-time +6.5); Delhi, Beijing, Colombo, New York Jan sahi. Endpoint date leta hi nahi, isliye DST / historical offsets (jaise India 1942–45) handle ho hi nahi sakte. `timezonefinder` `requirements.txt` me hai par kahin import nahi hota.
- **Fix:** real geocoder (GeoNames dataset / paid API) + IANA timezone (`timezonefinder` + `zoneinfo`/`pytz`) **birth date+time ke saath**; unknown city par 404; clients ko `tz` explicitly bhejne ka option documented rakho. **Done kab:** 50 cities (India + world, DST wale mahine + historical dates) par lat/lon/offset reference se match.

### C8. Backend leftovers — PDF template, i18n, guides (Pass 3)
- **PDF template** (`backend/app/pdf_engine/templates/kundli_report.html`): Jinja2 `autoescape=True` ✓ (HTML injection band), par `branding.primary_color` **CSS context** me bina validation ke `<style>` me jata hai — jab WeasyPrint aayega to CSS injection / `url()` se SSRF / local file read possible. `logo_url` template me hai hi nahi → **Enterprise plan ka "Whitelabel PDF with Custom Logo" feature deliver nahi hota.** "Basic" aur "Brihat" ek hi template (1 page: D1 chart + planet table, sirf title alag) jabki docs 15–20 / 60–100 pages kehte hain. Labels English-only (sirf planet/sign names translate hote hain); Ayanamsa "Lahiri (Chitra Paksha)" hardcoded; hemisphere bug: `{{lat}}° N, {{lon}}° E` (southern/western coordinates "-33.9° N" dikhate hain) aur `UTC +{{tz}}` (negative tz par "UTC +-5.0"). `PDF_JOBS` unbounded (memory leak) aur process-local.
- **i18n / locales**: 6 locales complete (✓ §2), par sirf 3 categories (planets, signs, nakshatras). Tithi / vaar ke naam sirf en+hi (inline `name_hi`); yoga, karana, koota, remedies, PDF text, error messages sab English. `lang` validate nahi (S24).
- **Guides** (rows §6): `INSTALLATION_GUIDE.md` me `NEXT_APP_URL`, `ASTRO_INTERNAL_SECRET`, `ASTRO_BACKEND_URL`, `ASTRO_INTERNAL_API_KEY` aur poora frontend `.env` gayab (FastAPI ↔ Next wiring ke bina 115/117 endpoints 500 — S12); systemd unit `--workers 4` chalata hai jabki `PDF_JOBS` in-memory hai (status polling ~75% 404); sample `INTERNAL_SECRET_KEY=c9f82d1a6e3b5c7f8a9e0d1b2` copy-paste weak secret; Redis / R2 / Sentry setup un features ke liye jo implement nahi hain (`REDIS_*`, `R2_*`, `SENTRY_DSN` config fields defined par unused; `INTERNAL_SECRET_KEY_PREVIOUS` rotation implement nahi).

---

## 4. Security findings

| ID | Severity | Finding | Location | Fix |
|---|---|---|---|---|
| S1 | 🔴 High | Hardcoded fallback master key `ak_live_dev_test_master_key_astro2026` (env unset ho to use hota hai) | `frontend/src/app/api/pdf/queue/route.ts:7`, `.../playground/route.ts:5` | Fallback hatao, env missing ho to error; jo key kabhi live hui ho use rotate |
| S2 | 🔴 High | Dev bypass: `ENVIRONMENT=="development"` par `"test"` wali koi bhi key valid, quota 99999 (`DEV_TEST_BYPASS`); key ke pehle 16 chars `print` hote hain | `backend/app/core/security.py:63, ~125-135` | Bypass hatao (test me `dependency_overrides` use karo); key/prefix kabhi log mat karo |
| S3 | 🔴 High | Payment signature params missing ho aur `NODE_ENV!=="production"` to verification **skip** hota hai (fake local order IDs) — 3 jagah | `billing/recharge/route.ts:121`, `billing/subscribe/route.ts:175`, `user/addons/route.ts:100` | Har env me signature mandatory; dev ke liye Razorpay test-mode keys |
| S4 | 🔴 High | Wallet / quota decrement read-then-write → race (double spend / negative balance) | `billing/subscribe/route.ts` (wallet path), `internal/verify-key/route.ts` | `updateMany({where:{id, walletBalance:{gte:x}}})` ya `SELECT … FOR UPDATE` transaction ke andar |
| S5 | 🟠 Med | FastAPI sirf 3 error codes map karta hai (`PLAN_UPGRADE_REQUIRED`, `QUOTA_AND_CREDITS_EXHAUSTED`, `ACCOUNT_SUSPENDED`); baaki (maintenance 503, forbidden 403 …) **401** ban jate hain | `backend/app/core/security.py:71-100` | Upstream status/code pass-through |
| S6 | 🟠 Med | Module-gating mismatch: FastAPI URL ka `path_parts[2]` bhejta hai (`dosha-matching`, hyphen) jabki `PLAN_MODULES_*` me `dosha_matching` (underscore) → exact-match fail. Code reading se; runtime me Next app nahi chalayi | `backend/app/core/security.py:38-40`, `frontend/src/app/api/admin/seed/route.ts:186`, `.../plans/route.ts:13`, `internal/verify-key/route.ts:83+` | Ek canonical module id (underscore) — dono side normalise karo + test |
| S7 | 🟠 Med | Internal secret: Next `x-internal-secret` ko `!==` se compare karta hai (timing-safe nahi); env names alag (`ASTRO_INTERNAL_SECRET` vs `INTERNAL_SECRET_KEY`, FastAPI default `""`) | `internal/verify-key/route.ts:17-18`, `backend/app/core/config.py` | `timingSafeEqual`; ek hi env name; FastAPI startup par empty secret par fail |
| S8 | 🟠 Med | Razorpay secret DB `SystemSetting` me plaintext (`RAZORPAY_KEY_SECRET`); seed plaintext placeholder secrets daalta hai | `billing/recharge/route.ts` (~108), `admin/seed/route.ts` | Secrets sirf env/secret manager; DB me ho to encrypt |
| S9 | 🟠 Med | Login rate-limiter in-memory (restart par reset, multi-instance me shared nahi) | `api/auth/session/route.ts` | Redis/DB-backed limiter |
| S10 | 🟡 Low | SSRF blocklist me `0.0.0.0/8`, IPv4-mapped IPv6 (`::ffff:0:0/96`), CGNAT `100.64.0.0/10` missing; validate-then-fetch ⇒ DNS-rebinding risk (webhook abhi `pass` hai, isliye latent) | `backend/app/core/ssrf.py:7-14` | `ipaddress.is_global` check; connect ke time resolved IP pin karo |
| S11 | 🟡 Low | `custom_openapi()` blocking `urllib` se Next `/api/plans` call karta hai, cache guard nahi → har `/docs` load event loop block | `backend/app/main.py` | Cache + async httpx + timeout |
| S12 | 🟡 Low | Fresh clone par `NEXT_APP_URL` unset ho to **115/117** endpoints `500` dete hain | `backend/app/core/security.py` | Startup validation; runtime par 503 + clear message |
| S13 | 🟠 Med | Input validation nahi: `dob`/`tob` plain `str`, `tz` unbounded, `ayanamsa` free text. Verified `core/planets/positions` par: `dob="1995-13-45"` aur `"abc"` → **HTTP 500**; `tob="25:99"` → **200** (galat time par silently result); `tz=99` → 200; unknown `ayanamsa="FOO"` → 200 (silent Lahiri fallback) | `backend/app/schemas/common.py:97-103` | Pydantic validators (`date`, `time` regex, `tz` −12…+14, `ayanamsa` `Literal`) → 422. Acceptance: `12_input_validation_check.py` (9/14 abhi FAIL) |
| S14 | 🔴 **Critical** | **`POST /api/plans` par koi authentication nahi.** Koi bhi anonymous user plan ka `priceMonthly`, `includedQuota`, `rateLimitPerMin`, `overageCost`, `features` **aur `PLAN_MODULES_*` (module permissions)** upsert kar sakta hai (jaise STARTER = ₹0 + saare modules). Middleware matcher `/api/*` cover nahi karta, isliye har route ko khud guard karna padta hai; 25 routes me ye ek write endpoint unguarded hai. FastAPI `/docs` bhi isi `/api/plans` se pricing table banata hai (defacement). Code reading — Next app chalayi nahi | `frontend/src/app/api/plans/route.ts:47-105`, `frontend/src/middleware.ts` (matcher) | POST par `requireAdminSession()`, NaN / negative validation, audit log; GET public rakho. Deploy ho chuka ho to plans / prices / `PLAN_MODULES_*` DB me verify karo |
| S15 | 🔴 **Critical** | **Recharge verification ek public placeholder secret par tika hai + order Razorpay ka hai hi nahi.** `verify_and_credit` secret = `DB SystemSetting RAZORPAY_KEY_SECRET` **pehle**, phir env. `admin/seed` (create) aur `admin/settings` GET dono missing row par placeholder `s8e8w9f0a1b2c3d4e5f6g7h8` daalte hain jo public repo me hai — env me real secret ho tab bhi DB wala jeetega. Attack: registered user `create_order` (amount khud chunta hai, koi bhi > 0) → `HMAC_SHA256(placeholder, orderId\|anyPaymentId)` bana kar `verify_and_credit` → **bina paise diye wallet credit** (+10/16/25% bonus). Upar se `create_order` local `order_<random>` banata hai: Razorpay Orders API call nahi, payment capture / amount fetch nahi, **webhook endpoint hi nahi** (25 routes me koi nahi); UI `order_id` isi fake id ke saath Razorpay Checkout kholta hai (real Razorpay me invalid) aur `rzp_test_mock_enterprise_key` fallback rakhta hai → production me legit payment bhi kaam nahi karegi. `subscribe` / `addons` me same scheme. Code reading; chain runtime me run nahi ki | `billing/recharge/route.ts:57-96, 107-111, 195`; `admin/seed/route.ts:80-82`; `admin/settings/route.ts:15-17`; `(dashboard)/billing/page.tsx:167-173` | Secrets sirf env / secret manager (DB se hatao), placeholder kabhi seed mat karo, rotate; server-side Razorpay Orders API, payment fetch (`captured` + amount), `payment.captured` webhook reconcile; amount min/max. **Is fix tak recharge / subscribe / addons-gateway band** |
| S16 | 🔴 High | **Stored XSS — invoice.** `billing/invoice/[id]` HTML me `taxProfile.businessName / address / state / gstin / pan`, `user.name`, `user.email` **bina escape** ke interpolate hote hain. Ye user khud set karta hai (`PATCH /api/user/me` `taxProfile` / `name` unvalidated JSON; register par email format check nahi). Admin billing page har transaction ka `/api/billing/invoice/${tx.id}` link deta hai aur admin kisi ka bhi invoice khol sakta hai → attacker ka script admin session me chalega (same-origin) → `GET /api/admin/settings` (saare secrets), `addCredit`, plan change → user → admin escalation | `billing/invoice/[id]/route.ts:32-37, 244-254`; `user/me/route.ts:108-110`; `(admin)/admin/billing/page.tsx:184` | HTML-escape (ya PDF / template engine), `taxProfile` schema (GSTIN regex, length), CSP header, invoice `Content-Disposition: attachment` |
| S17 | 🔴 High | **Password hash leak.** `GET /api/user/me` `data: { ...user }` return karta hai — `password` (scrypt ya legacy unsalted SHA-256 hash), `apiKeyHash`, `accountWebhookSecret`, `signupIp`, `taxProfile` sab browser ko (XSS / logs / extension se chori → offline cracking). Admin `GET /api/admin/data?type=pdf_jobs\|pdf_queue` bhi `include:{user:true}` se poora user record deta hai | `user/me/route.ts:42-54`; `admin/data/route.ts:88-99` | Explicit `select` / DTO; sensitive fields kabhi response me nahi |
| S18 | 🟠 Med | **Secrets browser tak.** `GET /api/admin/settings` saari `SystemSetting` values (Razorpay secret, webhook secret, R2 secret, SMTP password) plaintext me admin UI ko deta hai aur missing keys ke liye placeholder rows **create** karta hai (GET me side-effect). `POST` / `DELETE` par audit nahi. `GET /api/internal/settings` FastAPI ko **saari** settings (secrets samet) deta hai | `admin/settings/route.ts:5-56, 58-120`; `internal/settings/route.ts:24-33` | Secrets write-only / masked, env / secret manager; internal ke liye key allowlist; audit log |
| S19 | 🟠 Med | **Default admin credentials repo me.** `prisma/seed.ts` aur `seed_users.ts`: `admin@astroengine.io` / `Admin@12345` (role ADMIN, wallet ₹999,999) aur `developer@astroengine.io` / `User@12345`; hash **unsalted SHA-256**; dono seeds ke `update` branch me har run par admin password **default par reset** — production me seed chalane par takeover. (`admin/seed` route behtar: env `ADMIN_INITIAL_PASSWORD` ya random `Admin@<8 hex>`, password update nahi karta.) Dono seeds me STARTER `priceMonthly: 0` (§7) | `frontend/prisma/seed.ts:14-22, 67`; `seed_users.ts:6-21`; `admin/seed/route.ts:35` | Default creds hatao, random one-time password + forced change, update branch me password mat badlo, prod me seed block |
| S20 | 🟠 Med | **Auth hardening.** (a) register par rate-limit nahi (limiter sirf failed logins gine), email verify nahi (`emailVerified` kabhi use nahi), har naye account ko ₹100 + 35,000 quota → unlimited free accounts se compute farming; (b) limiter key `x-forwarded-for` (client-controlled) → header badal kar bypass; in-memory map unbounded; (c) register par password policy nahi (8-char rule sirf change-password me), email format validate nahi; (d) "account already exists" → enumeration; (e) stateless 72h token — logout sirf cookie clear karta hai, password change / block par purane token valid (token logic `@/lib/session` repo me nahi, isliye verify nahi); (f) user-not-found par hash compute nahi → timing enumeration | `auth/session/route.ts:9-51, 63-113, 140-146, 196-201` | CAPTCHA + IP / email throttle (Redis), trusted-proxy IP, email verify pehle credits, password policy, session store / `tokenVersion` |
| S21 | 🟠 Med | **Playground / PDF proxies.** `POST /api/playground` **unauthenticated**, internal key (fallback hardcoded master key) se FastAPI hit karta hai — koi bhi anonymous unlimited calls kar sakta hai, bill internal account par; whitelist me `/api/v1/matchmaking/ashtakoota` hai jo FastAPI me exist nahi karta (real `/api/v1/dosha-matching/matchmaking/ashtakoot`) — docs page aur `LivePlayground` me bhi yehi galat path. `POST /api/pdf/queue` FastAPI ka **`/api/v1/pdf/generate` call karta hai jo exist nahi karta** (real: `/pdf/kundli/basic` …) → hamesha error; chale bhi to job turant `COMPLETED` + banawati `cdn.astroengine.io` URL save, credits user se nahi kate (`creditsCost: 15` sirf record), call internal key se (master account bill). Admin PDF-queue "Retry" sirf 1 sec sleep + refetch (simulated) | `playground/route.ts:5-33, 43-49`; `pdf/queue/route.ts:7, 55-85`; `(admin)/admin/pdf-queue/page.tsx:58-66` | Playground par CAPTCHA + rate-limit + dedicated low-quota demo key; PDF flow real endpoints + ownership + billing; fake retry hatao |
| S22 | 🟠 Med | **Audit trail bharosemand nahi.** `admin/data` PATCH `actorUserId: "admin_super"` hardcode (asli admin ignore); `activeAddons` change ka label `USER_STATUS_TOGGLED`; `admin/settings`, `admin/addons`, `POST /api/plans`, API-key rotation par audit hi nahi; `AuditLog` normal writable table — README ka "immutable audit logs" claim galat | `admin/data/route.ts:145-155`; `admin/settings`, `admin/addons`, `user/keys` | Actor = session user, har admin mutation par log, DB-level append-only |
| S23 | 🟡 Low–Med | **Input validation (Next.js).** `admin/data` PATCH `planTier` check se pehle set hota hai; `admin/addons` `parseFloat` NaN / negative price, DELETE id lowercase nahi; `support` POST `category` / `priority` enum-mismatch → Prisma 500; `support/[id]/reply` `newStatus` koi bhi user set kar sakta hai; `user/branding` unvalidated aur error par bhi `status:"success"` (silent failure); `user/team` "Invitation sent" par koi email / acceptance nahi; `notifications/dispatch`: `QUOTA_100` / `PDF_FAILED` (spec me) handle nahi → **khaali subject / body ki email** chali jati hai; webhook `fetch` redirects follow karta hai (SSRF check sirf initial URL par), secret na ho to signature header khaali; email HTML me `user.name` / `data.*` unescaped | `admin/data:116-138`; `admin/addons:51-78, 106`; `support/route.ts:69-85`; `support/[id]/reply:39-46`; `user/branding:33-39`; `user/team:57-70`; `notifications/dispatch:63-106, 139-147` | Schema validation (zod), enum whitelist, role-based status transitions, `redirect:"manual"` + resolved-IP pin |
| S24 | 🟡 Low–Med | **`lang` path traversal + cache bloat (backend).** `get_locale_data(lang)` `os.path.join(LOCALES_DIR, f"{lang}.json")` bina validation ke. **Verified:** `lang="../locales/hi"` aur `"..\\locales\\hi"` Hindi names dete hain (arbitrary relative `.json` load); har alag string `LOCALES_CACHE` me naya entry → unbounded memory; non-dict JSON par 500. Unknown `lang` ("fr", "zz") silently English | `backend/app/locales/i18n.py:8-20` | `lang` ko `Literal["en","hi","gu","mr","ta","te"]` (422), cache key whitelist |
| S25 | 🟡 Low–Med | **Ephemeris silent fallback.** `EPHE_PATH` dir na ho to pyswisseph Moshier par chala jata hai (`retflag` 4 = `FLG_MOSEPH`; code `retflag` ignore karta hai) aur `/ready` phir bhi `{"status":"ready"}` deta hai. Is clone me `ephe/` hai hi nahi → mere saare numeric baselines (scripts 03–13) Moshier mode me chale; G2 golden tests production ephemeris files ke saath dobara chalane honge | `backend/app/core/swisseph.py:8-10`; `backend/app/main.py` (`/ready`) | Startup par `.se1` files verify, `/ready` me check, fallback par error / alert |
| S26 | 🟡 Low–Med | **Wallet / payment integrity (S4 ka vistaar).** `user/addons` wallet **aur** gateway dono path me `walletBalance: newBalance` **absolute** value likhte hain (start me padhi balance se) → beech ka recharge / API deduction overwrite (lost update; do parallel activations me ek free). `Transaction.gatewayPaymentId` unique nahi (replay check `findFirst` + tx → concurrent double-credit). `timingSafeEqual` alag-length signature par throw → 500. Non-prod me `gatewayOrderId` undefined ho to Prisma filter hat jata hai (koi bhi pending order match) | `user/addons/route.ts:83, 183-189, 221-247`; `schema.prisma:158-172`; `recharge/route.ts:135-138` | `walletBalance: {decrement}` + conditional, `@@unique([gatewayPaymentId])`, signature length check |
| S27 | 🟡 Low | **Build / tooling.** `auth/session/route.ts` route file se `hashNewPassword` extra export hota hai aur `admin/seed` use import karta hai — Next.js route files me sirf HTTP-handler exports allowed hain, `next build` type-check error de sakta hai (code reading; build chali nahi). `prisma db seed` `ts-node` use karta hai jo devDependencies me nahi. `requirements.txt` sab `>=` (no pins / lock), `pytest` prod deps me, `redis` / `timezonefinder` unused. Koi Dockerfile, CI, Prisma migrations nahi (`db push` only) | `auth/session/route.ts:6`; `frontend/package.json` (`prisma.seed`); `backend/requirements.txt` | Helpers `lib/` me, deps pin + lock, migrations, Dockerfile, CI |

**Acceptance mapping (docs/astroengine_review_scripts):** S14 → 14 A1 · S21 → 14 A1 + A4 · C5 → 14 A3 · S17 → 15.01 · S16 → 15.02 · S15 → 15.03–15.06 · S19 → 15.07 · S22 → 15.08 · S3 → 15.09 · S26 → 15.10 · S27 → 15.11, 15.12 + 17 D5 · S23 → 15.13, 15.14 · S18 → 15.15 (+ 15.06) · S20 → 15.16 · S24 → 16 L1–L3 · S25 → 16 E1–E3 · S13 → 12 · B5 → 15.17 · B6 → 15.18 · B9 → 15.19 · §6 docs / Appendix E tests → 17 D1–D4, D6. (Scripts 14 / 15 static heuristics hain — G3 / G5 ke runtime tests ka substitute nahi.)

---

## 5. Billing / business-logic gaps

- **B1. Rate limiting implement nahi hai.** `backend/app/main.py:77, 229-244, 347` me sirf docs/strings hain ("sliding-window 60 calls/min", `RATE_LIMIT_EXCEEDED`); koi middleware / Redis code nahi (`redis` requirements me hai par unused). Docs me Enterprise RPM **1,200** (`main.py:244`) jabki spec me **1,000** — number bhi inconsistent.
- **B2. Recurring billing nahi.** `monthlyUsage` kabhi reset nahi hota, subscription kabhi expire nahi hoti, dunning/renewal cron nahi (spec §8.2.6 ka poora design missing).
- **B3. Paisa `Float` hai** (`frontend/prisma/schema.prisma:74, 89-90, 128, 147, 161-162, 238, 241, 253, 256, 267-268`). Spec me bhi `Float` tha — dono jagah **`Decimal(12,2)`** karo.
- **B4. Pricing drift** — neeche §7 (user update) dekho.
- **B5. Team feature inert.** `TeamMember` table + CRUD + UI hai, par koi auth / permission path use nahi karta; invite email nahi, acceptance (`acceptedAt`) nahi, member ka apna key (`apiKeyHash`) nahi, seat-limit nahi. `POST /api/user/team` "Invitation sent" bolta hai jabki kuch nahi bhejta (spec §8.2.8 implement nahi).
- **B6. Schema-only spec features (code me 0 usage):** `allowedIps` (IP allowlist), sandbox key (`apiKeyTestHash/Prefix`), auto-recharge (3 fields), `piiRetentionDays` (cleanup job nahi), `emailVerified`, `signupIp / signupSource / onboardingCompletedAt`, `overageAllowed`, `clerkId`, `SecurityEventLog` model. Fine-grained roles `SUPPORT_ADMIN / BILLING_ADMIN / AUDITOR` enum me hain par middleware / routes sirf `ADMIN` / `SUPER_ADMIN` check karte hain — in roles wala koi user `/admin` me ghus hi nahi sakta (spec §14.16 RBAC missing). `user/keys` me sirf ek key regenerate hota hai (list / revoke / label nahi).
- **B7. Accounting galat.** `admin/stats` `totalRevenue` aur `admin/reports` GSTR-1 export **saare `SUCCESS` rows** jodte hain — wallet addon activations ke negative `WALLET_INTERNAL` rows (`-price`) bhi. GSTR-1 CSV valid return nahi (GSTIN, HSN/SAC, place of supply, IGST, consecutive invoice number nahi; email CSV-escape nahi; "amount 18% GST-inclusive" assumption). (`admin/stats/route.ts:20-24`, `admin/reports/route.ts:36-55`)
- **B8. Invoice / GST compliance (CA se confirm karo).** Invoice number `INV-YYYY-XXXXXXXX` = 17 chars (random UUID prefix) — GST rules me max 16 chars aur consecutive serial; supplier GSTIN `27AABCA1234F1Z8`, address, phone code me hardcoded (placeholder lagta hai); customer state missing ho to intra-state (CGST+SGST) default; export / non-India customers (zero-rated) handle nahi; SAC `998313` verify; wallet top-up (advance) par tax-invoice treatment; CGST / SGST `toFixed(2)` alag rounding (total se 1 paisa fark). (`billing/invoice/[id]/route.ts:41-50, 218`)
- **B9. Bonus tiers do jagah.** Recharge route me hardcoded (≥ ₹2,000 → +10%, ≥ ₹5,000 → +16%, ≥ ₹10,000 → +25%) jabki `WalletRechargeTier` table (`billing/tiers`, UI me dikhti hai) server ignore karta hai → UI aur asli credit alag ho sakte hain (`billing/recharge/route.ts:195`).
- **B10. Usage numbers galat.** `user/usage` metrics sirf last 100 logs se (`totalCalls` max 100, success rate, credits sample); `admin/stats` `failedJobs24h` asal me all-time FAILED; `admin/reports` module popularity sirf 500 arbitrary rows (ordering nahi). Aggregates DB se karo.
- **B11. Add-ons "monthly" par ek baar charge** — expiry / renewal nahi, deactivate par proration nahi; ENTERPRISE ko sab free (B2 ka hissa).
- **B12. PDF billing / feature gap.** PDF credits user se kabhi nahi kate (S21); Enterprise ka "Custom Logo" white-label template me hai hi nahi (C8).

---

## 6. Docs vs reality

| Claim | Reality |
|---|---|
| "117 live endpoints" | 117 routes hain, par 45 POST fabricated + 39 defective + 8 PDF simulated (Appendix C) — sirf 18 clean |
| "38/38 tests pass" | Clean clone par 38 pass + **1 fail** |
| `test_all_117_endpoints.py` "sab endpoints tested" | GET ke liye `status in [200,404]`, POST ke liye `[200,202]` assert — sirf routing prove; key `test_verification_key` sirf dev bypass (S2) se chalti hai |
| "100+ yogas scanner" | 3 hardcoded yogas |
| Manglik "20+ classical cancellation checks" | Code me 5 checks (C6.8) |
| Choghadiya "8 Day + 8 Night" | Sirf day (8 slots) return hota hai |
| `houses/cusps` "Placidus, Sripati, Equal, Whole Sign" | Router me `PLACIDUS` hardcoded; baaki unreachable; "Sripati" = Porphyry |
| KP "Real-time Ruling Planets" | Hardcoded literal (C1) |
| Tajik "16 classical yogas" / "36 Sahams" | 2 yogas / 4 sahams hardcoded |
| Jaimini "12 Arudha Padas (A1–A12, AL, UL)" | 3 hardcoded entries |
| "Mandi, Gulika, Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu" upagrahas | 4 hardcoded longitudes (same for everyone) |
| Geo "city autocomplete with elevation" / "timezone detection and DST offsets" | 10 cities + unknown → Delhi; tz longitude se, DST hamesha false (C7) |
| Numerology "Dual Chaldean and Pythagorean" | Pythagorean hardcoded `6` |
| Kaal Sarp "12 types (Anant … Sheshnag)" | Naam Rahu ki *sign* se, house se nahi (C6.2) |
| README "Razorpay Orders & Webhook HMAC-SHA256 verification" | Orders API call nahi, webhook endpoint nahi; secret DB placeholder ho sakta hai (S15) |
| README "GST-compliant tax invoices (PDF/CSV)" | Sirf HTML page; GST / accounting issues (B7, B8); XSS (S16) |
| README modules `/api/v1/strengths`, `/api/v1/dosha`, `/api/v1/matching` | Ye prefixes exist nahi (real: `/parashari/shadbala…`, `/dosha-matching`) |
| README "Yogini, Char / Farman, Teva / Synastry, Progressions / Ruling Planets" | Yogini, Char, Synastry, Ruling Planets fabricated (C1); Farman, Teva, Progressions implement nahi |
| README "immutable audit logs" | Writable table, actor hardcoded (S22) |
| README / Guide "Redis rate limiting, Cloudflare R2, WeasyPrint, Sentry" | Code me nahi (B1, C4); config fields unused |
| README "sub-arcsecond accuracy" | `.se1` files repo me nahi; Moshier fallback silently, `/ready` check nahi (S25) |
| BACKEND_PROGRESS "100% complete, 117 endpoints, 38/38 tests" | Khud sirf **37 endpoints** ko "Fully Implemented" list karta hai (baaki 80 ka koi record nahi); tests 39 (38 pass + 1 fail); links `file:///c:/xampp/htdocs/project/…` sirf author ki machine par khulte hain |
| API_DOCUMENTATION "117+ REST endpoints reference" | Script 17 (D1): **37 / 115** real `/api/v1` paths documented, **78** ka zikr nahi (jaise `tajik/muntha`, `geo/timezone`, `vimshottari/prana`, `upagrahas`, `char/jaimini`, `moon-lagna`, `ashtakvarga`, `yogas/find`, `sade-sati`, `papasmya`) — yani wahi 37 jo BACKEND_PROGRESS "fully implemented" bolta hai |
| INSTALLATION_GUIDE "37 passed in 0.38s" | 39 tests collected; frontend / wiring env vars missing; `--workers 4` + in-memory `PDF_JOBS` (C8) |
| Playground whitelist `/api/v1/matchmaking/ashtakoota` | Path exist nahi — playground route, **docs page aur LivePlayground** teeno me (S21, script 14 A4) |
| WeasyPrint + Cloudflare R2 PDF pipeline | Requirements me dono nahi; render simulated |
| 429 sliding-window rate limit | Code nahi (B1) |
| README/docs me 117 aur 37 endpoints dono | Ek count rakho |
| Enterprise RPM 1,200 (main.py) vs 1,000 (spec) | Ek number rakho |

**Tests (Pass 3 me saare 12 files padhe — Appendix E):** 39 tests collected (38 pass + 1 fail clean clone par). Sirf ~11 me value / semantic assertion (JD 2449995.875, nakshatra boundaries, THURSDAY, KP 0.1° → MARS/KETU/KETU, numerology 5 / 3, Sun in Libra …); baaki structure / key-presence hain (aur kuch weak — sun sign `"कन्या" or "सिंह"` dono accept). **Ashtakoot, Varga rules, KP horary, Kaal Sarp, Manglik, running-dasha ke koi value test nahi** — isliye galat logic bhi pass hota raha. Koi negative / auth / SSRF / quota / i18n-edge test nahi; frontend me koi test nahi; CI nahi.

---

## 7. Update after review (user input, 2026-09-19)

**Pricing:** User ne confirm kiya ki **₹0 wala plan hona hi nahi chahiye** aur seed me alter kar diya hai.
- Review wale commit `ad5a23e` me seed abhi bhi: `STARTER priceMonthly: 0` (`admin/seed/route.ts:114`), `PRO 4999` (`:131`), `ENTERPRISE 14999` (`:151`).
- **Pass 3 update:** `STARTER priceMonthly: 0` **do jagah** hai — `frontend/prisma/seed.ts:67` **aur** `admin/seed/route.ts:114`; dono badalne honge. Seed ke andar bhi inconsistency: `DEFAULT_ENTERPRISE_RPM = 1000` (SystemSetting) vs Enterprise plan `rateLimitPerMin: 1200`.
- Docs fallback table (`backend/app/main.py:115-117`): Starter ₹4,999 / Pro ₹14,999 / Enterprise ₹39,999.
- GitHub `origin/main` par abhi koi naya commit nahi (Pass 3 me dobara fetch kiya, `ad5a23e` hi hai) — yani seed ka change **push nahi hua** (ya local hai).
- **Action:** seed change push karo, aur **seed = docs (`main.py`) = spec §pricing** teeno ek hi price/RPM table se aayein (single source: DB `SubscriptionPlan`, docs usse render karein). Push ke baad main dobara verify kar dunga.

---

## 8. Prioritized fix plan

### P0 — deploy / customers se pehle
- [ ] **S14:** `POST /api/plans` par admin auth (aaj hi) + plans / prices / `PLAN_MODULES_*` DB me verify karo (kisi ne badla to nahi)
- [ ] **S15:** Razorpay — placeholder secret hatao + rotate, secrets DB se hatao; server-side Orders API + payment fetch + `payment.captured` webhook. **Tab tak recharge / subscribe / addon-gateway band**
- [ ] **S16:** invoice HTML escape + CSP + `taxProfile` validation (admin session risk)
- [ ] **S17:** `select` / DTO — `user/me` aur `admin/data` se password hash, `apiKeyHash`, secrets hatao
- [ ] **S19:** seeds se default creds hatao, password reset band; prod me seed block
- [ ] **S20:** register throttling + email verification (credits se pehle) + XFF ki jagah trusted-proxy IP
- [ ] **S21:** playground par auth / limit + demo key; `pdf/queue` real FastAPI endpoints ya disable
- [ ] C5: `.gitignore` fix + `frontend/src/lib` commit → clean-clone build pass (phir `src/lib` ka security review — session / authGuard / apiKey / ssrf / email)
- [ ] S1: hardcoded fallback key hatao, jo key exposed thi rotate karo
- [ ] S2: dev bypass + key-prefix `print` hatao
- [ ] S3: payment verification har env me mandatory
- [ ] S4: wallet/quota decrement atomic (transaction + conditional update) + concurrent-request test
- [ ] C1 **quick win:** sab 45 fabricated endpoints (Appendix C ❌) par abhi `501` + docs/marketing se hatao
- [ ] C1: fabricated endpoints ko priority se real banao — pehle wo jahan users decision lete hain: dosha-matching (sade-sati, pitra, guru-chandal, exceptions), muhurat (marriage / griha-pravesh / property), monthly-calendar, KP, Dasha (Yogini, Char), phir baaki
- [ ] C2: Ashtakoot classical tables + golden tests
- [ ] C3: Varga rules D2–D60 + `ayanamsa` respect (calculator **aur** router) + router me `lang=` / `ayanamsa=` keyword args + unknown varga par 422
- [ ] C7: geo search + timezone real (unknown city → 404, DST-aware offset birth date/time ke saath)
- [ ] S13: input validation (422, 500 nahi)

### P1 — launch ke turant baad
- [ ] C6.1: KP horary — 249-table (aur 2193)
- [ ] C6.2 / C6.3: Kaal Sarp type house se; birth-MD ka antardasha notional start se
- [ ] C6.4–C6.7: Panchang — sunrise-based vaar, Panchak (ID typo + pada 3–4 + full types), Bhadra loka, temporal horas, night choghadiya, end-times
- [ ] C6.8–C6.13: Manglik rules, Lal Kitab (debts/key bug/varshphal), moon-lagna re-base, house_system request field, rudraksha planet-id, numerology Pythagorean, wheel SVG
- [ ] B1: Redis sliding-window rate limit (plan-wise RPM), `429` + `Retry-After`
- [ ] B2: monthly usage reset cron, subscription expiry/renewal/dunning
- [ ] C4: PDF engine real (WeasyPrint + storage + DB jobs + real refund + ownership)
- [ ] S5/S6/S7: error-code pass-through, module-id normalisation, timing-safe secret + single env name
- [ ] S8/S9: secrets env me, login limiter Redis me
- [ ] S10/S11/S12: SSRF ranges, openapi cache, startup validation
- [ ] S18 / S22: secrets masking + internal allowlist; audit log (actor, sab admin mutations)
- [ ] S23 / S24 / S25 / S26: Next.js input validation, `lang` whitelist, ephemeris check + `/ready`, wallet decrement + unique `gatewayPaymentId`
- [ ] B5–B12: team feature (ya hatao), schema-only features (implement ya schema se hatao), accounting / GST (CA), bonus tiers single source, usage aggregates, add-on expiry, PDF billing + logo
- [ ] C8: PDF template (logo, CSS validation, Basic ≠ Brihat), i18n categories, guides (env vars, workers)

### P2 — hygiene
- [ ] S27: deps pin + lockfile, Dockerfile, CI, Prisma migrations, `ts-node`, route-file exports
- [ ] Tests (Appendix E): Ashtakoot / Varga / KP / Kaal Sarp / running-dasha value tests, negative + auth + SSRF + quota tests, frontend tests
- [ ] B3: money `Decimal`
- [ ] Docs sync (117/37, 38/38, RPM, pricing, aur §6 ke sab inflated claims) — ek generated source se
- [ ] Tests: 117-endpoint test me real value asserts (golden JSON), CI pipeline
- [ ] `timezonefinder` unused dependency (ya to C7 me use karo ya hatao); `redis` bhi unused jab tak B1 nahi banta

---

## 9. Production Readiness Gates

§8 ki fix list **zaroori hai, kaafi nahi.** Review ab Python calculators + routers (Pass 2) aur Next.js API / schema / seeds / PDF / locales / tests / guides (Pass 3) cover karta hai, par `frontend/src/lib`, UI line-by-line aur runtime flows baaki hain (§10), aur "output input ke saath badalta hai" ka matlab "sahi hai" nahi hota (Ashtakoot badalta tha par galat tha; 9 fabricated endpoints sirf input echo karte the). Production-ready tab maano jab **saare gates pass** hon. Status abhi sab ⬜ (start nahi hua).

| # | Gate | Kya karna hai | Done kab maane | Status |
|---|---|---|---|---|
| G0 | **Review coverage** | Python calculators + routers (Pass 2) aur Next.js API routes / schema / seeds / PDF / locales / tests / guides (Pass 3) padhe ja chuke (2026-09-19). **Blocked:** `frontend/src/lib` (session, authGuard, apiKey, ssrf, email, prisma) repo me nahi — C5 fix ke baad iska security review; UI pages line-by-line nahi (grep-level); runtime E2E. P0 fixes push hone ke baad poore repo ka re-review | Re-review report me koi module "unreviewed" nahi, koi Critical/High open nahi | 🟡 partial |
| G1 | **Code correctness (P0)** | §8 ke saare P0 items | `docs/astroengine_review_scripts/` ke scripts 02, 04, 05, 10 (`--require-501`), 11, 12 exit 0 (0 unintended-identical endpoints; Ashtakoot reference match; Varga 100% + `ayanamsa` respected; fabricated endpoints 501; geo/timezone reference match; invalid input → 422) aur 01, 03, 13 PASS rahein; Next.js / security P0 items (S14–S21) ke liye scripts 14, 15 aur 16 (S24–S25) exit 0, docs / tests / hygiene ke liye 17 exit 0 (`run_all.py` = 17/17 PASS); clean-clone build pass | ⬜ |
| G2 | **Astrology validation** | 20–30 golden kundlis ko reference software (Jagannatha Hora / Drik Panchang) se compare: planets, Asc, Panchang, Vimshottari, D9 + chune hue vargas, Ashtakoot. Edge cases: sign/nakshatra boundary, midnight birth, historic timezone/DST offsets (jaise India 1942–45), southern hemisphere, leap day, high latitude (>66°, Placidus undefined). Ek jyotishi / domain expert ka sign-off. **Per-endpoint golden tests** (sirf differential heuristic kaafi nahi — C1) jisme khaas cases: KP horary 1–249, Kaal Sarp type, running dasha birth MD ke andar, Panchak/Bhadra, sunrise-based vaar, geo/timezone (DST ke saath) — inke liye scripts 06–09, 11 ready hain (`run_all.py`), baaki endpoints ke golden tests apne likhne honge | Tolerance spec me define (jaise planets ≤ 0.01°), saare golden cases us tolerance me; expert sign-off note | ⬜ |
| G3 | **Runtime E2E (staging)** | signup → key → verify-key → quota → wallet overage → Razorpay (test-mode). Razorpay **webhook reconcile** (`payment.captured` / `payment.failed`, idempotent) — abhi endpoint hi exist nahi karta (Pass 3, S15): banana + test karna; forged-signature (placeholder secret) aur amount-tampering ke negative tests. Concurrency test: N parallel requests par wallet/quota kabhi negative na ho. Rate-limit, monthly reset, subscription expiry ke tests | Sab flows staging par pass; S3, S4, S6 runtime se confirm | ⬜ |
| G4 | **Ops** | Staging env; CI/CD (lint, type-check, tests, build, migration dry-run); monitoring + alerts (latency, 5xx, verify-key errors, payment failures); structured logs (API key / PII kabhi nahi); error tracking; MySQL backup + **tested restore** (RPO/RTO define); Prisma `migrate deploy` (prod me `db push` nahi); Redis persistence/HA; secrets manager; TLS/WAF; ephemeris (`.se1`) files deploy me; load test (target RPS per plan, worker sizing — pyswisseph CPU-bound) | Runbook + alerts fire hote dikhe; restore drill pass; load test target meet | ⬜ |
| G5 | **Security** | `pip-audit` + `npm audit`; OWASP API Top-10 pass; admin 2FA; audit log verify (spec §8); rotated keys (S1, S15) confirm; S1–S27 sab closed. `npm audit` 2026-09-19 par 0 vulns (har release par dobara); `pip-audit` pehle deps pin karke (abhi sab `>=`) | Pen-test / self-audit report me koi High open nahi | ⬜ |
| G6 | **Legal / compliance** | GST-compliant invoices; refund/cancellation policy; Terms + Privacy + astrology disclaimer; DPDP: birth data personal data hai → consent, retention/deletion policy, enterprise customers ke saath data-processing terms | Documents published, invoice sample GST-valid | ⬜ |
| G7 | **Launch plan** | Private beta (limited customers, monitored) → GA; rollback plan; support runbook / on-call; status page | Beta me fixed window tak zero P0/P1 incident | ⬜ |

**Verify karne wali cheez (defect nahi, sirf check):** `pyswisseph` ka sidereal mode (`swe.set_sid_mode`) global state hai. Agar FastAPI threadpool me concurrent requests alag `ayanamsa` ke saath aayein to race ho sakta hai. G4 ke load test me alag-alag ayanamsa ke parallel requests se confirm karo (aur agar dikhe to lock ya per-request `flags`/subprocess pool).

**Decisions jo spec me likhne baaki (G2 ke liye):** default ayanamsa (abhi Lahiri), house system (Placidus vs whole-sign; request field), Rahu **mean vs true node** (abhi `MEAN_NODE`, KP me bhi), Varga variants (D2/D3), Bhakoot/Nadi cancellation rules, **sunrise convention** (upper-limb vs disc-center, abhi disc-center), **vaar** sunrise se (abhi civil day), **Vimshottari year length** (abhi 365.2422; JHora default 365.25), Manglik rule-set (kaun se houses, Venus-based, cancellations), Hora (equal vs temporal hours), geo data source.

### Rollout stages

| Stage | Gates | Matlab |
|---|---|---|
| A — Dev complete | G0, G1 | Code sahi, clean build |
| B — Staging validated | G2, G3 | Output sahi aur flows kaam karte hain |
| C — Private beta | G4, G5, G6 (minimum) + P1 start | Kuch customers, monitored |
| D — Public launch (GA) | G0–G7 sab + P1 done | Production-ready |

---

## 10. Review me jo baaki hai

**Ho gaya:**
- **Pass 2 (2026-09-19):** saare Python calculators + routers (core, panchang, parashari, dasha, kp, lalkitab, advanced, dosha-matching, remedies, numerology, western) — findings C1, C6, C7, S13.
- **Pass 3 (2026-09-19):** Next.js ke saare 25 API routes (Appendix D), `prisma/schema.prisma`, `seed.ts` / `seed_users.ts`, `next.config.ts`, `AGENTS.md` / `CLAUDE.md` / frontend `README`, `postman_collection.json`, PDF router / generator / template / schemas, `ssrf.py`, locales (6 JSON), saare 12 test files (Appendix E), `INSTALLATION_GUIDE.md`, `README.md`, `BACKEND_PROGRESS.md`, `API_DOCUMENTATION.md` (path-coverage), `requirements.txt` / `package.json`, `npm audit` — findings S14–S27, B5–B12, C8. Checks scripts **14–17** me saved (Appendix B).

**Abhi bhi baaki (mai kar nahi paya):**
- **`frontend/src/lib/*` (7 modules: `prisma`, `authGuard`, `session`, `webSession`, `apiKey`, `ssrf`, `email`)** repo me hain hi nahi (C5) — authentication, session token signing / expiry, password hashing, API-key generation, admin guard, SSRF validator, email sender ka koi security audit nahi hua. Isi wajah se Next.js ka koi bhi "auth sahi hai" claim abhi verify nahi ho sakta. **C5 fix ke baad sabse pehle isko review karo.**
- **UI pages (~10,000 lines, 30+ files):** line-by-line nahi padhe — sirf grep-level (koi `dangerouslySetInnerHTML` / `localStorage` / secrets nahi mile; admin PDF-queue "Retry" simulated; `rzp_test_mock_enterprise_key` fallback). Client-side logic bugs aur UX / spec conformance baaki.
- **Runtime:** Next.js app build / run hi nahi hui (`src/lib` missing + S27) — S14, S15, S16 code reading se hain; staging par exploit-chain confirm karo. Pass 2 / Pass 3 ke checks scripts 06–17 me hain (`run_all.py`); 14 / 15 static heuristics hain.
- `billing/subscribe` aur `internal/verify-key` ka line-by-line dobara audit (Pass 1 me padhe the; Pass 3 me sirf cross-check).
- Prisma migrations / DB-level (indexes vs actual query plans) — production data ke saath EXPLAIN.
- Seed change push hone ke baad pricing re-verify (§7) — dono `seed.ts` aur `admin/seed/route.ts` me STARTER `priceMonthly: 0` hai.

---

## Appendix A — classical reference (fix ke liye)

Standard Parashari / BPHS conventions. Agar aap koi variant chahte ho (jaise D3 ka Jagannatha variant, Jaimini Hora) to spec me explicitly decide karo.

### A1. Nadi (nakshatra → nadi)
- **Aadi (Vata):** Ashwini, Ardra, Punarvasu, U.Phalguni, Hasta, Jyeshtha, Moola, Shatabhisha, P.Bhadrapada
- **Madhya (Pitta):** Bharani, Mrigashira, Pushya, P.Phalguni, Chitra, Anuradha, P.Ashadha, Dhanishta, U.Bhadrapada
- **Antya (Kapha):** Krittika, Rohini, Ashlesha, Magha, Swati, Vishakha, U.Ashadha, Shravana, Revati

Nadi dosha (0/8): dono ki nadi same.

### A2. Gana
- **Deva:** Ashwini, Mrigashira, Punarvasu, Pushya, Hasta, Swati, Anuradha, Shravana, Revati
- **Manushya:** Bharani, Rohini, Ardra, P.Phalguni, U.Phalguni, P.Ashadha, U.Ashadha, P.Bhadrapada, U.Bhadrapada
- **Rakshasa:** Krittika, Ashlesha, Magha, Chitra, Vishakha, Jyeshtha, Moola, Dhanishta, Shatabhisha

### A3. Bhakoot
Dosha jab groom→bride sign distance (1-based) ka pair **2/12, 5/9, 6/8** ho (`rel_dist ∈ {2,12,5,9,6,8}`). Standard exceptions (dono sign lords same/mitra) spec me decide karo.

### A4. Tara
Har partner ke nakshatra se doosre tak inclusive count karo, 9 se divide, remainder **3, 5, 7 = inauspicious** (Vipat, Pratyari, Vadha). Dono auspicious → 3, ek → 1.5, dono inauspicious → 0.

### A5. Vashya / Yoni / Graha Maitri
Lookup tables chahiye: Vashya groups (sign → Chatushpada/Manava/Jalachara/Vanachara/Keeta), Yoni (nakshatra → animal + 14×14 compatibility matrix), Graha Maitri (sign-lord natural friendship table → 5/4/3/1/0.5).

### A6. Varga rules (sign index 0 = Aries; "odd sign" = Aries, Gemini, …)

| Varga | Parts | Rule |
|---|---|---|
| D2 (Hora) | 2 × 15° | Odd sign: 1st half Leo (Sun), 2nd Cancer (Moon). Even sign: ulta |
| D3 (Drekkana) | 3 × 10° | Same sign, 5th, 9th |
| D4 | 4 × 7.5° | Same sign, 4th, 7th, 10th |
| D7 | 7 × 30/7° | Odd: same sign se; Even: 7th se |
| D9 | 9 × 3°20′ | Fire→Aries, Earth→Capricorn, Air→Libra, Water→Cancer se (already sahi) |
| D10 | 10 × 3° | Odd: same sign se; Even: 9th se |
| D12 | 12 × 2.5° | Same sign se (already sahi) |
| D16 | 16 × 1°52′30″ | Movable→Aries, Fixed→Leo, Dual→Sagittarius se |
| D20 | 20 × 1.5° | Movable→Aries, Fixed→Sagittarius, Dual→Leo se |
| D24 | 24 × 1°15′ | Odd→Leo, Even→Cancer se |
| D27 | 27 × 1°06′40″ | Fire→Aries, Earth→Cancer, Air→Libra, Water→Capricorn se |
| D30 (Trimshamsha, unequal) | 5 parts | Odd: 0-5° Mars(Aries), 5-10° Saturn(Aquarius), 10-18° Jupiter(Sagittarius), 18-25° Mercury(Gemini), 25-30° Venus(Libra). Even: 0-5° Venus(Taurus), 5-12° Mercury(Virgo), 12-20° Jupiter(Pisces), 20-25° Saturn(Capricorn), 25-30° Mars(Scorpio) |
| D40 | 40 × 0°45′ | Odd→Aries se, Even→Libra se |
| D45 | 45 × 0°40′ | Movable→Aries, Fixed→Leo, Dual→Sagittarius se |
| D60 | 60 × 0°30′ | Same sign se (already sahi) |

Movable = Aries, Cancer, Libra, Capricorn; Fixed = Taurus, Leo, Scorpio, Aquarius; Dual = Gemini, Virgo, Sagittarius, Pisces.
(D30 ka reference standard BPHS Trimshamsha mapping hai — implement karte time apne reference software se cross-check karo.)

---

## Appendix B — kaise verify kiya (reproducible)

Scripts yahan hain: **`docs/astroengine_review_scripts/`** — 17 scripts + `run_all.py` (README me setup, run commands aur baseline @ `ad5a23e`). AstroEngine ke `backend/` folder se chalao (14 / 15 / 17 repo root `..` se `frontend/` aur docs bhi padhte hain; `ASTRO_REPO_ROOT` se override); exit code 0 = PASS, 1 = FAIL. Read-only hain, repo/DB me kuch write nahi karte. `run_all.py` ek saath chalakar table deta hai — **baseline: 3 PASS (01, 03, 13), 14 FAIL**.

| Script | Kya karta hai | Baseline (fix se pehle) |
|---|---|---|
| `01_probe_endpoints.py` | `fastapi.testclient` + `app.openapi()` se sab 117 paths hit (default: auth override; `--real-auth` se asli path) | 117/117 (auth override). `--real-auth` + `NEXT_APP_URL` unset → 115/117 500 (S12) |
| `02_differential_test.py` | `dependency_overrides[verify_api_key]` se auth bypass, har POST ko 2 alag births (matchmaking ke liye 2 couples) se hit, `data` equal? | 60 differ / **45 identical** / 7 non-200 → exit 1 |
| `03_accuracy_check.py` | raw `swisseph` (Lahiri, mean node) se planets, Asc, tithi/nakshatra/yoga/vaar | diff 0.0000°, sab match → exit 0 |
| `04_ashtakoot_vimshottari_check.py` | A1/A2/A3 tables se Nadi 27×27, Gana 27×27, Bhakoot 12×12; Vimshottari independent calc | Nadi 160/729, Gana 242/729, Bhakoot 24/144 galat; Vimshottari PASS → exit 1 |
| `05_varga_check.py` | 5 sections: **A** 3 births × (Asc + 12 bodies) × 16 vargas (independent reference); **B** synthetic sweep — har sign × har varga-segment ± boundary (swisseph proxy, sirf script me); **C** API-level: 32 routes + 16 svg (mapping, API==function, `lang=hi`, `ayanamsa`, unknown varga); **D** house / houses consistency; **E** ayanamsa function-level (Asc + 288 planet placements) | A: 4/16 vargas sahi; B: wahi 12 galat; C: `lang` 30/32 routes ignore, ayanamsa ignore, unknown varga 7/7 → 200; D OK (0/1728); E ignore → exit 1 |
| `06_kp_check.py` | 249-row reference table (27 × 9 sub-divisions, 30° par split); `get_kp_sub_lord` 20,000 random longitudes; horary 1–249 vs table | sub-lord fn 0 mismatch; **horary 137/249 galat** (sub-lord 131), max 2.26° → exit 1 |
| `07_kaal_sarp_check.py` | 1995-11-04 (pehli Kaal Sarp date), Delhi Lagna har 2 ghante par; Rahu house → classical type vs API | **11/12** slots mismatch → exit 1 |
| `08_running_dasha_check.py` | Birth MD (RAHU, 1995-10-05) me har 45 din par running AD vs notional-start reference; AD list end vs MD end | **30/141** AD galat; overshoot 171 din → exit 1 |
| `09_panchang_check.py` | Delhi: vaar 03:00, Panchak scan (Dhanishta pada 1–4 + controls), night Choghadiya, temporal horas, tithi end-time; sunrise gap INFO | 7 checks FAIL (sunrise +73 s INFO) → exit 1 |
| `10_fabricated_endpoints_probe.py` | 13 behaviour probes (monthly-calendar dates, marriage muhurat, exceptions, event-analysis, bhav-chalit, moon-lagna, Char dasha, Lal Kitab ×2, rudraksha hi, name-analysis, restrictions); `--require-501` = 45 fabricated paths | **0/13** probes OK; 0/45 paths 501 → exit 1 |
| `11_geo_check.py` | Geo search (Udaipur / Kathmandu / nonsense) + timezone vs `pytz` (10 cases, DST + 1943; `date` param) | 10 FAIL → exit 1 |
| `12_input_validation_check.py` | 14 cases: invalid `dob` / `tob` / `tz` / `ayanamsa` → 422; valid + lat/lon controls | 9/14 FAIL → exit 1 |
| `13_spot_checks.py` | Regression: Jaimini karakas, Western tropical + Big Three, numerology core, Choghadiya day patterns, Rahu Kaal | 7/7 OK → exit 0 |
| `14_nextjs_auth_map_check.py` | Next.js 25 routes ka handler-level auth map (static): unauthenticated writes, missing `@/lib/*`, frontend ke nonexistent backend paths | A1 FAIL (`plans` POST, `playground` POST); A3 FAIL (7 lib modules); A4 FAIL (`/matchmaking/ashtakoota`, `/pdf/generate`) → exit 1 |
| `15_nextjs_security_patterns_check.py` | 19 static pattern checks (S15–S23, S26, S27, B5, B6, B9) — hash leak, invoice XSS, Razorpay secret / order / webhook, placeholders, seed creds, audit, NODE_ENV gate, wallet write, route exports, catch-success, masking, register throttle, schema-only fields, bonus tiers | **0 / 19** OK → exit 1 |
| `16_backend_lang_ephemeris_check.py` | `lang` traversal / unknown lang / cache bloat (S24); `/ready` vs ephemeris, Moshier fallback, `ret_flag` test (S25) | L1, L2, L3, E1, E3 FAIL; E2 WARN → exit 1 |
| `17_docs_tests_hygiene_check.py` | Docs coverage, test / endpoint-count claims, env vars documented, hygiene (pins, Docker, CI, migrations, tests, unused deps), `--workers` vs in-memory jobs, `npm audit` | D1 (37/115 documented), D2, D3, D4 (12/17 undocumented), D5, D6 FAIL; D7 OK → exit 1 |
| `run_all.py` | Sab scripts chalata hai; `run_all.py 14 15` se chune hue; `-v` full output | 3 PASS / 14 FAIL |

Extra (script nahi): **Secret scan** — git history par key/token patterns (clean).

> **Note:** `05_varga_check.py` ke 39 placements = 3 births × (Ascendant + 12 bodies: 9 grahas + Uranus/Neptune/Pluto); wording docstring me bhi theek kar di gayi hai.

### Pass 2 — baaki calculators (ab scripts 06–13 me)
Source: saare 11 routers + calculators + `core/` line-by-line padhe; phir ye checks pehle scratch folder me chalaye, ab **scripts 06–13** me saved hain (same `TestClient` + `dependency_overrides[verify_api_key]` setup). Method, script ke hisaab se:

1. **`06_kp_check.py` — KP reference table:** 27 nakshatra × 9 Vimshottari sub-divisions (`years/120 × 13°20′`, star lord se shuru), 30° sign boundary par split → **249 rows ✓** (expected count se match). `get_kp_sub_lord` ko 20,000 random longitudes par table se compare (0 mismatch); `calculate_kp_horary_chart(n)` ko n = 1…249 par table ke n-th row se compare (137 wrong tuple, 131 wrong sub-lord, max 2.26°).
2. **`07_kaal_sarp_check.py`:** 1990-01-01 se 3-din step scan → pehli date jahan `is_kaal_sarp` true (1995-11-04); Delhi coordinates par har 2 ghante ka Lagna nikaal kar Rahu ki house (whole-sign, Lahiri) → classical type vs API `type`.
3. **`08_running_dasha_check.py`:** birth 1995-10-05 14:30 IST (Moon 307.0135°, RAHU MD balance 17.532y); reference = MD end − 18y × 365.2422 d se notional start, phir AD sequence; birth MD me har 45 din (141 dates) par API `get_running_dasha_tree` se compare + AD list ka end vs MD end.
4. **`09_panchang_check.py`:** Delhi 2026-09-19 sunrise (`rise_trans`, disc-center vs upper-limb); 03:00 birth ka vaar; 2026-09-01 se 40 din, har 2 ghante par Moon ka nakshatra scan → Dhanishta pada 1/2/3/4 (+ Shatabhisha / Revati / Rohini controls) ke pehle occurrence par `calculate_bhadra_panchak`; hora ke liye 2026-06-21 (lamba din, taaki equinox coincidence na ho).
5. **`10_fabricated_endpoints_probe.py`, `11_geo_check.py`, `12_input_validation_check.py` — API-level probes:** `panchang/monthly-calendar` (Feb 2026), `muhurat/*` (2 dates), `matchmaking/exceptions` (2 couples), `kp/event-analysis`, `parashari/chart/bhav-chalit`, `moon-lagna`, `dasha/char/jaimini`, `lalkitab/chart/kundli` + `debts/rin` (24 diverse births), `remedies/rudraksha` (en/hi), `gemstones/restrictions`, `numerology/name-analysis`; `core/geo/search` (Delhi, Udaipur, Kathmandu, nonsense), `core/geo/timezone` (10 cases vs `pytz`); invalid `dob` / `tob` / `tz` / `ayanamsa` (14 cases).
6. **`13_spot_checks.py` — sahi nikle (regression):** Jaimini karakas order, Western tropical Sun/Moon vs raw swisseph + 12 bodies, Big Three ascendant, numerology core numbers, Choghadiya day patterns (7 weekdays), Rahu Kaal part table (7 weekdays).

### Pass 3 — bache hue files (ab scripts 14–17 me + source review)
Source (line-by-line): Next.js ke saare 25 `route.ts`, `prisma/schema.prisma`, `prisma/seed.ts`, `seed_users.ts`, `next.config.ts`, `AGENTS.md`, `CLAUDE.md`, frontend `README.md`, `package.json`, PDF `router.py` / `generator.py` / `kundli_report.html` / `schemas/pdf.py`, `core/ssrf.py`, `locales/i18n.py`, saare 12 test files, `INSTALLATION_GUIDE.md`, `README.md`, `BACKEND_PROGRESS.md`. Grep-level: UI pages (`app/**/page.tsx`, `components/`) — XSS sinks, storage, secrets, fetch targets. Ye checks pehle scratch me chalaye, ab **scripts 14–17** me saved hain. Method, script ke hisaab se:

1. **`14_nextjs_auth_map_check.py` — route ↔ auth map:** har `route.ts` ke har HTTP handler (aur uske helper function) me `requireAdminSession` / `getVerifiedSession` / `x-internal-secret` ki maujoodgi → 25 routes me se 4 bina auth (`auth/session` login, `billing/tiers`, `plans` — POST bhi, `playground`); `plans` POST unguarded (S14). `@/lib/*` imports vs folder existence → 7 modules missing (C5). Frontend ke `/api/v1/...` string literals vs `app.openapi()` → `/matchmaking/ashtakoota` (playground route + docs page + LivePlayground) aur `/pdf/generate` exist nahi (S21). Middleware matcher `/api/*` cover nahi karta.
2. **`15_nextjs_security_patterns_check.py` — 19 static checks:** regex / file scan se S15–S23, S26, S27, B5, B6, B9 ke patterns (Appendix D ke findings ka regression gate).
3. **`16_backend_lang_ephemeris_check.py` — runtime (TestClient, auth override):** `lang="../locales/hi"` / `"..\\locales\\hi"` → Hindi names (S24); 20 alag spellings → `LOCALES_CACHE` 20 entries; `settings.EPHE_PATH` galat karke `/ready` → phir bhi `ready`; `swe.calc_ut(...)` ka `retflag` = 4 (`FLG_MOSEPH`), `EPHE_DIR` maujood nahi; `ret_flag` variable capture hota hai par kabhi test nahi (S25).
4. **`17_docs_tests_hygiene_check.py`:** `app.openapi()` ke `/api/v1` paths ko API_DOCUMENTATION ke mentions se match → 37 / 115 documented (78 undocumented); `pytest --collect-only` → 39 collected vs docs claims 37 / 38; endpoint-count claims (37 vs 117); code ke 17 env vars me se 12 undocumented; deps unpinned, Docker / CI / migrations / frontend tests / `.env.example` nahi; `--workers 4` + in-memory `PDF_JOBS`; `npm audit --package-lock-only` (advisory lookup, koi install nahi; `--no-network` se skip): 0 vulnerabilities.
5. **Tests audit (Appendix E):** saare 12 test files ki assertions padhi — script nahi, manual (sirf count aur claims 17 me).

Limitations: Next.js app runtime me chalayi nahi (`src/lib` missing) — auth, payment, quota flows sirf code padh kar review hue: S3, S4, S6, **S14, S15, S16** runtime se confirm karne baaki hain (exploit chains code reading par based hain). Jin findings ke aage "code reading" likha hai (C6.6, C6.8, kuch C6.10 items, S27 ka build-error point) unka runtime confirm nahi kiya. C6.6 (Bhadra loka rule) muhurta texts ki standard convention hai — apne jyotishi se confirm karo. `pip-audit` nahi chala (deps unpinned).

---

## Appendix C — 112 POST endpoints ka per-endpoint classification (C1 ka final table)

Method: har router + calculator ka source padha + ad-hoc API call (Pass 2). Pass 1 ka differential test (60 differ / 45 identical / 7 non-200) sirf heuristic tha — uski galtiyan C1 me hain.

**Legend:** ✅ clean (koi defect nahi mila) · ⚠️ real par defective (C3 / C6 / C7) · ❌ fabricated (☐ = fix ya `501` baaki) · 📚 legit catalog · 📄 PDF (C4)
**Tally:** ✅ 18 · ⚠️ 39 · ❌ 45 · 📚 2 · 📄 8 = **112 POST**. Plus 5 GET (neeche).
Prefix sab paths ka `/api/v1/`.

### core (5)
| Endpoint | Class | Note |
|---|---|---|
| `core/planets/positions` | ✅ | raw swisseph se 0.0000° |
| `core/planets/retrograde` | ✅ | |
| `core/ayanamsa/all` | ✅ | |
| `core/houses/cusps` | ⚠️ | router me `PLACIDUS` hardcoded; Sripati = Porphyry (C6.10) |
| `core/sun-moon/timings` | ⚠️ | disc-center sunrise, upper-limb se +73 s (C6.7) |

### panchang (10)
| Endpoint | Class | Note |
|---|---|---|
| `panchang/daily` | ⚠️ | civil-day vaar; end-times nahi (C6.4, C6.7) |
| `panchang/choghadiya` | ⚠️ | sirf day, night nahi (C6.7) |
| `panchang/advanced` | ⚠️ | Rahu/Yamaghanda/Gulika ✅; Abhijit fixed ±24 min (C6.7) |
| `panchang/hora` | ⚠️ | 24 equal 1-hour slots (C6.7) |
| `panchang/bhadra` | ⚠️ | loka paksha se (C6.6) |
| `panchang/panchak` | ⚠️ | Dhanishta ID typo, pada, types (C6.5) |
| `panchang/monthly-calendar` | ❌ ☐ | Purnima `2026-02-30`; har mahine fixed dates |
| `panchang/muhurat/marriage` | ❌ ☐ | fixed "Vrishabha 19:30–23:45, score 92", asta false |
| `panchang/muhurat/griha-pravesh` | ❌ ☐ | fixed "Uttara Phalguni / Shukla Panchami" |
| `panchang/muhurat/property-vehicle` | ❌ ☐ | fixed "Wednesday / Amrit" |

### parashari (27)
| Endpoint | Class | Note |
|---|---|---|
| `parashari/chart/d1`, `d9` | ✅ | classical rule se 100% (boundaries samet); `lang` sahi |
| `parashari/chart/d12`, `d60` | ⚠️ | signs 100% sahi, par `lang` param ignore (positional-arg bug, C3) |
| `parashari/chart/d2`, `d3`, `d4`, `d7`, `d10`, `d16`, `d20`, `d24`, `d27`, `d30`, `d40`, `d45` (12) | ⚠️ | galat varga rule + `lang` ignore (C3) |
| `parashari/chart/divisional/{varga}`, `parashari/chart/svg` | ⚠️ | upar ke 12 vargas par galat; `lang` / `ayanamsa` ignore; unknown varga 200; SVG sirf North Indian (C3) |
| `parashari/chart/moon-lagna` | ⚠️ | Moon house 2 (1 hona chahiye) (C6.10) |
| `parashari/chart/bhav-chalit` | ❌ ☐ | `house` key nahi → har planet house 1 |
| `parashari/shadbala/details` | ❌ ☐ | literal rupas |
| `parashari/bhavabala` | ❌ ☐ | sirf house index ka formula |
| `parashari/avasthas` | ❌ ☐ | literal |
| `parashari/ashtakvarga/bhinnashtak` | ❌ ☐ | pattern `4 + idx % 4` |
| `parashari/ashtakvarga/sarvashtak` | ❌ ☐ | constant scores |
| `parashari/special-points` | ❌ ☐ | literal |
| `parashari/yogas/find` | ❌ ☐ | 3 fixed yogas ("100+" claim) |

### dasha (8)
| Endpoint | Class | Note |
|---|---|---|
| `dasha/vimshottari/mahadasha` | ✅ | 365.2422-day year = convention (spec me decide) |
| `dasha/vimshottari/antardasha`, `pratyantar`, `sookshma`, `prana` (4) | ✅ | real formulas; birth-independent by design (`planet` / `start_date` query params) |
| `dasha/vimshottari/current` | ⚠️ | birth-MD ke andar galat AD (C6.3) |
| `dasha/yogini/complete` | ❌ ☐ | generic 36-yr cycle (lords/years sahi), birth-based start nahi |
| `dasha/char/jaimini` | ❌ ☐ | sirf 2 periods (Aries 9y, Taurus 8y), start = dob |

### kp (8)
| Endpoint | Class | Note |
|---|---|---|
| `kp/planets`, `kp/cusps` | ✅ | KP ayanamsa, Placidus; sub-lord table se 0 mismatch |
| `kp/horary/1-249` | ⚠️ | equal-division; 137/249 galat (C6.1) |
| `kp/significators/level-4` | ❌ ☐ | literal grades |
| `kp/house-significators` | ❌ ☐ | har house par same Jupiter/Mercury |
| `kp/ruling-planets` | ❌ ☐ | literal ("real-time" docstring) |
| `kp/horary/1-2193` | ❌ ☐ | `seed/2193*360` |
| `kp/event-analysis` | ❌ ☐ | literal verdicts ("Clear victory…") |

### lalkitab (5)
| Endpoint | Class | Note |
|---|---|---|
| `lalkitab/chart/kundli` | ⚠️ | chart real; `kudrati_debts` constant 6 (C6.9) |
| `lalkitab/blind-halfblind` | ⚠️ | sleeping houses simplified; flags constant (C6.9) |
| `lalkitab/varshphal/chart` | ❌ ☐ | stub (`age // 35`) |
| `lalkitab/debts/rin` | ❌ ☐ | key mismatch → hamesha `[]` |
| `lalkitab/remedies/planet-wise` | 📚 | catalog, 9 me se 3 planets |

### advanced (9)
| Endpoint | Class | Note |
|---|---|---|
| `advanced/jaimini/karakas` | ✅ | independent sort se match |
| `advanced/jaimini/karakamsha` | ❌ ☐ | AK real, "Sagittarius (Navamsha of AK)" hardcoded |
| `advanced/jaimini/arudhas` | ❌ ☐ | 3 literal ("12" claim) |
| `advanced/upagrahas` | ❌ ☐ | 4 literal longitudes |
| `advanced/tajik/varshphal-chart` | ❌ ☐ | stub (solar return chart nahi) |
| `advanced/tajik/muntha` | ❌ ☐ | `years % 12 + 1` "house", Varsha Lagna nahi |
| `advanced/tajik/varshesh` | ❌ ☐ | saare 7 planets ki list |
| `advanced/tajik/yogas` | ❌ ☐ | 2 literal ("16" claim) |
| `advanced/tajik/sahams` | ❌ ☐ | 4 literal ("36" claim) |

### dosha-matching (10)
| Endpoint | Class | Note |
|---|---|---|
| `dosha-matching/manglik` | ⚠️ | 5 checks ("20+" claim) (C6.8) |
| `dosha-matching/kalsarpa` | ⚠️ | detection sahi, type galat (C6.2) |
| `dosha-matching/matchmaking/ashtakoot` | ⚠️ | 7/8 kootas galat (C2) |
| `dosha-matching/sade-sati/status` | ❌ ☐ | literal dict |
| `dosha-matching/sade-sati/timeline` | ❌ ☐ | fixed 2002–2009, 2032–2034 |
| `dosha-matching/pitra-dosha` | ❌ ☐ | hamesha "no dosha" |
| `dosha-matching/guru-chandal` | ❌ ☐ | hamesha "no dosha" |
| `dosha-matching/matchmaking/exceptions` | ❌ ☐ | har couple par cancellations `true` |
| `dosha-matching/matchmaking/dashakoot` | ❌ ☐ | hamesha 8.5 |
| `dosha-matching/matchmaking/papasmya` | ❌ ☐ | literal 14.5 / 15.0 |

### remedies (7)
| Endpoint | Class | Note |
|---|---|---|
| `remedies/gemstones` | ⚠️ | simplified rule, disclaimer chahiye (C6.11) |
| `remedies/rudraksha` | ⚠️ | `lang=hi` par galat (C6.11) |
| `remedies/mantras` | 📚 | catalog |
| `remedies/gemstones/restrictions` | ❌ ☐ | sab ko "Diamond prohibited" |
| `remedies/yantras` | ❌ ☐ | 2 generic items |
| `remedies/donations` | ❌ ☐ | 2 planets literal |
| `remedies/fasting` | ❌ ☐ | 2 generic items |

### numerology (8)
| Endpoint | Class | Note |
|---|---|---|
| `numerology/core-numbers`, `numerology/loshu-grid` | ✅ | Rahul→8; 1995-10-05→5/3 |
| `numerology/missing-numbers` | ⚠️ | generic template remedies (C6.12) |
| `numerology/name-analysis` | ⚠️ | Pythagorean hardcoded 6, object/number type mix (C6.12) |
| `numerology/forecast` | ⚠️ | personal year real; theme constant |
| `numerology/favorable` | ⚠️ | colors/days/avoid constant (C6.12) |
| `numerology/name-correction` | ❌ ☐ | literal suggestions (`+a`, `+h`, fixed numbers) |
| `numerology/pinnacles-challenges` | ❌ ☐ | fully hardcoded |

### western (7)
| Endpoint | Class | Note |
|---|---|---|
| `western/tropical-planets`, `western/big-three`, `western/aspects/matrix` | ✅ | swisseph se exact |
| `western/chart/wheel-svg` | ⚠️ | decorative (C6.13) |
| `western/synastry/score` | ❌ ☐ | literal 84.5; partner params unused |
| `western/transits/daily` | ❌ ☐ | 2 literal transits |
| `western/solar-return` | ❌ ☐ | literal moment / Scorpio / house 8 |

### pdf (8) 📄
`pdf/kundli/basic`, `pdf/kundli/brihat` — job banta hai, render simulated (C4). `pdf/matching/report`, `pdf/varshphal/annual`, `pdf/lalkitab/full`, `pdf/dosha/sade-sati`, `pdf/numerology/report` — kaam schedule hi nahi karte (C4). `pdf/preview/html` — Pass 3: synchronous HTML (D1 chart + planet table, koi PDF nahi), Jinja autoescape ✓, `primary_color` CSS-context unvalidated (C8).

### GET (5)
`/health`, `/ready` ✅ · `core/geo/search` ❌ (C7) · `core/geo/timezone` ❌ (C7) · `pdf/status/{job_id}` ⚠️ (ownership check nahi, in-memory jobs — C4).

---

## Appendix D — Next.js API: 25 routes ka auth map (Pass 3)

`frontend/src/middleware.ts` ka matcher sirf page routes (`/admin`, `/dashboard`, `/api-keys`, … `/login`) cover karta hai — **`/api/*` nahi**, isliye har route ko khud authorize karna padta hai. Neeche "Auth" = route file me `requireAdminSession()` (admin), `getVerifiedSession()` (user) ya `x-internal-secret` ki maujoodgi. Sab auth helpers `frontend/src/lib/authGuard` se aate hain jo repo me nahi hai (C5) — inki implementation verify nahi hui. Ye map `14_nextjs_auth_map_check.py` se regenerate + gate hota hai (unauthenticated writes allowlist ke bahar → FAIL).

| Route | Methods | Auth | Findings |
|---|---|---|---|
| `admin/addons` | GET, POST, DELETE | admin | S22 (no audit), S23 (NaN / negative price, DELETE id lowercase nahi) |
| `admin/data` | GET, PATCH | admin | S17 (`pdf_jobs` me full user), S22 (`actorUserId: "admin_super"`), S23 (`planTier` unchecked, addons label) |
| `admin/reports` | GET | admin | B7 (GSTR-1 CSV invalid, negative rows, CSV-escape nahi), B10 (500-row sample) |
| `admin/seed` | POST | internal secret (+ prod lock) | S15 / S18 (placeholder secrets create), STARTER `priceMonthly: 0` (§7) |
| `admin/settings` | GET, POST, DELETE | admin | S18 (secrets plaintext, GET me create), S22 (no audit) |
| `admin/stats` | GET | admin | B7 (revenue sum me negative rows), B10 (`failedJobs24h` all-time) |
| `auth/session` | POST, DELETE | public | S20 (register unthrottled, XFF, no verify, no revocation), S27 (extra route export) |
| `billing/invoice/[id]` | GET | user (owner ya admin) | **S16 (stored XSS)**, B8 (GST compliance) |
| `billing/recharge` | GET, POST | user | **S15**, S26, B9 (hardcoded bonus tiers) |
| `billing/subscribe` | POST | user | S3 (NODE_ENV bypass), S4 (wallet non-atomic), S15 (same scheme) |
| `billing/tiers` | GET | public | theek; par server iske tiers use nahi karta (B9) |
| `internal/settings` | GET | internal secret | S18 (saari settings FastAPI ko), S7 (`!==` compare) |
| `internal/verify-key` | POST | internal secret | S4, S6, S7 |
| `notifications/dispatch` | POST | admin ya internal secret | S23 (empty email, HTML injection, redirect-following webhook, unsigned webhook) |
| `pdf/queue` | GET, POST | user | **S21** (`/api/v1/pdf/generate` exist nahi, fake COMPLETED, unbilled, internal key) |
| `plans` | GET, **POST** | GET public, **POST none** | **S14** |
| `playground` | POST | none (by design) | S1 (fallback master key), S21 (unauthenticated, nonexistent path) |
| `support` | GET, POST | user | S23 (enum → 500, ticket number race `count + 1001`) |
| `support/[id]/reply` | POST | user (owner ya admin) | S23 (user `newStatus` set kar sakta hai) |
| `user/addons` | GET, POST | user | S26 (absolute wallet write), B11 (no expiry) |
| `user/branding` | POST | user | S23 (no validation, error → "success") |
| `user/keys` | POST | user | S22 (rotation unaudited), B6 (single key, no revoke / sandbox / IP allowlist) |
| `user/me` | GET, PATCH | user | **S17 (password hash leak)**, S16 (`taxProfile` / `name` unvalidated), S20 (no session invalidation) |
| `user/team` | GET, POST, DELETE | user | B5 (inert, false "Invitation sent"); IDOR check sahi ✓ |
| `user/usage` | GET | user | B10 (last-100 sample) |

**Tally (25 routes):** admin-session 5 (`admin/addons`, `data`, `reports`, `settings`, `stats`) · user-session 12 (`billing/invoice`, `recharge`, `subscribe`, `pdf/queue`, `support` ×2, `user/addons`, `branding`, `keys`, `me`, `team`, `usage`) · internal-secret 3 (`admin/seed`, `internal/settings`, `internal/verify-key`) · admin **ya** internal 1 (`notifications/dispatch`) · no auth 4 (`auth/session`, `billing/tiers`, `plans`, `playground`). Unguarded **write** paths: `plans` POST (S14 — bug), `playground` POST (by design, S21), `auth/session` register (public by nature, S20).

---

## Appendix E — Python tests ka audit (Pass 3)

`pytest --collect-only` = **39 tests** (`backend/tests/`, 12 files, ~526 lines). Clean clone par 38 pass + 1 fail (`test_all_117_endpoints_live`: `ENVIRONMENT=development` + `NEXT_APP_URL` ke bina 500 — S12). Koi `conftest.py`, `pytest.ini`, fixtures, parametrization, CI nahi. Docs ke test-count claims (37 / 38) vs 39 collected `17_docs_tests_hygiene_check.py` (D2) verify karta hai.

| File | Tests | Kya assert karta hai | Gap (kya nahi pakadta) |
|---|---|---|---|
| `test_astronomy.py` | 4 | ✅ JD 2449995.875 (±0.001), Ashwini / Rohini nakshatra, sign index + degree, Sun Hindi naam `सूर्य`; sign `"कन्या" or "सिंह"` (weak) | Planet longitudes vs reference; ayanamsa |
| `test_advanced_astronomy.py` | 4 | Structure (12 houses, planets present, sunrise ≠ N/A, day > 10 h, Lahiri > 23°) | House-system selection, sunrise value, ayanamsa values |
| `test_dasha.py` | 4 | Mahadasha lord RAHU + Hindi naam (`moon_lon=308.5`, API-computed 307.01 nahi), key presence for AD / PD / SD / PR / running tree | Dates / durations, birth-MD antardasha (C6.3) |
| `test_dosha.py` | 3 | Keys + `0 ≤ score ≤ 36` | **Ashtakoot values (C2), Manglik status, Kaal Sarp type (C6.2)** |
| `test_kp.py` | 4 | ✅ 0.1° → MARS / KETU / KETU; baaki keys | Horary 1–249 values (C6.1) |
| `test_lalkitab_advanced.py` | 4 | Keys, varshphal `target_year == 2025` (stub arithmetic), Jaimini karakas sorted descending, Muntha house 1–12 | Debts logic (C6.9), Tajik (stub) |
| `test_panchang.py` | 2 | ✅ vaar `THURSDAY` / `गुरुवार`; Choghadiya 8 slots, first `SHUBH` | Sunrise-based vaar (C6.4), Panchak / Bhadra, hora, night choghadiya |
| `test_parashari.py` | 3 | Structure (12 houses); SVG contains `<svg` / `D1` | **Varga rules (C3)**, lang / ayanamsa propagation |
| `test_pdf_engine.py` | 1 | HTML contains brand name, colour, `<svg` | PDF generation, job state, refund, R2 |
| `test_remedies_numerology.py` | 5 | ✅ Mulank 5 / MERCURY, Bhagyank 3 / JUPITER; Lo Shu structure; keys | Gemstone rules, rudraksha (hi) |
| `test_western.py` | 4 | ✅ Sun in LIBRA; structure for big-three / aspects / wheel | Aspect values, wheel content |
| `test_all_117_endpoints.py` | 1 | `status in [200, 404]` (GET) / `[200, 202]` (POST), `tested_count == 117`; key `test_verification_key` sirf dev-bypass (S2) se chalti hai; file me UTF-8 BOM | Sirf routing — correctness nahi (C1) |

**Summary:** ~11 / 39 tests me value / semantic assertion; baaki structure / key-presence. **Missing entirely:** negative / invalid-input tests (S13), `verify_api_key` + error-code mapping (S5), quota / wallet flows, SSRF validator (S10), rate limiting (B1), i18n edge / traversal (S24), `custom_openapi`, `/health` / `/ready`, PDF end-to-end, **saare frontend tests** (`package.json` me test script / runner hi nahi), CI. Fix ke saath value tests likhna zaroori hai — warna galat logic dobara "38/38 passed" ke saath ship hoga.
