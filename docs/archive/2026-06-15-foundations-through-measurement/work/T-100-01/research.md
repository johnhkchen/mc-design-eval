# T-100-01 kit-aware-gate — Research

## The ticket in one line

The resemblance gate is image-shaped and never *enumerates*: at 512px the judge names "material
zoning" gaps, never "missing trapdoor shutters" — so a kit-presence checker (pure, deterministic)
must verify each kit entry at its grammar sites and return **named gaps**, wired beside the
multi-angle gate (T-093-01) as a companion precondition that cannot be replaced by (and cannot
replace) the resemblance judgement.

## What exists (the three dependencies)

### T-096-01 — kit extraction (`src/form/kit.mjs`, 456 lines, pure)

- `kit/v1` records committed at `benchmarks/sculpture/kit/{cottage,gatehouse}.json`. Shape:
  `{schema, subject, kit:[entry], unidentified, dropped, overrides, overrideRows, diff, stats}`.
- Kit entry: `{block, role, formClass: cube|fixture|rail, whereUsed:[band names ∪
  openings|trim|corners-edges|base|roof], confidence, rationale, flags, valueCheck}`.
  `valueCheck.verdict` ∈ `verified | flagged-mismatch | null (non-cube) | no-swatch | thin-sample`.
- The **cottage kit** (live data the proof runs on): stone_bricks (cube, band0+base, verified),
  cobblestone (cube, flagged-mismatch — never binds), spruce_planks (cube, roof+band1+**trim**,
  verified), smooth_sandstone (cube, band1, verified), spruce_trapdoor (fixture, openings),
  spruce_door (fixture, openings+base), lantern (fixture, openings+base). No rail entry — the
  fence infill is *derived* (see T-099 below). `overrides = {white_terracotta→smooth_sandstone,
  dark_oak_planks→spruce_planks}`.
- Ticket's illustrative gap names ("stripped-log frame") don't match the live cottage kit; the
  real expected absences on the kit-less build are **trapdoor shutters** and **fence infill**
  (the durable skin sealed every window; frame/panel/course cubes are mostly present post-skin).

### T-098-01 — placement grammar (`src/form/placement-grammar.mjs`, 227 lines, pure)

The grammar defines **the sites** the ticket says presence must be verified at:

- `bindKit(kitEntries, {bandNames})` — frame = best cube with `trim` in whereUsed; panel per band
  = best cube covering the band (≠ frame block); course = best cube covering `roof`;
  openingTreatments = ranked fixture/rail entries covering `openings`. A `flagged-mismatch`
  valueCheck entry never binds (`usable`). Ranking: whereUsed-specificity → confidence → block id.
- Sites come from `src/view/frame-lines.mjs`: `frameLines(solid, {floorLines, upperTop, roofKeys})`
  → `cells: Map<"x,y,z" → cornerPost|roofline|floorLine>`; `fieldInstances` = bounded wall fields
  between frame lines per elevation. Geometry from `structuralZones(occ)` (floorLines, upperTop,
  roofKeys) and the roof predicate is shared (`y >= upperTop || roofKeys.has(key)`).
- **Crucial honesty from the live run** (committed `placement-grammar/cottage.json`): frame lines
  are NOT uniformly the frame block. Of 321 frame cells: 181 painted, some `respected` (kept
  declared secondaries, e.g. chimney cobble), `adopted` (line continuity via donor runs),
  `skippedIsolated` (never painted). So a presence check on frame lines must be
  **presence/threshold-shaped, not exhaustive-equality-shaped**.
- NAMED vs SHIPPED space: the grammar ships through `sub` = value-true substitution ∘ kit
  overrides (`skinRec.valueTrue.substitution` ∘ `kitRec.overrides`). Live cottage:
  band0 panel binds stone_bricks but **ships as tuff**; band1 ships smooth_sandstone; frame/course
  ship spruce_planks. A presence checker that demands the *named* kit block on a value-true
  artifact fails on naming, not absence — the shipped mapping is required input.
- The grammar's `openings` instances were **0 on the live cottage** — the durable skin sealed all
  windows, and `openings()` is silhouette-based. Opening sites cannot be read off a sealed target.

### T-099-01 — opening dressing (`src/view/opening-dressing.mjs`, 464 lines, pure)

- `treatmentsFromKit(kitRecord)` → slots `{infill, shutter, door, light, frame}`; cottage:
  infill = **spruce_fence (derived-species-fence** — no rail in kit), shutter = spruce_trapdoor,
  door = spruce_door, light = lantern, frame = spruce_planks (kit-trim).
- `extractApertures(refOcc)` — apertures measured on the **RAW reference** artifact
  (`concept-materials/cottage/after-artifact.json`), the openings the concept declared (E-25
  openingRegions precedent). Returns world-space `{dir, kind, bbox, cells, flanks, lintel, sill,
  perim, region}`. Cottage: 6 windows on ±x, 0 doors (doorway is not a through-hole — named
  honesty row, detector gap deferred to S-101).
- `dressOpenings(targetOcc, apertures, treatments)` → placements + perOpening reports with named
  conflicts (e.g. `shutter-no-jamb-left`); dressed artifact committed at
  `dress-openings/cottage/artifact.json`. Live cottage acceptance: 6/6 windows infilled, 3 fully
  shuttered, 9/12 shutter sides (3 honest no-jamb misses on floating panes).
- `openings(occ, dir)` (`src/view/structural-read.mjs:153`) runs on the SOLID view, so a
  fence-dressed aperture **re-detects as a window** and reports `dressing: {cells, blocks[]}` —
  the fixture blocks projected inside the component. Shutters sit one cell proud of the facade
  *outside* the aperture's (u,v) cells, so they do NOT appear in `dressing.blocks`; shutter
  presence needs flank-site probing (the aperture's `flanks` world cells), not `openings()` alone.

## The gate to wire beside (T-093-01)

- Pure core `src/form/multi-angle-gate.mjs`: fixed per-view judge prompt, `parseMultiAngleVerdict`,
  `aggregateMultiAngle(views, {azimuths, gapBudget})` → REFUSE (missing view/unparsed) or DECIDE
  (passed ⇔ all coverage-pass ∧ all "same object" ∧ gaps ≤ budget). Schema
  `multi-angle-gate/v1`. The T-088 coverage precondition is **per-view** and short-circuits the
  judge (judge never called on a coverage-failed view; that view is a decided FAIL).
- Impure runner `benchmarks/sculpture/multi-angle-gate.mjs`: GATE_SUBJECTS = durable-skin SUBJECTS
  ∪ synthetic-hut (no kit record). Loads `def.kitRecord` already (for shipped-palette overrides via
  `policyInShippedPalette` — substitution from `selectValueTrueMap` + `kitRec.overrides`, guarded
  by `allowedPalette(artifact)`). Exit codes 0/1/2 (pass/fail/refusal); `--offline` re-asserts the
  committed record. Records at `multi-angle/<subj>-<label>.json`; existing labels: cottage
  {baseline, current, challenge}, gatehouse {current, challenge}.
- The AC's companion semantics differ from T-088's: **both run, both reported** — the kit check
  must not short-circuit the judge, and a kit-presence failure must make the gate's overall
  verdict a fail without erasing the resemblance verdict.

## Conventions and constraints

- Purity idiom: pure core in `src/form/` or `src/view/`, unit tests `*.test.mjs` under
  `node --test "src/**/*.test.mjs"` (suite currently 1199 green, +17 dressing). No GL/network/
  Date/random in cores; committed-JSON loads only (`loadBlockTable` idiom). Collect-don't-throw
  with named reasons (`parseKit.dropped`, conflict rows) is the house style for honesty.
- Runner idiom: registry-driven (no subject branches — E-25 Rule 3), deterministic double-run
  sha proof where applicable, `--offline` re-assertion, records + md committed, PNGs gitignored
  except `pr/assets/frames/`.
- E-26 Rule 2 (in ticket): the kit is **immutable input at gate time** — load the committed
  `kit/v1` record; never re-extract, never re-rank into a friendlier kit.
- "No weakening of existing gate behavior": `aggregateMultiAngle` and the v1/v2 verdict
  vocabularies are frozen (Rule 5); existing multi-angle records must stay `--offline`-valid.
  The gatehouse multi-angle gate currently FAILS on the oblique judge (memory: roof form gap);
  cottage-current record exists. Re-running the gate live costs 4 judge calls per subject.
- Reproducibility memory: byte-reproducible runs gate on deterministic checks only; GL renders
  and judge verdicts are evidence/metered — the kit-presence proof should be decidable offline.

## Inputs available at gate time (all committed)

| input | path | gives |
|---|---|---|
| artifact under test | `durable-skin/<s>/artifact.json` (kit-less) / `dress-openings/<s>/artifact.json` (dressed) | occupancy |
| kit (immutable) | `kit/<s>.json` | entries + overrides |
| skin record | `durable-skin/<s>.json` | `fill.policy` (shipped), `valueTrue.substitution`, `zoneMap.bands` |
| raw reference | `concept-materials/<s>/after-artifact.json` (= SUBJECTS.build) | concept-declared apertures |
| geometry | `structuralZones(occ)` | floorLines, upperTop, roofKeys |

## Assumptions surfaced

1. Opening sites must come from the reference apertures (sealed builds have no detectable
   openings), exactly as T-099 did — the checker's "openings 3/4" numbering can follow
   extractApertures' deterministic order.
2. Frame/panel/course presence must be judged in SHIPPED space with the same `sub` composition the
   grammar used, else value-true renames read as absences (memory: value-true renames depress
   resemblance scores; reproducibility rule).
3. The dressed cottage is the natural positive proof; the durable-skin cottage is the negative.
   The synthetic-hut has no kit record — the checker must have a recorded skip/no-kit behavior.
4. Frame lines legitimately carry respected/adopted/skipped non-frame blocks; panel fields carry
   splat secondaries; demanding 100% equality would fail the grammar's own output. Presence
   thresholds (or run-based detection) are a Design question.
