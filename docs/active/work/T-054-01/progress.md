# T-054-01 — progress

## Status: COMPLETE — all 5 plan steps done, all 4 ACs met.

## Step 1 — Write the breadth runner (no live GL) — DONE
- Created `benchmarks/sculpture/glb-voxel-breadth.mjs` per structure.md.
- Verified: `node --check` parses; import is **side-effect-free** (no sweep on import) and exports
  `SUBJECTS` (7), `buildR1`, `runBreadth`; `buildR1` synthetic 2-row check produces the AC header columns
  and `json.subjects.length===2`; `npm test` 514/514 green (no `src/**` change).
- Commit `4c912bf`: runner + RDSPI artifacts.

## Step 2 — Live 7-subject sweep — DONE
- `node benchmarks/sculpture/glb-voxel-breadth.mjs` → 7/7 subjects built, rendered, judged; wrote
  per-subject `artifact.json`/`render-3q.png`/`summary.json` and `glb-voxel/r1.{md,json}`.
- **Measured R1 (scale 32):**

  | subject | occupancy | form IoU vs GLB |
  | ------- | --------- | --------------- |
  | dancing-man | 973 | 0.914 |
  | moai | 4215 | 0.565 |
  | pineapple | 3397 | 0.907 |
  | bow-and-arrow | 513 | 0.473 |
  | heart | 5840 | 0.877 |
  | mushroom | 9505 | 0.980 |
  | koi | 2164 | 0.622 |

- **Faithfulness check PASSED:** koi 0.622 and heart 0.877 reproduce the committed E-16 numbers exactly —
  the breadth path is byte-faithful to the proven E-16 build.
- Every artifact passes the AJV gate (in-runner `assertArtifact`; spot-confirmed moai via
  `scripts/validate-artifact.mjs --expect valid` → VALID).
- Renders correctly gitignored (none staged); no `.glb`/`.png` binaries staged.
- Commit `d9c0d69`: builds + r1 table.

### DEVIATION (documented, resolved) — summary field name
The plan's first draft of the runner named the IoU field `formIoU`. Caught during Step 2 review that
**`glb-voxel-surgical.mjs:buildBaselineIoU` reads `.silhouetteIoU`** from these same `summary.json` files
(a cross-harness coupling). Renaming would have silently broken the surgical harness's build baseline.
**Fix:** kept the field named `silhouetteIoU` (identical quantity); the r1 table LABELS the column
"form IoU vs GLB". Net effect: koi/heart `summary.json` diffs are **additive only** (a new `occupancy`
line; `silhouetteIoU` preserved). Re-ran the live sweep so all 7 summaries carry the corrected field —
numbers identical (deterministic).

## Step 3 — Offline determinism — DONE
- `node …/glb-voxel-breadth.mjs --offline` rebuilds `r1.{md,json}` from the committed summaries with
  **zero git diff** → the durable record is reproducible without GL.

## Step 4 — AC #3 regen branch sanity (no network) — DONE
- All 7 GLBs present, so `--regen-missing` is a no-op; the branch is wired but not exercised.
- **Secret hygiene confirmed:** `grep console … | grep -i env|url|MODAL` → none. The harness never logs
  `MODAL_ENDPOINT_URL`; the child `trellis-glb.mjs` owns the `.env` read.
- **Skip-not-error confirmed:** an absent GLB (without `--regen-missing`) renders a clean skipped r1 row
  (`| sword | — | … | _(GLB absent — not present)_`) and the sweep continues — no crash.

## Step 5 — Finalize — DONE
- `.gitignore` already covers `glb-voxel/**/render-3q.png` (new subjects auto-covered); no edit needed.
- Final `npm test` green; `progress.md` + `review.md` written and committed.

## ACs
- AC1 ✅ 7 subjects → AJV-valid glb-voxel artifact + render @ SCULPTURE_VIEW_3Q + form IoU vs GLB under
  `glb-voxel/<subject>/`.
- AC2 ✅ `glb-voxel/r1.{md,json}` — 7-row table (subject, occupancy, form IoU vs GLB).
- AC3 ✅ missing-GLB → `--regen-missing` shells `trellis-glb.mjs` (`.env`, never printed); none needed
  regen (all present); skip-not-error + secret hygiene verified.
- AC4 ✅ pure voxel/color logic stays unit-tested (existing `src/form/*.test.mjs`), no new GL in the
  suite, `npm test` 514/514 green.
