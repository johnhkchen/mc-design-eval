# Plan — T-084-01 surface-coherence-ops

Ordered, independently-verifiable steps. Each ends at a green `npm test` and an atomic commit. The pure
cores are unit-tested offline; the cottage run is the one metered/GL proof.

## Step 1 — Enabling exports (surface-grid + structural-read)

- `src/view/surface-grid.mjs`: add `orthoSpec(dir)` (wraps `resolveDir`, asserts ortho) and
  `cellWorldPos(occ, spec, u, v, w)` (world `[x,y,z]` from grid `(u,v)` + world depth `w`, via the existing
  `worldOnAxis`). No change to existing functions.
- `src/view/structural-read.mjs`: add `export` to the existing internal `airComponents`.
- **Tests:** extend `surface-grid.test.mjs` — `cellWorldPos` round-trips a known surface cell
  (`projectSurface` cell `(u,v)` whose `cellWorldPos(occ, spec, u, v, cell.voxel[axisW])` equals
  `cell.voxel`); `orthoSpec` throws on a diagonal. Extend `structural-read.test.mjs` — `airComponents` tags
  an enclosed vs a border-touching component.
- **Verify:** `npm run test:unit` green. **Commit:** `feat(E-23 T-084-01): surface-grid + structural-read seal-enabling exports`.

## Step 2 — `surface-coherence.mjs` pure core: watertight check

- Create the module with `watertightCheck(occ, {interior, padding})` + the inline enclosed-mass key
  computation + `applyDeltas`.
- **Tests** (`surface-coherence.test.mjs`):
  - sealed hollow box → `watertight:true`, `interiorCells>0`.
  - breached box (one skin voxel removed) → `watertight:false`, `reached>0`, breach sample non-empty.
  - solid cube → carve enclosed core → `watertight:true`.
  - empty occupancy → `{watertight:true, interiorCells:0, reached:0}` (no throw).
  - explicit `interior` arg overrides the default enclosed set.
- **Verify:** `npm run test:unit` green. **Commit:** `feat(E-23 T-084-01): watertight shell flood-fill check`.

## Step 3 — `sealRoof` + roof-outline coverage

- Add `dominantBlock`, `enclosedHoleCells`, `neighbourDepthW`, `roofOutlineCoverage`, `sealRoof`.
- **Tests:**
  - 3×3 single-material roof + 1 stray → 1 recolor delta, `after` strayCount 0, coverage 1.0.
  - roof with a centre enclosed hole → 1 fill delta at the neighbour-flush y; coverage 1.0 after.
  - non-rectangular roof → bbox corners (border-open) are **not** filled; only enclosed gaps.
  - `strip` set restricts which strays are recolored.
  - empty roof → zero deltas, no throw.
- **Verify:** green. **Commit:** `feat(E-23 T-084-01): watertight roof op (strip strays + seal holes)`.

## Step 4 — `sealWallFace` + `sealWalls`

- Add `sealWallFace(occ, dir, opts)` and the four-face fold `sealWalls(occ, opts)` (dedup by `voxelKey`).
- **Tests:**
  - wall face with one `spruce_planks` intrusion → 1 recolor to the stone field; `after` intrusion 0.
  - wall face with an enclosed hole → 1 fill; a border-touching air column (an intended opening) is
    **untouched** (no front voxel to recolor, not an enclosed hole).
  - `sealWalls` dedups a shared corner voxel sealed by two faces (one delta, not two).
  - `fieldMaterial` override forces the field block.
- **Verify:** green. **Commit:** `feat(E-23 T-084-01): coherent wall-skin op (strip intrusions + seal holes)`.

## Step 5 — Integration test: seal → watertight on a synthetic cottage-like shell

- One end-to-end pure test: a small holed shell (roof gap + wall intrusion + skin hole) →
  `sealRoof` + `sealWalls` → `applyDeltas` → re-derive occupancy → `watertightCheck` returns `watertight:true`
  and roof coverage 1.0. This pins the **op-chain → invariant** the cottage run exercises live.
- Source-guard: module text has no `ANTHROPIC_API_KEY`, no GL/render import.
- **Verify:** `npm test` green (full suite, not just unit). **Commit:** `test(E-23 T-084-01): seal→watertight integration on synthetic shell`.

## Step 6 — The cottage runner (metered/GL) + npm script

- Create `benchmarks/sculpture/surface-coherence.mjs` (mirror `detector-routing.mjs`):
  load cottage → `structuralRead` → **light-tier detectors (metered)** for the candidate flags → pure
  `sealRoof` + `sealWalls` → `watertightCheck` → re-derive + render before/after → write
  `surface-coherence-report.json`, the sealed artifact, and PNGs to `docs/active/work/T-084-01/`.
- Add `"coherence:cottage"` to `package.json`.
- **Verify:** `npm run coherence:cottage` (metered; subscription, light `--model` on the detectors).
  Confirm: before/after roof coverage, stray/intrusion/skin-hole counts, watertight pass/fail recorded.
- **Commit:** `feat(E-23 T-084-01): live cottage surface-coherence run + report`.

## Testing strategy

- **Unit (pure, `src/**/*.test.mjs`):** every op + the watertight check on synthetic occupancy — the AC's
  "a holed shell seals; strays strip; a breached shell fails the check". `cellWorldPos`/`airComponents`
  exports get round-trip/classification tests. This is the bulk of coverage and gates every commit.
- **Integration (pure):** Step 5 chains the ops → the watertight invariant on a small shell.
- **Metered/GL (not unit-tested, by design):** the live `claude -p` detector calls and the GL renders, like
  `detector-routing.mjs` — covered by the documented `coherence:cottage` round-trip, not asserted offline.
- **Verification criteria per AC:**
  - *Watertight roof op* — roof outline coverage → 1.0, stray → 0 (unit + cottage report).
  - *Coherent wall-skin op* — intrusion count down, skin-hole count → 0 (unit + cottage report).
  - *Watertight shell check* — flood-fill verdict reported pass/fail (unit pass+fail cases + cottage).
  - *Pure/deterministic + unit-tested* — Steps 2–5, no GL/IO/Date/random.
  - *Cottage run + `npm test` green* — Step 6 + the suite stays green throughout.

## Risks & mitigations

- **Cottage may not reach watertight** (a residual border-open notch the enclosed-hole seal can't see). →
  Report honest pass/fail + name the residual; hand off to the strong-tier `seal-authoring` op the routing
  table already reserves. The unit tests prove the ops reach watertight on a clean holed shell.
- **`cellWorldPos` sign/axis bug** silently misplacing a seal. → The Step 1 round-trip test pins
  `cellWorldPos(projectSurface cell) === stored voxel` before any op depends on it.
- **Over-stripping a multi-material wall.** → Default strip-all-non-field matches the cottage's single field;
  the `strip`/`fieldMaterial` knobs scope it when a wall is intentionally polychrome (documented, tested).
