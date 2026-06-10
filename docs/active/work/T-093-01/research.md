# T-093-01 — multi-angle-same-object-gate — Research

Descriptive map. No solutions proposed.

## 1. The defect, located

The E-22 gate judges ONE shared 3/4 view. `benchmarks/sculpture/resemblance.mjs` renders every
subject at `BUILDING_VIEW_3Q` (`src/building.mjs`: `{azimuthDeg: 45, elevationDeg: 30, fov: 45}`),
composes a triptych (concept | mesh silhouette | minecraft), and calls the categorical judge once.
Roof side faces, wall residue, and the gatehouse cavity were at their worst on views this gate
never rendered (the T-090/T-091 findings). `pr/assets/cottage-multi-angle.png` (328K, 1536×512,
4 panels, committed) is the existing visual evidence of front-vs-oblique divergence.

## 2. The E-22 gate machinery (what "reusing the E-22 judge" means concretely)

`src/form/resemblance.mjs` (pure core, unit-tested in `resemblance.test.mjs`):
- `VERDICTS = ["same object", "drifted", "different object"]`, `GAP_ATTRS = ["form", "massing",
  "material zoning", "palette"]` (lines 38-39, frozen — Rule 5: never widened per-run).
- `RESEMBLANCE_DEFAULTS` (line 42): `panel: 512`, `gutter: 8`, plus scorer knobs (grid 128,
  zoneGrid 8, deltaESet 18, deltaEZone 22). Schemas `resemblance/v1`, `resemblance-verdict/v1`.
- `buildResemblancePrompt()` (line 320): FIXED prompt describing the 3-panel triptych; demands
  strict JSON `{verdict, gap:{region,attribute}|null, rationale}`; **gap must be null on
  "same object"** and exactly ONE gap otherwise — enforced by `parseResemblanceVerdict(text)`
  (line 346), which throws precise errors; the runner records an honest `"unparsed"` verdict on
  throw rather than guessing.
- `consolidateResemblance(subjectResults)` (line 395): the existing pure aggregation precedent —
  tallies verdict counts, routes material-attributed gaps to E-21. Per-SUBJECT, not per-view.
- Panel/sheet math: `resampleRgba(img, W, H, "aspect")` (letterbox, white bg) and
  `composeTriptych(panels, {gutter})` — **hard-coded to exactly 3 panels** (`panels.length !== 3`
  throws); the N-panel "concept | 4 views" sheet has no existing composer.

`benchmarks/sculpture/resemblance.mjs` (impure runner):
- `runResemblanceGate({subject, conceptPath, glbPath, artifactPath, committedRenderPath, outDir,
  offline})` (line 145) → `{row, verdict, triptychPath}`; writes `<subject>-perceptual.json`,
  `-verdict.json`, `-triptych.png`, `-resemblance.md` under `benchmarks/sculpture/resemblance/`.
- `runJudge(triptychBuf)` (line 221): ONE metered `claude -p` call via
  `requestTextWithImage({prompt, images:[{data, mediaType:"image/png"}], model: PHASE1_MODEL_ID})`
  (`src/sdk-binding.mjs` line 478; model = `claude-opus-4-8`, `src/config.mjs` line 18). Usage
  (tokens/cost) recorded per call. `--offline` skips the judge (`verdict: "(not run)"`).
- Label drawing: node-canvas resolved through the render package (`canvasLib()`, falls back to
  label-free encode). Panel labels are drawn in a 28px bar appended BELOW the composed image.
- `SUBJECTS` registry (line 64): cottage/gatehouse artifacts now point at
  `durable-skin/<subj>/artifact.json` (the T-089→T-092 pipeline output); moai/pineapple at
  e19 builds. Concept paths immutable (Rule 1; existence-checked, never regenerated).

## 3. Multi-angle rendering — the 4 azimuths already exist by name

`src/view/multi-angle.mjs`:
- `VIEW_ANGLES` (line 21): ortho faces (front/back/left/right at elevation 0, top/bottom) and the
  four 45° ground diagonals at `DIAG_ELEV = 30`: **`+x+z` = azimuth 45°, `+x-z` = 135°,
  `-x-z` = 225°, `-x+z` = 315°** — exactly the ticket's angle set, at the same elevation as the
  E-22 3/4 lens. `durable-skin.mjs` line 81 already uses `-x-z` as the T-090 oblique.
- `resolveAngle(angle)` (line 55) accepts names or raw `{azimuthDeg, elevationDeg}` (throws on
  unknown); `renderViews(artifact, angles, {outDir, supersample?, width?, height?, label?})`
  (line 77, impure) lazy-imports `render/src/render-tool.mjs#renderArtifact` and returns
  `[{angle, view, path, bytes}]`, writing `view-<label>.png` per angle.
- Render contract resolution: `render/src/render.mjs` `DEFAULTS = {width: 512, height: 512}` with
  supersample 3 (the post-T-075 fixed lens; `supersample: 1` is the legacy lens, used only for
  before/after comparisons). E-25 Rule 4's "resolution floor" = this 512² contract; no caller in
  the repo lowers it.

## 4. The T-088 coverage precondition

`src/view/face-resemblance.mjs`: `DEFAULT_COVERAGE_THRESHOLD = 0.5`; `coverageGate(coverage,
{threshold, zones})` (line 73) over a `dominantCoverage` census; `acceptWithCoverage` (line 101)
encodes the contract: **coverage runs FIRST and short-circuits; on failure the resemblance fields
are nulled, NOT computed** — the record must show the delta was never consulted. The census basis
is the 6-direction **exposure shell** (`surfaceZoneHistogram(occ, zoneOf, {skin: "exposure"})`),
which is by construction view-independent ("what a camera at ANY angle can see" — zone-fill.mjs
header). There is **no per-azimuth coverage instrument**: `projectSurface` supports the 4 ortho
elevations + the 4 ground diagonals (`DIAG_DIRS`, surface-grid.mjs line 31), so a per-diagonal
projection census is *possible*, but nothing computes one today. durable-skin.mjs computes the
exposure-shell coverage + `coverageGate` as its terminal gate (lines 427-433) and records it.

## 5. The proof artifacts (fail one way, pass the other)

- **Grey-roof-sides cottage** (must FAIL on a non-front azimuth):
  `benchmarks/sculpture/concept-materials/cottage/after-artifact.json` — the committed E-23-era
  build durable-skin uses as its raw INPUT; its roof-band exposed surface was measured 42.7%
  spruce (the ticket's number) before the T-085/T-090 fill. Also fails the T-088 coverage gate
  (durable-skin's splat-only replay: `roof dark_oak_planks=2%` → REJECT).
- **Fully-skinned cottage** (the pass candidate): `durable-skin/cottage/artifact.json` — passed
  the exposure-shell coverage gate (band0 70% / band1 81% / roof 57%), roof-materials 100%,
  T-092 derived zone map. Whether the judge rules same-object at all 4 azimuths is an open
  empirical question (E-25 Rule 6: an honest fail is a recorded finding).
- A "synthetic positive" alternative is sanctioned by the AC (a build constructed to pass).

## 6. Aggregation + test conventions

- Pure-verdict test precedent: `src/form/resemblance.test.mjs` (lines 253-330) — parser contract
  cases + consolidation tallies, no GL/no network. `node --test "src/**/*.test.mjs"` (1084 green).
- Scorecard aggregation precedent: `src/form/e18-scorecard.mjs` (per-attribute tallies → verdict).
- Impure runners are validated by their own committed records + `--offline` re-asserts, never by
  the test glob (durable-skin / resemblance pattern).

## 7. Constraints and open questions surfaced (facts, not decisions)

- **"≤2 named minor gaps total" has no representation in E-22's verdict schema**: `same object`
  FORBIDS a gap (parser throws), and non-same verdicts carry exactly ONE gap. A "same-object
  with named minor gaps" record requires either a schema extension (a v2 verdict) or a
  reinterpretation (e.g. counting "drifted" views as the named gaps within budget — but the AC
  separately requires same-object at EVERY azimuth, so that reading conflicts).
- **The angle set must live in config and be non-overridable per run** (AC1 / E-25 Rule 4). Today
  angle choices are ad-hoc per runner (`BUILDING_VIEW_3Q`, `OBLIQUE_ANGLE`).
- **Refuse-to-verdict on a missing view** is a new behavior: every existing runner treats renders
  as best-effort evidence (`tryRenderAngle` catches and records errors).
- **The E-22 single-view gate has callers that must not change**: `resemblance.mjs` CLI,
  `resemblance-consolidation.mjs` (S-077), and the committed records under
  `benchmarks/sculpture/resemblance/`.
- **Concept is a single 3/4 image** — there is exactly one reference view; per-azimuth judging
  compares each build view against the SAME concept image (the concept does not rotate). The mesh
  silhouette CAN rotate (`rasterizeSilhouette(..., {view})` takes a view), though E-22 only uses
  the 3/4 view today.
- 4 judge calls per gate run = 4× the metered cost of E-22's single call; `--offline` and
  committed-render reuse are the existing cost-control levers.
- The judge model is pinned (`PHASE1_MODEL_ID`); per-op tiering exists (`MODEL_TIERS`) but E-22's
  judge runs on the strong tier.
