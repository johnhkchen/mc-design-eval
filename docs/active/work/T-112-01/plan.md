# T-112-01 hip-pyramid-cap — Plan

Each step is committable and independently verifiable. `npm test` (the pure suite) is the gate
after every code step; live runs are explicit steps. Evidence lands in `progress.md`.

## Step 0 — Baseline pin (no code)
- Record current state: `npm test` count green; committed roof record shas (cottage
  `47739999…`, gatehouse `6ed2580c…`, church status `accepted`); `git rev-parse HEAD`.
- Verify `roof:cottage -- --repro` and `roof:gatehouse -- --repro` MATCH **before** any change
  (the baseline for the no-collateral claim; also re-confirms no drift from T-111 runs).

## Step 1 — `hipEndPlanes` extraction (the byte-compat refactor)
- `src/form/roof-fit.mjs`: extract the hip end-plane definition (today's arithmetic verbatim);
  rewrite `gableSurfaceHeight` over it. Support `hip.fitted` per-end pitch override (inert —
  nothing sets it yet).
- `src/view/roof-generate.mjs`: re-base `gableDownhillAt`'s hip branch on `hipEndPlanes`.
- Tests: golden equivalence on existing hip fixtures (gatehouse-shaped synthetic); full suite.
- Verify: `npm test` green with zero changes to existing expectations.
- Commit: `refactor(E-29 T-112-01): one hip end-plane definition shared by surface and downhill`.

## Step 2 — The hip/pyramid fit core
- Create `src/form/roof-hip-fit.mjs` (`HIP_FIT_SCHEMA`, `HIP_FIT_DEFAULTS`, `capFootprint`,
  `fitHipCap`, `fitHipEnds`) per structure.md.
- Create `src/form/roof-hip-fit.test.mjs`: synthetic square pyramid accepts; elongated mass →
  emergent ridge; missing-face / thin-footprint refusals named; recorded-plane pitch wins;
  hip-end fit + refusal; determinism.
- Verify: `npm test` green (new tests included).
- Commit: `feat(E-29 T-112-01): hip/pyramid fit core — as-built positions, GLB slopes, named refusals`.

## Step 3 — Generator corner states
- `src/view/roof-generate.mjs`: `cornerEligible` owner flag + gated corner-shape emission
  (LEFT map, outer/inner rules, apex seat stays full).
- Tests: corner-state exhaustives (all 4 facings × outer/inner), legacy-gable
  straight-only on identical geometry, state validity through the version vocabulary.
- Verify: `npm test` green; existing roof-generate expectations byte-unchanged.
- Commit: `feat(E-29 T-112-01): corner stair states for hip constructions — gated, exhaustively tested`.

## Step 4 — Ladder wiring (pure layer)
- `src/form/roof-ridge-fit.mjs`: kind/≠2-side pass-through in `ridgeVariant`.
- `src/view/roof-swap.mjs`: `hipFit` arg, two appended tail rungs, `pitchKey` extension.
- Tests: rung order; no-`hipFit` attempt list verbatim (unit no-collateral proof); dedup
  isolation; refused-group + cap accepts at `hip-cap`; ridge-variant guard.
- Verify: `npm test` green.
- Commit: `feat(E-29 T-112-01): hip-cap / hip-end-fitted rungs appended to the swap ladder`.

## Step 5 — Runner wiring
- `benchmarks/sculpture/roof-program.mjs`: hoist aligned triangles; per-group cap/hip-end
  fitting (cap only when the group has no sane gable); `hipFit` into `swapRoof`; record
  `hipFit` section + markdown; `cap45`/`cap135` frame pairs on cap attempts.
- Verify: `npm test` green (runner has no unit tests; its proof is Step 6).
- Commit: `feat(E-29 T-112-01): roof runner fits hip/pyramid hypotheses per refused component`.

## Step 6 — Live evidence (the ACs' proof runs)
- `npm run roof:cottage -- --repro` → expect `MATCHES committed record` (sha `47739999…`).
- `npm run roof:gatehouse -- --repro` → expect MATCH (sha `6ed2580c…`).
  These two ARE the no-collateral AC. Any mismatch = stop, diagnose, fix before proceeding.
- `npm run roof:church` (live): double-run determinism gate, unmapped 0, mass-1 outcome —
  either the cap rung ACCEPTS (AC main branch) or the refusal/rejection is NAMED with fit
  error (AC alternate branch). Inspect renders/frames at 45°/135°.
- `npm run roof:church -- --repro` → MATCH against the fresh record; `npm run roof:church --
  --offline` → OK.
- Commit record + md + artifact + frames:
  `feat(E-29 T-112-01): church tower cap through the ladder — <outcome>, single-mass subjects byte-identical`.

## Step 7 — Review
- Full `npm test` final count; AC-by-AC check; write `review.md` (changes, coverage, concerns).

## Testing strategy summary
- **Unit (pure)**: fit core on synthetic specs; corner-state exhaustives; ladder composition;
  golden byte-compat for the Step-1 refactor. All under the existing `src/**/*.test.mjs` glob.
- **Integration (live, GL)**: the three named runs in Step 6 — determinism double-run,
  unmapped gate, cage outcomes, `--repro` byte checks. These are the AC's own verification
  vehicles; no new harness is invented.
- **Non-goals**: settle/styled chain (S-113), judge re-runs (T-114), generate-first (T-115).

## Rollback line
Steps 1–4 are pure and independently revertible; the runner step is wiring-only. If Step 6's
cottage/gatehouse repro breaks, the defect is in Steps 1 (refactor) or 4 (ladder) by
construction — bisect there; the committed records are never rewritten by `--repro`.
