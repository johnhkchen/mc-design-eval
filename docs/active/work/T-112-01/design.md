# T-112-01 hip-pyramid-cap — Design

## The decision in one paragraph

Represent the pyramidal cap as a **four-sided gable** — apex (or short emergent ridge) = the
ridge cap, four eave-anchored face planes = four entries in `gable.sides` — so the existing
single surface definition (`gableSurfaceHeight` = min over sides + ridge cap), the generator,
`programFitError`, and the whole cage path are REUSED, not paralleled. A new pure core
(`src/form/roof-hip-fit.mjs`) fits the cap from the as-built occupancy (positions) + the GLB
triangles (slopes) and fits per-end hip planes for hip-demanded gables. The new hypotheses enter
`swapRoof` as **appended tail rungs** (after every existing rung), which makes the no-collateral
proof structural: cottage and gatehouse accept mid-ladder today, so the new rungs are unreachable
for them. Corner stair states are emitted **only for cells owned by a hip/pyramid construction**,
never for legacy 2-side gables — the cottage's valleys keep today's bytes.

## Options considered

**A. Pyramid as 4-sided gable through the existing cores (CHOSEN).**
`gableSurfaceHeight` and `gableDownhillAt` already iterate `gable.sides` generically (research
§6) — a 4-side gable computes a hip-cap surface with per-face slopes with no change to the
shared definition. Generator, heightfield composition, owner/cap/sheet marking, swap judging,
census, and the record schema all apply unchanged. The cost: guarding the few places that
assume exactly two sides (`ridgeFromPlanes`, `fitGableEnds`, `pitchKey` reserialization) and
extending the hip branch for per-end fitted pitches.

**B. A parallel pyramid module (own surface + generator + judge). REJECTED:** duplicates the
judged seam (cage checks, census, fit-error gating, record shape) that E-27/E-28 spent four
tickets consolidating; the gatehouse lesson (generator and fit-error measuring different
surfaces kills the gable) is exactly the divergence risk a second surface definition recreates.

**C. Teach `gablesFromRecord` to pair 4 planes into a pyramid at fit time. REJECTED:** the
church tower's ±x cap faces were never segmented (research §1) — there is nothing to pair; and
changing global pairing touches every subject's fit, putting the byte-identical AC at risk for
zero benefit.

**D. Emit corner stair states wherever two slopes meet. REJECTED:** the cottage main+cross
valley would change cells → `roof:cottage --repro` MISMATCH. Corner emission must be gated by
construction kind, not by local geometry alone.

## The fit core (`src/form/roof-hip-fit.mjs`, pure)

### `fitHipCap({record, massId, gables, occ, tris, opts})` → `{gable|null, evidence, findings}`

Parameter sourcing follows the E-27/E-28 doctrine — positions as-built, slopes GLB-fittable,
geometric sanity gates only, the cage arbitrates:

- **Band floor**: min recorded eaveY over the group's pitched sides (tower: 28); fallback = the
  refused gable's min eave. Recorded inputs, not new measurement.
- **Cap footprint**: occupied columns of `occ` at y = bandFloor restricted to the mass's plan
  columns (the as-built cap cross-section — NOT the whole-storey plan union, research §6),
  rows/ribs made contiguous with roof-fit's fill-between rule. `bbox` from these columns.
- **Square-ish gate** (geometric, not tuned): the four faces must each fit sanely (below) and
  the implied apex/ridge must sit inside the footprint with run ≥ `minRun` on every face —
  an elongated footprint simply yields a short emergent ridge (a hip cap), which the same
  representation realizes; a footprint too thin to give every face `minRun` is a NAMED refusal.
- **Per-face pitch** (4 faces, eaveDirs ±x/±z): from the **recorded plane** on that mass facing
  that direction when one exists (tower +z: roof-14, voxel 1.355) via the existing source
  selection; otherwise from **GLB band triangles**: cone of roof-band triangles inside the cap
  window with outward normal toward the face (|n·dir| ≥ cos faceAngleDeg, n_y > 0), pitch =
  area-weighted mean of `n_dir/n_y` (the plane identity: a slope p toward +z has normal ∝
  (0, 1, p)). Sanity: 0 < pitch ≤ `maxPitch` (ROOF_FIT_DEFAULTS, shared). An unfittable face →
  the cap is refused with the face named (Rule 2 — never an invented shape).
- **Eave anchors**: eaveY = bandFloor + the recorded eave offset where a plane exists, else
  bandFloor (as-built); eaveEdge per face = the footprint bbox edge (as-built truth).
- **Apex**: constructed, not copied — the max of the 4-plane min surface over the footprint
  (`ridge.y`, rounded to halves). The GLB apex measured fitRidgeLine-style is recorded as
  **evidence** (`evidence.apex = {glbMaxY, constructedY}` + per-face area-weighted vertex RMSE
  about its fitted plane) — never applied as an absolute height (the aabb-affine lesson).
- **Output gable**: `{id: hip-cap-<massId>, kind: "hip-cap", ridge: {axis: <long axis>, y},
  sides: [4 entries — planeId where recorded, null for synthetic faces, extentCells only for
  recorded planes], footprint, hip: {demanded: false}, sane: true, reasons: []}`. Fit error
  evidence travels on `gable.capFit` for the durable record.

`programFitError` then measures generated-vs-parametric over recorded extents only (synthetic
faces contribute no cells — their honesty lives in `capFit` rmse + the cage). This keeps the
fit-error gate meaningful without inventing extents.

### `fitHipEnds(gables, occ, tris, alignment, opts)` → `{gables, findings}`

For each sane gable with `hip.demanded`: per demanded end, select the end-window triangles
(roof-end-fit's window machinery: cross window × anchor-bounded ridge-axis window) whose
normals point toward the end **and up** (a slope, not a face: pitch = n_dir/n_y sane under
`maxPitch`), and fit the per-end hip pitch (area-weighted) with its vertex RMSE. Result rides
the gable as `hip.fitted = {lo: {pitch, rmse, triangles}|null, hi: …}`; `gableSurfaceHeight`'s
hip branch uses the fitted per-end pitch when present and keeps the mean-of-sides otherwise
(byte-compatible: committed gables never carry `hip.fitted`). An unfittable end → named finding,
heuristic hip stays (Rule 2).

## Generator: corner states (`src/view/roof-generate.mjs`)

`roofHeightfield` already records the owning gable per column. Extend the owner with
`corner: true` eligibility — set ONLY when the owning gable is `kind: "hip-cap"` or carries
`hip.fitted` for the end whose plane is active. In `generateRoof`, for an eligible stair cell:
inspect the two perpendicular neighbors of the downhill axis; if exactly one perpendicular
neighbor also drops ≥1 (a convex hip arris) the stair becomes `shape: outer_left|outer_right`
(side chosen relative to `facing` = uphill, Minecraft's own semantics); if exactly one
perpendicular neighbor rises ≥1 with the cell in a valley seat, `inner_left|inner_right`.
Ambiguous corners (both perpendicular neighbors drop — the apex seat) stay full blocks (the
cap course already marks them). Non-eligible cells take today's path verbatim — the straight /
full / slab emission is untouched character-for-character.

States are constructed exactly like the existing ones (string values, `form: "fixture"`,
`half: "bottom"`) — the proven T-097 emission mechanism; the live unmapped gate in the runner
plus a unit test that maps every emitted (block, state) through `render/src/version.mjs`'s
blockStateId path prove `unmapped: []`. `CARD_ROWS` is NOT touched: the card is the kit
grammar's vocabulary (doors/shutters/arches); the roof generator has never drawn from it, and
adding rows would dirty the committed fixture-card record and grammar consumers for no AC.

## Ladder wiring (`src/view/roof-swap.mjs` + runner)

`swapRoof` gains an optional `hipFit` argument: `{cap?: gable, hipEnds?: gables}`. Rung
construction appends, AFTER the existing tail (`voxel-pitch-gable-ends`):

1. `hip-end-fitted` — the group's gables with `hip.fitted` attached (only when any end fitted).
2. `hip-cap` — `[cap]` replacing the group's refused gables (only when the cap fit succeeded).

No ridge-fit flavor for these (`ridgeVariant` gets a guard: gables with `kind` or ≠2 sides pass
through unchanged); `pitchKey` already serializes sides generically — add `kind` and
`hip.fitted` pitches to the tuple so dedup can't collapse a new rung into a legacy one.
First-accept semantics are untouched: **cottage (accepts at rung 3) and gatehouse (rung 4)
never reach the appended rungs — their attempts lists, artifacts, and shas are byte-identical
by construction**, which is the `--repro MATCH` proof.

Runner (`roof-program.mjs`): per component group, call `fitHipCap` when the group has **no sane
gable** (the planes refuted the ridge-pair hypothesis — the tower's condition) and `fitHipEnds`
when any group gable demands a hip; pass both via `hipFit`. After an accepted cap swap, the
termination pass must treat the cap as consumed: add its sides' non-null planeIds to
`consumedPlaneIds` (existing code already iterates sides) and its footprint cols to
`excludeCols` (existing code already does — the pyramid gable populates both fields). Record:
new `hipFit` section (`roof-hip-fit/v1` — cap evidence, per-face rmse, hip-end fits, findings);
new frame pairs `roof-church-tower45/135` (the azimuths that named the tower cap). The spike
budget formula extends with a declared geometric term for hip constructions: a hip cap's line
features are its apex cell(s) and four eave-line corners → `+5` per accepted cap (1 apex + 4
corners), still a formula, not a constant fit to a subject.

## Risks, named

- **Cap rejection by the cage** is a legitimate outcome: the AC's "or the residual is named
  with its fit error" branch. The record will carry capFit rmse + the rejecting azimuths.
- **mass-3 (the spire protrusion) rides the cap**: chimney protection + reseat already handle a
  stack above a new surface; the cap heightfield must simply exclude chimney columns (the swap
  already does this for generated cells).
- **roof-12/13 flats on mass-1** stay termination candidates; their clamps re-judge on the
  post-cap occupancy. Cage-arbitrated; no special-casing.
- **gatehouse hip-end rung**: appended rungs are unreachable (accepts earlier), proven by
  `--repro`. The hip-end fit still RUNS (pure, recorded as evidence) — only geometry is gated.
