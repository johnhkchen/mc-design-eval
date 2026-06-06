# T-058-03 — Structure: file-level blueprint

The shape of the code. Five touched paths; one new module, one new test, one new benchmark, two small
wirings, one gitignore stanza.

## CREATE `src/form/palette-augment.mjs` (pure, ~120 lines)

The headline deliverable. Imports only `palette-extract` (clusters), `cielab` (ΔE), `block-table`
(the full table). No GL/WebP/GLB/network. Must NOT import `glb-voxel-build` (cycle).

```js
import { aggregateForeground, medianCutLab, DEFAULTS as EXTRACT_DEFAULTS } from "../color/palette-extract.mjs";
import { deltaE, nearestLab, srgbToLab } from "../color/cielab.mjs";
import { loadBlockTable } from "../color/block-table.mjs";

export const AUGMENT_DEFAULTS = Object.freeze({
  k: 8, driftThreshold: 12, minCoverage: 0.05, fitThreshold: 6, gainThreshold: 6, K: 2,
});

// full table as a nearestLab palette (inlined — do not import blockPaletteFromTable, that'd cycle)
function tablePalette(table) { return table.blocks.map((b) => ({ key: b.block, lab: b.lab })); }

/** Rich computation: clusters → gates → ranked secondary (≤K) → merged palette + diagnostics. PURE. */
export function augmentReport(designDocPalette, texture, table = loadBlockTable(), opts = {}) { … }

/** The wireable entry point: the augmented {key,lab}[] palette only. PURE. AC-named. */
export function augmentPalette(designDocPalette, texture, table = loadBlockTable(), opts = {}) {
  return augmentReport(designDocPalette, texture, table, opts).palette;
}
```

`augmentReport` internals (Design Decision 3):
- validate `designDocPalette` non-empty `{key,lab}[]`; `o = {...AUGMENT_DEFAULTS, ...opts}`.
- `aggOpts = { dropColor: o.dropColor ?? EXTRACT_DEFAULTS.dropColor, dropTolerance: o.dropTolerance ??
  EXTRACT_DEFAULTS.dropTolerance, alphaThreshold: o.alphaThreshold ?? EXTRACT_DEFAULTS.alphaThreshold }`.
- `{ points, foregroundPx } = aggregateForeground(texture, aggOpts)`; if `foregroundPx === 0` → return
  `{ palette: designDocPalette.slice(), secondary: [], added: [], candidates: [], meanSnapBefore: 0,
  meanSnapAfter: 0, foregroundPx: 0 }`.
- `clusters = medianCutLab(points, o.k)`; `tbl = tablePalette(table)`; `primaryKeys = new Set(primary keys)`.
- per cluster build `candidate = { key: best.key, lab: best.lab, coverage, primaryDeltaE, tableDeltaE,
  gain, clusterLab }`; mark `qualifies` = four gates && !primaryKeys.has(best.key).
- `chosen` = candidates.filter(qualifies) → sort by `gain*coverage` desc / coverage desc / key asc →
  dedupe by key → slice(0, K).
- `secondary = chosen.map({key,lab})`; `palette = [...designDocPalette, ...secondary]`.
- `meanSnapBefore/After` = Σ coverage·nearestLab(clusterLab, primary|palette).deltaE over clusters.
- return all of it (added = chosen with diagnostics; candidates = every cluster's diagnostics).

## MODIFY `src/form/glb-voxel-build.mjs` (+~6 lines)

- `import { augmentPalette } from "./palette-augment.mjs";`
- `glbVoxelBuild(glb, { scale, decodeTexture, palette, augment, metadata, style })` — add `augment`.
- After `const texture = await decodeTexture(...)` and before `sampleSurfaceColors`:
  ```js
  let pal = palette;
  if (augment && pal) {
    const a = augment === true ? {} : augment;
    pal = augmentPalette(pal, texture, a.table, a);
  }
  ```
  then `colorVoxelsToArtifact(occupancy, colors, { palette: pal, scale, metadata, style })`.
- Purity unchanged (augmentPalette is pure; the only impurity stays `decodeTexture`). JSDoc updated.

## MODIFY `src/form/material-segment.mjs` (+~6 lines)

- `import { augmentPalette } from "./palette-augment.mjs";`
- In `segmentMaterials`, replace the `snapPalette` line:
  ```js
  let snapPalette = opts.palette ?? extractTexturePalette(texture, { k, dropColor: opts.dropColor }).snapPalette;
  if (opts.augment) {
    const a = opts.augment === true ? {} : opts.augment;
    snapPalette = augmentPalette(snapPalette, texture, a.table, a);
  }
  ```
- `segmentMaterials` stays PURE (texture is in `build`). Add `augment` to the opts JSDoc. SEG behaviour
  with no `augment` is byte-identical to today (regression-safe).

## CREATE `src/form/palette-augment.test.mjs` (GL-free, ~110 lines)

`node:test`; helpers `atlasRow(texels)` (copy the seg/clean fixture), `buildFrom(texels)` (copy from
material-segment.test for the wiring test), a synthetic `PRIMARY = [{key,lab}]` and `TABLE = {blocks:
[{block,lab}]}` with a controlled tight-fit block. Cases (Design Decision 6):

1. far cluster + tight table block → that block added (secondary length 1, key present, total = primary+1).
2. well-served cluster → `augmentPalette` deep-equals primary (nothing added).
3. ≥3 qualifying clusters → `added.length === K` (cap holds).
4. low-coverage off-colour speck (< minCoverage) → not added (palette == primary).
5. fit gate: far, real cluster whose nearest table block is > fitThreshold → not added.
6. wiring: `segmentMaterials(buildFrom(redTexels), { palette: PRIMARY, augment: { table: TABLE } })` →
   AJV-valid; manifest keys ⊆ augmented palette; `offPaletteCount(keys, augmented) === 0`;
   distinct ≤ primary + K.

## CREATE `benchmarks/sculpture/secondary-palette.mjs` (host/GL, ~200 lines, NOT in npm test)

Mirror `glb-voxel-seg.mjs`'s glue (dwebp `decodeTexture`, `judgeIoU`, `--offline`, `SUBJECTS` import).
Per subject `runRow`:
- decode texture; `manifest = runs/<run>/artifact.json .palette.manifest`; `primary = paletteFromManifest(manifest)`.
- `table = loadBlockTable()`; `rep = augmentReport(primary, texture, table)`.
- build: `segmentMaterials({occupancy, surface, texture}, { palette: primary, augment: { table },
  metadata, style })`; `assertArtifact`; write artifact.json; render render-3q.png; `judgeIoU`.
- per-voxel drift: `colors = sampleSurfaceColors({occupancy, surface, texture})`; mean over voxels of
  `nearestLab(srgbToLab(rgb), primary).deltaE` (before) and `…, rep.palette).deltaE` (after).
- `offPalette = offPaletteCount(keysFromArtifact(artifact), rep.palette)` (must be 0).
- summary row: `{ subject, designDocSize: primary.length, added: rep.added.map({block:key,gain,coverage}),
  secondaryCount, totalPalette, snapBefore, snapAfter, offPalette, formIoU, durationSec }`.
- pure `buildSecondary(rows)` → `{md, json}` (schema `secondary-palette/v1`), mirroring `buildSeg`:
  a per-subject table + the honest "subjects that need none add none" framing; `defaults: AUGMENT_DEFAULTS`.
- `main()`: live sweep (writes per-subject summary + top-level `secondary-palette.{md,json}`) or
  `--offline` (rebuild md/json from committed summaries).
- Output: `benchmarks/sculpture/secondary-palette/<subject>/{artifact.json, render-3q.png, summary.json}`
  + `benchmarks/sculpture/secondary-palette.{md,json}` (top-level, like e18-remeasure).

## MODIFY `.gitignore` (+2 lines)

```
# regen via `node benchmarks/sculpture/secondary-palette.mjs`. Durable record: secondary-palette.{md,json} + summaries.
benchmarks/sculpture/secondary-palette/**/render-3q.png
```

## Ordering of changes

1. `palette-augment.mjs` (pure core) — nothing depends on the others.
2. `palette-augment.test.mjs` — lock the core's behaviour (red-green before wiring).
3. Wire `glb-voxel-build.mjs` + `material-segment.mjs` (+ the wiring test case).
4. `benchmarks/sculpture/secondary-palette.mjs` + `.gitignore` stanza.
5. Run the 7-subject sweep (host/GL, if GLBs present) → commit the record; else commit code + note.

Each of 1–4 is an atomic commit; `npm test` green after 2 and after 3.
