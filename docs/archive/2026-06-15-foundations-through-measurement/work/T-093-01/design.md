# T-093-01 — multi-angle-same-object-gate — Design

## Problem restated

Widen the E-22 single-view gate to 4 fixed azimuths with per-view categorical judgement, a per-view
T-088 coverage precondition, a contact-sheet verdict artifact, a unit-tested aggregate pass rule
(same-object everywhere, ≤2 named minor gaps, refuse on missing view), and a recorded
fail/pass proof — without changing E-22 single-view behavior for existing callers.

## Key design decisions

### D1 — A v2 per-view verdict schema; E-22's v1 stays frozen

The AC's "same-object at every azimuth with ≤2 named **minor** gaps total" cannot be expressed in
`resemblance-verdict/v1`: there, "same object" FORBIDS a gap and non-same verdicts carry exactly
one. So the per-view judge gets a new contract, `multi-angle-verdict/v1`:

```
{verdict: "same object"|"drifted"|"different object",
 gaps: [{region, attribute ∈ GAP_ATTRS, severity: "minor"|"major"}],   // 0..3
 rationale}
```
Constraints (parser-enforced, mirroring v1's strictness): `same object` may carry 0..N **minor**
gaps only (a major gap contradicts same-object → parse error); `drifted`/`different object`
require ≥1 gap with ≥1 `major`. `VERDICTS`/`GAP_ATTRS` are reused frozen — the vocabulary does not
widen (E-22 Rule 5), only gap cardinality/severity is new. v1's prompt, parser, schemas, and all
existing callers are untouched (AC: no weakening of single-view behavior).

**Rejected**: reusing v1 and counting "drifted" views as the minor gaps — conflicts with the AC's
separate requirement that every azimuth be same-object; a drifted view must fail the gate.

### D2 — Per-view triptych input, reusing E-22's panel shape

Each judged view gets its own image: **concept | mesh-silhouette@angle | build@angle** — the exact
3-panel shape the E-22 judge already reads, composed by the existing `composeTriptych`. The
concept panel is always the one immutable 3/4 image (the concept does not rotate — the prompt says
so explicitly and tells the judge the build is viewed from azimuth X, so back views are judged for
same-object plausibility, not pixel match). The mesh silhouette DOES rotate
(`rasterizeSilhouette(mesh, {view})` already takes a view) and is orientation-consistent with the
build render by construction (the build was voxelized from that mesh) — it is the judge's
form/massing reference precisely where the concept can't see. GLB absent → grey placeholder panel
(existing pattern).

**Rejected**: one judge call over the whole 5-panel sheet returning 4 verdicts — cheaper (1 vs 4
metered calls) but per-view attribution degrades, the parse contract quadruples in fragility, and
a single bad parse voids all four verdicts. E-22 precedent is one image per call.

### D3 — The angle set is config, not an option

`src/config.mjs` (the repo's single-source config, pure data) gains:
```js
export const MULTI_ANGLE_GATE = Object.freeze({
  azimuths: Object.freeze(["+x+z", "+x-z", "-x-z", "-x+z"]), // 45°, 135°, 225°, 315° @ elev 30
  gapBudget: 2,
});
```
The runner has **no flag** that changes the set, the elevation, or the 512² render contract
(E-25 Rule 4); the names resolve through `VIEW_ANGLES` (multi-angle.mjs), which pins elevation 30°
— the same elevation as the E-22 3/4 lens. Render resolution stays the render contract's default
(512×512, supersample 3 — the fixed lens).

### D4 — Per-view coverage via the existing diagonal projection skin

The T-088 precondition becomes genuinely per-view with ZERO new instrument code:
`surfaceZoneHistogram(occ, zoneOf, {faces: [angleName], skin: "projection"})` already accepts the
four ground-diagonal dir names (`DIAG_DIRS`, surface-grid.mjs) — the first-hit voxels from that
azimuth are exactly the view's visible skin. Per view: that census → `dominantCoverage` →
`coverageGate` (threshold 0.5, unchanged). On failure the view's judge is **not called** and the
view records `verdict: null, reason: "coverage"` (the T-088 short-circuit contract: the record
must show the judge was never consulted) — an automatic not-same-object for aggregation.

Zones come from the T-092 derivation, reused: `structuralZones` + `extractConceptZoneMap` (concept
+ material map) with the registry prior as recorded fallback — the same `{zoneOf, zones}` the
pipeline used to build the skin, re-derived from the same committed inputs (deterministic), via
durable-skin's exported `SUBJECTS` registry. The gate stays subject-generic: registry data only.

**Rejected**: exposure-shell coverage once for all views (view-independent — weaker than what the
existing diag projection provides and not "per view" as the AC demands).

### D5 — Pure aggregation with refuse-on-missing

`aggregateMultiAngle(views, {azimuths, gapBudget})` (pure, unit-tested):
1. **Refuse**: any expected azimuth absent, render-failed, or verdict unparsed/missing →
   `{decided: false, refusal: "missing-view:<angle>" | "unparsed:<angle>"}` — the gate produces NO
   pass/fail verdict (AC1). A coverage-failed view is NOT a refusal — it is a decided FAIL.
2. **Decide**: `passed` iff every view's coverage passed AND every verdict is `same object` AND
   `Σ gaps.length ≤ gapBudget` (all gaps on same-object views are minor by D1's parser).
3. Output names everything: per-view status, total gap list `[{angle, region, attribute}]`,
   `failures` (coverage / drifted / different / gap-overflow). Schema `multi-angle-gate/v1`.

### D6 — The contact sheet is the verdict artifact

A new pure N-panel composer `composeSheet(panels, {gutter})` generalizes `composeTriptych`
(triptych delegates to it; its 3-panel throw is preserved for v1 callers). The sheet =
**concept | 45° | 135° | 225° | 315°** (5 × 512 panels), labeled per panel with the angle and its
per-view outcome (`same object` / `drifted: <attr>` / `coverage`), drawn via the runner's
node-canvas label bar (label-free fallback as in E-22). Saved to
`benchmarks/sculpture/multi-angle/<subject>-<label>-sheet.png` and copied to
`pr/assets/frames/multi-angle-<subject>-<label>.png` (committed — Rule 1: no number substitutes
for the sheet). Per-view JSON + the aggregate record are support, in `multi-angle/<subject>-<label>.json`.

### D7 — Runner and the proof both ways

`benchmarks/sculpture/multi-angle-gate.mjs` (`npm run gate:multi -- --subject cottage
[--artifact <path> --label <name>] [--offline]`): renders the 4 views (render error → REFUSAL,
recorded, exit ≠ 0 — never a silent skip), runs D4 coverage per view, D2 judge per surviving view,
D5 aggregation, D6 sheet. `--artifact/--label` exist solely so the SAME unmodified gate can run on
the proof baseline; the angle set/resolution have no flags. `--offline` re-asserts a committed
record (no GL, no judge), mirroring durable-skin.

Proof runs (both recorded):
- `--label baseline --artifact concept-materials/cottage/after-artifact.json` — the committed
  grey-roof-sides cottage; expected to fail per-view coverage at the obliques (its splat-only roof
  measured ~2-43% dominant) and/or be judged non-same — **fails on a non-front azimuth**.
- the default durable-skin cottage artifact — the pass candidate. If the judge honestly rules it
  drifted at some azimuth, that is a recorded E-25 finding (Rule 6); the gatehouse is the second
  pass candidate; the AC's "synthetic positive" remains the fallback of last resort.

## Risks / mitigations

- **Judge variance over 4 calls**: any unparsed reply → refusal (not a guessed verdict), re-run is
  cheap; the parser's strictness is the existing E-22 mitigation.
- **Back views vs a front-only concept**: the prompt states the azimuth and that the concept shows
  the front 3/4; the rotating mesh panel anchors form. If the judge still over-penalizes unseen
  faces, that shows up as named gaps — honest, recorded.
- **Metered cost**: ≤8 strong-tier calls for the proof pair; no loops.
- **Zone derivation drift between gate and pipeline**: both read the same committed inputs through
  the same pure cores; the gate additionally records the zone source (concept vs prior-fallback).

## Out of scope

Per-azimuth concept references (Rule 2 forbids generating them); arbitrary-oblique coverage beyond
the four named diagonals (surface-grid explicitly scopes them out); replacing E-22's single-view
gate (S-095 decides which gate the milestone uses).
