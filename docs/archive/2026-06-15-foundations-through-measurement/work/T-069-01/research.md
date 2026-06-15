# T-069-01 — surgical-refine-to-standard · Research

Epic **E-20** (the quality bar). The high-res building (T-068-01) is placed + clean but TRELLIS+voxelization
nails the *bulk* while fine architectural detail (window reveals, cornices, roof edges) stair-steps or reads
soft. This ticket pushes it to a **high standard** by re-using the E-15 **surgical revision loop** with the
building's **GLB as the form target**, and measures honestly whether the **categorical judge** reaches
**Strong+** — or *where it tops out*. Descriptive map below; no solutions proposed.

## The asset under refinement (T-068-01 output)

- `benchmarks/sculpture/building/best/artifact.json` — the chosen scale-64 build, **57,202 placements**
  (~7.6 MB), AJV-valid, E-19-clean (off-palette 0, speckle ~0, distinct 4, single mass). Whole-object form
  IoU vs the GLB **0.929** at the building 3/4 view (capped by the TRELLIS reconstruction, T-067).
- `benchmarks/sculpture/glb/stone-gatehouse.glb` — the whole-building GLB (gitignored, ~5 MB, present on
  disk). The form target's source mesh.
- `benchmarks/sculpture/runs/015-vBuilding-…-arched-gate/` — the design provenance: `design-doc.md` (the
  brief; medieval gatehouse, peaked gable, arched gate, monochrome stone + warm dark_oak voussoir accent),
  `concept.png`, and `artifact.json` carrying the **design-doc palette manifest**
  `[stone_bricks, cobblestone, deepslate_tiles, dark_oak_log]`.
- View: `BUILDING_VIEW_3Q = { azimuthDeg:45, elevationDeg:30, fov:45 }` (`src/building.mjs:55`).

## The surgical loop (E-15) — what exists, where

`src/revise/loop.mjs` — **`reviseLoop(artifact, opts)`**. The deterministic cage the AC mandates:
- Walks a **fixed, caller-supplied `regions` list once, in order**. Per region: `selectRegion` → skip if its
  subBounds intersects a **locked** region → `diagnose` (route) → up to `budget.perRegion` tweaks; accept the
  **first that strictly improves** the form score (`after > before + epsilon`), **lock R**, else **roll back**
  every attempt (leaving `current` untouched).
- Terminates structurally in ≤ `regions.length × perRegion` attempts under a global `maxIterations` cap;
  `converged = iterations < maxIterations`.
- Returns **`{ schema, artifact, trace, iterations, converged, locked }`**. The `trace` is the per-region
  edit ledger: `{ iteration, region, subBounds, defect, where, route, tweak, scoreBefore, scoreAfter,
  accepted, reason }` (reason ∈ accepted | rolled-back | clean | locked-overlap).
- **Seams** (all injectable, default deterministic): `score` (the FORM number — `liveFormScore`, GL),
  `diagnose` (default model-free `proceduralDiagnose`), `observe` (optional live render feeding a model
  critic), `tweakFor` (default `scopedTweakFor` — procedural relief/material).
- **P14-safety is the loop's structural guarantee**: an accepted region's subBounds is pushed to `locked` and
  never re-entered (`boxesIntersect` guard, `loop.mjs:92`); a non-improving tweak is rolled back, not kept.

`liveFormScore(cfg)` (`loop.mjs:168`) — the GL seam. Renders the R-framed crop via `observeRegion` to a temp
PNG, then `target.scoreRender(renderPath, R)`. **The target is itself a seam** (`resolveFormTarget`): pass
`cfg.formTarget` and the loop body/observe/diagnose/accept-gate are byte-identical.

## The GLB form target (E-16) — the exact API this ticket needs

`src/form/form-target.mjs` — **`glbFormTarget({ glbPath, buildBounds, view, grid, fit })`**:
- `scoreRender(renderPath, R)` → the **true per-region IoU**: `mapVoxelRegionToMesh(R.subBounds, buildBounds,
  mesh.bounds)` maps the voxel region AABB into mesh space by per-axis whole-AABB fraction, clips the GLB
  silhouette to that 3-D region, and IoUs it against the R-framed render. Falls back to whole-object IoU if
  `buildBounds` omitted.
- `wholeObjectScore(renderPath)` → whole-object IoU (no region clip) — the verdict/trajectory signal.
- Honesty ledger (documented in-module): single 3/4 view; GLB↔build share no origin/scale (normalization
  removes translation + uniform scale); **rotation/axis mismatch is NOT corrected**; silhouette ≠ form;
  absolute IoU bounded by the TRELLIS reconstruction. The loop reads the **relative Δ**.

## The editors behind the gate

`src/revise/form-edit.mjs` — **`makeFormEditor({ critic })`** → `{ diagnose, tweakFor, stash, proposals }`.
One critic, two interchangeable editors behind the same gate: defects routed to `relief`/`material` →
deterministic `scopedTweakFor` (procedural); any **other** (form) route → the **LLM block-editor**
(`defaultProposeEdit` spawns `baml-revise.mts` → `ReviseRegion` op-union → `applyFormEdit`, bounded
add/remove/move/swap clamped to R, AJV-gated; over-reaching ops dropped, not thrown). The async model work
lives in `diagnose` (stashes); the sync `tweakFor` replays the stash (the loop applies tweaks synchronously).

`src/revise/tweak.mjs` — `proceduralDiagnose` (model-free routing), `scopedTweakFor` (relief = ±Z depth step
clamped to R; material = block swap), `tweakLabel`, `boxesIntersect` (pure, reusable for a P14 check).

`src/revise/region.mjs` — `selectRegion(artifact, spec)` addresses a region by **bbox** (`{min,max}` /
`{bbox}`), **named part** (`{part}`), or **`where`** (`{where}` — top/bottom/front/back/left/right/middle/…
slab at `fraction` of the axis extent). `subBoundsOf`, `artifactBounds`, `observeRegion` (GL crop render).

## The categorical judge (the standard)

`baml_src/judge.baml` — **`JudgeFacade(brief, render) -> FacadeScore`** with enum
`Category { Weak, Competent, Strong, Exceptional }` over dims `proportion/color/detail/fidelity/overall` +
`notes`. "Be hard to please. Default ceiling is strong." `benchmarks/temple-facade/judge.mjs`
**`judgeRender({ imagePath, brief, samples })`** spawns `baml-judge.mts` → claude -p (subscription, metered),
**median over `samples`** → `{proportion,color,detail,fidelity,overall, notes, perSample, usage}`. Categories
ranked weak<competent<strong<exceptional (`judge.mjs:11`). "Strong+ = a high standard of passing round."

> Caveat surfaced: the prompt frames a "TEMPLE FACADE, rendered head-on." The subject is a **gatehouse at
> 3/4 view**. The enum + rubric dims transfer, but the temple/head-on framing is a residual to record, not
> silently ignore (the brief passed is the gatehouse design-doc; the render is the building 3/4).

## The established pattern this ticket should mirror

Two precedents define the house style:
- **`benchmarks/sculpture/glb-formtarget-ab.mjs`** (E-16) — the direct template: load a build, wire
  `glbFormTarget({ glbPath, buildBounds })`, run `reviseLoop` with `makeFormEditor`, record
  before/after per-region + whole-object IoU + a categorical verdict, `--offline` re-derivation, save
  before/after renders. The "only line that differs is the form target" seam invariant.
- **`benchmarks/sculpture/building-build.mjs` + `src/form/building-build.mjs`** (T-068-01) — the **pure
  core / impure runner split**: a PURE module (`src/form/…` — no GL/I/O/Date/random, under the
  `src/**/*.test.mjs` glob → `npm test`) does the ranking/decision/report; the impure benchmark runner owns
  the GL render + model + file I/O and is verified by committed outputs + `--offline` (the project's standard
  untested GL+model surface; `npm test` must never pull GL or a host tool).

## Constraints & assumptions

- `npm test` green (AC#4) ⇒ the reviewable logic must live in a **pure** `src/form/*.mjs` with unit tests;
  the live GL+model run is the on-demand metered surface (precedent: glb-formtarget-ab / building-build live
  paths are not in CI).
- Cost is real (memories: scale studies are not cheap; the LLM judge is metered, multi-sample). A whole-build
  render of 57k blocks + multi-sample judge + per-region LLM edits is heavy → bounded rounds, bounded
  regions, judge the **whole render once per round** (not per accepted region).
- P14-safety is already structural in `reviseLoop`; this ticket must **record and verify** it (no accepted
  region later altered; non-improving tweaks rolled back), not re-implement it.
- Absolute IoU is capped by the GLB reconstruction (T-067) — the **relative trajectory** is the signal.
- The fine-detail defects the AC names (window reveals, cornices, roof edges) are **form** defects → the LLM
  block-edit route; the silhouette IoU may be a **weak** signal for thin reveals (a known E-15 limit:
  per-region single-view IoU can diverge from whole-object verdict).
