# T-058-03 — Progress

Executed plan.md. All 5 steps complete; the live 7-subject sweep ran here (GLBs + dwebp present).
`npm test` green at every committed step.

## Commits (4, on `main`)

1. **`feat(E-18 T-058-03): gated secondary palette (augmentPalette) + opt-in wiring`** — Steps 1–3.
   - `src/form/palette-augment.mjs` (new, pure): `AUGMENT_DEFAULTS`, `augmentReport`, `augmentPalette`.
   - `src/form/glb-voxel-build.mjs`, `src/form/material-segment.mjs`: opt-in `augment` flag.
   - `src/form/palette-augment.test.mjs` (new): 7 GL-free tests.
2. **`feat(E-18 T-058-03): secondary-palette sweep runner + gitignore stanza`** — Step 4.
   - `benchmarks/sculpture/secondary-palette.mjs` (new), `.gitignore` stanza.
3. **`docs(E-18 T-058-03): gated secondary-palette 7-subject record (scale 32)`** — Step 5.
   - `benchmarks/sculpture/secondary-palette.{md,json}` + per-subject `artifact.json`/`summary.json`
     (render PNGs gitignored).

## What was built (vs plan)

- **Core (`palette-augment.mjs`).** As designed. `augmentReport` clusters the decoded texture
  (`aggregateForeground` + `medianCutLab` — reuse, no new colour math), scores each cluster
  (`primaryΔE`, `tableΔE` via `nearestLab`, `gain`), applies the four gates + the "not already in
  primary" dedupe, ranks qualifiers by `gain × coverage` (deterministic tie-break), caps at `K=2`, and
  returns the merged palette plus diagnostics (`added`, `candidates`, coverage-weighted
  `meanSnapBefore/After`, `foregroundPx`). `augmentPalette = augmentReport(...).palette`. The full table
  is inlined as a `nearestLab` palette to avoid importing `glb-voxel-build` (cycle).
- **Wiring.** `glbVoxelBuild` augments `pal` after decode / before `colorVoxelsToArtifact`;
  `segmentMaterials` augments `snapPalette` after the design-doc/extracted choice. Both behind a falsy-
  default `augment` flag (`true` ⇒ defaults, or `{table?,…,K?}`), so the no-augment path is byte-identical
  to before (the two "regression-safe" tests + the unchanged 588 prior tests confirm it).
- **Benchmark.** `secondary-palette.mjs` mirrors `glb-voxel-seg.mjs`'s host/GL glue (dwebp decode,
  `judgeIoU`, `--offline`, `SUBJECTS`). Reports the per-voxel mean snap ΔE (truest drift) rather than the
  cluster-weighted one for the record; the cluster-weighted value lives in `augmentReport` for the tests.

## Live sweep results (scale 32, 7/7 subjects)

| subject | design-doc | +secondary | total | snap ΔE before→after | off-pal | form IoU |
| --- | --- | --- | --- | --- | --- | --- |
| dancing-man | 5 | 0 (none) | 5 | 15.33 → 15.33 | 0 | 0.914 |
| moai | 4 | 2 (nether_quartz_ore, cyan_terracotta) | 6 | 8.22 → 5.21 | 0 | 0.565 |
| pineapple | 4 | 0 (none) | 4 | 17.59 → 17.59 | 0 | 0.907 |
| bow-and-arrow | 6 | 2 (light_gray_concrete_powder, black_terracotta) | 8 | 9.28 → 7.04 | 0 | 0.473 |
| heart | 5 | 2 (mycelium, cyan_terracotta) | 7 | 13.24 → 10.15 | 0 | 0.877 |
| mushroom | 4 | 2 (dead_brain_coral_block, mossy_stone_bricks) | 6 | 23.53 → 18.04 | 0 | 0.98 |
| koi | 5 | 1 (smooth_red_sandstone) | 6 | 13.84 → 11.58 | 0 | 0.622 |

- **Off-palette = 0** and **total ≤ design-doc size + K (2)** on every subject (max total 8, bow). AC #4 met.
- **Drift removed** on all 5 subjects that augmented (moai −3.0, mushroom −5.5, heart −3.1, koi −2.3,
  bow −2.2 ΔE). Honest: dancing-man and pineapple add **0**.
- **Form IoU** is the augmented build's; identical to the primary-only build by construction (recolouring
  moves no voxel), so it is "not harmed". The low values (bow 0.473, moai 0.565) are the subjects' inherent
  silhouette fidelity, not an augmentation effect.

## Deviations from plan

- **Commits 1+2 of the plan merged into one** (`feat … augmentPalette … + opt-in wiring`): the wiring
  test cases (6, 7) live in the same test file and exercise `segmentMaterials({augment})`, so they only go
  green once the wiring lands — splitting would have left an intermediate red commit. Merging keeps every
  commit green, which the plan's invariant ("npm test green at every committed step") actually requires.
- **Step 5 ran live** (plan listed it as best-effort): the host GLBs and `dwebp` were present, so the real
  record was produced rather than a placeholder.

## Observation worth carrying forward

- dancing-man (15.33) and pineapple (17.59) carry **high** residual drift but augment **nothing** — the
  drift is spread across many small/mid clusters, none individually clearing all four gates (most fail the
  `fitThreshold ≤ 6` "super-great fit" bar — no single table block is a near-exact match for those
  textures' off-design colours). This is the conservative high-bar behaving as specified, not a bug; if a
  later ticket wants to chip at that residual it should revisit `fitThreshold`/`gainThreshold`, not the
  mechanism. Recorded in the sweep `note`.
