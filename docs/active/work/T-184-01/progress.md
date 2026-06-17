# T-184-01 — Progress

All plan steps complete. Verdict: **DO-NOT-PROMOTE** (the term reads the pack, not the picture, at population
scale). `npm test` 2302 green; `measurements/` untouched.

## Steps

- [x] **Step 1 — pure core + tests.** `src/workshop/style-agreement.mjs` (DESIGN_CELL,
  packVsConceptDecomposition, termPairVerdict, pairwiseAgreement, interLabelAgreement, rankConcordance,
  recommendation) + `style-agreement.test.mjs` (SA1–SA6 + const). 7 tests, green. Commit (pure core).
- [x] **Step 2 — pair set.** `experiments/eval-alignment/corpus/labels/pairs.json` — 3 easy + 5 hardMiddle,
  referential integrity verified against the corpus (all `a`/`b` are state ids). Commit.
- [x] **Step 3 — GL-free instrument + human-gate prep.** `experiments/eval-alignment/style-label.mjs` +
  `package.json` `style:label`. GUARD_ONLY passed; full build wrote 8 `instrument/<id>.png` composites +
  `labels-template.json`. Eyeballed H1 — composite reads as a judgeable A‖B pair. Commit.
- [x] **Step 4 — metered harness.** `experiments/eval-alignment/style-agreement-run.mjs` + `package.json`
  `style:agreement`. SUBJECT_PROGRAMS (gatehouse synthetic verbatim + cottage/barn real recognition programs);
  per-state scoring; independent proxy glance judge; pure-core join. GUARD_ONLY passed (38 assets). Commit.
- [x] **Step 5 — metered run @VOTES=6.** Spend probe first (minimal `claude -p` → "OK", no spend-limit
  notice). Full run: 72 score + 48 proxy calls, ~95 min, exit 0. `results/style-agreement.json` written.
  Commit (run + FINDINGS).
- [x] **Step 6 — FINDINGS.md.** The GO/NO-GO report (decomposition table, agreement, inter-label, concordance,
  recommendation + the concept-image-conditioning residual for S-185). Committed with Step 5.
- [x] **Step 7 — final verification.** `npm test` 2302 green; `git status --porcelain measurements/` empty.
  progress.md + review.md (this phase).

## The result (one screen)

- **Decomposition PACK-DRIVEN:** packEffect **+45** ≫ conceptImageEffect **+8** (NOISE=12). matchedRight=53,
  matchedWrong=45, foreignRight=8. Builds matching their own picture under a foreign pack: gh-wrongpack 16,
  ct-wrongpack **0**. Per-subject gatehouse conceptImageEffect **−12** (wrong picture scored *higher*).
- **Agreement vs proxy:** hard middle **1/5**, easy 2/3, overall 3/8; τ=−0.14. The one missed "easy" pair (E1)
  is the picture-axis indictment (proxy 6/6 A, term B).
- **Inter-label LABELABLE** (hard-middle self-consistency 0.90) — the gate is not ill-posed; the term disagrees
  with a stable, sensible label.
- **recommendation.go = false**, DO-NOT-PROMOTE.

## Deviations from plan

1. **Cottage/barn programs loaded from real recognition outputs**, not hand-written synthetic stand-ins (plan
   Step 4 / structure #5 allowed either). `benchmarks/sculpture/recognition/{cottage,barn}.program.json` exist
   and are more authentic than a fresh synthetic program; the gatehouse stays the referee's synthetic PROGRAM
   verbatim for T-182 comparability (gh-match=47 ≈ T-182 A-matched=41, within noise — the cross-check held).
2. **Run wall-clock ~95 min** (not the ~60 estimated) — each image diagnose is ~40–50s at the strong tier.
   Ran in the background; no behavioral change. No re-asks fired (no malformed replies; all 48 proxy votes
   parsed).
3. **No human labels collected in-loop** (autonomous loop can't summon the reviewer) — the LLM-proxy fallback
   ran and is flagged non-licensing, exactly as the AC permits. The human instrument is prepared
   (`instrument/*.png` + `labels-template.json`) for S-185 if a human licensing pass is ever wanted; for a
   DO-NOT-PROMOTE it is not needed (a proxy can refute; the decomposition refutes without labels at all).

## Artifacts

- Source: `src/workshop/style-agreement.mjs` (+ test), `experiments/eval-alignment/style-label.mjs`,
  `experiments/eval-alignment/style-agreement-run.mjs`, `package.json` (2 scripts).
- Data/output: `corpus/labels/pairs.json`, `corpus/labels/instrument/*.png` (8),
  `corpus/labels/labels-template.json`, `results/style-agreement.json`.
- Docs: research/design/structure/plan/FINDINGS/progress/review under `docs/active/work/T-184-01/`.
- `run-votes6.log` is gitignored (`*.log`); every per-vote score is in `results/style-agreement.json`.
