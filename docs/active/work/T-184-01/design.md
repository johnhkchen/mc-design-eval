# T-184-01 — Design

Three deliverables, one decision: (1) a pairwise labeling instrument over the hard-middle pairs; (2) labels
(human gate prepared + LLM-proxy fallback run, flagged); (3) an agreement + decomposition harness reporting
term-vs-human agreement (overall AND hard-middle), inter-label agreement, and the pack-vs-concept-image
decomposition. Output = the GO/NO-GO evidence S-185 acts on. Lead with how it fails (anti-hedge).

## Decision 1 — where the agreement/decomposition arithmetic lives

**Options.** (a) Extend `bakeoff-score.mjs` (reuse `pairAgreement`); (b) **new pure module
`src/workshop/style-agreement.mjs`** unit-tested in `npm test`; (c) inline in the metered harness.

**Chosen: (b).** `pairAgreement` is the wrong row shape (within-state matched-vs-wrong, not between-state) — and
`bakeoff-score.mjs` is the EXACT surface S-185 will freeze into `measurements/`. Keeping agreement out of the
frozen scorer keeps the freeze surface minimal and the gate logic (which is NOT the instrument) separate.
Inlining in the harness (c) would leave the decomposition untested — the project's discipline is pure-core +
thin-shell. New module it is, mirroring `defect-corpus.mjs`/`bakeoff-score.mjs` exactly (pure, no GL/IO/model).

## Decision 2 — the per-subject program (the scoring-input correctness call)

**Options.** (a) Reuse the referee's ONE fixed gatehouse `PROGRAM` for all 12 states (comparable to T-182, but
wrong-form for cottage/barn — injects false "missing" items); (b) **a fixed per-subject program map**
{gatehouse, cottage, barn}, each held CONSTANT across that subject's pack/concept conditions.

**Chosen: (b).** The `program` is the recognized "what the build SHOULD read as"; scoring a cottage against a
gatehouse program is a category error that pollutes every cottage score with the same false missing-mass
penalty. The decoupling we measure is in `(pack, concept)`, NOT the program — so the program is a per-subject
CONSTANT, varied by nothing. This isolates pack-effect and concept-image-effect cleanly while making each
build's score meaningful. The gatehouse program is the referee's verbatim (preserves T-182 comparability on the
gatehouse rows); cottage/barn programs are new fixed synthetic stand-ins (masses + reading prose), labelled as
stand-ins exactly like the referee's. Rejected (a): comparability to a single-subject crater is not worth
mis-scoring two of three subjects — the population result must be per-state-valid.

## Decision 3 — the pair set (what the human labels)

**Options.** (a) Full all-pairs matrix (C(12,2)=66 — too long, dilutes the contested signal); (b) **a curated
~8-pair set**, each pair = two states, bucketed `easy` vs `hard-middle`, drawn so the hard middle is genuinely
rank-either-way; (c) within-state matched-vs-wrong (the defect-corpus shape — doesn't use the new corpus).

**Chosen: (b).** The ticket says "small enough for a focused session, not the full all-pairs matrix" and "report
the hard middle separately." Curated pairs:

- **easy (3)** — match vs an obviously-worse cell (validates where it didn't need to; reported separately so it
  can't inflate the headline): `gh-match ▸ gh-samepack-classical`, `ct-match ▸ ct-samepack-gatehouse`,
  `bn-match ▸ bn-cross`. Intended winner: the match.
- **hard-middle (5)** — every pair touches a hard-middle state, genuinely contestable:
  `gh-match ▸ gh-mid-material` (faithful vs warm-spruce-roof — clearly worse, or rank-either-way?),
  `gh-mid-material ▸ gh-mid-gate` (wrong roof material vs unframed gate — which defect is worse?),
  `gh-mid-gate ▸ gh-samepack-classical` (partial gatehouse vs wrong-picture — does a real-but-incomplete
  gatehouse beat a fully-wrong concept?), `ct-match ▸ ct-mid-plain` (half-timber vs plain upper storey),
  `ct-mid-plain ▸ ct-samepack-gatehouse` (plain cottage vs wrong-subject).

Each pair carries an `intended` winner (the corpus single-rater's call) for reference only; the human/proxy
labels independently. The pair set is **data** (`corpus/labels/pairs.json`) so S-185 can replay it.

## Decision 4 — label collection (the human gate)

**Options.** (a) Block on a human (impossible in an autonomous loop); (b) **prepare the human instrument fully
AND run the LLM-proxy fallback, flagged non-licensing**; (c) proxy only, no human prep.

**Chosen: (b).** The loop "prepares everything up to" the human gate. Concretely: write per-pair
beside-beside composite PNGs (state-A-beside-its-concept ‖ gutter ‖ state-B-beside-its-concept) + a fillable
`labels-template.json` (each pair, empty `humanLabel`, instructions) the reviewer drops into `labels.human.json`.
The harness reads `labels.human.json` if present (human gate satisfied); else it falls back to the proxy and
stamps `labelSource: "llm-proxy"` + `licensing: false` everywhere. This satisfies the AC honestly (fallback run
+ explicitly flagged) and leaves the human gate one file away. Rejected (c): skipping the human prep would make
the human gate harder later for no saving.

## Decision 5 — the LLM-proxy labeler (independence)

The proxy must NOT be the term, or agreement is circular. **Chosen:** a raw holistic pairwise judge —
`runTieredOp({tier:"strong", prompt, images})` with the two beside-concept composites and a terse prompt:
"Which build more faithfully realizes ITS OWN concept image (left or right)? Answer JSON {pick:'A'|'B'|'tie',
reason}." No DiagnoseBuild, no pack, no score — a glance judge, the project's "the stranger is the judge"
register (`milestone-ladder`). N=`VOTES` votes → majority = proxy label; the per-vote spread is the proxy
self-consistency (the labelability signal). No re-ask on malformed (burns budget) — a malformed vote is dropped
and logged.

## Decision 6 — the metrics (the three the AC names)

1. **Term-vs-human pairwise agreement.** Term picks the higher `styleFidelityScore` state in each pair; agree
   iff it matches the human (proxy-fallback) pick. Reported **overall, easy-bucket, and hard-middle-bucket
   SEPARATELY**. Ties: a term tie (equal scores) vs a decisive human pick = disagree; mutual tie = agree.
   Secondary: Kendall-τ-style concordance over the pair judgments (rank correlation the AC mentions).
2. **Inter-label agreement.** Human-vs-proxy when both present; in fallback-only mode, the proxy panel's
   per-pair majority fraction (self-consistency) stands in — reported on the hard middle separately and
   **flagged as not human inter-rater** (one rater can't yield true inter-rater; low self-consistency on the
   hard middle ⇒ the pairs may be ill-posed → reported, not buried).
3. **Pack-vs-concept-image decomposition.** Score all non-middle states once (VOTES-averaged); bucket by
   (pack ∈ {matched, foreign}, picture ∈ {right, wrong}); `conceptImageEffect = mean(matched,right) −
   mean(matched,wrong)`; `packEffect = mean(matched,right) − mean(foreign,right)`. Per-subject where cells
   exist, plus pooled. The T-182 C-control generalized to a population.

## Falsifiable claim & the verdict map (anti-hedge — lead with failure)

The recalibrated term **agrees with the labels on the hard middle AND its signal is carried by the
concept-image, not the pack**, across the population. The harness is built to FIND the failure:
- **packEffect ≫ conceptImageEffect** (T-182 confound generalizes) → **DO-NOT-PROMOTE**, localize the
  concept-image-conditioning fix — the publishable negative.
- **inter-label / proxy self-consistency low on the hard middle** → no ground truth → ill-posed gate, reported;
  agreement numbers are then suspect by construction.
- **term agrees on easy but NOT hard-middle** → validated where it didn't need to → not licensed.
- **conceptImageEffect substantial AND hard-middle agreement clears the bar** → GO-LEANING; but a proxy-only
  run can only REFUTE — it cannot license; the human labels remain the gate for S-185's actual PROMOTE.

The output is evidence + a recommendation with the breadth named. It does **not** touch `measurements/`.
