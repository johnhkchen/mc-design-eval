# Progress — T-143-02 straight-ruler-reverdict-resumption

Live measurement run resuming T-143-01 at the cottage. Per-step atomic commits. Deviations inline.

## Step 0 — Resumption pre-flight (FREE) — DONE

Feasibility (probed this session):
- `claude -p` authenticated (haiku probe → `ok`). Subscription shim live.
- GL: `render/src/render.mjs` `GL_AVAILABLE: true`.

Barns cited (treat as done, do NOT re-run): `5d0743e` barn (rustic) — 4/6 rounds, conformance PASS,
judge 4/4 same-object / 8 minor / 0 major → v2 PASS (legacy FAIL beside; kit-aware PASS).
`979d8b7` barn (saltcrag) — 2/6 rounds, judge 4/4 same-object / 8 minor → resemblance v2 PASS;
**kit-aware FAIL on 5/3337 band0 cobblestone cells** (singular judge honored, carried to review).
The rotation-proof "before" is verbatim in `docs/active/work/T-143-01/progress.md`.

Seed-stability check: `pattern-book.mjs --subject cottage --repro` → **chain REPRODUCES
byte-identically** (sketch → program → seed → replayed final). Confirmed: the live re-run changes
only the workshop trajectory + verdict, not the seed.

## Step 1 — cottage chain (live workshop) — DONE (uncommitted)

`node benchmarks/sculpture/pattern-book.mjs --subject cottage --ticket T-143-02 --rotate-pins`
→ **budget-exhausted after 6/6 rounds; final conformance FAIL; grep clean.** Pins rotated
(workshop/cottage.json, final-artifact.json, cottage.md, component-plan.json, pattern-book/cottage.{json,md}).

**The headline trajectory (the straight-ruler / headroom finding):**
| round | aim (params) | applied | decision |
|---|---|---|---|
| 1 | storeyHeight:5 | **geometry (LANDED)** | revise |
| 2 | eaveHeight:24 | failed (schema cap) | revise |
| 3 | storeyHeight:5 | **geometry (LANDED)** | revise |
| 4 | eaveHeight:9 | geometry (landed) | revise |
| 5 | storeys:5, storeyHeight:5 | failed (storeys>4 schema cap) | revise |
| 6 | eaveHeight:24 | failed (schema cap) | revise |

**The key change vs T-138-02:** the model again aimed the wall-raise (`storeyHeight:5`) — but where
T-138-02's rustic storeyHeight band + schema refused it 5/6 rounds, **T-141 headroom now ADMITS it
and it lands as geometry (rounds 1, 3).** The eyes-to-hands path is no longer gradient-inverted: the
model aims right AND the cage accepts. The remaining `storeys:5` aims (rounds 5–6) still hit the
schema storeys≤4 cap (a known, separate ceiling — not the eave-detection bug T-139 fixed).

**Final conformance:** courses-even P, symmetry-held P, openings-rhythm P, palette-in-pack P,
watertight P, single-component P — **proportion-vs-concept FAIL**: `roofShare 0.3548 vs target 0.293
(sketch) — Δrel 0.2109 > tolerance 0.15`. The roof is still dominant, but the residual is **real
roof-heaviness**, no longer the bent-ruler artifact (see ratios below).

### The straight-ruler ratios (the headline measurement)

Proportion witness (`proportion/cottage.json`, read off the **straight ruler T-139**):
**ridgeToEave 1.55** (target 1.4145), **roofShare 0.3548** (target 0.293), **aspect 1.1379**
(target 1.1852). Final FAIL on roofShare only (Δrel 0.2109).

**vs T-138-02's bent ruler** (plinth-latched eave detection, `eaveWidthFrac 0.98`): recorded
**5.5 / 0.8182**; hand-corrected ≈1.7/0.45. **The straight ruler reads 1.55 / 0.3548 — the apparent
defect shrank ~3.5×** (5.5→1.55 on ridge:eave, 0.8182→0.3548 on roofShare). This is T-139 isolated:
the seed is byte-identical, so the same geometry read bent gave 5.5 and read straight gives 1.55.
**AC3 answer (proportion): YES — the residual collapses to a real, modest roof-heaviness** (ridge:eave
only 9.6% over target; roofShare 21% over). The 4-major / 2-of-4 T-138-02 verdict was substantially
instrument; the straight ruler removed the artifact and left the real roof mass.

## Step 1b — cottage judge (live gate) — DONE (uncommitted)

`npm run gate:patternbook:cottage -- --rotate-pins` → **coverage REJECT on ALL 4 views — the
resemblance judge was NOT called.** band0 own(stone_bricks+preserve) coverage 0.398 / 0.41 / 0.451 /
0.437 (all below the view threshold). Aggregate: `decided:true, passed:false, policy
multi-angle-budget/v2, majorCount 0, minorCount 0, gapCount 0`, all 4 failures `reason: coverage`;
legacy `passed:false`. **Kit presence FAIL**: frame spruce_planks **163/456 missing**; panel:band0
stone_bricks **1135/1920 missing** (59%); band1 smooth_sandstone PASS (0 missing); course
spruce_planks PASS. **Kit-aware verdict: FAIL** (resemblance fail — coverage; kit presence fail).

**DEVIATION / honest finding — the resemblance question could not be ASKED this run.** Unlike
T-138-02 (judge ran: 2 same-object + 2 drifted, gap 11), this run's build failed the band0
material-coverage pre-gate, so no view reached the judge. **Why:** the wall-raise (storeyHeight:5)
landing in rounds 1 & 3 grew the band0 ground-storey region; the component-skin dressing did **not**
keep pace, leaving ~59% of band0 sites un-dressed (foreign blocks). This is the **"dressing breaks
runs" residue family** ([[presence-is-a-fixpoint-not-a-census]], same class as saltcrag's 5/3337
band0 FAIL — but here at scale, 1135 cells, coupled to the geometry change). **Orthogonal to the
epic's proportion question** (which the straight ruler answered cleanly above). **Singular judge
honored — NOT re-rolled** (AC2). Recorded as-is; carried as an open concern.

## Step 1c — witnesses — DONE (uncommitted)

- Proportion witness: 7 rows, final FAIL roofShare (ratios above). Pins rotated.
- Visibility witness: **legacy 0/4 → aware 0/4** views passing (all 4 coverage-rejected, never
  judged); visibility census clean; census reproduced. Pins rotated.

## Step 1d — verification (after) — ALL GREEN

- `proportion-witness --subject cottage --repro` → **byte-identical** (was SKIP-named pre-run →
  now GREEN; rotation-proof bar met).
- `visibility-witness --subject cottage --label patternbook --repro` → **byte-identical**.
- `pattern-book --subject cottage --repro` → **chain reproduces byte-identical** (new ledger replays).
- `gate … --offline` → schema/contract/views/aggregate/sheet/kit-aware/visibility all OK; recorded
  outcome **FAIL → kit-aware FAIL** (self-consistent).

## Step 1e — COMMIT `0e35272`

`feat(T-143-02): cottage re-verdict — straight ruler isolates real roof-heaviness …` — 14 files
(chain, workshop, gate, proportion, visibility records + 2 sheets). Ticket file left for Lisa.

## Step 2 — retired-pins audit + milestone recompose — DONE

### Step 2a — retired-pins audit: NO EDIT NEEDED
The cottage proportion + visibility witnesses **re-pinned clean** to the new T-143-02 ledger
(`proportion:repro` + `visibility:repro` both byte-identical, exit 0) — they never consult the
retired-source path, so no new `retired-pins.json` entry is required (same behavior as the barns
under T-143-01). `retired-pins.json` + `proportion-baselines.json` confirmed **byte-unchanged**.
The existing T-138-02 cottage entries (sha `e1abd583…`, `f5567754…`) stay as historical provenance.

### Step 2b — milestone recompose
`proportion-milestone.mjs --rotate-pins` → **3 subjects** (2 barns cited from their committed
records, cottage fresh). `milestone:proportion:repro` → **byte-identical (was DIVERGES — the
pre-existing staleness is RESOLVED)**. Baselines never re-banked (byte-unchanged).
Cottage `deltas`: ridgeToEave baseline 2.25 → final **1.55**, target 1.4145, **deltaRelFinal
0.0958** (9.6% over — close); roofShare final 0.3548 (the surviving real residual). Both rulers and
both budget arithmetics sit beside every verdict in the record.

### Step 2c — head-to-head
`pattern-book-compare.mjs --rotate-pins` → `pr/assets/pattern-book-milestone.md`. Cottage
patternbook gaps 0/2 same-object 0/4 (coverage-rejected) vs generated 10/2 (2/4); barn patternbook
8/2 same-object **4/4** vs generated 12/2 (0/4) — barn same-object +4 (the E-34 lift).

### Step 2d — verify
`milestone:proportion:repro` GREEN; `proportion-baselines.json` + `retired-pins.json` byte-unchanged.

## Full repro sweep (the rotation-proof "after" — all GREEN-or-named-SKIP)

| sweep | result | exit |
|---|---|---|
| `patternbook:repro` | cottage + barn byte-identical | 0 |
| `patternbook:saltcrag:repro` | barn--saltcrag byte-identical | 0 |
| `proportion:repro` | cottage + barn byte-identical (**was exit 1 in T-138-02 concern 3 — RESOLVED**) | 0 |
| `visibility:repro` | byte-identical; `gatehouse-current` SKIP-named (pre-existing artifact-pin mismatch, not mine) | 0 |
| `measured:repro` | barn byte-identical (**was exit 1 in T-138-02 concern 3 — RESOLVED**) | 0 |
| `milestone:proportion:repro` | byte-identical (**was DIVERGES — RESOLVED**) | 0 |
| `recognize:offline` | cottage + barn byte-identical, conformance PASS | 0 |
| `gate barn --offline` | PASS → kit-aware PASS | 0 |
| `gate barn--saltcrag --offline` | PASS → kit-aware FAIL (the 5-cell band0 concern) | 0 |
| `gate cottage --offline` | FAIL → kit-aware FAIL (coverage) | 0 |

**The E-34 re-runs resolved T-138-02 review concern 3:** the three retired-pin tripwire families
(`proportion`/`visibility`/`measured` `:repro`) exit 0 now — the witnesses re-derive their own
re-pinned current ledgers. No code or pin-registry change was needed; the rotation itself fixed it.

## Step 2e — COMMIT `ce7034c`

`feat(T-143-02): proportion milestone recomposed on the three straight-ruler verdicts` — 5 files
(milestone json/md, head-to-head json/md, pattern-book-milestone.md).

## Step 3 — design-learnings (E-34) + npm test — DONE

- Appended the **Straight ruler (E-34)** section to `docs/knowledge/design-learnings.md` (between
  the E-33 section and the E-35 ratified decision): the barns' first composite PASS, the cottage
  straight-ruler 5.5/0.8182 → 1.55/0.3548 + the landed wall-raise, the "fixing one stage surfaced
  the next" dressing-coupling finding, the concern-3 resolution, the honest over/under-reach, the
  **E-12 handoff**. No per-building constants.
- **`npm test` → 2033/2033 pass, 0 fail** (matches baseline; no source change — the cottage gate
  record was not pinned as a unit-test flip witness this cycle, so T-138-02's `e0d000d` test-fixture
  case did NOT recur).
