# Structure — T-083-01 hollow-cottage-milestone

The blueprint. This ticket is **integration-heavy, new-code-light**: one tiny pure module + its test, one
chained runner, the E-12 assets, and the design-learnings section. Every geometric guarantee is borrowed
from a tested core; nothing reimplements expansion, carve, fill, or render.

## Files

### Created

**`src/view/cutaway.mjs`** (pure, ~60 ln) — the only new pure capability.
- `sectionKeys(occ, { axis, at, side })` → `Set<string>` of occupancy keys to **remove** for a render-only
  section. `axis ∈ {"x","y","z"}`; removes cells on `side` of the plane `coord = at` (`side:"above"` removes
  `coord ≥ at`, `side:"below"` removes `coord < at`). Iterates `occ.cells` keys (format `"x,y,z"` — matches
  `voxelKey`, so the set drops straight into `carveArtifact`). PURE, deterministic, no GL/IO/Date/random.
- `roofCut(occ, read)` → `sectionKeys` removing everything **above the top storey's ceiling** (derived from
  the structural read's floor lines + bounds) — the plan/top section input.
- `frontHalfCut(occ)` → `sectionKeys` removing the front half (`z ≥ midpoint`) — the 3-Q cross-section input.
- Both helpers return a remove-set; the runner does `carveArtifact(filled, set)` on a **throwaway copy** to
  get the section artifact to photograph. The helpers never mutate `occ` or the artifact.

**`src/view/cutaway.test.mjs`** (~10 tests) — synthetic occupancy (a solid box, a two-storey shelled box):
- `sectionKeys` removes exactly the cells on the named side of the plane; the complement is kept; empty
  occupancy → empty set; an out-of-range plane → all or nothing (boundary).
- `roofCut` keeps the lower storeys and removes the roof band (count = cells above ceiling).
- `frontHalfCut` removes the `z ≥ mid` half (count check on a box).
- **Round-trip invariant:** `carveArtifact(artifact, sectionKeys(...))` yields a build whose occupancy is
  exactly `occ` minus the section set (compose with `carveOccupancy`) — i.e. the section is a faithful clip.
- Source guard (no model/GL/API-key/Date/random import), mirroring `hollow-carve.test.mjs`.

**`benchmarks/sculpture/hollow-cottage-milestone.mjs`** (impure runner, ~220 ln) — the chain. Sections:
1. **Load + paint** — load raw cottage; run the deterministic spray-paint stage (concept-splat +z front,
   GLB-splat +x side via `loadGlbSplat` with the `dwebp` `decodeTexture`, `paintFace` → `mergePaints` →
   `applyPaint`); record plaster `white_terracotta` before/after; capture `front-before`/`front-after` face
   renders (best-effort GL) for the E-12 before/after.
2. **Seal** — `sealRoof` + `sealWalls` → `applyDeltas` (coherence holes only).
3. **Hollow** — `hollowableCore` prior → **metered light** `hollowable-mass` detector (3-Q view) → `keep =
   cornerPostKeys ∪ tallColumnKeys` → `markHollowable` → `carveArtifact`; `exteriorHeld` proof (throws if
   false); `cavityReport`; `watertightCheck` before/after.
4. **Fill** — `structuralRead` → `storeysFromRead` → **metered strong** `floorplan-author` (plan+elevation)
   → `parseFloorplanSpec` (fallback 2×2) → `generateFloorplan` → `applyFloorplan`; `gateFloorplan`
   (plausibility, six constraints + residual); `exteriorHeld` proof again (throws if false).
5. **Gates** — exterior **resemblance** front face before/after vs concept (`faceResemblance` +
   `acceptIfCloser`, best-effort GL); interior **plausibility** (the gate from step 4). Both with a named
   residual.
6. **Renders** — multi-angle `front`, `+x+z` (diag/oblique), `threeQuarter` on the **real** final build;
   cutaway `cutaway-plan` (roofCut → `top`), `cutaway-section` (frontHalfCut → `threeQuarter`),
   `from-below` (`bottom` on the real build). All via `renderViews`.
7. **Write** — `milestone-cottage-artifact.json` (the one finished build, AJV-asserted),
   `milestone-report.json` (both gates + exteriorHeld + cavity + floorplan + detector usage + render paths),
   and copy the E-12 assets into `pr/assets/` (face before/after, montage, cutaway).

The runner is self-sufficient (sibling pattern) and degrades gracefully: GL-blind → recorded gaps; shim-down
→ deterministic fallbacks; `dwebp` absent → side splat skipped. The deterministic spine (paint counts,
carve counts, gate constraints, exteriorHeld) **always** runs and is recorded.

### Modified

**`package.json`** — add `"milestone:cottage": "node benchmarks/sculpture/hollow-cottage-milestone.mjs"`.

**`docs/knowledge/design-learnings.md`** — append `## 2.5-D interaction sector (E-23) …` (the AC-#5 section).

**`pr/assets/`** — add `cottage-face-before.png`, `cottage-face-after.png`, `cottage-multi-angle.png`,
`cottage-cutaway.png`, and `hollow-cottage.md` (E-12 handoff). Wired in `.gitignore` only if the siblings'
face PNGs are gitignored — but `pr/assets/*.png` are **committed** (the existing triptychs are tracked), so
these are committed too.

### Not modified (reused as-is — the integration surface)

`src/view/{occupancy,structural-read,multi-angle,surface-grid,reference-quantize,glb-splat,face-paint,
palette-cans,face-resemblance,hollow-carve,floorplan,hollowable-mass}.mjs`, `src/model-tier.mjs`,
`src/sdk-binding.mjs`, `src/artifact.mjs`, `render/src/render-tool.mjs`. The milestone consumes their public
exports unchanged — if any needed a change, that would be a missing dependency edge, not milestone work.

## Module boundaries / interfaces

- **`cutaway.mjs` is the only new pure unit.** Its contract: given an occupancy and a plane, return the
  remove-set; the *artifact* clip is done by the existing `carveArtifact`. This keeps the new code to "compute
  a set of keys" — the smallest possible new surface, fully testable offline.
- **The runner owns all impurity:** GL renders, the two metered calls, GLB decode, file writes, `magick`
  montage. No `src/` file gains a model/GL import.
- **Determinism boundary:** every *geometric* result (paint counts, carve counts, plausibility constraints,
  exteriorHeld digests, section sets) is pure and reproducible; only the two LLM steerings and the GL pixels
  vary across runs (recorded honestly, per the sibling residual pattern).

## Ordering of changes (so each step is independently verifiable)

1. `src/view/cutaway.mjs` + `cutaway.test.mjs` → `npm test` green (the only suite-affecting change).
2. `benchmarks/sculpture/hollow-cottage-milestone.mjs` + `package.json` script → offline structure provable
   (fallbacks make the chain run without the shim).
3. Live run (metered) → artifacts + renders + report; copy E-12 assets; assemble montage/cutaway PNGs.
4. `design-learnings.md` E-23 section + `pr/assets/hollow-cottage.md`.

Step 1 is the only change that can break `npm test`; everything after is runner/docs/assets. This lets the
suite stay green from the first commit and isolates risk to ~60 lines of pure, tested code.
