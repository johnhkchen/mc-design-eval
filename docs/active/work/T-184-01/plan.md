# T-184-01 — Plan

Ordered, independently-verifiable steps. The pure core + tests land first (red→green in `npm test`); the
data + GL-free instrument next (committable, deterministic); the metered run last (model spend, gated behind a
GUARD_ONLY dry run). Commit incrementally. Nothing under `measurements/`.

## Step 1 — pure core + tests (the freeze-irrelevant gate math)
Write `src/workshop/style-agreement.mjs` (Decision 1/6 functions: `DESIGN_CELL`,
`packVsConceptDecomposition`, `termPairVerdict`, `pairwiseAgreement`, `interLabelAgreement`,
`rankConcordance`, `recommendation`) and `src/workshop/style-agreement.test.mjs` (SA1–SA6).
- **Verify:** `npm test` green (the new tests + all 2295 prior). Pure module → deterministic.
- **Commit:** `feat(T-184-01): pure style-agreement core (decomposition + pairwise agreement + recommendation)`.
- Atomic: this is testable with zero model spend and zero corpus IO (synthetic fixtures).

## Step 2 — the curated pair set (data)
Write `experiments/eval-alignment/corpus/labels/pairs.json` (8 pairs: 3 easy + 5 hard-middle, Decision 3).
- **Verify:** a tiny node one-liner loads it, asserts every `a`/`b` ∈ corpus state ids (referential integrity
  vs `loadStyleCorpus`), buckets ∈ {easy, hardMiddle}, intended ∈ {A,B,tie}. No model.
- **Commit:** `feat(T-184-01): curated hard-middle pair set for the labeling instrument`.

## Step 3 — the GL-free instrument builder + human-gate prep
Write `experiments/eval-alignment/style-label.mjs` (Decision 4 / structure #4): compose the 8 pairwise
composites + the fillable `labels-template.json`; asset-guard the `beside` PNGs first; `GUARD_ONLY=1` path.
Add `package.json` `"style:label"` (direct node).
- **Verify:** `GUARD_ONLY=1 node experiments/eval-alignment/style-label.mjs` (no spend) lists assets; then the
  full run writes 8 `instrument/<id>.png` + `labels-template.json`. Eyeball 2–3 composites to confirm the two
  beside-concept panels read side-by-side (the human must be able to judge them).
- **Commit:** `feat(T-184-01): GL-free pairwise labeling instrument + fillable human template`.
- This completes the human-gate PREP (AC: instrument exists; human can label by filling `labels.human.json`).

## Step 4 — the metered harness (scoring + proxy labels + join), GUARD_ONLY first
Write `experiments/eval-alignment/style-agreement-run.mjs` (structure #5): `SUBJECT_PROGRAMS`, score-each-state,
LLM-proxy pairwise judge, join through the pure core, write `results/style-agreement.json` + console verdict.
Add `package.json` `"style:agreement"` (direct node).
- **Verify (no spend):** `GUARD_ONLY=1 node …/style-agreement-run.mjs` — asset guard passes for all 12 states'
  views + packs + concepts + the 8 instrument composites; exits clean. Confirm the pure-core imports resolve.
- **Commit:** `feat(T-184-01): metered style-agreement harness (state scoring + proxy labels + decomposition)`.
- No model spend yet — the guard run is the gate before metering.

## Step 5 — the metered run (model spend; the evidence)
Run `VOTES=6 node experiments/eval-alignment/style-agreement-run.mjs` (proxy-fallback labels — no human file
present in the loop). ~12 states×6 score calls + 8 pairs×6 proxy calls ≈ 120 metered calls. Probe with a
minimal `claude -p` first if a spend-limit notice is suspected (`spend-limit-reply-failure-mode`).
- **Verify:** `results/style-agreement.json` has scoredStates (12), the 2×2 decomposition with effects, the
  bucketed agreement (easy + hardMiddle separately), interLabel self-consistency, concordance, and a
  recommendation with `licensing:false` (proxy fallback) and `go:null` (recommend-only).
- **Inspect honestly:** read the per-state scores beside the renders — does a matched build outscore its
  wrong-picture / foreign-pack twins? Is the hard middle genuinely split in the proxy votes? Record the actual
  numbers, not the hoped-for ones.
- **Commit:** `feat(T-184-01): style-agreement run @VOTES=6 (proxy-fallback labels) + results`.

## Step 6 — FINDINGS.md (the GO/NO-GO report)
Write `docs/active/work/T-184-01/FINDINGS.md`: the decomposition table (packEffect vs conceptImageEffect,
pooled + per-subject), the agreement table (overall / easy / hard-middle), inter-label self-consistency, the
concordance, and the recommendation for S-185 with the breadth + licensing caveat named. Lead with how it fails
(anti-hedge): does the term read the picture or the pack at population scale? Is the hard middle labelable? Is
the proxy result refute-only (yes — human labels are the S-185 gate)?
- **Commit:** `docs(T-184-01): FINDINGS — population pack-vs-picture decomposition + GO/NO-GO for S-185`.

## Step 7 — final verification + progress/review
- `npm test` green (2295 + the new SA tests).
- `git status --porcelain measurements/` EMPTY (the freeze is S-185).
- Update `progress.md` (deviations) and write `review.md`.

## Testing strategy
- **Unit (in `npm test`):** the entire `style-agreement.mjs` decision surface (SA1–SA6) — the arithmetic a
  reviewer must trust, single-sourced and deterministic. This is the real coverage; the gate math is what
  S-185 leans on.
- **Referential integrity (one-liner, Step 2):** pairs.json ids exist in the corpus, buckets/intended valid.
- **Empirical (the metered run, Step 5):** the population scores + labels are the EVIDENCE, not a unit test —
  reproducible by re-running the one command (idempotent sink). A unit test cannot assert what the live judge
  emits under the concept-conditional prompt; the run is the correct instrument for that question.
- **Anti-circularity check:** confirm the proxy prompt contains NO pack/score/DiagnoseBuild text (a glance
  judge), so term-vs-proxy agreement is not the term agreeing with itself.

## Risks & mitigations
- **Proxy ≈ term (circular):** mitigated by the independent glance prompt (Decision 5) + the anti-circularity
  check; and by the licensing flag (proxy can only refute).
- **foreignWrong cell empty** (no gatehouse/cottage guildhall-pack + wrong-concept state): the decomposition
  main effects don't need it (packEffect holds picture=right, conceptImageEffect holds pack=matched); the cell
  is reported `n:0` honestly, not imputed.
- **Hard middle not actually contestable** (proxy unanimous): then interLabel says LABELABLE and agreement on
  it is meaningful; if proxy is split, interLabel says ILL-POSED — either way reported, the corpus already
  inspected the renders for contestability (T-183-01).
- **Spend-limit notice:** probe before the full run; no re-ask on malformed votes (drop + log).
