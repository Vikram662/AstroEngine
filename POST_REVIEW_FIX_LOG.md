# Post-Review Fix Log

Tracks work done against `ASTROENGINE_REPO_REVIEW.md` (the independent audit at commit
`ad5a23e`). That review found the repo's own `BACKEND_PROGRESS.md` claims ("100%
complete, 0 stopgap") didn't hold up under real testing. This log applies the same
discipline in the other direction: nothing below is marked fixed without being
verified against the live server or classical reference formulas, not just read as
source code and assumed correct.

**Repo state at last update:** commit `3564612` (`main`), backend running locally
(`pip install -r requirements.txt` — `timezonefinder`/`pytz`/`pyswisseph` etc. were
missing in this dev environment initially), changes below not yet committed. Local
clone at `C:\xampp\htdocs\AstroEngine`. Every item from the review's "still pending"
list has now been either fixed or verified as already-fixed/stale, including the deep
Shadbala/Bhavabala/Avastha/Ashtakvarga formula-accuracy audit (see below). Only item
still open: the Next.js `pdf/generate` 404 mismatch (frontend-side, not investigated).

**Methodology:** differential testing (same endpoint, two different birth-data
inputs, byte-diff the JSON) was the main tool, cross-checked against source reading
wherever the diff test's own blind spots could produce a false result:
- **False positive** (looks broken, isn't): test sent a param in the JSON body when
  the route actually reads it as a FastAPI query param (`?target_year=`, `?seed=`,
  `?age=`, `?current_name=`, `?event_type=`, `?partner_dob=` etc. are all query
  params on this backend, not body fields) — silently ignored, so both calls hit the
  same default and "looked" static.
- **False negative** (looks fixed, isn't): an endpoint that echoes one input field
  (e.g. interpolates `{target_year}` into an otherwise-fully-hardcoded string) will
  show up as "varies" in a crude diff even though the actual content is still fake.
  Caught by reading source for anything the diff test passed.

---

## Fixed and verified this session

### PDF report engine (design + language)
- Replaced the hand-rolled, Helvetica-only PDF writer (`backend/app/pdf_engine/renderer.py`)
  with a ReportLab-backed engine embedding real Noto Sans fonts per script (Latin,
  Devanagari, Gujarati, Tamil, Telugu, Bengali — files in `backend/app/pdf_engine/fonts/`).
- Fixed the actual language bug: `backend/app/pdf_engine/generator.py` was hardcoding
  `lang="en"` for the chart calc regardless of what the PDF request asked for. Now
  passes the real `lang` through, so planet/sign names render correctly localized.
- Redesigned visual style: minimal neutral palette (white/charcoal/gray), brand
  accent color used as filled shapes (logo badge, stripe, section marks) instead of
  thin lines — a near-black default brand color (`#0f172a`, the real DB-backed
  default from the Next.js branding form) was invisible as a hairline but reads
  fine as a filled badge. Auto-picks white/dark text for contrast via
  `_contrast_text_color()`.
- Verified: all 6 report types (kundli basic/brihat, matchmaking, Lal Kitab,
  Varshphal, numerology) generate correctly in en/hi/gu/ta/te/bn/mr, including
  edge cases like nested parentheses in labels ("GROOM (BOY) PROFILE").

### Genuinely fabricated endpoints (were hardcoded regardless of input)
| Endpoint | Was | Fix |
|---|---|---|
| `numerology/pinnacles-challenges` | Hardcoded pinnacle/challenge numbers | Real Pythagorean formula from DOB (`calculate_pinnacles_challenges`) |
| `western/transits/daily` | 2 hardcoded transit aspects | Real current transiting planets vs natal chart (`calculate_daily_transits`) |
| `western/synastry/score` | Hardcoded `84.5` | Weighted cross-aspect scoring, calibrated against several real chart pairs (`calculate_synastry_score`) |
| `western/solar-return` | Only the year was real; date/ascendant/house all fixed strings | Real solar-crossing moment via `swe.solcross_ut` (`calculate_western_solar_return`) |
| `advanced/tajik/varshesh` | "All 7 planets" as candidates | Real 5-candidate Panchadhikari: Varsha Lagnesh, Muntha Lord, Trirashi Lord, Dinesh, Horesh (`calculate_panchadhikari_varshesh`) |

New shared helper: `find_solar_return_jd()` in `backend/app/core/swisseph.py`, used
by both the Western and Tajik solar-return calculations.

### Ashtakoot Guna Milan (matchmaking) — now 8/8 kootas classically correct
Nadi, Gana, Tara, Bhakoot, and Varna were already correct as of the post-review
`f475bc5` commit. Vashya, Yoni, and Graha Maitri were still crude sign-distance
approximations — replaced with the real classical lookup tables in
`backend/app/modules/dosha_matching/calculator.py`:
- **Vashya**: real 5-group compatibility (Chatushpada/Manava/Vanachara/Jalachara/Keeta)
- **Yoni**: real 27-nakshatra → animal mapping (14 animals) + classical enemy pairs
- **Graha Maitri**: real Panchadha Maitri (natural friendship between Moon-sign lords)

Sanity-checked: identical charts correctly max every koota except Nadi (which
correctly *should* show Nadi Dosha for identical nakshatras — not a bug).

### Divisional charts (D2–D60) — verified correct, no fix needed
Spot-checked `compute_varga_sign()` against every rule in the review's own
Appendix A6 classical reference table (D2 Hora through D60). All correct. This was
already fixed since the review's baseline; the review's "12/16 wrong" finding no
longer applies.

### panchang/muhurat date parameter
Added an explicit `date` field to `BirthDataRequest` (`backend/app/schemas/common.py`).
Previously you had to know to repurpose `dob` (Date Of Birth) to mean "the calendar
date to compute panchang for" — confusing since panchang isn't tied to anyone's
birth. All panchang/muhurat routes now prefer `date` when provided, falling back to
`dob`. (The underlying date-dependence already worked correctly — this was a
naming/discoverability fix, not a bug fix.)

### Geo endpoints (C7) — verified correct, no fix needed
`core/geo/search` and `core/geo/timezone` (`backend/app/modules/core_astronomy/router.py`)
were rewritten since the review's `ad5a23e` baseline (commit `f475bc5`) to a ~100-city
static table + live OpenStreetMap Nominatim lookup + `timezonefinder`/`pytz` for real
IANA offsets. Live-tested against the review's own failing cases and more: Shillong,
Reykjavik, Nairobi (city search — real coordinates, not Delhi), and timezone for
Kathmandu-adjacent/Sydney/mid-Pacific-ocean coordinates — all correct, no Delhi
fallback anywhere. The finding was already stale; `timezonefinder`/`pytz` just weren't
installed in this dev environment (now are, via `pip install -r requirements.txt`).

### core/houses/cusps — Sripati now real, unknown house_system/ayanamsa now reject
`backend/app/modules/core_astronomy/advanced_astronomy.py`. Two parts to the original
finding: (1) "hardcoded to Placidus" was already stale — the router correctly reads
`req.house_system` and produces genuinely different cusps per system (verified live
for Placidus/Sripati/Equal/Whole-Sign/Koch). (2) "Sripati = Porphyry" was real — fixed
with `_porphyry_to_sripati()`, implementing the classical definition (confirmed against
Astrodienst's own house-systems reference, fetched live): compute Porphyry cusps, then
move each house's cusp to the midpoint of the *previous* house's span. Verified the
Ascendant/MC now differ from the house 1/10 cusps under Sripati, as the classical
system requires. Also added 422 validation for unknown `house_system`/`ayanamsa`
instead of silently substituting Placidus/Lahiri while echoing the invalid requested
name back in the response.
**Bonus bug found via this fix:** `BirthDataRequest.ayanamsa` schema accepts
`"KRISHNAMURTI"` as a documented literal, but `AYANAMSA_MODES` only had the key `"KP"`
— any request using the documented `KRISHNAMURTI` value silently fell back to Lahiri.
Fixed in `backend/app/core/swisseph.py` (added `"KRISHNAMURTI"` as an alias for the
same `swe.SIDM_KRISHNAMURTI` mode). This affects every endpoint that accepts
`ayanamsa`, not just houses/cusps.

### core/sun-moon/timings — upper-limb sunrise/sunset
Removed `swe.BIT_DISC_CENTER` from the Sun/Moon rise-set calls in
`advanced_astronomy.py::calculate_sun_moon_timings` (defaults to swisseph's standard
upper-limb + refraction convention). Verified: Delhi 2026-09-19 sunrise now
`06:07:56`, exactly 72s earlier than the old disc-center value the review measured
(`06:09:08`) — matches the review's ~73s figure.

### Panchang — end-times, Abhijit, Bhadra loka, Panchak
`backend/app/modules/panchang/calculator.py`. All share the same shared
`calculate_sun_moon_timings` helper, so the sunrise fix above also fixes Vaar/Hora/
Choghadiya/Muhurat sunrise timing here for free.
- **Vaar (weekday)** was already sunrise-based on `main` (fixed in a commit prior to
  this session, `def6730`) — stale finding. Verified live: Delhi 2026-09-19 03:00 →
  `FRIDAY` (matches the review's expected classical value; civil weekday would say
  Saturday).
- **Hora** was already temporal (`(sunset−sunrise)/12` day, separate night span) —
  stale finding, already fixed.
- **Choghadiya** was already returning both 8 day + 8 night slots — stale finding
  (review said day-only), verified live.
- **`panchang/daily` end-times** — added. Tithi/Nakshatra/Yoga/Karana each now
  include an `end_time` (`YYYY-MM-DD HH:MM:SS` local), computed via Newton-style
  root-finding on the relevant Sun/Moon angle using instantaneous speed as the
  derivative (`_find_next_boundary`). This was a genuine gap, not a stale finding.
- **Abhijit Muhurat** — was a fixed ±24min window; now `(sunset−sunrise)/15`
  (the classical 8th-of-15-muhurta rule), centered on local solar noon. Verified the
  window width now scales with day length instead of being a constant 48 minutes.
- **Bhadra loka** — was paksha-based; now Moon-sign-based per muhurta texts
  (Mesha/Vrishabha/Mithuna/Vrischika → Swarga; Kanya/Tula/Dhanu/Makara → Patala;
  Karka/Simha/Kumbha/Meena → Bhu/Mrityu). Verified live: Moon in Makara (Capricorn)
  during an active Vishti Karana → correctly returns Patala Loka.
- **Panchak** — three sub-bugs fixed: (1) ID typo `"DHANISHTA"` vs the canonical
  `"DHANISHTHA"` used everywhere else in the codebase meant Panchak during
  Dhanishtha's last 2 padas was never detected — this was dead code, now fixed.
  Verified live against the review's exact boundary cases (2026-09-23 22:00 pada 3,
  2026-09-24 06:00 pada 4) — both now correctly `is_active: true`. (2) Type table
  expanded from 2 to the full classical 5 (Raj/Agni/Samanya/Chor/Mrityu/Rog by
  weekday, cross-checked against multiple current almanac sources). (3) Type is now
  computed from the weekday Panchak *started* on (backward Newton search to the
  296°40' crossing), not the weekday of the queried moment.

### Divisional charts — lang bug and moon-lagna were stale; East Indian style added
`backend/app/modules/parashari/router.py`, `calculator.py`. Three parts to the
original C3/C6.10 finding:
- **`lang` positional-arg bug** — stale. Every route (16 individual D-routes,
  `divisional/{varga}`, `chart/svg`) already calls `compute_varga_chart(...)` with
  either correct keyword args or the correct positional order matching the function
  signature `(dob, tob, lat, lon, tz, varga, ayanamsa, lang)`. Verified live:
  `chart/d9` with `lang=hi` returns real Devanagari sign/planet names (मीन, मिथुन,
  सूर्य), not English.
- **`moon-lagna` Moon-in-house-2 bug** — stale. `p_copy["house"] = ((p_sign_idx -
  moon_sign_idx) % 12) + 1` already correctly rebases so the Moon's own sign maps to
  house 1. Verified live: Moon's `house` field is `1`.
- **`chart/svg` North-only** — half-stale. South Indian (fixed sign grid) was
  already fully implemented (not stale from review's view, since it post-dates
  `ad5a23e`, but not on the pending list either — found while checking this). East
  Indian was genuinely missing; added `_EAST_INDIAN_/BENGALI` style to
  `generate_chart_svg()`: same diamond geometry as North Indian, but each
  compartment holds a *fixed* sign (Aries at top, counter-clockwise, confirmed via
  research on the classical Bengali/Odia layout) with the *house* number rotating
  instead of the sign. Verified all three styles (`NORTH_INDIAN`/`SOUTH_INDIAN`/
  `EAST_INDIAN`) render 200 OK with non-trivial SVG output.
- **Bonus fix**: unknown `varga` (e.g. `D99`, `X1`) silently rendered a D1-like
  chart instead of erroring. Added the same 422-on-unknown pattern used for
  `house_system`/`ayanamsa` (`_validate_varga()` in `parashari/router.py`), applied
  to `chart/divisional/{varga}` and `chart/svg`.

### Dasha & KP
- **`dasha/vimshottari/current` running-dasha bug — stale, already fixed.**
  `dasha/calculator.py::get_running_dasha_tree` already computes the birth MD's
  notional start (`md_end − full_years`), builds the full AD list from there, and
  trims to periods overlapping actual life. Verified directly against the review's
  own reference case (the endpoint itself has no `target_date` param, so called the
  underlying function directly with the review's exact test birth — Udaipur
  1995-10-05 14:30): MD = RAHU, end `2013-04-16` (matches, no 171-day overshoot),
  and on 1998-01-01 the running Antardasha is RAHU→JUPITER (matches the review's
  "correct" value, not the old buggy RAHU→RAHU).
- **`kp/horary/1-249` sub-lord table — real, but had a genuine float-precision bug,
  now fixed.** `kp/calculator.py::_generate_kp_249_table()` already implements the
  real unequal Vimshottari-proportional 249-division table (not equal division) —
  spot-checked entry #3 against the review's own reference (3.000°, Sun sub-lord)
  and it matched. But the table had **252 entries instead of 249**: repeated
  float addition of degree spans (243 sub-arcs) drifted by ~1e-13 near three sign
  boundaries (180°/240°/300°), each spuriously detected as "crossing" a boundary
  it had actually landed exactly on, producing 3 extra near-zero-width entries —
  which would silently shift every horary number after each spurious split by one.
  Fixed by rewriting the generator with exact `fractions.Fraction` arithmetic
  (every span is `years/9`, rational) instead of floats. Verified: table now has
  exactly 249 entries, no near-zero spans, entry #3 still matches the review's
  reference, and live `/kp/horary/1-249?seed=1,3,249` all return correct sub-lords.

### Lal Kitab — kudrati_debts and blind/dharmi/andhi flags now chart-based
`backend/app/modules/lalkitab/calculator.py`, `router.py`.
- **`kudrati_debts`** was a constant 6-item list regardless of chart. Each
  `LAL_KITAB_DEBTS` entry already carried a `cause` string (e.g. "Jupiter afflicted
  by Venus/Mercury in 2nd/5th/9th/12th houses") that was never actually evaluated —
  structured it into `main_planets`/`afflicting_planets`/`houses` and added
  `_evaluate_kudrati_debts()`: a debt is active when a main planet sits in one of
  its trigger houses *and* is conjunct one of its afflicting planets there
  (the standard Lal Kitab affliction test). Verified live across two births: debts
  now genuinely differ (Udaipur 1995 → all 6 inactive; Mumbai 1970 → Matri Rin and
  Stri Rin active), not a constant list.
- **`blind-halfblind`**: `andhi_kundli`/`dharmi_kundli`/`rat_ki_andhi` were hardcoded
  `False`/`True`/`False`. Researched and implemented the classical definitions:
  Andhi Kundli = 2+ mutually-enemy planets (reusing the `NATURAL_FRIENDSHIP` table
  from the Ashtakoot fix) with at least one debilitated, in the 10th house; Dharmi
  Kundli = Jupiter and Saturn conjunct in the same house; Raat ki Andhi = Moon
  conjunct a natural-enemy planet (the general "two enemy planets together" Andhi
  mechanism applied to the Moon specifically — the most defensible reading found,
  as sourcing for this specific term was thin). `sleeping_houses` stays
  occupancy-only (empty house) — the review's note that Lal Kitab also weighs
  drishti/aspect before calling a house fully "asleep" is left as a documented gap,
  not implemented, since Lal Kitab's own aspect rules differ from Parashari's and
  weren't confidently sourced. Verified live across two births: all three flags
  genuinely vary (not constant).

### Dosha matching
- **`kalsarpa` type — stale, already fixed.** `dosha_matching/calculator.py::
  calculate_kaal_sarp_dosha` already computes Rahu's *house from Lagna*
  (`((rahu_sign_idx - asc_sign_idx) % 12) + 1`), not just its sign, and indexes
  the 12 type names by that house. Verified live against the review's exact
  reference case (1995-11-04, Delhi): 06:00 → house 1 → Anant; 18:00 → house 7 →
  Takshak — both match the review's classically-correct values exactly (not the
  old buggy "Takshak both times").
- **`manglik`** — docstring/router claimed "20+ classical cancellation checks";
  counted what's actually implemented: 12 (own sign/exalted/debilitated Mars,
  Jupiter conjunction+5th+7th+9th aspect — the review's specific complaint that
  5th/9th weren't checked is already fixed, only conjunction/7th were previously
  missing 5th/9th but that's resolved — house+sign-specific exceptions for
  2nd/4th/7th/8th/12th, 11th-from-Moon, Leo/Cancer Lagna Yogakaraka). Corrected
  the docstrings in `calculator.py` and `router.py` to claim 12, not 20+, rather
  than inventing 8 more rules to hit a round number. Left open: the review's note
  that the own-sign cancellation (checks Mars' sign only) isn't house-specific
  the way BPHS technically requires — not fixed, flagged as a known gap rather
  than guessed at.

### Remedies
- **`rudraksha` lang=hi bug — stale, already fixed.** `remedies/router.py::
  get_rudraksha` already reads `gems["life_stone"]["planet_id"]` (the invariant
  planet ID) rather than a localized name, and `remedies/calculator.py::
  calculate_gemstone_recommendations` returns that raw ID via `get_gem_meta()`.
  Verified live: `lang=hi` and `lang=en` for the same birth return identical
  `ruling_planet` picks (7 Mukhi/Saturn, 10 Mukhi/All-planets, 5 Mukhi/Jupiter).
- **`gemstones`** — added the disclaimer the review asked for as the minimum bar
  (the rule only checks house lordship, not Shadbala strength or functional
  benefic/malefic status for the specific chart — gemstones can amplify a malefic
  planet too). New `disclaimer` field on the response, localizable via
  `translate_entity("remedies_disclaimers", "GEMSTONE", ...)`.

### Numerology — name-analysis was stale; favorable/forecast/missing-numbers now computed
`backend/app/modules/numerology/calculator.py`, `router.py`.
- **`name-analysis` Pythagorean-hardcoded-to-6 — stale, already fixed.**
  `router.py::get_name_analysis` already computes `pythagorean_compound`/
  `pythagorean_single` for real from `PYTHAGOREAN_MAP`, not a constant 6.
- **`favorable`** — `favorable_colors`/`favorable_days`/`neutral_numbers`/
  `avoid_numbers` were constants for every Mulank; only `lucky_dates` varied. Added
  `get_favorable_profile()`: colors/day come from each Mulank's ruling planet
  (1=Sun..9=Mars, the standard Vedic numerology assignment, cross-checked against
  two independent sources), and friendly/neutral/avoid numbers are *derived* from
  the same `NATURAL_FRIENDSHIP` (Naisargika Maitri) table used in the Ashtakoot fix
  rather than hand-typed per number — Rahu(4)/Ketu(7) proxy to Saturn/Mars for this
  (no classical weekday or Naisargika Maitri entry of their own; this proxy
  convention is also what's used for their lucky day). Verified live across two
  Mulanks (5 and 3): both color/day/friendly-number sets differ and are internally
  consistent (e.g. Mulank 3/Jupiter's avoid list is `[5,6]` = Mercury/Venus, its two
  classical enemies).
- **`forecast`** theme was a constant string regardless of the computed personal
  year. Added `PERSONAL_YEAR_THEMES` (1-9 plus master numbers 11/22/33, standard
  numerology cycle meanings). Verified live: year 2026 → personal year 7 →
  introspection theme; year 2030 → personal year 11 → master-number theme.
- **`missing-numbers`** remedies were the same templated sentence for every number
  ("Wear crystal bracelet..."). Added `MISSING_NUMBER_REMEDIES`, one real per-number
  remedy tied to that number's ruling planet. Verified live: a chart missing
  {2,4,6,7,8} now gets 5 distinct, planet-specific remedies.

### Western — chart/wheel-svg was already real, now less bare
`backend/app/modules/western/calculator.py`, `router.py`. The review's premise
("purely decorative, doesn't reflect actual planet positions") was already stale —
`generate_western_wheel_svg` was already plotting each planet at its real tropical
`full_degree`. What the review actually asked for by name (Ascendant, houses, sign
labels, aspect lines) was genuinely missing though. Added: a 12-sign glyph ring
around the rim, a labeled Ascendant spoke (new `get_tropical_ascendant_degree()`
helper, Placidus), and real aspect lines between the actual plotted planets (color/
dash coded by aspect type, reusing the existing `calculate_aspects_matrix`) —
verified live: response grew from a bare wheel to one with the ASC marker, all 12
sign labels, and a dashed opposition-aspect line, confirmed present in the output.
**Not done:** true unequal Placidus house-cusp lines (only the 12 equal 30°
sign-boundary sectors are drawn) — a real house-cusp overlay needs cusp data
threaded through separately and was left for a follow-up rather than approximated.

### Misc — PDF job ownership check added (and a worse bug found alongside it)
`backend/app/pdf_engine/router.py`, `jobs_db.py`. The review flagged
`/pdf/status/{job_id}` as having no ownership check. While fixing it, found
**`/pdf/download/{job_id}` had no authentication at all** — not even an API key
was required, so it was strictly worse than the flagged endpoint. Fixed both:
- Every job-creation endpoint (7: kundli basic/brihat, matching, varshphal,
  lalkitab, sade-sati, numerology) now records `owner_key_hash` (SHA-256 of the
  creating request's `x-api-key`, reusing the existing `hash_api_key()` — raw keys
  are never stored) on the job.
- `owner_key_hash` added as a real SQLite column (`jobs_db.py`, with a migration
  for already-created dev databases) since `PDF_JOBS` *is* the SQLite-backed
  `jobs_store` (they're the same object, not two stores as the fallback-lookup
  code implied).
- `/status/{job_id}` and `/download/{job_id}` now require the requesting API key
  to match the job's owner (or an internal/master key, same convention as the
  existing rate-limit bypass); `/download/{job_id}` now also requires
  authentication at all, which it previously didn't.
- Jobs created before this fix have no recorded owner — access to those stays
  open rather than retroactively locking everyone out; only new jobs are enforced.
- Verified live: create job with key A → poll/download with key A succeeds (200);
  poll/download the same job with key B → 403; download with no key at all → 401
  (previously would have succeeded with the file streamed to anyone).

### Deep formula-accuracy audit: Ashtakavarga, Avasthas, Shadbala, Bhavabala
This was the review's remaining big item — `shadbala/details`, `bhavabala`, `avasthas`,
`ashtakvarga/bhinnashtak`, `ashtakvarga/sarvashtak`, `special-points`, `yogas/find` all
varied with input already, but formula *correctness* against classical BPHS references
hadn't been checked. Verified/fixed per endpoint:

**`ashtakvarga/bhinnashtak` + `/sarvashtak` — verified correct, no fix needed.** Hand-summed
every one of the 7 planets' benefic-bindu contribution tables in
`calculate_ashtakavarga()` (`parashari/calculator.py`) against the classical per-planet
Ashtakavarga totals (Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52, Saturn
39 — summing to the classical 337 Sarvashtakavarga total). All 7 matched exactly. This
was already a real, correct implementation of the classical bindu-placement tables, not
the "constant scores" / `4 + idx % 4` pattern the original review found.

**`avasthas` — real bug found and fixed.** The Jagradadi Avastha (Jagrat/Swapna/Sushupti)
state was reading a `dignity` field that can only ever be `EXALTED`/`DEBILITATED`/
`OWN_SIGN`/`NEUTRAL` (from `compute_varga_chart`) and checking it against
`["FRIEND", "GREAT_FRIEND"]` for the Swapna state — a value that field can never hold, so
Swapna was dead code; every planet always resolved to only Jagrata or Sushupti. Fixed
by adding a real Panchadha Maitri (5-fold compound relationship) dignity calculator,
`compute_compound_dignity()`, combining Naisargika (natural, existing `NATURAL_FRIENDSHIP`
table) and Tatkalika (temporal, from D1 house distance) friendship toward the occupied
sign's lord, plus real Moolatrikona degree ranges (BPHS) — giving the full
Exalted/Moolatrikona/Own/Great-Friend/Friend/Neutral/Enemy/Great-Enemy/Debilitated scale.
Verified live across two charts that Swapna is now genuinely reachable (e.g. Mumbai 1970
chart: Sun/Moon/Mars/Mercury/Jupiter/Venus/Rahu/Uranus/Neptune/Pluto all resolve to
Swapna), not just the previous two states.

**`shadbala/details` — 4 of 6 components were toy formulas dressed in classical
terminology; rewritten with real, sourced formulas.** Naisargika Bala (fixed classical
table) and the Kendra/Trikona *concept* behind Sthana Bala were already right; Dig Bala,
Kaala Bala, Chesta Bala, and Drik Bala were structurally fake (e.g. Kaala Bala was
literally `130 + house*5`, Drik Bala was `15 if house in [1,5,9,10] else -10` — no
Kaala or Drishti math at all despite the docstring naming 8 and multiple real
sub-components respectively). Formulas cross-checked against the Saravali reference
(`saravali.github.io/astrology/bala_*.html`) and the PyJHora open-source implementation
(`github.com/naturalstupid/PyJHora`, based on P.V.R. Narasimha Rao's *Vedic Astrology: An
Integrated Approach*). Now real:
- **Sthana Bala** = Uchcha + Saptavargaja + Ojayugmarasyamsa + Kendradi + Drekkana Bala,
  all 5 real (Saptavargaja reuses the existing verified `compute_varga_sign` for
  D1/D2/D3/D7/D9/D12/D30 plus the new Panchadha Maitri dignity calculator).
- **Dig Bala**: real distance/3 formula, but the "weakest point" reference is an
  equal-house bhava-madhya approximation (Lagna + (house-1)×30 + 15), since this module's
  houses are whole-sign, not Placidus cusps — documented as an approximation, not exact.
- **Kaala Bala** = Nathonnata + Paksha + Tribhaga + Vaaradhipati + Hora + Ayana Bala, all
  using real sunrise/sunset/declination/weekday data. **Deliberately omitted**:
  Abdadhipati (year-lord, 15 virupas) and Masadhipati (month-lord, 30 virupas) — both need
  a Hindu-calendar ahargana epoch this module doesn't implement, and guessing epoch
  constants risked a confidently-wrong number, which is worse than a documented gap.
  Yuddha (planetary war) redistribution also not computed (rare edge case).
- **Chesta Bala**: Sun's = its own Ayana Bala, Moon's = its own Paksha Bala (both real,
  per BPHS rule, confirmed via Saravali). The other 5 planets use a continuous speed-ratio
  approximation (real instantaneous speed vs. real mean daily motion) anchored to the
  sourced Sama (~7.5) and Chara (~45) values — not the exact classical 8-tier discrete
  classification, whose precise speed-ratio breakpoints weren't confidently sourced.
- **Drik Bala**: real piecewise Sputa Drishti formula (special full-strength aspect zones
  for Mars 4th/8th, Jupiter 5th/9th, Saturn 3rd/10th), summed as
  (benefic aspects − malefic aspects)/4, sourced verbatim from PyJHora's
  `__drik_bala_calc_1`. Moon classified benefic/malefic by paksha; Mercury simplified to
  always-benefic (the classical conjunct-a-malefic flip isn't implemented).

Live-verified: two different birth charts (Udaipur 1995-10-05 14:30, Mumbai 1970-01-15
08:00) produce believable, non-round, genuinely input-dependent totals in the classical
5.6–9.1 rupas range for every planet (previously totals were dominated by round,
house-number-derived arithmetic). Cross-checked Thursday-born Jupiter correctly receiving
Vaaradhipati Bala (45) and the correct Tribhaga segment lord for the birth hour.

**`bhavabala` — Bhava Digbala and Bhava Drishti Bala were also toy formulas; fixed.**
Bhava Digbala used an invented 60/45/30 grouping; changed to the well-sourced Kendra/
Panapara/Apoklima 60/30/15 (same grouping as planetary Kendradi Bala). Bhava Drishti Bala
was `30 + occupants×15` (an occupant *count*, not an aspect calculation); replaced with
the real Sputa Drishti aspect strength received by the house's own bhava-madhya point
from all 7 classical planets, reusing the same formula as Shadbala's Drik Bala.
Bhavadhipati Bala (the house lord's Shadbala) automatically benefits from the Shadbala fix.

**`special-points` and `yogas/find` — reviewed, no formula bugs found.** Gandanta
zones, Pushkar Bhaga degrees, and Pushkar Navamsha sign set all matched classical values.
`yogas/find` checks 10 real yoga definitions (Budhaditya, Gajakesari, the 5 Pancha
Mahapurusha yogas, Chandra-Mangala, Amala, Kemadruma with cancellation) correctly, but the
router docstring still claimed "100+ classical yogas" — corrected to state the actual 10
(same pattern as the earlier Manglik "20+"→12 docstring fix). Also corrected the
`avasthas` router docstring, which claimed a "Deeptadi" avastha that was never
implemented.

### Separately noted, not yet investigated further
- Next.js `api/pdf/queue/route.ts` calls `POST /api/v1/pdf/generate` on the FastAPI
  backend, which doesn't exist (only specific routes like `/api/v1/pdf/kundli/basic`
  exist) — that integration path would 404 in production as-is.

---

## Reference material used
- `ASTROENGINE_REPO_REVIEW.md` — the independent audit, especially Appendix A
  (classical reference tables for Nadi/Gana/Bhakoot/Tara/Varga rules) and Appendix C
  (per-endpoint classification table)
- Prokerala's public OpenAPI spec (`api.prokerala.com/spec/astrology.v2.yaml`) and
  Vedic Rishi/AstrologyAPI's public Postman collections — downloaded for future
  cross-comparison but not yet used (no live API keys available for either service
  at time of writing)
- For the Shadbala/Bhavabala rewrite: the Saravali reference
  (`saravali.github.io/astrology/bala_sthana.html`, `bala_dig.html`, `bala_kala.html`,
  `bala_cheshta.html`, `bala_drig.html`) and the PyJHora open-source implementation
  (`github.com/naturalstupid/PyJHora/blob/main/src/jhora/horoscope/chart/strength.py`,
  itself based on P.V.R. Narasimha Rao's *Vedic Astrology: An Integrated Approach*) —
  fetched and cross-read against each other; PyJHora's actual code was trusted over
  Saravali's prose wherever the two seemed to disagree (e.g. Drik Bala's exact
  aggregation formula), since code is unambiguous and prose summaries can mistranscribe.

---

## Frontend Redesign Plan — public site → consumer Vedic-astrology design (PLAN ONLY, not started)

**Status:** planning document only. No frontend or backend code has been touched for
this item — written per request, to be reviewed and approved before any
implementation begins.

### Why
The public marketing site (`frontend/src/app/page.tsx`, `Navbar.tsx`, `Footer.tsx`)
currently reads as a generic "AI-generated developer SaaS" template: system font,
zinc/slate/indigo palette, dot-grid hero, metric strip, three-icon feature grid,
pricing cards — the standard shape every AI page-builder produces. The backend behind
it is real and already verified (see sections above), but the storefront doesn't
communicate that; it looks templated rather than like a product built by a specific
Vedic astrology company. Goal: reskin the **public-facing pages only** into a warmer,
more human, editorial design in the style of `https://vedicrishi.in/`, while keeping
every other part of the app exactly as it is.

### Explicit scope boundaries
- **In scope:** everything an anonymous visitor sees before logging in —
  `frontend/src/app/page.tsx` (home), `frontend/src/components/Navbar.tsx`,
  `frontend/src/components/Footer.tsx`, `frontend/src/components/LivePlayground.tsx`,
  `frontend/src/app/pricing/page.tsx`, `frontend/src/app/docs/page.tsx`,
  `frontend/src/app/documentation/page.tsx`, `frontend/src/app/demo/page.tsx`,
  `frontend/src/app/login/page.tsx`, `frontend/src/app/globals.css`, plus new
  consumer-facing calculator/horoscope pages described below.
- **Out of scope — do not touch:** `frontend/src/app/(dashboard)/*` (the logged-in
  user/console panel), `frontend/src/app/(admin)/*` (the admin panel),
  `DashboardSidebar.tsx`, `AdminSidebar.tsx`, and all backend code
  (`backend/app/**`). Those stay exactly as they are today — this is a public-site
  visual redesign, not a functional or backend change.
- No backend logic changes are needed for this plan: every "free calculator" section
  proposed below maps to an **already-implemented, already-verified** AstroEngine
  endpoint (list below), so this is wiring + UI, not new astrology math.

### Brand identity: follow the layout, don't copy the identity
Clarified by the user after the first draft of this plan: vedicrishi.in is a
**structural/UX reference only** — page anatomy, section order, information density,
"feels alive not static" patterns (ticker, live chat widget, instant no-signup
tools). It is **not** a source to copy colors, exact typography, or visual identity
from. AstroEngine needs its own distinct look:
- Do **not** reuse vedicrishi's literal `orange-500`/`orange-600` CTA color or its
  exact "Noto Sans everywhere" typography choice as a copy — those belong to that
  brand.
- Pick an **original AstroEngine accent color** in the design-tokens step (Phase 1
  below) — something distinct from both vedicrishi's orange and the current generic
  indigo-on-zinc dev-tool look. Candidate directions to choose from at
  implementation time (final pick is a design decision, not made here): a deep
  saffron/marigold, a maroon-terracotta, or a jewel-tone indigo-plum — anything that
  reads as "warm, human, Vedic" without being an orange clone of the reference site.
  Neutrals (background/text) can still warm up (charcoal-brown text, cream section
  bands instead of stark zinc) since that's a layout/mood pattern, not a copied
  brand color.
- Same rule for type: warmer, more editorial type pairing is fine (e.g. a serif or
  slab-serif accent for headline emphasis words, matching the reference site's
  *pattern* of mixing a serif accent into a sans headline) but pick AstroEngine's own
  font choice rather than defaulting to Noto Sans because that's what vedicrishi
  uses.
- Component shapes (rounded-xl cards, soft shadows, ticker strip, dropdown mega-menu
  nav, DOB-entry hero form, calculator-grid pattern) are layout/UX conventions, safe
  to follow directly — these aren't "the design," they're the section anatomy the
  user asked to replicate.

### Design audit of vedicrishi.in (captured live via browser inspection, 2026-09-22)
Recorded below for structural reference (spacing, component patterns, information
architecture). Per the note above, the specific color/font values here are **not**
to be reused as-is — see "Brand identity" above for what to do instead.
Reference site is a consumer Vedic-astrology portal (Kundli, horoscope, matching,
astrologer chat), not a developer tool — same underlying domain as AstroEngine but a
completely different audience-facing skin.

**Typography & color** (read from computed styles, not guessed):
- Font: `"Noto Sans"` throughout (headings and body) — no serif/mono anywhere.
- H1: ~64px, font-weight 800, near-black (`rgb(17,17,17)`). Body text a warm dark
  charcoal-brown (`rgb(43,38,32)`), not pure black/gray — reads warmer than
  zinc/slate.
- Primary CTA buttons: solid orange (`rgb(249,115,22)` = Tailwind `orange-500`),
  white text, bold, radius 10–12px (not pill, not sharp — soft rounded-xl).
  Secondary/text links use `orange-600` (`rgb(234,88,12)`).
  → maps directly onto Tailwind's existing `orange-500`/`orange-600` scale, no custom
  palette needed.
- Background: white page background with alternating soft off-white/cream section
  bands and white cards on top (shadow, not border-only) — softer than AstroEngine's
  current flat zinc-100/white alternation.
- A gradient promo banner sits above the sticky nav (blue gradient, dismissible,
  "NEW" pill + one-line offer + CTA) and a dark ticker strip below the nav shows
  today's Tithi / Rahu Kaal / a "today's Panchang" link / today's transits — this is
  the single biggest "feels alive, not static" element AstroEngine's current hero
  lacks.

**Section inventory, top to bottom** (this is the section list the user asked to
replicate):
1. **Promo banner** (dismissible gradient strip) + **sticky nav** with dropdown
   menus (Astrology, Matching, Panchang, Chat, Reports, Calculators, Store, Blog) +
   Login/Sign up buttons.
2. **Info ticker** — today's Tithi, Rahu Kaal window, link to full Panchang, today's
   transits — dark strip, always visible under the nav.
3. **Hero, two-column**: left = big headline (plain + one italic serif-accented line)
   + one-line subhead + an inline "enter your DOB → Read My Kundli" form (no
   signup); right = a live "Chat with Astrologer" widget card — astrologer avatar,
   a greeting bubble, 2–3 recommended questions as clickable chips, a free-text
   input, "100% Private" badge.
4. **"Free Astrology Analysers"** — a row of 5–6 simple pill/card links to no-signup
   instant tools (Kundli, Numerology, Lal Kitab, Dhan Yoga, Name Correction, Tithi
   Pravesh).
5. **"Today's Panchang & Transit"** card — full tithi/nakshatra/yoga/karana/Rahu
   Kaal/Abhijit Muhurat grid for today, plus one upcoming "planet enters sign" event
   and a link to a full transit calendar.
6. **"Vedic Calculators"** — a large grid (~24 cards) of free single-purpose
   calculators, each just a title + one-sentence description (Ascendant, Moon Sign,
   Nakshatra, Manglik, Sade Sati, Kaalsarpa, Pitra Dosha, Numerology, Yogini Dasha,
   Gemstone/Rudraksha suggestion, Career/Love/Marriage/Child reports, etc.).
7. **"Today's Horoscope"** — 12 zodiac-sign cards (date range + "today's reading"
   link).
8. **"Chat With Astrologers"** — astrologer profile cards (photo, name, specialty,
   rating, price-per-question, "Start chat" button).
9. **Footer** — 5-column link directory (Core Astrology / Calculators / Tools /
   Premium reports / Ecosystem+API+Blog), app-store badges, a store CTA, legal
   links.

### Mapping: reference-site sections → AstroEngine's own (already-verified) endpoints
No new astrology logic is required — the backend already covers nearly every tool in
the reference site's calculator grid:

| Reference-site feature | AstroEngine endpoint(s) already implemented |
|---|---|
| Free Kundli / birth chart | `parashari/chart/d1`, `core_astronomy/planets/positions` |
| Manglik Dosha | `dosha_matching/manglik` |
| Kaalsarpa Dosha | `dosha_matching/kalsarpa` |
| Sade Sati Check | `dosha_matching/sade-sati/status`, `.../timeline` |
| Pitra Dosha | `dosha_matching/pitra-dosha` |
| Kundli Matching (Ashtakoot) | `dosha_matching/matchmaking/ashtakoot` (verified 8/8 correct, see above) |
| Numerology (Life Path/Destiny) | `numerology/core-numbers`, `.../forecast` |
| Name Correction Analyser | `numerology/name-correction`, `.../name-analysis` |
| Lal Kitab Analysis | `lalkitab/chart/kundli`, `.../debts/rin`, `.../remedies/planet-wise` |
| Dhan Yoga Analyser | `parashari/yogas/find` |
| Yogini Dasha | `dasha/yogini/complete` |
| Gemstone / Rudraksha Suggestion | `remedies/gemstones`, `remedies/rudraksha` |
| Today's Panchang / Tithi / Rahu Kaal / Muhurat | `panchang/daily`, `.../choghadiya`, `.../hora` |
| Today's / Weekly / Yearly Horoscope | `panchang/horoscope/daily`, `.../weekly`, `.../yearly` |
| Chat with Astrologer | `ai_astrologer/ask`, `.../quick-insights`, `.../suggested-prompts` |
| Tarot card of the day | `tarot/daily-card` (bonus — reference site doesn't even have this) |

Where the reference site sells a paid human-astrologer chat, AstroEngine's own
`ai_astrologer` module already does an AI equivalent — same UI slot, different
backend, no new engineering beyond wiring the existing `/ask` endpoint into the chat
widget.

### Phased implementation steps (for when this plan is approved)
1. **Design tokens** — define an **original** AstroEngine accent color (not
   vedicrishi's orange — pick from the candidate directions in "Brand identity"
   above, e.g. saffron/marigold or maroon-terracotta or indigo-plum), plus warm
   charcoal-brown text instead of zinc/slate and softer off-white section bands,
   larger card radii + shadow, in `globals.css`. Choose AstroEngine's own font
   pairing (not a copy of "Noto Sans everywhere") via `next/font/google`. No
   component logic changes in this step — tokens only, so the palette choice can be
   reviewed before it ripples into every component.
2. **Navbar + promo banner + info ticker** — rebuild `Navbar.tsx` with the
   dropdown-menu structure (Astrology/Matching/Panchang/Chat/Reports/Calculators),
   add the dismissible gradient promo strip and the live Tithi/Rahu-Kaal ticker
   (sourced from `panchang/daily`, computed for "today" server-side or on mount).
   Keep the existing "Console" / "Sign in" links, just restyled.
3. **Hero rebuild** — two-column layout: DOB-entry "Read My Kundli" form on the
   left wired to the D1 chart endpoints; the AI-astrologer chat widget on the right
   wired to `ai_astrologer/ask` + `/suggested-prompts`.
4. **Free calculators grid** — new route(s) under `frontend/src/app/calculators/`
   (or a single dynamic `[tool]` route) rendering the ~24-card grid, each card
   linking to a lightweight result page that posts to its mapped endpoint from the
   table above.
5. **Panchang/transit widget** — new component pulling `panchang/daily` +
   `panchang/choghadiya`/`hora`, styled as the reference site's tithi/nakshatra/
   yoga/karana/Rahu-Kaal/Muhurat grid.
6. **Horoscope section** — 12 zodiac cards linking to `panchang/horoscope/daily`
   result pages (weekly/yearly as secondary tabs).
7. **Footer rebuild** — restructure `Footer.tsx` into the 5-column consumer link
   directory, keep the existing dynamic company-info wiring (`/api/settings/public`)
   for address/contact/social, drop the "ENTERPRISE"/API-console framing from this
   footer only (that framing can stay inside the dashboard if wanted).
8. **Pricing/docs pages** (`pricing/page.tsx`, `docs/page.tsx`,
   `documentation/page.tsx`) — restyle to match the new palette/typography for
   visual consistency; content/structure unchanged.
9. **QA pass** — verify responsive behavior (mobile-first, the reference site is
   clearly designed mobile-first), verify every calculator card's result actually
   round-trips through its real backend endpoint (not a placeholder), verify
   `(dashboard)` and `(admin)` routes are visually untouched.

Each phase should land as its own reviewable change rather than one large rewrite,
given the size of the surface area (9 phases, ~24 new calculator surfaces).
