# AstroEngine review — verification scripts

`../../ASTROENGINE_REPO_REVIEW.md` (my-app root) ke findings ko dobara verify karne ke scripts (17 + runner).
Fix ke baad inhe chalao — jo script FAIL tha wo PASS (exit code 0) hona chahiye. Ye **gate G1 / G2** ka evidence hain.

> Ye scripts AstroEngine repo ke **andar nahi** hain. Repo ke `backend/` folder se chalao (neeche dekho).
> Ye sirf read/compute karte hain — repo ya DB me kuch write nahi karte.

## Setup (ek baar)

```powershell
cd <AstroEngine>\backend
python -m venv ..\.venv            # ya apna existing venv
..\.venv\Scripts\activate
pip install -r requirements.txt    # pytz (script 11) aur pyswisseph isi me hain
```

Scripts **14, 15, 17** repo ke `frontend/` aur root docs bhi padhte hain: repo root = `backend/` ka parent (`..`) maana jata hai;
alag jagah ho to `ASTRO_REPO_ROOT` set karo (`$env:ASTRO_REPO_ROOT = "C:\path\to\AstroEngine"`). Folder nahi mila to script
exit code `2` ("SKIP") deti hai. Script **17** ka D7 (`npm audit`) npm registry ko dependency list bhejta hai — offline / privacy
ke liye `--no-network` (ya `ASTRO_OFFLINE=1`) se skip karo.

## Run (har baar, `backend/` folder se)

```powershell
$S = "C:\xampp\htdocs\my-app\docs\astroengine_review_scripts"
python "$S\run_all.py"             # sab 17 scripts + PASS/FAIL table
python "$S\run_all.py" 14 15 16 17 # sirf chune hue (number se)
python "$S\run_all.py" -v          # har script ka poora output bhi
python "$S\06_kp_check.py"         # ya koi ek script seedha
```

Exit code `0` = PASS, `1` = FAIL. Scripts `ENVIRONMENT=development` aur `NEXT_APP_URL=http://127.0.0.1:9`
(dead port → `/docs` ka blocking plans-fetch turant fail hota hai) `setdefault` se set karte hain;
apna value pehle se set ho to wahi use hota hai. Auth `dependency_overrides[verify_api_key]` se bypass hota hai
(taaki sirf calculation logic test ho) — isliye dev-bypass (finding S2) hatane ke baad bhi scripts chalte rahenge.

## Scripts

| Script | Kya check karta hai | Review finding |
|---|---|---|
| `01_probe_endpoints.py` | Sab 117 routes 200/202 dete hain? (`--real-auth` se `verify_api_key` ke through, Next app ya stub chahiye) | S12, route count |
| `02_differential_test.py` | 2 alag births → same output? (heuristic; `ALLOW_STATIC` me legit-static paths daalo) | C1 (Pass 1) |
| `03_accuracy_check.py` | Planets/Asc/Panchang vs raw `pyswisseph` (Lahiri, mean node) | §2 (working) |
| `04_ashtakoot_vimshottari_check.py` | Nadi 27×27, Gana 27×27, Bhakoot 12×12, Vimshottari vs classical | C2 |
| `05_varga_check.py` | 5 sections: A natural births (independent reference), B synthetic sweep (har sign × har varga-segment ± boundary), C API-level (routes, `lang=hi`, `ayanamsa`, unknown varga), D house/houses consistency, E ayanamsa function-level | C3 |
| `06_kp_check.py` | KP: reference 249-table build; `get_kp_sub_lord` 20,000 random longitudes; horary 1–249 vs table | C6.1 |
| `07_kaal_sarp_check.py` | Kaal Sarp type = Rahu ki **house** (Lagna se) — 12 time slots par | C6.2 |
| `08_running_dasha_check.py` | Birth Mahadasha ke andar running Antardasha (notional start) + AD list end vs MD end | C6.3 |
| `09_panchang_check.py` | Sunrise-based vaar, Panchak (Dhanishta pada 3/4), night Choghadiya, temporal horas, tithi end-time (+ sunrise gap INFO) | C6.4–C6.7 |
| `10_fabricated_endpoints_probe.py` | 13 probes (monthly-calendar dates, marriage muhurat, exceptions, event-analysis, bhav-chalit, moon-lagna, Char dasha, Lal Kitab, rudraksha hi, name-analysis, restrictions) + `--require-501` (45 fabricated paths) | C1, C6 |
| `11_geo_check.py` | Geo search (unknown city ≠ Delhi) aur timezone vs `pytz` (DST + historical; `date` query param bhejta hai) | C7 |
| `12_input_validation_check.py` | Invalid `dob` / `tob` / `tz` / `ayanamsa` → 422 (500 ya silent 200 nahi) | S13 |
| `13_spot_checks.py` | **Regression** — jo sahi nikla wo sahi rahe (Jaimini karakas, Western, numerology, Choghadiya, Rahu Kaal) | §2 (Pass 2) |
| `14_nextjs_auth_map_check.py` | Next.js 25 routes ka handler-level auth map (static): unauthenticated writes, missing `@/lib/*`, frontend ke nonexistent backend paths | S14, S21, C5, Appendix D |
| `15_nextjs_security_patterns_check.py` | 19 static pattern checks: password-hash leak, invoice XSS, Razorpay secret / order / webhook, placeholder secrets, seed creds, audit, NODE_ENV gate, wallet write, route exports, catch-success, secrets masking, register throttle, schema-only fields, bonus tiers | S15–S23, S26, S27, B5, B6, B9 |
| `16_backend_lang_ephemeris_check.py` | `lang` path traversal / unknown lang / cache bloat; `/ready` vs ephemeris; Moshier fallback (WARN) | S24, S25 |
| `17_docs_tests_hygiene_check.py` | Docs coverage (37/115 paths), test-count aur endpoint-count claims, env vars documented, hygiene (pins, Docker, CI, migrations, tests, unused deps), `--workers` vs in-memory jobs, `npm audit` | §6, Appendix E, S27 |
| `run_all.py` | Upar ke sab chalata hai, PASS/FAIL table | — |

Reference tables/rules: `ASTROENGINE_REPO_REVIEW.md` → Appendix A. Pass 2 ka method: Appendix B (06–13), Pass 3: Appendix B (14–17).

## Baseline @ commit `ad5a23e` (fix se pehle) — `run_all.py`: **3 PASS, 14 FAIL**

| Script | Exit | Result |
|---|---|---|
| 01 | 0 | 117/117 (1 = `pdf/status/{job_id}` 404 expected). `--real-auth` + `NEXT_APP_URL` unset → 115/117 500 |
| 02 | **1** | 112 POST: 60 input-dependent, **45 identical**, 7 non-200 (PDF 202). Per-endpoint classification (heuristic ke 9 false-positive + 9 miss ke saath): review md Appendix C |
| 03 | 0 | Planets/Asc worst diff 0.0000°; tithi 12, nakshatra 24, yoga 9, vaar THURSDAY sab match |
| 04 | **1** | Nadi 160/729 pairs galat; Gana 242/729; Bhakoot 24/144 (distance 5, 9 miss); Vimshottari PASS |
| 05 | **1** | Sections A, B, C, E FAIL; D OK. **A:** D1, D9, D12, D60 = 39/39; D2 2, D3 15, D4 14, D7 21, D10 21, D16 10, D20 3, D24 4, D27 9, D30 1, D40 3, D45 10. **B (sweep):** wahi 12 galat, D1/D9/D12/D60 100% (boundaries samet). **C:** route mapping OK; `lang=hi` **30/32** routes par ignore; `ayanamsa` API se ignore; unknown varga (D99, D5 …) 7/7 → 200. **D:** 0/1728 violations. **E:** ayanamsa IGNORED (Asc + 0/288 planets) |
| 06 | **1** | Reference 249 rows ✓; `get_kp_sub_lord` 0 / 20,000 mismatch; **horary: 137/249 galat tuple, 131/249 galat sub-lord**, max start-degree error 2.26° |
| 07 | **1** | 1995-11-04: API hamesha `Takshak`; **11 / 12 time slots mismatch** (sirf 18:00 par coincide) |
| 08 | **1** | Birth MD (RAHU 1995-10-05): **30 / 141** sampled dates par AD galat; AD list MD end se **171 din** aage |
| 09 | **1** | 7 checks FAIL: vaar 03:00 → SATURDAY; Dhanishta pada 3/4 inactive; Choghadiya day only; hora 3600 s vs 4177 s, hora #13; tithi end-time nahi. INFO: sunrise +73 s |
| 10 | **1** | **0 / 13** probes OK; `--require-501`: 0 / 45 paths 501 dete hain |
| 11 | **1** | 10 checks FAIL: search Udaipur / Kathmandu / nonsense → Delhi; tz Kathmandu, Kabul, NY Sep, London Jul, Sydney Jan, Adelaide Jan, Delhi 1943 |
| 12 | **1** | 9 / 14 cases FAIL (dob → 500; tob 25:99 / 12:60 → 200; tz ±99 → 200; ayanamsa FOO → 200) |
| 13 | 0 | Sab 7 regression checks OK |
| 14 | **1** | A1 FAIL: `plans` POST + `playground` POST bina auth; A3 FAIL: 7 `@/lib/*` modules missing (`apiKey`, `authGuard`, `email`, `prisma`, `session`, `ssrf`, `webSession`); A4 FAIL: `/api/v1/matchmaking/ashtakoota` (playground route + docs page + LivePlayground), `/api/v1/pdf/generate` (pdf/queue) FastAPI me nahi. INFO: middleware `/api/*` cover nahi karta |
| 15 | **1** | **0 / 19** checks OK — S17 (`user/me`, `admin/data`), S16 (invoice raw ×6), S15 (DB-secret ×3 routes, no Orders API, no webhook), 13 placeholder-secret hits, S19 (4 creds + 2 unsalted SHA-256), S22, S3 ×3, S26, S27 ×2, S23 ×2, S18, S20, B5, B6 (10/10 fields unused), B9 |
| 16 | **1** | L1 / L2 / L3 / E1 / E3 FAIL (traversal Hindi locale load karti hai; `fr` / `zz` → 200; cache 20 entries; `/ready` galat EPHE_PATH par bhi ready; `ret_flag` kabhi test nahi hota). E2 WARN: ephe/ nahi, Moshier (`retflag` 4) |
| 17 | **1** | D1 37/115 paths documented (78 undocumented); D2 claims 37 / 38 vs 39 collected; D3 "37 Endpoints" vs 117; D4 12/17 env vars undocumented; D5 13/13 deps unpinned + Docker / CI / migrations / frontend tests / `.env.example` nahi + redis, timezonefinder unused; D6 `--workers 4` + in-memory `PDF_JOBS`; **D7 OK** (`npm audit`: 0 vulnerabilities) |

**Fix ke baad expected:** 01–17 sab exit 0. Jab tak koi endpoint 501 rakha gaya hai, `10 --require-501` PASS hoga par
uske probes (jo real behaviour maangte hain) tab tak FAIL rahenge — implement karne par hi PASS.

## Limits (dhyan rakhna)

- **03 aur 05 ka reference wahi library (pyswisseph)** hai → wrapper sahi hai ye prove hota hai; ayanamsa / house system / mean-vs-true node spec ka decision hai.
- **D30 reference** standard BPHS Trimshamsha mapping hai; apne reference software (Jagannatha Hora / Drik) se cross-check karo. Varga variants (D2 Jaimini Hora, D3 Jagannatha) chahiye to spec me decide karke `classical()` badlo.
- **04 me sirf wahi kootas** test hote hain jo API output me dikhte hain (Nadi/Bhakoot flag, Gana points). Vashya / Yoni / Tara / Graha Maitri ke lookup tables (Appendix A5) banane ke baad unke golden tests alag likho.
- **02 "identical = static" heuristic hai, dono taraf galat ho sakta hai** (Pass 2 me source padhne par confirm hua): 45 flagged me 9 false positive (4 Dasha sub-period expanders design se birth-independent, 2 legit catalogs, 3 test-data coincidence) aur 9 fabricated endpoints miss (input ki date/name echo karte hain, jaise `panchang/monthly-calendar` Feb ko `2026-02-30` deta hai). Script PASS hona "sab real hai" ka saboot **nahi** — uske liye per-endpoint golden tests (gate G2) chahiye.
- **05:** section A ke 39 placements = 3 births × (Ascendant + 12 bodies: 9 grahas + Uranus/Neptune/Pluto); reference (Julian Day + swisseph) script ka apna hai, repo ke helpers nahi. Outer planets par classical varga rules traditionally lagte nahi, par API unhe bhi varga me rakhta hai — isliye script unhe bhi compare karti hai. **Section B** me `pc.swe` ko sirf script ke process me fake-longitude proxy se replace kiya jata hai (repo ki file nahi badalti); agar `compute_varga_chart` ka internal structure badle (swisseph call ka tarika), to proxy update karna padega. Section C `lang=hi` check tab hi meaningful hai jab `hi.json` locale me planet names hon (script khud detect karke SKIP karti hai). D30 / D2 / D3 conventions ke caveats upar wale bullets me hain.
- **06:** reference 249-table standard KP construction hai (27 × 9 Vimshottari sub-divisions, sign boundary par split → 249 ✓); KP software se ek baar cross-check karo. `kp/horary/1-2193` yahan test nahi hota (sirf 501-gate).
- **07 / 08:** Kaal Sarp classical type-by-house map standard hai. 08 ka reference API ka hi year length (365.2422 d) use karta hai — sirf *logic* compare hota hai, year-length convention (JHora 365.25) spec ka decision hai.
- **09:** Panchak expectation = Moon Kumbha se Revati tak (Dhanishta pada 3–4 …); hora expectation = temporal hours (convention — spec me decide karo, wahi 09 ka standard hai); Bhadra loka (C6.6) test **nahi** hota (convention, sirf code reading). Sunrise convention INFO hai, fail nahi.
- **10:** har probe sirf "sahi behaviour" maangta hai (jaise Feb me `2026-02-30` na aaye); pass hone se endpoint certify nahi hota. Baaki ~30 fabricated endpoints ke liye sirf 501-gate hai — unke probes implement karte waqt add karo.
- **11:** endpoint ko `date` query param chahiye (abhi nahi leta — isliye DST/historical cases FAIL). Expected offsets `pytz` ki tz database se aate hain (pytz purana ho to recent tz-rule changes miss ho sakte hain). Search ke liye real geocoder chahiye.
- **12:** validation sirf `core/planets/positions` (shared `BirthDataRequest`) par test hota hai; `MatchmakingRequest` aur query params (`seed`, `age`, `target_year` …) cover nahi.
- **13:** regression only — fix ke dauran kuch tootne par pata chale.
- **14 / 15 static heuristics hain** (regex / file scan) — "pattern maujood hai" pakadte hain, "runtime me exploit ho sakta hai" prove nahi karte. Fix ke baad code restructure ho jaye (jaise invoice ko template engine par le jao) to pattern gayab hone se check PASS ho sakta hai — asli saboot staging runtime tests (G3 / G5) hain. Route / file ka naam badle to script "route nahi mili" (FAIL) deti hai — tab regex update karo. 14 me `PUBLIC_WRITE_ALLOWLIST` / `PUBLIC_READ_ALLOWLIST` (sirf `auth/session`, `plans` GET, `billing/tiers` GET) jaan-bujh kar chhoti hain — naya public endpoint add karo to socho-samajh kar allowlist me daalo. **`frontend/src/lib` missing hai**, isliye 14 / 15 auth helpers ki *implementation* verify nahi karte (sirf unka istemal).
- **16:** E2 tab tak WARN hai jab tak `ASTRO_REQUIRE_EPHE=1` na do (dev machine par ephemeris files na hon to bhi chalna chahiye); production check me `ASTRO_REQUIRE_EPHE=1` lagao.
- **17:** D1 exact `/api/v1/...` mention dhoondhta hai (path param ke liye ek segment `{x}` se replace karke); D2 / D3 docs me numbers regex se nikalta hai (per-file "(4 tests)" aur HTTP status codes ignore) — docs ka wording badle to regex tune karo. D7 network (registry advisory lookup) use karta hai.
- Next.js flows (auth, payment, quota, wallet) ye scripts runtime me test **nahi** karte — wo gate **G3** (staging E2E) me aate hain.
