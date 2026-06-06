# T-054-01 — structure: glb-voxel-breadth

The file-level blueprint. One new runner; everything else is reuse. No `src/` change, no schema change.

## Files

### CREATE — `benchmarks/sculpture/glb-voxel-breadth.mjs` (the only new module)
The E-17 R1 sweep runner. Self-contained GL/host harness; pure core reused from `src/`.

Imports (all existing):
- `node:fs/promises` (`readFile, writeFile, mkdir, rm`), `node:fs` (`existsSync`), `node:path`,
  `node:url`, `node:child_process` (`spawn`), `node:os` (`tmpdir`).
- `../../src/form/glb-voxel-build.mjs` → `glbVoxelBuild`.
- `../../src/artifact.mjs` → `assertArtifact`.
- `../../src/sculpture.mjs` → `DEFAULT_SCALE, SCULPTURE_VIEW_3Q`.
- `../../src/color/palette-extract.mjs` → `decodeImage`.
- `../../src/form/glb-silhouette.mjs` → `loadMeshFromGlb, rasterizeSilhouette`.
- `../../src/form/form-fidelity.mjs` → `extractSilhouette, normalizeSilhouette, iou, RENDER_BG`.
- Lazy (inside `runBreadth`, GL only on a live run): `../../render/src/render-tool.mjs` →
  `renderArtifact`; `../../src/render-tool.mjs` → `renderSummary`.

Module layout (top → bottom):

1. **Header comment** — what/why, the GL+host-tool/not-in-CI note, the sword exclusion, usage lines:
   ```
   node benchmarks/sculpture/glb-voxel-breadth.mjs [scale]                 # live sweep, 7 subjects
   node benchmarks/sculpture/glb-voxel-breadth.mjs --offline               # rebuild r1.{md,json} from summaries
   node benchmarks/sculpture/glb-voxel-breadth.mjs --regen-missing [scale] # also TRELLIS-regen any absent GLB
   ```

2. **Constants**
   - `HERE`, `GLB_DIR = join(HERE,"glb")`, `OUT_DIR = join(HERE,"glb-voxel")`, `RUNS_DIR = join(HERE,"runs")`.
   - `SUBJECTS` — the 7 `{ key, glb, run }` rows (run = concept-image dir for AC#3 regen), in the
     research.md §3 order. Sword intentionally absent (one-line comment).

3. **`decodeTexture({data,mimeType})`** — local impure glue, copied from `glb-voxel-run.mjs` verbatim
   (PNG/JPEG→temp→`decodeImage`; WebP→`dwebp`→`decodeImage`). Uses a module-local `tmpSeq` + `run()`.

4. **`run(cmd,args)`** — spawn-to-completion promise, reject on non-zero (copied from `glb-voxel-run.mjs`).

5. **`judgeIoU(renderPath, glbBytes)`** — silhouette IoU of render vs the GLB's own silhouette at
   `SCULPTURE_VIEW_3Q` (copied from `glb-voxel-run.mjs`).

6. **`regenMissingGlb(subj, { scale })`** — AC#3 branch (only reached with `--regen-missing`): resolves
   `RUNS_DIR/<subj.run>/concept.png`, shells `node trellis-glb.mjs <concept.png> <glb>` via `run()`
   (inherits `.env` MODAL_ENDPOINT_URL from the parent env; never printed), returns `true` if the GLB now
   exists. Throws a legible error if the concept is missing.

7. **`buildR1(rows)` → `{ md, json }`** — PURE formatter (exported). Builds:
   - the AC table (`| subject | occupancy | form IoU vs GLB | scale | blocks | manifest |`) over
     non-skipped rows;
   - a JSON object `{ schema:"glb-voxel-r1/v1", rung:"R1", method, view, scale, generatedFrom, note,
     subjects: rows }`.
   No GL, no IO — testable in principle (kept harness-local per design D7).

8. **`runBreadth({ scale, regenMissing }) -> rows[]`** — the sweep:
   - lazy-import GL (`renderArtifact`, `renderSummary`);
   - `mkdir OUT_DIR`;
   - for each subject: resolve `glbPath`; if absent → (regenMissing? `regenMissingGlb`) else push
     `{subject, skipped:true}` + continue; build via `glbVoxelBuild`; `assertArtifact`; write
     `artifact.json`; render `render-3q.png`; `judgeIoU`; assemble summary
     `{subject, scale, occupancy: artifact.placements.length, blocks: sum.placed, unmapped, bounds,
       manifestSize, formIoU, regenerated?, durationSec}`; write `summary.json`; push.
   - return `rows`.

9. **`emit(rows)`** — `buildR1(rows)` → write `OUT_DIR/r1.json` and `OUT_DIR/r1.md`; log a one-line
   summary to stderr.

10. **`regenerateOffline()`** — `--offline`: read each `glb-voxel/<key>/summary.json` that exists,
    reassemble `rows`, `emit(rows)`. Lets the durable table be rebuilt without GL (mirrors the surgical
    harness's `--offline`).

11. **`main()`** — parse argv (`--offline`, `--regen-missing`, numeric scale); dispatch
    `regenerateOffline()` or `emit(await runBreadth({scale, regenMissing}))`.

12. **Main guard** — `if (import.meta.url === \`file://${process.argv[1]}\`) main().catch(…exit 1)`.
    Side-effect-free import (D7). `export { SUBJECTS, buildR1, runBreadth }`.

### MODIFY — none in `src/`. Possibly `.gitignore` (verify only)
`benchmarks/sculpture/glb-voxel/**/render-3q.png` is already ignored and covers the 5 new subjects'
renders. No `.gitignore` edit expected; confirm during Implement.

### GENERATED (committed durable record)
- `benchmarks/sculpture/glb-voxel/r1.md`, `…/r1.json` — the AC deliverable.
- `benchmarks/sculpture/glb-voxel/<subject>/artifact.json`, `…/summary.json` for the 5 new subjects
  (dancing-man, moai, pineapple, bow-and-arrow, mushroom); koi/heart re-emitted (should match).

### GENERATED (gitignored)
- `benchmarks/sculpture/glb-voxel/<subject>/render-3q.png` (all 7).

## Public interface (exports)
- `SUBJECTS: { key:string, glb:string, run:string }[]` — the 7-subject manifest.
- `buildR1(rows): { md:string, json:object }` — pure table/record formatter.
- `runBreadth({ scale?, regenMissing? }): Promise<row[]>` — the GL/host sweep.

`row` (the summary shape): `{ subject, scale, occupancy, blocks, unmapped, bounds, manifestSize, formIoU,
durationSec, regenerated?, skipped? }`.

## Ordering of changes (matters)
1. Write the runner with the main-guard; verify **import is side-effect-free** and `npm test` still green
   (it adds nothing to `src/**`, so it must stay green) — gate before any live GL.
2. Live sweep (`node …/glb-voxel-breadth.mjs`) — generates the 7 per-subject artifacts + `r1.{md,json}`.
3. Sanity-check koi/heart reproduce E-16 (~0.622 / ~0.877) as a faithfulness check.
4. `--offline` re-run reproduces byte-identical `r1.{md,json}` from the summaries (deterministic record).

## Boundaries honored
- **Purity:** only the injected `decodeTexture` + `dwebp`/GL are impure; all of `src/` untouched.
- **CI:** nothing new under `src/**`; the suite is unchanged (AC#4 "no new GL in the suite").
- **Secret hygiene:** the regen branch never prints `MODAL_ENDPOINT_URL`; it is read by the child
  `trellis-glb.mjs` from `.env`, inherited via the process env, never logged.
- **Epoch separation:** E-16's `glb-voxel-run.mjs`/`summary.md` are untouched; R1 is its own artifact.
