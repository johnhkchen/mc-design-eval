# T-098-01 placement-grammar — Research

Epic E-26 / Story S-098. Descriptive map of what exists. The ticket asks for a pure placement-grammar
core that binds kit entries (T-096) to *structural feature instances* — frame lines, the fields between
them, opening instances, roof courses — instead of the E-21 map's 4 coarse zone-wide rules.

## 1. The problem the grammar fixes

The E-21 map (`src/form/material-map.mjs`) has a closed placement vocabulary, `PLACEMENT_RULES`
(lines 30–37): `walls / corners-edges / roof / base / trim / openings`. Two materials can both claim
`walls` (cottage: `stone_bricks` band0 + `white_terracotta` band1) — zone-wide rules carry no instance
geometry, which is how the cottage's plaster collapsed 215→8 historically. T-092 split walls into
per-band zones; the *frame rhythm inside a band* (studs, posts, rakes, eave beams) is still only a
"preserve what's already there" contract, never a generator: nothing today *places* the frame.

## 2. The kit (T-096) — what the ingredients are

`src/form/kit.mjs` (pure). Kit record `kit/v1`, committed at `benchmarks/sculpture/kit/<subj>.json`.
Each entry: `{block, role, formClass: cube|fixture|rail, whereUsed[], confidence, valueCheck}`.
`whereUsed` vocabulary = derived band names (`band0`, `band1`, `roof`) ∪ `WHERE_FEATURE_TERMS`
(kit.mjs:56) = `["openings", "trim", "corners-edges", "base"]`.

Committed cottage kit (verified actual file, not the agent summary):

| block | formClass | whereUsed | conf | valueCheck |
|---|---|---|---|---|
| stone_bricks | cube | band0, base | high | verified |
| cobblestone | cube | corners-edges, base, roof | medium | flagged-mismatch |
| spruce_planks | cube | roof, band1, trim | high | verified |
| smooth_sandstone | cube | band1 | medium | verified |
| spruce_trapdoor | fixture | openings | medium | — |
| spruce_door | fixture | openings, base | medium | — |
| lantern | fixture | openings, base | high | — |

Gatehouse kit: stone_bricks (band0, openings), cobblestone (corners-edges, trim — thin-sample),
deepslate_bricks (roof, verified), stone_brick_stairs (fixture, roof), dark_oak_planks (openings,
flagged). Overrides: cottage `{white_terracotta→smooth_sandstone, dark_oak_planks→spruce_planks}`;
gatehouse `{deepslate_tiles→deepslate_bricks}`.

Note: the cottage kit's *frame* recognition is `spruce_planks` (role "roof field, timber framing beams
and floor band", whereUsed includes `trim`) — the recognizer did NOT emit `dark_oak_log`. The ticket's
"stripped-log frame" phrase describes the concept's look; the shipped block must come from kit data
(E-25 Rule 3 — no subject constants). `kit-verification-shading-offset` memory: rank candidates by
whereUsed-specificity before confidence.

## 3. The structural read — geometry available today

`src/view/structural-read.mjs` (pure, no GL):

- `footprint(occ)` (:21) → `{cells:Set<"x,z">, bbox{minX..maxZ}, width, depth, area}`.
- `storeyBands(occ)` (:49) → `{bands[{yStart,yEnd,dominantBlock,fill}], floorLines:number[]}` —
  floorLines = y-layers with fill ≥ 0.6 (slab signal).
- `openings(occ, dir)` (:153) → per ortho face `[{bbox{u0,v0,u1,v1}, kind:"door"|"window", cells,
  dressing{cells,blocks[]}}]` — runs on `solidOccupancy` so dressed apertures keep identity (T-097).
- `roofRegion(occ)` (:211) → top-exposed cells `[{x,z,y,block}]`, coverage, yRange.
- `wallFields(occ)` (:240) → four elevations: `surfaceCells[{u,v,voxel,block}]`, enclosed-air `holes`,
  `blockCounts`.
- `structuralZones(occ)` (:301) → `{zoneOf(voxel)→base|upper|roof, storeyDivide=floorLines[1],
  upperTop=floorLines[last] (the eave line), roofKeys:Set, floorLines}`. Roof is MEMBERSHIP
  (roofKeys) ∪ y≥upperTop, not a y-threshold.

**Nothing computes frame lines yet.** Floor lines exist (y-indices); corner posts, gable rakes, and
eave beams have no derivation. `airComponents(mask)` (:96) is the reusable 2-D component helper.
`src/view/surface-grid.mjs` supplies `projectSurface` (2.5-D grid with `voxel` back-pointers, :170),
`orthoSpec` (:183), `gridMaskOf` (:236). `ORTHO_DIRS`/`DIAG_DIRS` are the only legal views.

`src/view/occupancy.mjs`: `occupancyFromCells` (:45), `artifactOccupancy` (:103), `solidOccupancy`
(:119); occ carries sparse `forms`/`states` maps and `formOf/solid` accessors (T-097 third class).

## 4. The fill it must compose with (E-24/E-25)

`benchmarks/sculpture/durable-skin.mjs` — `buildSkin(def)` (:300), the deterministic core, stages:
1. value-true selection (T-086) → `substitution`; 1b. kit overrides compose `combined =
{...substitution, ...kit.overrides}`, `subK` = THE one renaming point (:330–341); 2. substituted
build (shipped palette); 3. seal (S-084); 4. zones — concept-derived `extractConceptZoneMap` +
`zonesFromBands` → `zoneOf`, `policyNamed` (band0/band1/roof zone names), agreement-asserted against
committed `zone-map/<subj>.json` (:362–396); `policyS = mapPolicy(policyNamed, subK)` (:397);
5. full-shell base coat `zoneFill(occSealed, {zoneOf, zones, skin:"exposure"})` (:402–407);
6. secondaries splat (paintFace front/side, T-088 coverage precondition) (:409–441); 7. legacy
splat-only baseline; 8. coherent surface — `regularizeRoofCourses` + `stripStraySalt`
(minKeep=3, minExtent=3) (:459–465); 9. terminal gates — plaster invariant, coverage gate (THROW),
T-090 band evidence (roof ≥ 0.9 own materials, wall foreign residue ≤ 0.05) (:467–516).
Returns all intermediates (`raw, artifact0, sealed, based, painted, splatOnly, final, policyS,
zoneOf, zoneMap, ...`). `SUBJECTS` registry exported (:94) — cottage/gatehouse/church, all behavior
differences are registry DATA (E-25 Rule 3). Main: double-run byte-equal proof (:589–592), renders
(evidence only), frames to `pr/assets/frames/durable-<subj>-{before,after,strip}.png`, record
`durable-skin/<subj>.{json,md}` + `<subj>/artifact.json` with sha256.

**The T-090-01 secondaries contract** (`src/color/band-profile.mjs:76–79` `CROSS_BAND_RULES =
["trim","corners-edges","openings"]`; `resolveBandRoles` :338): blocks with those placementRules are
declared secondaries of *every* band regardless of share. `zoneFill` (`src/view/zone-fill.mjs:134`)
keeps a non-dominant skin cell iff it is in the zone's `preserve` set AND sits in a 6-connected
same-block run ≥ `minRun` (default 2); isolates are filled. `stripStraySalt`
(`src/view/surface-pattern.mjs:207`) keeps off-dominant components of size ≥ 3 AND extent ≥ 3.
So frame lines (long runs of a preserved block) survive both the fill and the salt strip *by the
existing contracts* — the grammar only has to place them.

Committed cottage zone map (`zone-map/cottage.json`, source "concept"): band0 y0–6
dominant `stone_bricks`; band1 y7–13 dominant `white_terracotta` (→ smooth_sandstone after kit
override); roof dominant `dark_oak_planks` (→ spruce_planks). `dark_oak_log` (the map's
"half-timbering frame" trim role) is a declared secondary in BOTH bands (shares 0.418 / 0.201) —
the concept's framing rhythm spans both storeys, which is what the ticket's "both storeys" AC
references against the old base/upper stone-base prior.

## 5. Runners, gates, conventions

- `benchmarks/sculpture/challenge-milestone.mjs` — E-25 terminal chain (provision → shell → buildSkin
  → multi-angle gate via CLI spawn); zero subject keys in code; honest-failure record on THROW.
- Multi-angle gate: 4 config azimuths `["+x+z","+x-z","-x-z","-x+z"]` at 30° elev, 512², frozen by
  E-25 Rule 4 (`src/config.mjs:42–53`). "Gate angles" = those four diagonals.
- Runner conventions: SUBJECTS-style registry data, `--subject` flag, `--offline` re-assert mode,
  double-run reproducibility proof, records `.json`+`.md` committed, run PNGs gitignored, curated
  evidence frames committed under `pr/assets/frames/`. Oblique before/after = azimuth 225 (`-x-z`).
- npm script naming: `<noun>:<subject>` (`skin:cottage`, `challenge:cottage`, `kit:extract`).
- Tests: `node --test`, `<module>.test.mjs` beside the module, pure cores on synthetic occupancies
  (`zone-fill.test.mjs` builds a 5×5 two-storey hut with hand-counted expectations; `kit.test.mjs`
  uses entry/swatch factory helpers).

## 6. Constraints and assumptions surfaced

- **Pure core under src/, impure wiring in benchmarks/** — the seam invariant (durable-skin.mjs:24).
- **No air op** (`facade-recess-by-exclusion` memory; expand.mjs has no deletion): the grammar can
  only recolor existing skin cells / add fixtures — it must not move geometry.
- **Determinism**: no LLM, no Date/random on the path; double-run byte-equality is asserted by every
  runner. Grammar inputs (kit record, zone-map record, artifact) are committed data.
- **Changing buildSkin changes committed durable-skin records for ALL subjects** (sha-pinned,
  agreement-asserted). Inserting the grammar into buildSkin would force regenerating cottage +
  gatehouse records and frames; a downstream composition point (consume `durable-skin/<subj>/
  artifact.json`) leaves them untouched. Where to compose is a Design decision.
- **T-099 boundary**: opening *treatments* (placing trapdoor shutters, doors, lanterns with states)
  are applied by T-099; this ticket must bind each opening instance to its declared treatment and
  stop there.
- **Openings y-coordinate**: `openings()` returns face-local (u,v) bboxes; converting to world y for
  frame-line interaction uses `orthoSpec`/`cellWorldPos` (surface-grid.mjs:183/:203).
- **Gable cells above the eave are zone "roof"** under `zonesFromBands`' contract (y ≥ upperTop) —
  a gable-rake frame line lives in roof zone, where the frame block must be in `preserve`/`splat`
  for the existing gates' band evidence to tolerate it (cottage roof preserve includes the frame
  candidates today; band evidence counts dominant+preserve as "roof materials").
- The kit may have NO `trim`-tagged cube entry (church has no kit at all) — the grammar needs a
  defined no-binding behavior (skip, recorded), not a throw, to stay subject-generic.
