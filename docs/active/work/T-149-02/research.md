# Research — T-149-02 (live-facade-build & band0-coverage-fix)

Epic E-35, story S-149, ticket 2. T-149-01 shipped the deterministic articulation slice (inert on
facade-less programs). This ticket switches the machine on: fix the band0 coverage reject that blocks
the cottage gate, then run the first **live** facade recognition + relieved workshop build for
cottage + barn. This document maps what exists; it does not prescribe.

## 1. The band0 reject — what actually happens (diagnosed from committed data)

The T-143-02 cottage gate (`benchmarks/sculpture/multi-angle/cottage-patternbook.json`) coverage-
REJECTs all four views on band0, so the resemblance judge never runs. The committed numbers:

| view | band0 ownFraction | dominantFraction | total cells | passed |
|------|-------------------|------------------|-------------|--------|
| +x+z | 0.398 | 0.382 | 636 | false |
| +x-z | 0.410 | 0.380 | 631 | false |
| -x-z | 0.451 | 0.360 | 634 | false |
| -x+z | 0.437 | 0.363 | 666 | false |

`kitPresence.grammar.fill.byZone.band0 = { surface: 1920, filled: 1135, kept: 785 }` → 785/1920 =
0.409 own. Threshold is `DEFAULT_COVERAGE_THRESHOLD` (0.5). band0 own-vocabulary already includes the
preserve set: `["stone_bricks","dark_oak_log","spruce_planks","cobblestone","bricks"]`.

**The build's actual vertical structure** (`workshop/cottage/final-artifact.json`, 7803 placements,
per-y dominant block):

- y0–4: `stone_bricks` (the stone ground storey / plinth) — band0's dominant ✓
- **y5–19: `white_terracotta`** (15 uniform rows of 144) — this is **band1's dominant**, foreign to
  band0's own set
- y20–30: `spruce_planks` + `spruce_stairs` (roof)
- y33: `bricks` (chimney)

The band policy (committed in the gate record `zones.policy`): band0 dominant `stone_bricks`; band1
dominant `white_terracotta`; roof dominant `spruce_planks`. So white_terracotta is *correctly* band1's
material — it is not a mis-named stone-family block.

**Why band0 reads 40% own.** The gate derives zones from the **concept image**, not from the build's
own layer dominants:

- `benchmarks/sculpture/multi-angle-gate.mjs:182-200` `deriveZones()`:
  `gridResult = gridFromPixels(conceptImg, …)` then
  `extractConceptZoneMap({ gridResult, floorLines, layerCounts: layerCounts(occ), upperTop, materialMap })`.
- `src/color/band-profile.mjs` header (lines 10-18): *"This module reads the band structure FROM the
  concept image: a height-band profile of the concept's facade."* Band **boundaries** are concept-pixel
  derived; only the end bands are clamped to the build extent (`band-profile.mjs:513-514`:
  `bands[0].yRange[0]→yMin`, `bands[last].yRange[1]→upperTop-1`). The **interior** band0/band1 boundary
  stays at the concept-detected layer index.
- `src/view/zone-map.mjs:67-74` `zoneOf(voxel)`: a wall voxel lands in the band whose
  `[yRange[0],yRange[1]]` contains its y; outside-extent clamps to the nearest end band (total).

The concept cottage shows a **tall stone ground storey** (memory `cottage-concept-ground-storey-is-stone`
— "plinth claim refuted; ground storey IS stone"). The build, after the T-141/T-143 wall-raise
(`storeyHeight:5`, finding 3 of T-143-02 review), put stone in only y0–4 and grew the **white_terracotta
upper storey** to 15 rows. So band0's concept-proportioned zone (≈ the lower half of the wall) overlaps
the build's white_terracotta (y5…band0-boundary), and those cells census as foreign. Result: own ≈ 0.40,
coverage REJECT, judge skipped.

**This is NOT the church-band0 literal-name class** (`church-band0-is-material-assignment`,
`recognize-blocks-dont-color-match`): there, a stone-family block (`polished_basalt`) was censused under
the literal name `stone`; the own-vocabulary metric (`ownCoverage`, `metric:"own"`) already fixed that
class and is in force here. The 60% foreign here is genuine `white_terracotta` (band1's dominant),
correctly excluded from band0's own set.

### The discriminating question (the diagnosis the ticket mandates, with the data to settle it)

What is band0's upper boundary `yRange[1]` on the build, vs the build's stone/white transition (y4→y5)?
- If band0 boundary ≈ y4, own would be ≈ 1.0 — contradicted by the record, so the boundary is **higher**.
- The boundary is **concept-derived** (`deriveZones` above). Two readings, not yet separated:
  - **(H-instrument) band0 over-claims.** The concept band0 proportion (fraction of the *concept*
    facade) is fitted onto the taller wall-raised build; band0's zone reaches up into rows the build
    legitimately dressed as the white upper storey. The short-stone-plinth + tall-white-storey build is
    a valid realization and the census mis-assigns it. Fix lives in the zone-derivation / census
    (re-derive against the build's own storey structure, role-family discipline; T-095/T-101/T-110/T-100).
  - **(H-gap) the lower wall is genuinely mis-dressed.** The concept wants stone across the lower ~half
    of the wall; the wall-raise grew the white storey and left stone a thin plinth, so band0 really is
    white where it should be stone. Fix is in the build/skin: the component-skin dresses band0's full
    zone as `stone_bricks` (supplying-op fixpoint, `presence-is-a-fixpoint-not-a-census`,
    `surface-paint-respects-run-rule`) — re-derive coverage against the workshop output, not a stale ref.

Settling it requires running `deriveZones()` on the cottage artifact (loads concept PNG + matMap) and
printing band0/band1 yRanges. That is **Implement step 1** (the ticket: *"State which, with cell counts,
before any fix"*). Note the reference path (`multi-angle-gate.mjs:280-284`,
`--reference ?? def.build = concept-materials/cottage/after-artifact.json`) is used **only for aperture
extraction** (`extractApertures`), not for the coverage census — the census is self-comparing against
the judged artifact's own occupancy. So a "stale reference artifact" is *not* the mechanism; the band
boundary placement is.

## 2. The coverage / census machinery (file map)

- `src/view/zone-fill.mjs:187-198` `surfaceZoneHistogram(occ, zoneOf, {faces, skin})` — tallies blocks
  per zone on the visible projection/exposure skin.
- `src/view/zone-fill.mjs:238-251` `ownCoverage(hist, zones)` — adds `own` (dominant ∪ preserve) and
  `ownFraction` per zone (the T-110 role-family metric).
- `src/view/face-resemblance.mjs:78-96` `coverageGate(coverage,{threshold,zones,metric})`; T-137
  `visibilityAwareCoverage` (~135-191) excludes not-visible bands.
- `benchmarks/sculpture/multi-angle-gate.mjs:234-242` `gateCensuses(occ, zoneOf, azimuths, zones)`;
  `:499-506` calls `visibilityAwareCoverage(…, metric:"own", threshold:DEFAULT_COVERAGE_THRESHOLD)`.
- `src/form/multi-angle-gate.mjs:155-187` `budgetVerdict()` short-circuits to verdict-null on
  `coverage.passed === false` (T-088 contract) — this is why the judge never ran.
- `src/form/material-vocabulary.mjs:52-55` `ownSetsOf(zones)` — the canonical dominant∪preserve set.
- `src/view/coverage-monotone.test.mjs` — the own ⊇ dominant monotonicity property test (the discipline
  any census change must preserve).
- `src/form/kit-presence.mjs` — companion precondition; `grammar.fill.byZone` is where 1920/1135/785 live.
- `src/form/component-skin-distill.mjs` — judge-free record rebuild (`--distill-only`), not the live gate.

Identity-class discipline precedent (must be honored by any census/zone change): T-095/T-101/T-110/T-100
— monotone proof (every previously-passing coverage re-derives unchanged), **both arithmetics reported**,
committed records untouched, gate contract unmoved.

## 3. Live facade recognition (pipeline A)

- Runner: `benchmarks/sculpture/facade-grammar.mjs` (`facade:cottage` / `facade:barn` / `facade:offline`).
  Flags: `--subject`, `--pack packs/<style>.json` (default `packs/rustic.json`), `--ticket` (default
  T-145-01 — **must override to T-149-02**), `--rotate-pins`, `--offline`.
- Live flow (`runLive`): load base program + concept PNG + style pack →
  `renderTexturedGlbViews({ glbPath, azimuths, … })` (`src/recognition/facade-render.mjs:51-72`,
  voxelize GLB + snap surface texture to palette, render 4 gate azimuths, **layout evidence only —
  "GL bytes never decide"**) → `facadeRenderArgs({program,pack})` builds prompt+schema
  (`src/recognition/facade-grammar.mjs:65-106`) → `runReplyPolicy` (T-114 bounded re-ask) calling
  `requestTextWithImage({prompt, images, model: MODEL_TIERS.strong})` →
  `parseFacadeReply` merges `{facades:{massId:facade}}` into the program → `assertFacadeDiegetic`
  (`src/recognition/program.mjs:169-189`: every material is a pack **role**, every textured-GLB face
  carries `evidence.layoutOnly:true`).
- Model binding: `MODEL_TIERS.strong = "claude-opus-4-8"` (`src/config.mjs:34-37`) via
  `src/sdk-binding.mjs` → spawns `claude -p --model …` (subscription shim, **never the metered API** —
  the API path is deliberately not importable on this seam).
- Records (pin-guarded via `guardedWriteRecord`): `replies.json`, `prompt.md`, `merged.json`
  (the program now carrying `masses[].facade`), `render.json`, `record.json` (FACADE_RECORD_SCHEMA v1,
  sha pins, diegetic receipt). `--offline` re-parses the committed reply, byte-compares SHA, re-asserts
  diegesis (exit 0/1).
- Evidence-source narrowing (ratified §Stage 2): concept shows front faces (+x,+z); GLB reads unseen
  (-x,-z) as **layout only**; palette stays diegetic (brief color, never the mesh texture).

## 4. Relieved workshop build (pipeline B)

- Runner: `benchmarks/sculpture/pattern-book.mjs` (`patternbook:cottage|barn`, `patternbook:repro`,
  `patternbook:offline`). Flags `--subject`, `--pack`, `--ticket`, `--rotate-pins`. Preflights all
  record pins before any spend (pin-guard T-119).
- Seed (`src/workshop/seed.mjs:103-118` `seedWorkshopProgram`): `compileProgram(program, pack)` →
  articulation plan; `realizeWithArticulation(workshopProgram, articulation)`
  (`src/workshop/articulate.mjs:27-63`, the T-149-01 helper) folds relief brushes onto the skin **iff
  the program carries a facade** (facade-less ⇒ empty plan ⇒ byte-identical to bare realize).
- Loop (`src/workshop/loop.mjs`): each round re-compiles articulation from `currentSource` and realizes
  with it; the build the loop critiques + the gate censuses carries the relief.
- `compileProgram`/`facadeArticulationPlan`/`applyArticulation` (`src/recognition/compile.mjs:362-430`):
  four E-35 brushes (pilaster, quoin, infill-panel, eave-overhang); `roleBlock(pack, role)` is the one
  role→block site; facade-less ⇒ `[]`.
- Replay (`src/workshop/replay.mjs:50-106` `replayLedger`, `:120-197` `offlineAssert`): re-derives
  articulation from committed source + pack, `realizeWithArticulation`, byte-compares final artifact +
  conformance; `patternbook:repro` / `workshop:replay` are the byte-identity checks.
- Witnesses (S-142): `proportion-witness.mjs`, `visibility-witness.mjs` (`proportion:repro`,
  `visibility:repro`) — green-or-named-SKIP, rotation-proof, `--repro` byte-identical.

## 5. Facade milestone (the glance, recorded)

- `benchmarks/sculpture/facade-milestone.mjs` (`milestone:facade`, `:baselines`, `:repro`). Quotes
  committed chain + gate records (never decides). Per subject reports **both** arithmetics —
  `overall` (kit-aware-gate/v1) and `aggregate` (multi-angle-gate/v1 budget, v2 + legacy) — plus
  `reliefAware` (T-148, `armed:false` until a relieved judge runs). Baselines never re-banked.
- Sheets go to `pr/assets/` (cottage + barn: relieved build vs flat baseline vs concept).

## 6. Constraints & assumptions

- **Diagnose first, with counts** — the ticket forbids prejudging band0; §1 above gathers the evidence
  but the yRange print (Implement step 1) is what commits the branch.
- **No judge run in scope** — the singular billed verdict is the runbook's later step; this ticket buys
  the *glance* (first articulated render), not the verdict.
- **Subscription shim only**, never the metered API. Live runs need `claude -p` + GL (the T-143-01 barns
  ran live the same way; availability is environment-dependent — record honestly if a live stage cannot
  complete here).
- **No per-building constants**; pins rotate only under `--rotate-pins` in this owning ticket with
  retired pins named (T-119); `npm test` stays green (baseline 2098/2098 per T-149-01).
- A still-flat or still-blocked result **is the finding** and scopes the next rung before M3.
