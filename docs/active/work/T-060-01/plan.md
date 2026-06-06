# T-060-01 — Plan: ordered, verifiable steps

Four steps. Steps 1–2 land the pure assembler + tests (verified by `npm test`, AC #4). Steps 3–4 land the
GL/host runner and the 7-subject combined sweep (verified by running it; not in CI, the established split).

## Step 1 — Pure assembler `src/form/remeasure.mjs`

**Do.** Create the module: `REMEASURE_SCHEMA`, `METRICS` (5, ordered, with `better`), `BUILDS`, and
`improved`, `delta`, `assembleRemeasure(rows, opts)`. `assembleRemeasure` computes per-subject vsR1/vsR2
deltas (direction-aware), per-build averages (mean over non-null), a `regressions` list (E18 cells that
didn't improve, excluding the value-ΔE tautology which goes in `notes`), and renders the md table
(R1→R2→E18 triples + AVERAGES + a Regressions/no-change section). Null-safe throughout.

**Verify.** `node -e` smoke: feed two synthetic subjects, print `json.subjects.length`, a couple of
deltas, and assert the md contains "AVERAGES".

**Commit.** `feat(E-18 T-060-01): pure e18 remeasure assembler (5 metrics × R1/R2/E18 + deltas)`

## Step 2 — Unit tests `src/form/remeasure.test.mjs`

**Do.** `node:test` on synthetic rows (structure.md coverage map): delta/improved direction (IoU higher-
better, speckle lower-better, equal, null), happy-path assemble (2 subjects, correct delta signs +
averages + md content), honest regression in `json.regressions` + md section (AC #3), value-ΔE tautology
not counted as a regression, null-build handling, schema shape (`e18-remeasure/v1`, 5 ordered metrics).

**Verify.** `npm test` green (artifact validation + `node --test "src/**/*.test.mjs"` incl. the new suite).
This is AC #4's "pure assembly/metric logic unit-tested" + "`npm test` green".

**Commit.** `test(E-18 T-060-01): remeasure assembler — deltas, regressions, tautology, nulls`

## Step 3 — GL/host runner `benchmarks/sculpture/e18-remeasure.mjs`

**Do.** Create the runner (structure.md blueprint): `decodeTexture`(dwebp), `judgeIoU`, `readJson`,
`keysFromArtifact`; `buildSubject(subj, {renderArtifact})` assembling the combined build (`voxelizeGlbThin`
→ `segmentMaterials`), rendering it, and collecting the E18 + R1 + R2 cells (speckle over the matching
occupancy; baselines read from committed artifacts/summaries) + the `thin` diagnostics; `runLive`,
`regenerateOffline`, `emit` (→ `assembleRemeasure` → `e18-remeasure.{md,json}`), `main` (`[scale]` /
`--offline` / `--regen-missing`). Absent asset → null cells + note.

**Verify.** Lint-run one subject live: `node benchmarks/sculpture/e18-remeasure.mjs 32` reaches at least
koi's combined build + render + summary without throwing; `assertArtifact` passes in-runner.

**Commit.** `feat(E-18 T-060-01): e18-remeasure runner — combined thin+seg build + collect`

## Step 4 — Run the 7-subject combined sweep + emit the record

**Do.** `node benchmarks/sculpture/e18-remeasure.mjs 32` for all 7. Write `e18-build/<subj>/{artifact.json,
render-3q.png, summary.json}` and `e18-remeasure.{md,json}`. Add the `e18-build/**/render-3q.png` gitignore
stanza. Inspect renders (per memory: inspect renders, not block counts) — thin members present, materials
coherent.

**Verify (the ACs):**
- All 7 combined builds assembled, AJV-valid, rendered, saved (AC #1).
- `e18-remeasure.{md,json}` carries form IoU + speckle + distinct + off-palette + value ΔE for E18 vs R1
  and R2, with deltas (AC #2).
- All 7 present; any non-improvement (incl. the value-ΔE tautology and any subject where a fix didn't help)
  recorded honestly (AC #3).
- `npm test` still green (AC #4).
Record the numbers in `progress.md` and `review.md`.

**Commit.** `chore(E-18 T-060-01): combined 7-subject sweep — e18-build/* + e18-remeasure.{md,json}`

## Testing strategy

- **Unit (pure, CI)** — the assembler: delta direction, averages, regression flagging, tautology
  exclusion, null handling, schema. No GL/WebP/GLB.
- **Integration (manual, GL/host)** — the 7-subject combined sweep: real GLBs, thin voxelization, dwebp
  decode, segment, render, silhouette IoU, the before/after roll-up. Verified by running the runner;
  renders inspected.
- **Regression guard** — deps untouched; their suites + all `src/**/*.test.mjs` stay green.

## Risks & mitigations

- **Speckle occupancy mismatch** — baselines scored over `voxelizeGlb`, E18 over `voxelizeGlbThin`; the
  runner computes both occupancies (design D3). A unit-style smoke already confirmed koi (E18 speckle 0.17
  vs R1 0.72 / R2 0.35).
- **Value-ΔE tautology** — R2/E18 ≈ 0 by construction; assembler excludes it from regressions and notes it
  (design D6) so a reader doesn't misread the 0.
- **Heavier thin builds** — render time up ~2× on bow/koi; acceptable (T-059 #1). If a render is slow,
  scale stays 32 (parity is required anyway).
- **form IoU dip risk** — reported honestly; expectation is a rise on thin subjects, parity on thick.
