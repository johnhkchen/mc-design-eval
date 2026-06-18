# T-206-01 Plan — ordered, verifiable steps

Each step is independently checkable; commit at the marked points. Verification commands are exact.

## Step 1 — `eaveRingClosure`: footprint metric + remove the clamp
**File:** `src/view/wall-generate.mjs`
- Add `program` + `coverageFloor = 0.5` to the param destructure.
- Delete the `robustExtent`/`PROUD_TRIM` clamp (the `ext` line + `footprint` filter loop +
  `ring = perimeterColumns(footprint)`).
- Insert: register the program (`registerRect`); if `reg && reg.coverage >= coverageFloor` measure
  `present/ring.size` over `reg.ring` forgiving `openCols`; else fall back to `perimeterColumns(cols)`
  with the existing closure / closure-except-aperture branch (unclamped).
- Rewrite the docstring (footprint, supersedes T-202 clamp).
**Verify:** `node -e "import('./src/view/wall-generate.mjs').then(m=>console.log(typeof m.eaveRingClosure))"`
prints `function` (parses, exports intact).

## Step 2 — `closeShell`: report through the new metric
**File:** `src/view/wall-generate.mjs`
- `closureBefore` → `eaveRingClosure(occ, { floor, eaveY, program: params.program, coverageFloor })`.
- `closureAfter` → `eaveRingClosure(out, { floor, eaveY, program: params.program, coverageFloor })`.
**Verify:** part of Step 5's test run (closeShell tests still green).

## Step 3 — remove the `PROUD_TRIM` export
**File:** `src/view/wall-generate.mjs`
- Delete `export const PROUD_TRIM = 0.05;` + its doc comment.
**Verify:** `grep -rn PROUD_TRIM src/view/wall-generate.mjs` → only any remaining (expect none).
`grep -rn "PROUD_TRIM" src | grep -v test` → empty.

## Step 4 — rewrite the affected tests + add T-206 cases
**File:** `src/view/wall-generate.test.mjs`
- Drop `PROUD_TRIM` from the import (L10).
- WG-CS6/CS7: pass `program: T202_PROGRAM` to the `eaveRingClosure` calls on the relief'd / reopened
  builds; keep the `naiveBandClosure` crater assertion; assert footprint ≥/< `FORM_READY_CLOSURE`.
- WG-CS8: remove the `PROUD_TRIM` range assertion; keep the proud-free no-op readings; retitle.
- Add WG-CS10 (seed ≈0.608 <0.9), WG-CS11 (closed+relief ≈0.9375 ≥0.9), WG-CS12 (reopened ≈0.839 <0.9),
  WG-CS13 (agreement: `eaveRingClosure(seed,{program})` === `closeShell(...).report.closureBefore`),
  WG-CS14 (gate: relief blocked@seed, close_shell allowed@seed, relief allowed@closed+relief).
- Ensure `artifactOccupancy` is imported in the test (add if absent).
**Verify:** `node --test src/view/wall-generate.test.mjs` → all pass (expect the existing count + 5 new).

## Step 5 — full unit suite green (COMMIT 1)
**Verify:** `npm test` → green (no regression elsewhere; the metric is additive/optional).
**Commit:** `fix(T-206-01): form-readiness on the absolute program footprint — colonnade reads open`
(wall-generate.mjs + test).

## Step 6 — thread `program` through the runner
**File:** `experiments/eval-alignment/picture-climb.mjs`
- `closureNow` (L693): add `program: PROGRAM`.
- `closureAfter` (L770–771): add `program: PROGRAM`.
- REBUILD_ARCH_PROBE evidence calls (L644–650): add `program: PROGRAM`.
- Update the `closureNow` comment block to name the footprint metric + T-206.
**Verify:** `node --check experiments/eval-alignment/picture-climb.mjs` → no syntax error
(no LLM spend; the runner is not in the test glob).

## Step 7 — zero-spend evidence probe
**File (new):** `docs/active/work/T-206-01/footprint-evidence.mjs`
- Pure geometry, absolute-path imports, mirrors `T-197-01/closeshell-evidence.mjs`.
- Prints + asserts: seed footprint <0.9; closed+relief ≥0.9; reopened <0.9; agreement
  (`eaveRingClosure(seed,{program})` === `closeShell(seed,{program}).report.closureBefore`); gate
  verdicts. `process.exit(pass?0:1)`.
**Verify:** `node docs/active/work/T-206-01/footprint-evidence.mjs` → prints PASS, exit 0.

## Step 8 — progress + commit (COMMIT 2) + review
- Write `progress.md` (what landed, deviations, the validated readings).
- **Commit:** `feat(T-206-01): footprint evidence probe + runner threads program`
  (picture-climb.mjs + footprint-evidence.mjs + progress.md).
- Write `review.md` (Review phase).

## Testing strategy
- **Unit (authoritative):** `wall-generate.test.mjs` — the metric's three real fixtures + agreement +
  gate behaviour. This is the AC's "unit-tested on three real fixtures" + "agreement asserted" +
  "`formReadyGate` gates correctly". Run under `npm test`.
- **Integration (zero-spend):** `footprint-evidence.mjs` — the runner-true reading on the live seed +
  the close-shell-agreement re-run. No LLM, no GL, deterministic.
- **Runner parse-check only:** `node --check` on `picture-climb.mjs` (a full metered climb is the
  capstone S-208, not this lead-fix ticket).
- **No frozen-instrument change:** confirm `git status` shows nothing under `measurements/`.

## Rollback safety
The new `eaveRingClosure` params are optional and additive; with `program=undefined` the function is
today's behaviour minus a documented no-op clamp. Any un-updated caller still compiles and behaves
unchanged on proud-free input. `closeShell`'s decision path (coverage ≥ floor) is untouched — only its
*reported* numbers route through the new metric.

## Risk checks to run during Implement
- Confirm WG-CS2/CS3/CS5 still green after `closeShell` reports through the footprint metric
  (`closureBefore < 1`, `closureAfter == 1` on the clean shell).
- Confirm `gappy7` reads ≈0.7917 on the no-program fallback (clamp was a no-op there).
- Confirm closed+relief ≥0.9 with margin (0.9375) — if it lands <0.9, the proud coupling is tighter
  than measured; stop and re-examine `registerRect`'s trim rather than re-introducing a clamp.
