# T-056-01 — Plan (ablation-sweep)

Ordered, independently verifiable steps. Each ends at a commit gate. Maps to AC #1 (R3 sweep), AC #2 (one
structured record), AC #3 (honesty — no dropped rungs), AC #4 (pure logic tested, `npm test` green).

## Step 1 — Pure core `src/form/ablation.mjs` + tests  → AC #4

- Write `src/form/ablation.mjs`: `RUNGS`, `autoRegions`, `rungVerdict`, `assembleAblation` (per
  structure.md interfaces). No imports from `benchmarks/`; pure.
- Write `src/form/ablation.test.mjs`: `autoRegions` (tiling/count/edge), `rungVerdict` (baseline/improved/
  held/regressed/unknown at eps), `assembleAblation` (4-rung chain, marginal deltas incl. negative ΔE,
  null-cell tolerance, json shape).
- **Verify:** `npm test` green (new tests included; existing 522 still pass). Import smoke:
  `node -e 'import("./src/form/ablation.mjs")'` side-effect-free.
- **Commit:** `feat(E-17 T-056-01): ablation pure core — autoRegions + rungVerdict + assembleAblation`.

## Step 2 — R3 runner `glb-voxel-surgical-sweep.mjs`  → AC #1

- Write the runner per structure.md: reviseLoop on each R2 build, `autoRegions` regions, default
  procedural diagnose, `score = liveFormScore({ formTarget: glbFormTarget({ glbPath, buildBounds }) })`;
  whole-object before/after; local pure `p14Report`; `buildR3`; `--offline`.
- **Verify (static):** parses; imports side-effect-free; `--offline` on an empty dir degrades to skipped
  rows without throwing.
- **Run live:** `node benchmarks/sculpture/glb-voxel-surgical-sweep.mjs` (7 subjects). Confirm per AC #1:
  each subject has a render + per-region tweak trace; **P14 holds** for every subject (non-improving tweaks
  rolled back). Expected near-null verdicts (held) — that is the finding, recorded not dropped.
- **Verify (determinism):** re-run `--offline` → r3.{md,json} rebuild from summaries is byte-identical
  except float `durationSec`.
- **Commit:** `feat(E-17 T-056-01): R3 surgical sweep across 7 subjects + r3 roll-up` (PNGs gitignored).

## Step 3 — Collector `sweep-ablation.mjs` + the structured record  → AC #2, AC #3

- Write the collector per structure.md: per subject decode GLB texture once → ref palette; per rung load
  artifact, compute `valueDeltaE` (guarded), source `formIoU` (R1/R2/R3 from summaries, R0 rendered+judged);
  write per-subject `ablation.json`; `assembleAblation` → top-level `sweep-ablation.{md,json}`; `--offline`.
- **Run live:** `node benchmarks/sculpture/sweep-ablation.mjs`. Confirm:
  - all 7 subjects × 4 rungs present (AC #3 — no subject/rung dropped; zero/negative Δ shown honestly);
  - `sweep-ablation.json` has `subject × rung → { formIoU, valueDeltaE, verdict }` + marginal `dFormIoU`/
    `dValueDeltaE` (AC #2);
  - the expected story is visible: formIoU jumps R0→R1, value ΔE drops R1→R2, R2→R3 ~flat.
- **Verify (determinism):** `--offline` rebuild → zero diff (ignoring float jitter).
- **Commit:** `feat(E-17 T-056-01): sweep-ablation collector + R0–R3 data spine`.

## Step 4 — AC sweep + progress.md

- Re-run `npm test` → green (AC #4). Re-confirm AC #1–#3 from the committed records. Secret hygiene: no
  endpoint/URL printed by any runner; GLB bytes never logged.
- Write `progress.md`: each AC with the concrete evidence (file paths, numbers, test count).
- **Commit:** `docs(E-17 T-056-01): progress — all ACs met`.

## Step 5 — Review

- Write `review.md`: files changed, test coverage + gaps, open concerns (R3 near-null interpretation,
  R0-vs-GLB normalization caveat, value ΔE reference choice), handoff to T-057-01 scorecard.

## Testing strategy

| logic | where | how tested |
| --- | --- | --- |
| `autoRegions`, `rungVerdict`, `assembleAblation` | `src/form/ablation.mjs` | `src/form/ablation.test.mjs` (pure, in `npm test`) |
| reviseLoop / glbFormTarget wiring | already covered | `src/revise/*.test.mjs`, `src/form/*.test.mjs` |
| value ΔE math | already covered | `src/color/value-gate.test.mjs` |
| live R3 render + IoU | `glb-voxel-surgical-sweep.mjs` | GL/host-metered; manual run + committed summaries; NOT in CI |
| live collection (R0 render, texture decode) | `sweep-ablation.mjs` | GL/host-metered; manual run + `--offline` determinism; NOT in CI |

## Risks / mitigations

- **R3 is a null (all held).** Expected (`[[form-revision-needs-3d-target]]`); the record states it plainly
  and `dFormIoU` shows ~0. Not a failure.
- **An R0 artifact uses a block missing from the value-true table** → `valueDeltaE` for that cell is null
  with a note; the sweep continues (D3 guard).
- **R0-vs-GLB IoU is cross-target** (text→JSON coords vs mesh). `normalizeSilhouette` removes
  translation + uniform scale; documented as the honest baseline, not a like-for-like build comparison.
- **Float jitter in `durationSec`** across re-runs — excluded from the determinism assertion (prior-rung
  precedent).
