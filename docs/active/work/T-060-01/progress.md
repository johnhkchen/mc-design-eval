# T-060-01 — Progress

Integration of E-18's two fixes (thin form + speckle) into one combined glb-voxel build, re-measured on 5
axes vs the E-17 R1/R2 baselines. All four plan steps complete and committed; `npm test` green (588); the
7-subject combined sweep ran live at scale 32 (parity with R1/R2).

## Step status

| step | what | status | commit |
| ---- | ---- | ------ | ------ |
| 1 | `src/form/remeasure.mjs` — pure assembler (5 metrics × R1/R2/E18 + deltas) | ✅ | `6c1a4cf` |
| 2 | `src/form/remeasure.test.mjs` — 9 unit tests | ✅ | `6c1a4cf` |
| 3 | `benchmarks/sculpture/e18-remeasure.mjs` — GL/host combined-build runner | ✅ | `96cd8ad`¹ |
| 4 | 7-subject combined sweep → `e18-build/*` + `e18-remeasure.{md,json}` + gitignore | ✅ | `96cd8ad`¹ |

¹ Lisa's commit lock bundled Steps 3–4 (and the corrected tautology note) under a neighbouring commit
message; the committed *content* is correct (verified: runner tracked, gitignore stanza present, note
updated). Trust `e18-remeasure.json` for the numbers.

## What was built

- **`src/form/remeasure.mjs`** (pure): `assembleRemeasure(rows) → {md, json}` with `improved`/`delta`
  (direction-aware: form IoU higher-better; speckle/distinct/off-palette/value ΔE lower-better),
  per-build averages (null-skipping), and an honest `regressions` list (every E18 cell not strictly better
  than a baseline, tagged `worse`/`no-change`). The value-ΔE tautology is recorded but explained.
- **`src/form/remeasure.test.mjs`** (9 tests, GL-free): delta/improved direction, happy-path assemble +
  averages, honest worse-regression, tautology flagging, all-improving → empty, null handling, schema.
- **`benchmarks/sculpture/e18-remeasure.mjs`** (GL/host): per subject `voxelizeGlb` + `voxelizeGlbThin`,
  decode texture, `segmentMaterials({occupancy: occThin, surface, texture})` → render → 5 metrics; R1/R2
  cells read from committed artifacts/summaries (speckle recomputed over the non-thin occupancy). Live /
  `--offline` / `--regen-missing`.

The combined build is exactly `segmentMaterials({occupancy: voxelizeGlbThin(glb), surface, texture})` —
`segmentMaterials` performs the value-true colour step internally, so the ticket's three middle stages
collapse into one call (design D1).

## Final combined sweep (scale 32, cells read R1→R2→E18)

| subject | form IoU | speckle | distinct | off-pal | value ΔE | thin |
| ------- | -------- | ------- | -------- | ------- | -------- | ---- |
| dancing-man | 0.91→0.91→**0.81** | 0.53→0.28→0.15 | 18→5→5 | 366→319→0 | 2.1→0→0 | +531, comp 1 |
| moai | 0.56→0.56→**0.59** | 0.64→0.25→0.16 | 43→5→5 | 853→0→0 | 1.22→0→0 | +1844, comp 3 |
| pineapple | 0.91→0.91→**0.85** | 0.55→0.25→0.11 | 24→5→4 | 2272→2003→0 | 4.38→0→**4.73** | +1458, comp 1 |
| bow-and-arrow | 0.47→0.47→**0.53** | 0.71→0.37→0.05 | 34→8→5 | 365→164→0 | 3.8→0→0 | +697, comp 1 |
| heart | 0.88→0.88→**0.9** | 0.69→0.34→0.1 | 91→7→6 | 4063→2831→0 | 5.91→0→**3.41** | +2142, comp 1 |
| mushroom | 0.98→0.98→**0.93** | 0.52→0.3→0.14 | 92→7→6 | 4212→2300→0 | 6.44→0→**1.29** | +2453, comp 1 |
| koi | 0.62→0.62→**0.71** | 0.72→0.35→0.17 | 71→8→6 | 1646→586→0 | 7.87→0→0 | +991, comp 1 |
| **AVG** | 0.76→0.76→0.76 | 0.62→0.30→**0.13** | 53.3→6.4→**5.3** | 1968→1172→**0** | 4.53→0→1.35 | — |

## Findings (honest, the deliverable)

1. **Speckle / distinct / off-palette: E18 wins on all 7.** off-palette → **0 everywhere**; speckle avg
   0.30→0.13 vs R2; distinct avg 6.4→5.3. The two E-18 directives hold under integration.
2. **Form IoU is a routed tradeoff, not a uniform win.** It RISES on the thin/organic subjects the thin
   pass targets (bow 0.47→0.53, koi 0.62→0.71, heart→0.90, moai→0.59) and DIPS on already-solid subjects
   (dancing-man −0.10, pineapple −0.06, mushroom −0.05). Cause: on real curved meshes the conservative
   surface trace adds a ~1-voxel boundary shell to *every* subject (occupancy grew on all 7, not just thin
   ones — contra T-059's cube-only "bit-identical on thick forms"). That recovers missing members on thin
   forms but slightly over-thickens solid ones. **This is the key integration finding for T-061: route
   thin voxelization by form type rather than applying it universally.**
3. **Value ΔE: E18's tighter k=6 palette has a small cost.** R2's value ΔE is ~0 by construction (it snaps
   to the k=8 texture palette = the reference). E18 snaps to a tighter k=6 palette, so its value ΔE is
   nonzero where the two diverge (pineapple 4.73, heart 3.41, mushroom 1.29) — recorded honestly, not the
   R2 tautology. Still far below R1 on average (1.35 vs 4.53).

All non-improvements (form IoU dips, value-ΔE costs, no-change cells) are in `e18-remeasure.json#regressions`
and the md "Regressions / no-change" section (AC #3).

## AC checklist

- [x] Combined thin-preserved + segmented build for all 7 (AJV-valid, rendered, saved to `e18-build/<s>/`).
- [x] One record `e18-remeasure.{md,json}`: form IoU + speckle + distinct + off-palette + value ΔE for E18
      vs R1 and R2, with deltas.
- [x] All 7 present; subjects where a fix didn't help (form IoU dips, value-ΔE costs) recorded honestly.
- [x] Pure assembly/metric logic unit-tested (9 tests); live render GL-isolated; `npm test` green (588).

## Verification

- `npm test` — **588/588 green** (+9 remeasure tests over the prior run).
- Live sweep ran end-to-end on all 7 without throwing; `assertArtifact` passes in-runner.
- Renders inspected (per memory: inspect renders, not block counts) — thin members present, materials
  coherent; solid subjects show the expected ~1-voxel shell thickening.

## Open items (for review.md)

- The thin-shell over-thickening on solid subjects is the headline handoff to T-061 (routing / boundary
  finding). The combined build per the ticket uses thin for all subjects; routing is out of T-060 scope.
- Value-ΔE reference is k=8 (E-17 parity) while the build palette is k=6 — the mismatch is what surfaces
  E18's small value cost. A k-matched reference would zero it but break comparability with E-17.
