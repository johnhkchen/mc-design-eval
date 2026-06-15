# Plan — T-079-01 spray-paint-materials

Ordered, independently-verifiable steps. Each pure core ships with its `*.test.mjs` and commits
atomically; the impure runner is last. Verification per step is `npm run test:unit` (the new tests)
plus the full `npm test` at the end. The metered cottage run is exercised by hand (`npm run
spray:paint`), not by `npm test`.

## Step 1 — `palette-cans.mjs` (the "4 cans", AC #3)
**Do:** `allowedPalette(artifact, additions)`, `withAdditions(artifact, additions)`,
`filterToPalette(targetGrid, allowed)`. Reuse `bareBlock` (occupancy.mjs).
**Test:** union + add-back, manifest stays sorted/namespaced, off-palette cell nulled, idempotent
add-back. **Verify:** `node --test src/view/palette-cans.test.mjs` green. **Commit:**
`feat(E-23 T-079-01): palette-cans — enforced "4 cans" + concept-justified add-back`.

## Step 2 — `face-paint.mjs` (splat→back-project→recolor, AC #1, #4)
**Do:** `paintFace(occ, dir, targetGrid, {allowed, source})` → `PaintPass`; `mergePaints(passes,
{priority})` with concept>glb corner precedence + `voxelKey` dedup; `applyPaint(artifact, placements)`
appending recolor voxels. Consumes `projectSurface`/`backProject` (T-078). No air op; skip
no-change/off-palette/air cells.
**Test (the load-bearing invariant):** on a synthetic 3×3×3 + an L-occupancy —
- painting a top band recolors exactly the band's front voxels;
- `expandArtifact(applyPaint(...))` has **identical voxel positions** to the original (geometry-safe),
  only the painted blocks differ;
- a target == current block emits no placement;
- an off-palette target is skipped (counted in `offPalette`);
- `mergePaints`: a shared corner voxel resolves to the `concept` pass over `glb`;
- an occluded interior voxel (never a front-most cell) is never painted.
**Verify:** `node --test src/view/face-paint.test.mjs`. **Commit:**
`feat(E-23 T-079-01): face-paint — splat back-projection to recolor placements + corner precedence`.

## Step 3 — `glb-splat.mjs` (side/roof target, AC #2)
**Do:** `glbVoxelOccupancy({surface, texture, occupancy, palette})` (reuse `sampleSurfaceColors` +
`colorVoxelsToArtifact` → `artifactOccupancy`); `splatFromGlbOccupancy(glbOcc, dir, faceGrid)`
projecting through the same `dir` + nearest-cell resample onto the build face `(n,m)`;
`loadGlbSplat(...)` the lazy-impure decode leaf.
**Test (PURE parts):** a synthetic colour-true occupancy + a build face grid — the projected/resampled
target matches the face `(n,m)`, snaps to the injected palette, and a known coloured voxel lands in the
expected cell. Decode/parse left to the runner.
**Verify:** `node --test src/view/glb-splat.test.mjs`. **Commit:**
`feat(E-23 T-079-01): glb-splat — same-angle textured-GLB material target in voxel space`.

## Step 4 — `face-resemblance.mjs` (accept-if-closer, AC #5)
**Do:** `faceResemblance(buildFaceImg, conceptFaceImg, blockTable, opts)` reusing `zoneAgreement` +
`setAgreement`; `acceptIfCloser({before, after, epsilon})` mirroring `reviseLoop`'s gate.
**Test:** deterministic synthetic RGBA face pair (built in-test, no PNG fixture) — a face nearer the
concept scores higher; `acceptIfCloser` accepts strict improvement and rejects equal/worse (rollback).
**Verify:** `node --test src/view/face-resemblance.test.mjs`. **Commit:**
`feat(E-23 T-079-01): face-resemblance — per-face E-22 gate + P14-safe accept-if-closer`.

## Step 5 — full `npm test` gate
**Do:** run `npm test` (AJV self-test + `test:unit`). Fix any glob/import breakage.
**Verify:** green. **Commit:** none (gate only) unless a fix is needed.

## Step 6 — `benchmarks/sculpture/spray-paint.mjs` (the cottage run, AC #6, #7)
**Do:** wire the runner per Structure — load cottage build + concept + GLB; front concept-splat +
`+x` GLB-splat; `paintFace` → `mergePaints` → per-face gate (render before/after via `renderViews`,
`faceResemblance`, `acceptIfCloser`) → commit/rollback → `assertArtifact`. `--refine` adds the metered
LLM face-vs-face call; default off. `--offline` re-derives from committed numbers. Record
`spray-paint/cottage.json` + `.md`: **white_terracotta before/after** (plaster band restored), per-face
resemblance before/after, painted/skipped/offPalette, accept/rollback, additions. Add the `spray:paint`
npm script.
**Verify:** `npm run spray:paint` produces the record with white_terracotta recovered from 8 and the
front face resemblance not regressed; `assertArtifact` passes on the painted build. If GL/model is
unavailable in this environment, run the deterministic splat+back-project+`applyPaint`+`assertArtifact`
path and the `--offline` verdict, and record what was deferred (honest gap, not a silent skip).
**Commit:** `feat(E-23 T-079-01): spray-paint runner — cottage front+side, plaster band restored`.

## Testing strategy
- **Unit (in `npm test`):** every `src/view/*` core — palette enforcement, the geometry-safe recolor
  round-trip (the key invariant), corner precedence, glb-splat alignment/snap, the per-face accept
  gate. All on synthetic occupancy/RGBA, GL-free, model-free.
- **Integration (by hand, metered/GL):** the cottage front+side run — the real plaster-band recovery
  and per-face resemblance before/after. Isolated to the runner; `--offline` keeps a model-free,
  GL-free re-derivation for CI parity.
- **Not tested (documented leaves):** GLB decode/parse, the live GL render, the metered LLM refine —
  the impure edges, mirrored on `multi-angle.mjs`/`material-correct.mjs` precedent.

## Risks / watch-items
- **Concept-vs-front camera mismatch** depresses absolute zone agreement (E-22 honesty ledger) — rely
  on the *relative* before/after delta and the white_terracotta count, not absolute IoU.
- **GLB↔build registration**: the resample guards alignment, but if the GLB occupancy is empty/degenerate
  the side splat should no-op gracefully (skip, recorded), never throw mid-run.
- **`zoneAgreement` reads render pixels** (Rule 2 proxy) — the verdict remains the human face triptych;
  the gate is a hill-climb nudge, P14-safe by rollback.
</content>
