# T-060-01 — Structure: file-level blueprint

Two new files, one generated tree. **No existing file modified** (deps consumed read-only; gitignore may
gain one stanza for the new renders, matching every sibling sweep).

## Files

| File | Action | Purity |
| ---- | ------ | ------ |
| `src/form/remeasure.mjs` | **create** — pure assembler (rows → md/json + deltas) | pure |
| `src/form/remeasure.test.mjs` | **create** — `node:test`, synthetic rows | pure |
| `benchmarks/sculpture/e18-remeasure.mjs` | **create** — GL/host combined-build + collect runner | impure (dwebp + render) |
| `benchmarks/sculpture/e18-build/<subject>/` | **generated** — artifact/render/summary | output (renders gitignored) |
| `benchmarks/sculpture/e18-remeasure.{md,json}` | **generated** — the roll-up | tracked |
| `.gitignore` | **maybe-edit** — ignore `e18-build/**/render-3q.png` | — |

## `src/form/remeasure.mjs` — pure interface

Header mirrors `ablation.mjs`/`scorecard.mjs`: what/why, the pure/GL split, reuse list.

### Exported constants
- `REMEASURE_SCHEMA = "e18-remeasure/v1"`.
- `METRICS` — the 5-metric spec (ordered), each `{ key, label, better:"higher"|"lower" }`:
  `formIoU`(higher), `speckle`(lower), `distinct`(lower), `offPalette`(lower), `valueDeltaE`(lower).
- `BUILDS = ["r1","r2","e18"]` (display order; R1 → R2 → E18).

### Exported pure functions
1. `improved(metric, value, baseline) → boolean|null` — direction-aware; null if either side null.
2. `delta(metric, value, baseline) → { raw:number|null, improved:boolean|null }` — signed `value −
   baseline` (raw), plus the direction-aware `improved`.
3. `assembleRemeasure(rows, opts={}) → { md, json }` — the headline. `rows`: per-subject
   `{ subject, r1, r2, e18, thin? }`, each build cell `{ formIoU, speckle, distinct, offPalette,
   valueDeltaE }` (nullable), `thin` optional `{ components, surfaceOnlyCount, occBase, occThin }`.
   Produces:
   - **json** `{ schema, scale, metrics:METRICS, generatedFrom, note, subjects:[{ subject, r1, r2, e18,
     thin, deltas:{ vsR1:{metric→delta}, vsR2:{metric→delta} } }], averages:{ r1,r2,e18 per metric },
     regressions:[{subject, metric, vs, raw}] }`. `regressions` = E18 cells that did NOT improve on a
     baseline (improved===false), excluding the documented value-ΔE tautology (flagged separately as
     `notes.valueDeltaETautology`).
   - **md** — title + intro; a per-subject table `| subject | form IoU R1→R2→E18 | speckle R1→R2→E18 |
     distinct … | off-pal … | value ΔE … | thin (comp, +cells) |`; an AVERAGES row; a "Regressions /
     no-change" section listing honest non-improvements + the value-ΔE tautology note. Null cells render
     `—`.

### Internal helpers
- `round2`, `fmtTriple(r1,r2,e18, metric)` ("0.72→0.35→0.17" with `—` for nulls), `avg(rows, build, key)`
  (mean over non-null), `markRegressions(subjects)`.

### Purity contract
No I/O, no GL, no schema import; pure arithmetic + string building over already-collected rows. Runs under
`src/**/*.test.mjs`.

## `src/form/remeasure.test.mjs` — coverage map

`node:test` + `node:assert/strict`, synthetic rows only:
- **delta/improved direction** — IoU higher-better (0.7 vs 0.6 → improved); speckle lower-better (0.2 vs
  0.4 → improved); equal → not improved; null side → null.
- **assembleRemeasure happy path** — two synthetic subjects → json has 2 subjects, deltas vsR1/vsR2 correct
  signs, averages = mean of cells, md contains the subjects + an AVERAGES row + the R1→R2→E18 triples.
- **regression recorded honestly (AC #3)** — a subject whose E18 speckle is *worse* than R2 appears in
  `json.regressions` with `vs:"r2"`, and the md "Regressions" section names it.
- **value-ΔE tautology** — R2 and E18 both 0 value ΔE → not listed as a regression; `notes` carries the
  tautology line.
- **null handling** — a subject missing R1 → its vsR1 deltas are null, no crash, md shows `—`; averages
  skip nulls.
- **schema/shape** — `json.schema === "e18-remeasure/v1"`, `metrics` has 5 entries, ordered.

## `benchmarks/sculpture/e18-remeasure.mjs` — runner blueprint (clone of sweep glue)

Imports: `voxelizeGlb`, `voxelizeGlbThin`, `parseGlbColoredSurface`, `segmentMaterials`/`speckleScore`/
`offPaletteCount`/`SEG_DEFAULTS`, `extractTexturePalette`, `valueGate`/`realizedPaletteFromArtifact`,
`assembleRemeasure`, the silhouette kernel, `decodeImage`, `assertArtifact`, `renderArtifact`/
`renderSummary`, `SUBJECTS`, `DEFAULT_SCALE`/`SCULPTURE_VIEW_3Q`. Local glue: `run`/`decodeTexture`(dwebp)/
`judgeIoU`/`keysFromArtifact`/`readJson` (same as siblings).

Per subject (`buildSubject`):
1. `occBase = voxelizeGlb(glb,{scale})`, `occThin = voxelizeGlbThin(glb,{scale})`.
2. `surface`, `texture` (decoded). `refClusters = extractTexturePalette(texture).snapPalette`;
   `segPalette = extractTexturePalette(texture,{k:SEG_DEFAULTS.k}).snapPalette`.
3. `e18 = segmentMaterials({occupancy:occThin, surface, texture}, {metadata, style})`; `assertArtifact`;
   write `e18-build/<subj>/artifact.json`; render → `render-3q.png`; `formIoU = judgeIoU(...)`.
   Cell: `{formIoU, speckle: speckleScore(occThin, eKeys), distinct, offPalette: offPaletteCount(eKeys,
   segPalette), valueDeltaE: valueGate(realizedPaletteFromArtifact(e18), refClusters).meanDeltaE}`.
4. R1/R2 cells: read committed artifact + summary; `formIoU` from `silhouetteIoU` / `formIoUAfter`;
   speckle over `occBase`; distinct from manifest; off-palette vs `segPalette`; value ΔE via `valueGate`.
5. `thin = { components: occThin.thin.components, surfaceOnlyCount: occThin.thin.surfaceOnlyCount,
   occBase: occBase.count, occThin: occThin.count }`.
6. Write `e18-build/<subj>/summary.json` (all three cells + thin + scale).

Top-level: `runLive({scale})` loops `SUBJECTS`, collects rows, `emit(rows,{scale})` →
`assembleRemeasure` → write `e18-remeasure.{md,json}`. `regenerateOffline({scale})` rebuilds the roll-up
from per-subject `summary.json`. `main()` parses `[scale]` / `--offline` / `--regen-missing`. An absent
asset → a row with null cells + a note (no hard fail). Export `{ buildSubject, runLive }`.

## Ordering of changes (atomic commits — see plan.md)
1. `remeasure.mjs` pure assembler.  2. `remeasure.test.mjs` (CI green).  3. `e18-remeasure.mjs` runner.
4. live sweep → `e18-build/*` + `e18-remeasure.{md,json}` + gitignore. Steps 1–2 are pure/CI; 3–4 GL/host.
