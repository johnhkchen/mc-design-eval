# T-049-01 — Plan: ordered, atomically-committable steps

Each step is independently verifiable; tests stay green at every commit. The pure work (1–2) lands first
and is fully unit-tested offline; the metered re-run (3) is gated behind GL/model and committed as a record.

## Step 1 — Pure kernel: `mapVoxelRegionToMesh` + `glbSilhouetteScore`

**Edit** `src/form/form-target.mjs`:
- Add imports: `extractSilhouette, normalizeSilhouette, iou, RENDER_BG, FORM_DEFAULTS` from
  `./form-fidelity.mjs`.
- Add `mapVoxelRegionToMesh(subBounds, buildBounds, meshBounds)` — per-axis fractional map (design D2),
  with the degenerate-axis guard (build span 0 ⇒ full mesh span) and min≤max normalization.
- Add `glbSilhouetteScore({ targetMask, renderImg, grid, fit, _extract = extractSilhouette })` — extract
  the render silhouette (`RENDER_BG`), normalize both masks to G×G, return `iou`.

**Test** (`form-target.test.mjs`, new group F):
- `mapVoxelRegionToMesh`: (i) identity bounds → passthrough; (ii) known asymmetric mesh AABB + a
  front-lower-third voxel box → exact expected mesh region; (iii) degenerate build axis → full mesh span,
  no NaN.
- `glbSilhouetteScore`: identical masks → 1.0; disjoint → 0.0; a half-overlap synthetic → strictly in
  (0,1). Uses tiny hand-built RGBA `renderImg` + `extractSilhouette`-shaped `targetMask`.

**Verify:** `npm run test:unit` green; no fs/GL touched.

## Step 2 — `glbFormTarget` adapter (replace the throwing stub)

**Edit** `src/form/form-target.mjs`:
- Add imports: `loadMeshFromGlb, rasterizeSilhouette` from `./glb-silhouette.mjs`; `SCULPTURE_VIEW_3Q`
  from `../sculpture.mjs`.
- Replace the `glbFormTarget(opts){ throw … }` body with the adapter (structure.md): memoized `loadMesh`,
  `scoreRender(renderPath, R)` (region-mapped per-region IoU; whole-object fallback when `buildBounds`
  absent), `wholeObjectScore(renderPath)`. Defaults: `view=SCULPTURE_VIEW_3Q`, `grid/fit` from
  `FORM_DEFAULTS`, `_loadMesh/_rasterize/_decode` injectable (`_decode` lazy-imports `decodeImage`).
- Keep `FormTargetNotImplementedError` exported (back-compat). Update the module/docblock note: the GLB
  adapter point is now *implemented* (was "until then this throws").

**Test** (`form-target.test.mjs`):
- **Delete** test B (the throws assertion).
- Add: `glbFormTarget` with injected `_loadMesh` (fake mesh `{bounds}`), `_rasterize` (records opts,
  returns a fixed mask), `_decode` (returns a fixed RGBA): assert `kind==="glb"`; `scoreRender` forwards a
  `region` derived from `R.subBounds`+`buildBounds`+mesh bounds (assert the forwarded region equals
  `mapVoxelRegionToMesh(...)`); `wholeObjectScore` forwards **no** region; `buildBounds` omitted ⇒
  `scoreRender` forwards no region (whole-object fallback). Memoization: `_loadMesh` called once across two
  `scoreRender` calls.
- Extend the swap test: `resolveFormTarget({formTarget: glbFormTarget({_loadMesh,_rasterize,_decode})})`
  returns it unchanged and `scoreRender` runs end-to-end — the seam invariant, now on the real GLB target.

**Verify:** `npm test` green (validation + unit; suite ≥ 464 + new − 1 deleted).

## Step 3 — The metered E-15 re-run harness + recorded result

**New** `benchmarks/sculpture/glb-formtarget-ab.mjs` (mirror `form-revise-ab.mjs`; structure.md):
- Swap the target to `glbFormTarget({ glbPath, buildBounds: artifactBounds(artifact) })`; `score:
  liveFormScore({ formTarget: target })`; whole-object before/after via `target.wholeObjectScore`.
- Same two subjects/regions/editor (`makeFormEditor` forcing the form route), same
  `budget:{maxIterations:4,perRegion:1}`, same `formVerdictOf` + `form-baseline.json` E-13 baselines.
- `emit` → `glb-formtarget-ab.{json,md}` with the GLB provenance + honesty note (coordinate-space caveat;
  did the 3-D target move the loop — explicit yes/no per subject).
- `--offline` regen mirrors the template.

**Run (best-effort, metered/GL):** `node benchmarks/sculpture/glb-formtarget-ab.mjs`.
- If GLBs + artifacts + render/model are available in this environment → live numbers recorded.
- If not (gitignored 5 MB assets / no GL / no `claude -p`) → generate an **honest placeholder** `.{md,json}`
  via the offline path documenting the seam is wired, the run command, and that the live A/B awaits an
  environment with the assets — a null/deferred *record*, not a fabricated score (AC #4: honesty).

**Verify:** `glb-formtarget-ab.md` table renders; `npm test` still green (the harness is not in the suite).

## Step 4 — Review + commit

- `progress.md` updated per step with deviations.
- Single commit (or one per step) on `main`: `feat(E-16 T-049-01): glbFormTarget + E-15 loop re-run`.
- `review.md` (handoff): files changed, AC status, test coverage + gaps, the honest did-it-move finding,
  open concerns (orientation mismatch, live-run environment).

## Testing strategy

| Unit (in `npm test`, offline) | Metered / GL (on demand, NOT in suite) |
|---|---|
| `mapVoxelRegionToMesh` math (identity, asymmetric, degenerate) | the live `reviseLoop` re-run on koi/heart |
| `glbSilhouetteScore` IoU (1 / 0 / partial) | whole-object before/after render + IoU |
| `glbFormTarget` region-forwarding, whole-object, fallback, memoize | the categorical verdict vs E-13 baseline |
| seam invariance via `resolveFormTarget` | the eyeball that the GLB silhouettes frame correctly |

## Acceptance-criteria → step map

- AC #1 (`glbFormTarget` behind `scoreRender`; whole + true per-region IoU) → Steps 1–2.
- AC #2 (re-run with `glbFormTarget` via `liveFormScore`/`resolveFormTarget`; before/after recorded) → Step 3.
- AC #3 (no loop control-flow change — drop-in `scoreRender`) → Step 2 (no `loop.mjs` edit; swap test).
- AC #4 (honest did-it-move; pure logic unit-tested; `npm test` green) → Steps 1–4 + the recorded note.
</content>
