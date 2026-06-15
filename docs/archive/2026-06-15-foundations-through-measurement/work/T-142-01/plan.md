# T-142-01 Plan — witness-pin-policy

Ordered, independently-verifiable steps. Each commits atomically. Baseline first: capture the four
reds and `npm test` count so every claim is differential.

## Step 0 — baseline (no commit)
- Record the four reds (done in research.md) and `git log` shas needed to fill the retired
  registries: `inputs.ledger.sha256` from `benchmarks/sculpture/proportion/{cottage,barn}.json`, and
  `source.sha256` from `benchmarks/sculpture/visibility/{barn-patternbook,barn-patternbook-saltcrag,
  cottage-patternbook}.json`.
- `npm test` → confirm green count (expect 2018) before any edit.

## Step 1 — the pure cage + its test  (commit: `feat(T-142-01): witness-repro SKIP-vs-FAIL decision core`)
- Write `src/form/witness-repro.mjs` (`classifyWitnessRepro`, `retiredEntry`,
  `WITNESS_REPRO_VERDICT`).
- Write `src/form/witness-repro.test.mjs` (WR1–WR6 per structure.md).
- **Verify**: `node --test src/form/witness-repro.test.mjs` green; `npm test` still green (delta =
  +N new tests, 0 regressions). This step stands alone — it is the AC3 deliverable and touches no
  runner.

## Step 2 — proportion-witness: thread the pack + SKIP the retired records  (commit: `fix(T-142-01): proportion-witness threads the pack; retired ledgers SKIP, not throw`)
- Add the imports; load `pack` once; pass it to both `replayLedger` calls.
- Add `RETIRED_SOURCES` (fill `retiredSourceSha` from the committed records' `inputs.ledger.sha256`).
- Rewrite `runRepro` per structure: classify on the ledger sha before `buildRecord`; SKIP→`true`,
  green→existing byte-compare, fail→`false`.
- **Verify**: `npm run proportion:repro` → `cottage: SKIP — … T-138-02`, `barn: SKIP — … T-138-01`,
  gatehouse/church no-record → **exit 0** (`echo $?`). Confirm the SKIP reason names the ticket.
- **Negative check**: temporarily corrupt one committed proportion record's bytes (in a scratch
  copy / or flip a registry sha) to confirm an *unregistered* mismatch still FAILs — then revert.
- Self-grep: the runner's `generalizationGrep` still clean (registry slugs are subject keys! — see
  Risk R1).

## Step 3 — visibility-witness: tracked-only plan + gate-record SKIP guard  (commit: `fix(T-142-01): visibility-witness SKIPs retired gate-record pins; reads only tracked component-plans`)
- Extend imports (`isTracked`, `loadTrackedSet`, classifier).
- `derive()`: tracked-only component-plan; stamp `source.componentPlan`.
- Add `RETIRED_GATE_RECORDS`; add the `--repro` SKIP guard (classify on `source.sha256` vs current
  gate sha) before the byte-compare.
- **Verify (pre-rotation)**: `npm run visibility:repro` → the 3 pattern-book legs `SKIP — … T-138-0x`;
  gatehouse-current still SKIP; the 13 green legs still byte-identical; cottage-challenge now either
  green (plan excluded) or DIVERGES-pending-rotation (resolved in Step 4). Note exit code.
- Self-grep clean (Risk R1 again — `RETIRED_GATE_RECORDS` slugs contain subject keys like `barn`,
  `cottage`).

## Step 4 — the data rotations  (commit: `chore(T-142-01): rotate measured before-baselines + cottage-challenge provenance under explicit pin rotation`)
- **measured**: edit `measured-proportions.mjs` to add `inputs.chainSeed`. Then
  `node benchmarks/sculpture/measured-proportions.mjs --all --rotate-pins`. Confirm only
  `{cottage,barn}.record.json` + `.md` changed bytes (program/artifact `skip-identical`); `before`
  now matches the rotated seed; `after`/`target` unchanged. Quote the retired `before` in progress.md.
- **cottage-challenge**: `node benchmarks/sculpture/visibility-witness.mjs --subject cottage
  --label challenge --rotate-pins`. If the plan-less census is valid → green record (provenance
  resolved by exclusion). If degenerate → revert to SKIP-flag (keep committed numbers, SKIP on
  `componentPlan.tracked===false`); document which path was taken.
- **Verify**: all four runs exit 0:
  `npm run proportion:repro && npm run visibility:repro && npm run measured:repro && npm run measured:offline`.

## Step 5 — full gate + isolation  (commit: folded into Step 4 or a docs commit if needed)
- `npm test` green (no regressions; +N from Step 1).
- Isolation scan: confirm no witness writes under `benchmarks/sculpture/multi-angle/`; the
  runners' self-greps clean; `git status` shows only the intended files changed (no gate records).
- Confirm the diff touches exactly: 2 new `src/form/witness-repro*`, 2 runner edits, 1 measured
  runner edit, and the rotated data records — nothing under the gate namespace.

## Testing strategy
- **Unit (npm test)**: `witness-repro.test.mjs` is the AC3 regression test — SKIP for a registered
  rotation, FAIL for corruption, FAIL for an unregistered change, GREEN for clean. Pure, fast,
  deterministic; both "witness families" exercise the *same* core so one suite covers both.
- **Integration (exit-coded npm runs)**: the four `*:repro`/`:offline` runs are the end-to-end proof
  — each must exit 0 with every non-green leg printing a *named* SKIP. These are not in `npm test`
  (they read `benchmarks/` records) but are the acceptance harness.
- **Negative/adversarial**: Step 2/3 each include a "corrupt a record → still FAILs" check so the
  SKIP path can't mask a real regression (the whole point of AC3).

## Risks & mitigations
- **R1 (self-grep)**: the retired registries embed subject keys (`barn`, `cottage`, `gatehouse`) in
  string literals → both runners' `generalizationGrep` (`src.includes(key)`) would HIT and the
  runner would `process.exit(1)`. **Mitigation**: keep the registries in a SEPARATE committed data
  file (e.g. `benchmarks/sculpture/retired-pins.json`) loaded by each runner, so no subject key
  appears in `*.mjs` source. The grep scans the runner's own source only — a JSON sidecar is clean.
  (Confirm by reading each runner's grep target: `fileURLToPath(import.meta.url)`.) Decide in
  Step 2; this is the single highest-risk detail.
- **R2 (exit sentinel)**: a SKIP returning `null` would trip "no committed witness records found".
  Covered by the `true`-for-skip contract; assert with `echo $?` after each run.
- **R3 (plan-less cottage census degenerate)**: Step 4 fallback to the SKIP-flag path.
- **R4 (measured rotation sweeps more than before)**: verify the diff is only record+md (the seed
  pin is additive; program/artifact re-emit byte-identical). If `after`/`target` move, STOP — that
  would mean a non-`before` input rotated (investigate, do not re-bank).
