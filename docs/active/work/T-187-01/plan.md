# T-187-01 — PLAN (ordered, independently verifiable steps)

Each step is committable and verifiable. The metered re-gate (Step 6) is the AC's evidence and the one
step that cannot be unit-verified — it is run live and recorded honestly. Mirrors the T-186-01 plan.

## Step 0 — Baseline green (pre-flight)
- `npm test` on a clean tree → confirm baseline passes (so any later red is ours).
- `GUARD_ONLY=1 node experiments/eval-alignment/style-agreement-run.mjs` → confirm assets / 12 states /
  8 pairs present (the re-gate is runnable). No spend.
- **Verify:** baseline green; guard clean. No commit.

## Step 1 — Add the medium-tolerance clause to the `DiagnoseBuild` prompt (D1+D2)
- `baml_src/department.baml`: append the VOXEL-MEDIUM clause after CONCEPT-CONDITIONAL per `structure.md`
  §1 (blockiness is the medium; same-thing-ness at block resolution; sub-resolution detail exempt;
  reserve `replace`/major for a genuinely different thing). Keep schema/enums/`RouteCritique` intact.
- `npm run baml:gen` (regenerate `baml_client`).
- **Verify:** `npm run baml:gen` exits 0; `baml_client` diff is the `DiagnoseBuild` prompt only.

## Step 2 — Sharpen the `styleProfileBlock` header (the material anti-leak, D3)
- `src/workshop/diagnose.mjs`: append the material anti-leak clause to the `styleProfileBlock` header
  (vocabulary materials are never the EXPECTED material; picture-material wins). Body unchanged. Update
  the doc-comments on `styleProfileBlock`/`diagnoseRenderArgs` to cite T-187/E-47.
- **Verify:** `node --test src/workshop/diagnose.test.mjs` — DG5/DG7/DG8 still pass (append preserves
  their substrings). DG9 added in Step 4. (Expected: still green; new clause not yet asserted.)

## Step 3 — Regenerate the diagnose fixtures (inputs.json + golden)
- Throwaway snippet (the T-186 procedure): load the barn program
  (`benchmarks/sculpture/recognition/barn.program.json` → `{reading, masses}` as the harness does) +
  `packs/rustic.json`, call production `diagnoseRenderArgs`, write
  `src/baml/fixtures/diagnose/inputs.json`; then `bamlRender({fn:"DiagnoseBuild", args})` → write
  `src/baml/fixtures/diagnose/prompt.golden.txt`. (Pin-guard note: committed fixtures — this ticket owns
  the re-pin; regenerate deliberately, never hand-edit.)
- **Verify:** `git diff` shows `inputs.json::style_profile` gains the material clause; `golden.txt` shows
  the new medium prose + the extended header; the barn program/palette body is byte-identical otherwise.

## Step 4 — Update tests (DG9 + FX-DB1 medium regex)
- `src/workshop/diagnose.test.mjs`: add **DG9** asserting the header carries the material anti-leak
  ("never the … material"; picture-material wins). Touch DG5/DG7 comments only if intent narrows.
- `src/baml/fixtures.test.mjs`: extend FX-DB1's content regexes with a stable substring from the medium
  clause (e.g. `/VOXEL|block resolution/i`, `/finer than the block grid/i`). FX-DB1's byte-pin matches
  the re-pinned golden automatically.
- **Verify:** `npm test` green (pretest `baml:gen`; FX-DB1 byte-match + new regexes; DG1–DG9 pass;
  FX-DB2 unaffected; contract test intact).
- **Commit:** "feat(T-187-01): voxel-vs-art tolerance — medium clause (DiagnoseBuild) + material
  anti-leak header (styleProfileBlock); re-pin diagnose golden + DG9".

## Step 5 — Crux-direction read (folded into the full run, per T-186)
- The full run's per-state `[score]` logs give the crux-direction read at no extra spend (T-186 folded
  the separate VOTES=2 probe in). Watch in the live log: `gh/ct/bn-match` should rise off their T-186
  18/19/25; `gh-wrongpack` off 1; `*-samepack-*`/`bn-cross` should NOT rise (the decoupling guard).
- **Verify (early-abort signal):** if matched does not rise OR wrong-picture rises with it, the
  tolerance under-delivers / re-couples — record it, do not promote. (Read post-hoc from the JSON;
  no pre-spend probe.)

## Step 6 — Re-gate at full strength (the AC evidence)
- `VOTES=6 node experiments/eval-alignment/style-agreement-run.mjs` → writes
  `experiments/eval-alignment/results/style-agreement.json` (~120 strong-tier calls, ~50 min). Run in
  the background; tee the log to `docs/active/work/T-187-01/run-votes6.log`.
- Read the verdict block: `conceptImageEffect`, `packEffect`, decomposition verdict; overall/easy/
  hardMiddle agreement; inter-label; concordance; recommendation (`go`).
- **Record** the full numbers in `progress.md` + a `RE-GATE.md` (the T-186 RE-GATE analogue): the 2×2
  cells, per-subject effects, **matchedRight AND matchedWrong explicitly** (the crux), the crux-cell
  movements (`*-wrongpack` ↑, `*-samepack-*` ↓), `gh-wrongpack` term-vs-fixture read, and the honest
  verdict — with the T-186 cells beside each.
- **Verify (the claim):** PICTURE-DRIVEN ∧ matchedWrong stayed low ∧ hardMiddle ≥ 0.70 ∧ matched rose ∧
  gh-wrongpack diagnosed. Any miss → honest negative; `measurements/` untouched; no promote.

## Step 7 — Stage (only if clean PICTURE-DRIVEN + agreeing) — NOT autonomous
- If PICTURE-DRIVEN + hardMiddle ≥ 0.70: the result is at best `go=null` (proxy ⇒ non-licensing). Do
  **not** write `measurements/`. Stage the PROMOTE-prep package description (the guarded ADD under
  `measurements/style-distance/` + a PinGuard entry + a replay-verify) UNEXECUTED, behind human
  sign-off, in `RE-GATE.md`. If still-MIXED / re-coupled / regressed: record the residual localization
  + the follow-on stub (term vs gate/NOISE/corpus vs fixture). No staging.
- **Verify:** `git status` — nothing under `measurements/`; the only product code change is the diagnose
  seam + fixtures.

## Step 8 — Review
- Write `review.md`: files changed, the re-gate numbers (T-186→T-187 delta table), test coverage, open
  concerns, the GO/NO-GO, the named follow-on.

## Testing strategy
- **Unit (in `npm test`):** DG1–DG9 (serializer content + the D3 tripwire), FX-DB1 (re-pinned golden
  byte-match + medium-clause regex), FX-DB2 (parse unchanged), the contract test (schema intact). These
  prove the seam changed exactly as intended and nothing downstream drifted.
- **Integration (metered, out-of-test):** the re-gate run — the only test of whether the tolerance makes
  the term PICTURE-DRIVEN *without* lifting wrong-picture builds. Cannot be mocked; it is the
  falsifiable evidence, reported with matchedRight AND matchedWrong.
- **Honesty gate:** a still-MIXED / re-coupled re-gate is a valid, recorded outcome — the plan does not
  assume success. Agreement holding at 1.00 while the scale stays short is a sharp localization, not a
  failure.

## Rollback
- Each step is additive at the seam; revert is `git revert` of the Step-4 commit + restoring the prior
  `prompt.golden.txt`/`inputs.json`. The gate, scoring core, and `measurements/` are never touched, so
  rollback cannot affect the frozen instrument.
