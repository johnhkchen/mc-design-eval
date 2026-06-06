# T-058-02 — Structure: file-level blueprint

The shape of the change, not the code. Files created/modified, public interfaces, ordering. Grounded in
`design.md`.

## Created

### `benchmarks/sculpture/palette-discipline.mjs` — the verification record runner (GL-host, not CI)
The AC#4 record across all 7 subjects. Mirrors the established runner shape (`secondary-palette.mjs`,
`glb-voxel-breadth.mjs`): local `decodeTexture` (dwebp), `SUBJECTS` imported from `glb-voxel-breadth.mjs`,
`paletteFromManifest` from the design manifest, `--offline` to rebuild from committed summaries.
- **Per subject (GL-free palette metrics):**
  - `prim = paletteFromManifest(designManifest)`; `aug = augmentPalette(prim, texture)`.
  - `after = glbVoxelBuild(glb, {scale, decodeTexture, palette: prim, augment: true})`.
  - `before = glbVoxelBuild(glb, {scale, decodeTexture, palette: blockPaletteFromTable()})` (pre-fix
    full-table snap, same voxelization) → the "91"-style distinct count.
  - `assertPaletteDiscipline(after, aug, { cap: prim.length + 2 })` (the guard, run live).
  - record `{ subject, designDocSize, secondaryCount, distinctBefore (full-table), distinctAfter (augmented),
    offPaletteAfter (=0), cap, formIoURef (R1 summary silhouetteIoU), pass }`.
- **PURE roll-up `buildDiscipline(rows, {scale})`** → `{ md, json }` (schema `palette-discipline/v1`). Table:
  `subject | design-doc size | secondary | distinct before→after | off-(aug) | cap | form IoU (ref) | pass`.
  The md headline: max before→after drop (heart 91→7), all off-(aug)=0, all distinct ≤ size+2.
- Writes `palette-discipline/<subj>/summary.json` + `palette-discipline.{md,json}`. No render PNGs needed
  (palette metrics are render-free); if any are produced, gitignore them.
- Exports `{ buildDiscipline }` for an offline rebuild path.

## Modified

### `src/form/glb-voxel-build.mjs` — add the guard
- **New export `assertPaletteDiscipline(artifact, palette, opts = {})`:**
  - `palette`: `{key,lab}[]` (or accept a key-set; spec: `{key}[]`). Build `allowed = new Set(palette.map
    key)` (bare keys; namespace-strip placements).
  - Scan `artifact.palette.manifest` (already the unique placed blocks); collect any whose bare key ∉
    `allowed`. If non-empty → `throw new Error("palette discipline: N block(s) outside the augmented
    design-doc palette (size M): a, b, …")`.
  - If `opts.cap` is a number and `manifest.length > cap` → throw naming the count vs cap.
  - Returns the artifact (chainable) on success. PURE; no I/O, no GL.
- Placed near `paletteFromManifest`. JSDoc explains it is the consumer-side palette assert, the twin of
  `assertArtifact`.

### `src/form/glb-voxel-build.test.mjs` — guard + augment-wiring unit tests (CI)
- `assertPaletteDiscipline`: (a) manifest ⊆ palette → returns artifact, no throw; (b) a manifest block
  outside palette → throws naming it; (c) `cap` exceeded → throws; (d) namespace tolerance
  (`minecraft:foo` placement vs bare `foo` palette key).
  Build artifacts via the existing `colorVoxelsToArtifact` + `occ2x1x2()` helpers, or hand-assemble a minimal
  artifact `{palette:{manifest},placements}` for the pure guard.
- `glbVoxelBuild({augment})` wiring (closes T-058-03 review gap #1): a synthetic in-test GLB-less path is
  not possible (glbVoxelBuild needs GLB bytes); instead assert at the `colorVoxelsToArtifact` +
  `augmentPalette` seam on synthetic occupancy/colors/texture that the augmented build's manifest ⊆ augmented
  palette and `assertPaletteDiscipline` passes. (If a GLB fixture is infeasible offline, cover the seam:
  augmentPalette(prim, tex) ⊇ prim, and a colorVoxelsToArtifact over it passes the guard.)

### `benchmarks/sculpture/glb-voxel-breadth.mjs` — R1: augment + guard
- Add `augment: true` to the `glbVoxelBuild(...)` opts.
- After `assertArtifact(artifact)`, compute `aug = augmentPalette(palette, decodedTexture)` and call
  `assertPaletteDiscipline(artifact, aug, { cap: palette.length + 2 })`. (Requires the decoded texture; the
  runner currently passes `decodeTexture` into `glbVoxelBuild` and does not hold the texture — either expose
  the texture or recompute the augmented palette by decoding once in the runner. Simplest: decode once in the
  runner, pass `texture`-derived `augment` is internal; for the guard, recompute `aug` from a single decode.)
  *Minimal-change alternative:* import `augmentPalette` + `blockPaletteFromTable` only if needed; the guard
  needs the augmented palette — decode the texture once in the runner for the guard, or skip the in-runner
  guard and rely on the palette-discipline record. Decision in plan.md (keep R1 change minimal: `augment:true`
  + record-level guard, avoid double-decode).
- Update the per-row/style prose to note "augmented design-doc palette".

### `benchmarks/sculpture/glb-voxel-seg.mjs` — seg: bug fix + augment + guard
- **Fix the latent bug:** rename the 5 stray `snapPalette` references (l.233, 248, 263, 280, 281) to
  `palette` (the actual local from l.211). Without this the runner `ReferenceError`s on any live run.
- Add `augment: true` to the `segmentMaterials(...)` opts.
- `offPaletteAfter`/`offPaletteBefore` should be measured against the **augmented** palette: compute
  `aug = augmentPalette(palette, texture)` once and use it where `palette` was used for `offPaletteCount`.
- Optional in-runner `assertPaletteDiscipline(artifact, aug, {cap: palette.length+2})` after `assertArtifact`.

### `benchmarks/sculpture/e18-remeasure.mjs` — integrate: the core fix
- Read the design manifest (as the other runners do): `designManifest = JSON.parse(readFile(runs/<run>/
  artifact.json)).palette.manifest`; `prim = paletteFromManifest(designManifest)`.
- Pass `palette: prim, augment: true` to the `segmentMaterials(...)` call (currently no palette).
- Compute `aug = augmentPalette(prim, texture)`; measure E18/R1/R2 `offPalette` against `aug` (not the k=6
  `segPalette`). Keep `segPalette`/`refClusters` only where still needed (value-ΔE reference stays the E-17
  k=8 texture palette for comparability — unchanged).
- `assertPaletteDiscipline(artifact, aug, {cap: prim.length+2})` after `assertArtifact`.
- Import `paletteFromManifest`, `augmentPalette`, `assertPaletteDiscipline` from `glb-voxel-build` /
  `palette-augment`. `SUBJECTS` already imported (carries `run`).
- The `assembleRemeasure` assembler (src/form/remeasure.mjs) is unchanged — it consumes rows; only the
  `offPalette` *values* in the rows change.

### `.gitignore`
- Add a stanza for `benchmarks/sculpture/palette-discipline/**/render-*.png` (mirrors the other sweep
  stanzas) only if the runner emits renders; the durable record is `palette-discipline.{md,json}` + summaries.

## NOT changed
- `src/form/palette-augment.mjs`, `src/form/material-segment.mjs` core, `keysToArtifact`,
  `colorVoxelsToArtifact` — the mechanism is correct; only call sites + the guard change.
- `glb-voxel-surgical.mjs` (R3) — compliant by inheritance (design Decision 6); audit-documented, not edited.
- `src/form/remeasure.mjs` assembler — consumes rows unchanged.

## Public interfaces (new/changed)
```
// src/form/glb-voxel-build.mjs
export function assertPaletteDiscipline(artifact, palette, { cap } = {}): artifact  // throws on violation

// runners now call segmentMaterials/glbVoxelBuild with {palette, augment:true} and guard the result
```

## Ordering (commit boundaries — full detail in plan.md)
1. Guard + unit tests (src, CI-safe) — `npm test` green.
2. Runner wiring: R1 augment; seg bug-fix + augment; integrate palette + augment + off-palette reference.
3. Verification runner `palette-discipline.mjs` + generate `palette-discipline.{md,json}` (live, GL-free).
4. Regenerate R1 / seg / e18-remeasure sweeps (live GL) + refresh committed artifacts/records.
