# T-186-01 — PLAN (ordered, independently verifiable steps)

Each step is committable and has a verification. The metered re-gate (Step 6) is the AC's evidence and
is the one step that cannot be unit-verified — it is run live and recorded honestly.

## Step 0 — Baseline green (pre-flight)
- `npm test` on a clean tree → confirm baseline passes (so any later red is ours).
- `GUARD_ONLY=1 node experiments/eval-alignment/style-agreement-run.mjs` → confirm 38 assets / 12
  states / 8 pairs present (the re-gate is runnable). No spend.
- **Verify:** baseline green; guard clean. No commit.

## Step 1 — Re-frame `styleProfileBlock` header (the vocabulary demotion)
- `src/workshop/diagnose.mjs`: change ONLY the `styleProfileBlock` header line to the naming-vocabulary
  frame ("NOT the standard; the CONCEPT IMAGE is the standard"). Update the doc-comment on
  `styleProfileBlock` + `diagnoseRenderArgs` to the new contract.
- **Verify:** `node --test src/workshop/diagnose.test.mjs` — DG5/DG7 body assertions still pass (body
  unchanged). DG8 not yet added → add in Step 4. (Expected: still green; header not yet asserted.)

## Step 2 — Re-frame the `DiagnoseBuild` prompt (the standard)
- `baml_src/department.baml`: reword the `DiagnoseBuild` prose per `structure.md` §1 — concept image is
  the sole standard; the `palette_block` preface + the style block are naming vocabulary; the inverting
  sentence; `replace`/`add` re-keyed to build-vs-picture. Keep schema/enums/`RouteCritique` intact.
- `npm run baml:gen` (regenerate `baml_client`).
- **Verify:** `npm run baml:gen` exits 0; `baml_client` diff is the DiagnoseBuild prompt only.

## Step 3 — Regenerate the diagnose fixtures (inputs.json + golden)
- Write a throwaway snippet: load barn program (`benchmarks/sculpture/recognition/barn.program.json`
  shape, as the harness does) + `packs/rustic.json`, call production `diagnoseRenderArgs`, write
  `src/baml/fixtures/diagnose/inputs.json`; then `bamlRender({fn:"DiagnoseBuild", args})` and write
  `src/baml/fixtures/diagnose/prompt.golden.txt`. (Pin-guard note: these are committed fixtures —
  regenerate deliberately, this ticket owns the re-pin.)
- **Verify:** `git diff` shows `inputs.json::style_profile` header reframed; `prompt.golden.txt` shows
  the new prose + reframed headers; the barn program/palette body is byte-identical otherwise.

## Step 4 — Update tests (DG comments + DG8 tripwire + FX-DB1)
- `src/workshop/diagnose.test.mjs`: update DG5/DG7 intent comments; add **DG8** asserting the
  re-framed header (`doesNotMatch(/should read as/)`, `match(/NOT the standard|naming vocabulary/i)`).
- FX-DB1 (`fixtures.test.mjs`) needs no edit — it compares against the re-pinned `prompt.golden.txt`.
- **Verify:** `npm test` green (pretest `baml:gen`; FX-DB1 matches; DG1–DG8 pass; FX-DB2 unaffected).
- **Commit:** "feat(T-186-01): anchor DiagnoseBuild 'expected' on the concept image, pack→vocabulary
  (term seam); re-pin diagnose golden + DG8".

## Step 5 — Sanity-spike the two crux directions (cheap, pre-gate confidence)
- A minimal 2-state probe (1 `*-wrongpack`, 1 `*-samepack-*`) at VOTES=2 to confirm the re-frame moves
  scores in the predicted direction BEFORE spending the full VOTES=6 run. (Optional, low-spend; if the
  full run is cheap enough, skip straight to Step 6.) Record the probe in `progress.md`.
- **Verify:** `ct-wrongpack` rises off 0; one `*-samepack-*` falls vs its T-185-01 baseline. If it does
  NOT move, STOP — the re-frame under-delivers; record it, consider Approach-B fallback, do not promote.

## Step 6 — Re-gate at full strength (the AC evidence)
- `VOTES=6 node experiments/eval-alignment/style-agreement-run.mjs` → writes
  `experiments/eval-alignment/results/style-agreement.json`.
- Read the verdict block: `conceptImageEffect`, `packEffect`, decomposition verdict; overall/easy/
  hardMiddle agreement; inter-label; concordance; recommendation (`go`).
- **Record** the full numbers in `progress.md` + a `RE-GATE.md` (the T-185-01 FINDINGS analogue):
  the 2×2 cells, per-subject effects, the crux-cell movements (`*-wrongpack` ↑, `*-samepack-*` ↓), and
  the honest verdict.
- **Verify (the claim):** PICTURE-DRIVEN ∧ hardMiddle ≥ 0.70 ∧ crux cells moved right ∧ matched not
  regressed. If any fails → honest negative; `measurements/` untouched; no promote.

## Step 7 — Stage (only if the re-gate is GO-LEANING) — NOT autonomous
- If PICTURE-DRIVEN + agreeing: the result is at best `go=null` (proxy ⇒ non-licensing). Do **not**
  write `measurements/`. Note the T-185-01 `promote.mjs` staging template as the human-run path and
  stop. If PACK-DRIVEN/MIXED/regressed: record the negative; no staging.
- **Verify:** `git status` — nothing under `measurements/`; the only product code change is the
  diagnose seam + fixtures.

## Step 8 — Review
- Write `review.md`: files changed, the re-gate numbers, test coverage, open concerns, the GO/NO-GO.

## Testing strategy
- **Unit (in `npm test`):** DG1–DG8 (serializer content + the re-frame tripwire), FX-DB1 (re-pinned
  golden byte-match), FX-DB2 (parse unchanged), the contract test (schema intact). These prove the
  seam changed exactly as intended and nothing downstream drifted.
- **Integration (metered, out-of-test):** the re-gate run — the only test of whether the re-frame
  actually makes the term PICTURE-DRIVEN. It cannot be mocked; it is the falsifiable evidence.
- **Honesty gate:** a non-PICTURE-DRIVEN re-gate is a valid, recorded outcome — the plan does not
  assume success.

## Rollback
- Each step is additive at the seam; revert is `git revert` of the Step-4 commit + restoring the prior
  `prompt.golden.txt`/`inputs.json`. The gate, scoring core, and `measurements/` are never touched, so
  rollback cannot affect the frozen instrument.
