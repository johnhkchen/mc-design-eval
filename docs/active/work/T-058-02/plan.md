# T-058-02 — Plan: ordered, verifiable steps

Five steps, four commits. Each step independently verifiable. Maps to the ACs at the end.

## Step 1 — The guard + unit tests (src, CI-safe) → commit 1

1. `src/form/glb-voxel-build.mjs`: add `assertPaletteDiscipline(artifact, palette, { cap } = {})`.
   - `allowed = new Set(palette.map(p => p.key))`.
   - `off = artifact.palette.manifest.filter(b => !allowed.has(b.replace(/^minecraft:/, "")))`.
   - `if (off.length) throw new Error("assertPaletteDiscipline: " + off.length + " block(s) outside the
     augmented design-doc palette (size " + palette.length + "): " + off.join(", "))`.
   - `if (Number.isFinite(cap) && artifact.palette.manifest.length > cap) throw … "distinct " + len + " >
     cap " + cap`.
   - `return artifact`.
2. `src/form/glb-voxel-build.test.mjs`: add tests —
   - guard passes (manifest ⊆ palette) and returns the artifact;
   - guard throws naming an off-palette block;
   - guard throws on `cap` exceeded;
   - namespace tolerance (`minecraft:foo` placement, bare `foo` palette key);
   - augment-seam wiring: `augmentPalette(prim, synthTexture, synthTable)` ⊇ prim, a `colorVoxelsToArtifact`
     over it passes `assertPaletteDiscipline(…, aug, {cap: prim.length+2})` (closes T-058-03 review gap #1).
3. **Verify:** `npm test` green (expect prior 595 + new).

## Step 2 — Runner wiring: augment + bug-fix + off-palette reference → commit 2

1. `glb-voxel-breadth.mjs` (R1): add `augment: true` to the `glbVoxelBuild` opts; update the style/row prose
   to "augmented design-doc palette". (No in-runner guard — runner does not decode the texture; the
   palette-discipline record guards R1's output.)
2. `glb-voxel-seg.mjs` (seg): rename the 5 stray `snapPalette` → `palette` (l.233, 248, 263, 280, 281); add
   `augment: true` to `segmentMaterials`; compute `const aug = augmentPalette(palette, texture)` (texture is
   already decoded in the runner) and use `aug` as the `offPaletteCount` reference for before/after; add
   `assertPaletteDiscipline(artifact, aug, { cap: palette.length + 2 })` after `assertArtifact`. Import
   `augmentPalette`, `assertPaletteDiscipline`.
3. `e18-remeasure.mjs` (integrate): read `designManifest` from `runs/<subj.run>/artifact.json`;
   `prim = paletteFromManifest(designManifest)`; pass `palette: prim, augment: true` to `segmentMaterials`;
   `const aug = augmentPalette(prim, texture)`; measure E18/R1/R2 `offPalette` against `aug` (replace the
   `segPalette` reference in `offPaletteCount` calls — keep `segPalette`/`refClusters` for value-ΔE only);
   add `assertPaletteDiscipline(artifact, aug, { cap: prim.length + 2 })` after `assertArtifact`. Import
   `paletteFromManifest`, `augmentPalette`, `assertPaletteDiscipline`.
4. **Verify:** `npm test` still green (runners are not in CI, but imports must resolve — a `node --check`
   on each touched runner confirms no syntax/import error).

## Step 3 — The verification runner + generate the record (live, GL-free) → commit 3

1. Create `benchmarks/sculpture/palette-discipline.mjs` (structure.md): per subject compute distinct
   before (full-table) → after (augmented), off-(aug)=0, secondary count, cap, form-IoU ref (from R1
   summary); call `assertPaletteDiscipline` live; pure `buildDiscipline(rows)` → `{md,json}`; `--offline`.
2. Run `node benchmarks/sculpture/palette-discipline.mjs 32` (needs GLBs + dwebp, both present; no headless
   GL — palette metrics are render-free, so this is fast and robust).
3. Commit `palette-discipline.{md,json}` + per-subject summaries; `.gitignore` stanza only if renders emit.
4. **Verify:** record shows off-(aug)=0 and distinct ≤ size+2 on all 7; the before→after drop is large
   (heart ~91→7); the guard did not throw (else the run fails loudly — the point).

## Step 4 — Regenerate the committed sweeps (live GL) → commit 4

1. `node benchmarks/sculpture/glb-voxel-breadth.mjs 32` → refresh `glb-voxel/<subj>/{artifact,summary}.json`
   + `r1.{md,json}` (now augmented).
2. `node benchmarks/sculpture/glb-voxel-seg.mjs 32` → refresh `glb-voxel-seg/<subj>/…` + `seg.{md,json}`
   (bug-fixed + augmented; previously could not run at all).
3. `node benchmarks/sculpture/e18-remeasure.mjs 32` → refresh `e18-build/<subj>/…` + `e18-remeasure.{md,json}`
   (now design-doc palette + augment; off-palette vs the augmented palette).
4. Commit the refreshed artifacts/records (render PNGs gitignored).
5. **Verify:** each sweep's off-palette = 0 vs the augmented design-doc palette; distinct ≤ size+2; form IoU
   unchanged from the pre-augment committed numbers (recolour-invariant — same occupancy).
6. **Contingency:** if a headless-GL render step fails on this host, the GL-free `palette-discipline` record
   (Step 3) is the authoritative AC#4 proof; document the sweeps as regenerable via the runners (the
   established GL/host split) in `progress.md`/`review.md`, and still commit any sweeps that did run.

## Step 5 — Final verification

- `npm test` green.
- `palette-discipline.{md,json}` committed; all 7: off-(aug) 0, distinct ≤ size+2, before→after drop shown.
- Audit conclusions for all four paths recorded in `review.md` (R1/seg/integrate fixed; R3 compliant by
  inheritance, LLM-`swap` caveat noted).

## Testing strategy

- **Unit (CI, `npm test`):** `assertPaletteDiscipline` (pass / off-palette throw / cap throw / namespace);
  augment-seam wiring. These are the load-bearing guard coverage — they run in CI and fail loudly on a
  future full-table snap that re-enters the manifest.
- **Live (host, not CI):** the `palette-discipline` record (the cross-subject AC#4 proof) + the three
  regenerated sweeps. Reproducible via the runners; durable `.json/.md` are the committed record.
- **Provable, not just measured:** form IoU is invariant under palette choice for a fixed voxelization
  (palette changes colors, never occupancy) — AC#6 is argued in prose + cross-referenced to the committed
  R1 `silhouetteIoU`, not re-rendered for proof.

## AC trace

| AC | Step | Evidence |
| -- | ---- | -------- |
| #1 Audit every path; none over full-table/median-cut | 2, review | R1/seg/integrate wired to augmented design-doc palette; integrate median-cut removed; R3 documented |
| #2 palette = design-doc ∪ ≤2 gated secondary; off = 0 | 2,3,4 | `augment:true` everywhere; record off-(aug)=0 |
| #3 Regenerate R1/seg/integrate for all 7 | 4 | refreshed artifacts + `{r1,seg,e18-remeasure}.{md,json}` |
| #4 Record off=0, distinct ≤ size+2, before→after drop | 3 | `palette-discipline.{md,json}` |
| #5 Guard fails loudly on a block outside augmented palette | 1 | `assertPaletteDiscipline` + unit tests; called in seg/integrate/record runners |
| #6 Form IoU not harmed; `npm test` green | 4,5 | recolour-invariance + committed IoU unchanged; suite green |
