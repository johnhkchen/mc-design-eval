# T-058-03 — Plan: ordered, verifiable steps

Each step is a commit; `npm test` green at every committed step. Steps map 1:1 to structure.md.

## Step 1 — Pure core: `src/form/palette-augment.mjs`

Implement `AUGMENT_DEFAULTS`, `tablePalette` (internal), `augmentReport`, `augmentPalette` per
Decision 3 / structure blueprint. Reuse `aggregateForeground` + `medianCutLab` (clusters with
coverage), `nearestLab`/`deltaE`/`srgbToLab` (the two ΔE queries), `loadBlockTable` (the table).

- Verify: `node -e "import('./src/form/palette-augment.mjs').then(m=>console.log(Object.keys(m)))"`
  prints the exports without throwing.
- No test yet → commit happens together with Step 2 (a module with no callers/tests is not a useful
  atomic unit). Actually commit 1 = Steps 1+2 (core + its tests), so the first commit is green.

## Step 2 — Unit tests: `src/form/palette-augment.test.mjs`

Six cases (Decision 6). Build a synthetic `TABLE` whose blocks' Lab come from `srgbToLab` of chosen
RGBs so the "tight fit" is exact, and a `PRIMARY` of two well-separated blocks (e.g. white/black
concrete) that genuinely cannot represent a saturated hue.

- (1) far+tight → added; (2) served → unchanged; (3) ≥3 qualifiers → cap K; (4) low coverage → none;
  (5) fit gate (no tight block) → none; (6) wiring via `segmentMaterials(..., {augment})`.
- Verify: `npm test -- src/form/palette-augment.test.mjs` (or full `node --test`) green.
- **Commit 1:** `feat(E-18 T-058-03): augmentPalette gated secondary palette + unit tests`.

## Step 3 — Wire the two build paths

- `glb-voxel-build.mjs`: import `augmentPalette`; add `augment` to `glbVoxelBuild` opts; augment `pal`
  after decode, before `colorVoxelsToArtifact`. JSDoc.
- `material-segment.mjs`: import `augmentPalette`; in `segmentMaterials`, augment `snapPalette` when
  `opts.augment`. JSDoc.
- Add the wiring test case (6) to the augment test (or keep it there from Step 2 — it exercises
  `segmentMaterials`, so it must come after Step 3 passes; if written in Step 2 it will fail until the
  wiring lands → write it in Step 2 but expect it green only after Step 3; to keep each commit green,
  put case (6) in this step's commit).
- Verify: full `npm test` green; with no `augment` opt, existing seg/voxel tests unchanged (the snap
  line is identical when `opts.augment` is falsy).
- **Commit 2:** `feat(E-18 T-058-03): wire opt-in augment into glbVoxelBuild + segmentMaterials`.

## Step 4 — Benchmark runner + gitignore

- `benchmarks/sculpture/secondary-palette.mjs` per structure (live / `--offline`, `buildSecondary` pure
  roll-up). `.gitignore` stanza for the render PNGs.
- Verify (no GLBs needed): `node benchmarks/sculpture/secondary-palette.mjs --offline` runs and writes
  `secondary-palette.{md,json}` (empty/"no summary" rows if no per-subject summaries yet) without
  throwing. Confirms the pure roll-up + arg parsing.
- **Commit 3:** `feat(E-18 T-058-03): secondary-palette sweep runner + record + gitignore`.

## Step 5 — Run the sweep (best-effort; GLBs are gitignored)

- If `benchmarks/sculpture/glb/*.glb` are present locally: `node benchmarks/sculpture/secondary-palette.mjs 32`
  → per-subject summaries + the committed `secondary-palette.{md,json}` record. Commit the record.
- If GLBs absent (CI/clean checkout): the sweep skips with a note; the durable record is committed from
  whatever summaries exist, and progress.md records that the live sweep needs the host GLBs +
  dwebp + GL. The unit tests already prove augmentPalette's behaviour offline (AC #2), so AC coverage
  does not depend on Step 5 running here.
- **Commit 4 (if sweep ran):** `docs(E-18 T-058-03): secondary-palette 7-subject record`.

## Testing strategy

- **Unit (AC #2, the load-bearing coverage):** `palette-augment.test.mjs`, fully GL-free/offline. Proves
  add-on-tight-fit, no-op-when-served, cap-at-K, no-speckle-from-low-coverage, the fit gate, and the
  `segmentMaterials` wiring (off-palette 0, total ≤ size+K, AJV-valid).
- **Integration / record (AC #3, #4):** the `secondary-palette` sweep, host/GL, not in `npm test`
  (same as every other E-18 sweep). Produces the per-subject record and confirms off-palette = 0 and
  form IoU invariance on real TRELLIS textures when the GLBs are present.
- **Regression safety:** with `augment` absent, both build paths are byte-identical to today — the
  existing glb-voxel-build / material-segment / e18 tests must stay green (Step 3 verify).

## Acceptance-criteria trace

- AC1 `augmentPalette` pure+GL-free, wired, named-constant thresholds+K → Steps 1, 3 (`AUGMENT_DEFAULTS`).
- AC2 unit tests (add / no-op / cap / no-speckle) → Step 2 (+fit gate, +wiring).
- AC3 per-subject record (added blocks + mean snap ΔE before→after) → Step 4 runner, Step 5 data.
- AC4 total ≤ design-doc size + K; off-(augmented) = 0; form IoU unharmed → cap in core (Step 1),
  asserted in the wiring test (Step 2/3) and the sweep (Step 5); form IoU invariant by construction.
- AC5 `npm test` green → verified at Steps 2 and 3.

## Risks

- **Median-cut may not isolate a tiny speck** as its own cluster at small k → the low-coverage test must
  use colours distinct enough that `medianCutLab` splits them (it splits by count×spread; two very
  different colours separate at k≥2). Mitigation: choose well-separated test colours.
- **dropColor default drops near-black foreground** (palette-extract caveat). For dark subjects the
  texture's dark cluster could be dropped before augmentation sees it — acceptable (it mirrors how the
  primary palette was extracted) and the runner can pass `dropColor: null` if a subject needs it; the
  record notes the foreground fraction. Not a blocker for the gate logic.
