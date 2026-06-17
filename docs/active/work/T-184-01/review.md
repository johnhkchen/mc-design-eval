# T-184-01 — Review

**Deliverable:** the E-46/S-184 labeling instrument + agreement/decomposition harness that turns the S-183
decoupling corpus into a GO/NO-GO verdict. **Verdict: DO-NOT-PROMOTE** — the recalibrated style-distance term
tracks the PACK, not the concept IMAGE, at population scale (the T-182-01 confound generalizes across 3
subjects), and it disagrees with self-consistent labels on the hard middle (1/5). This is the arc's
publishable negative, with the residual named for S-185: **concept-image-conditioning**. `npm test` 2302 green;
**nothing under `measurements/`** (the freeze is S-185, behind sign-off). Commits: pure core, pair set,
instrument, harness, run+FINDINGS (5 atomic commits on `main`).

## What changed (files)

**Created — pure core (in `npm test`):**
- `src/workshop/style-agreement.mjs` — the agreement + decomposition arithmetic. PURE (no GL/IO/model/Date/
  random); takes scores IN, so **no** dependency on `bakeoff-score.mjs` — kept OUT of the scorer so S-185's
  freeze surface stays minimal (the gate math is never promoted). Exports `DESIGN_CELL`,
  `packVsConceptDecomposition`, `termPairVerdict`, `pairwiseAgreement`, `interLabelAgreement`,
  `rankConcordance`, `recommendation`, `STYLE_AGREEMENT_SCHEMA`, `NOISE`, `LABELABLE_FLOOR`.
- `src/workshop/style-agreement.test.mjs` — SA1–SA6 + const (7 tests): cell mapping, PACK/PICTURE-DRIVEN
  decomposition + empty-cell handling, bucketed agreement + tie semantics, labelable/ill-posed inter-label,
  concordance, the full recommendation verdict map incl. the licensing gate.

**Created — data:**
- `experiments/eval-alignment/corpus/labels/pairs.json` — 8 curated pairs (3 easy + 5 hardMiddle), each two
  corpus state ids + bucket + intended single-rater reference + rationale.

**Created — metered/IO shells (NOT in `npm test`):**
- `experiments/eval-alignment/style-label.mjs` — GL-free, model-free instrument builder (the human-gate prep):
  composes 8 A‖B beside-concept composites + a fillable `labels-template.json`. Asset-guard-first, GUARD_ONLY.
- `experiments/eval-alignment/style-agreement-run.mjs` — the metered harness: per-state scoring (VOTES-averaged
  `diagnose` → `styleFidelityScore`), the independent LLM-proxy glance judge, the pure-core join, results JSON
  + console verdict. Asset-guard-before-spend, GUARD_ONLY, VOTES default 6, no re-ask on malformed.

**Created — generated output (committed):**
- `corpus/labels/instrument/{E1..E3,H1..H5}.png` (8 composites), `corpus/labels/labels-template.json`,
  `experiments/eval-alignment/results/style-agreement.json` (the run result).

**Modified:** `package.json` — `style:label` + `style:agreement` scripts (direct `node`, no flag-swallow).
**Deleted:** none. **Untouched:** `bakeoff-score.mjs`, `corpus-referee.mjs`, the scorer, all of `measurements/`.

## Acceptance criteria

- **Pairwise labeling instrument over the hard-middle pairs; labels collected (human gate OR LLM-proxy flagged
  non-licensing)** — ✅ instrument built (8 composites + fillable template = the prepared human gate); labels
  collected via the **LLM-proxy fallback**, explicitly `labelSource:"llm-proxy"`, `licensing:false`, refute-only.
- **Harness reports term-vs-human agreement overall AND on the hard middle separately; inter-label agreement;
  the pack-vs-concept-image decomposition** — ✅ all in `results/style-agreement.json`: agreement
  {overall 3/8, easy 2/3, hardMiddle 1/5}, inter-label {hard-middle self-consistency 0.90 → LABELABLE},
  decomposition {conceptImageEffect +8, packEffect +45 → PACK-DRIVEN, pooled + per-subject}, concordance τ=−0.14.
- **Recorded honestly: picture or pack at scale? hard middle labelable? GO/NO-GO with breadth named** — ✅
  FINDINGS §1–5: PACK at scale; the hard middle IS labelable (not ill-posed); DO-NOT-PROMOTE; breadth (3
  subjects/2 packs/12 states/8 pairs, empty foreignWrong cell, barn lacks a foreign cell) stated.
- **`npm test` green; nothing under `measurements/`** — ✅ 2302 pass; `git status --porcelain measurements/`
  empty.

## Test coverage

- **Unit (in `npm test`):** the entire `style-agreement.mjs` decision surface (SA1–SA6) — the arithmetic
  S-185's gate leans on, deterministic and single-sourced. This is the real automated coverage; it asserts the
  verdict logic (PACK-DRIVEN→DO-NOT-PROMOTE, ILL-POSED→DO-NOT-PROMOTE, easy≫hard→DO-NOT-PROMOTE,
  PICTURE-DRIVEN+licensing→PROMOTE, +licensing=false→recommend-only) on synthetic fixtures.
- **Referential integrity:** the harness asserts every pair id exists in the corpus before any spend.
- **Empirical (the run):** the population scores + labels are the EVIDENCE, reproducible by re-running
  `npm run style:agreement` (idempotent sink). A unit test cannot assert what the live judge emits under the
  concept-conditional prompt — the run is the correct instrument; the verdict is robust across 6 votes.
- **Gap (acceptable):** the metered shells (`style-label.mjs`, `style-agreement-run.mjs`) are not unit-tested —
  they are thin IO/model shells over the tested pure core (the project idiom: pure core tested, shell thin). A
  GUARD_ONLY dry run validated their asset-guard + imports without spend.

## Open concerns / what a human reviewer should weigh

1. **Labels are LLM-proxy, not human (the one honest limit).** A proxy can REFUTE, not LICENSE — fine for a
   DO-NOT-PROMOTE. The verdict does not actually *depend* on the labels: the **decomposition alone refutes**
   (gh-wrongpack=16, ct-wrongpack=0 — builds matching their own picture, floored by a foreign pack). If a human
   wants to confirm, the instrument is one file away (`labels.human.json`); the harness reads it as the gate
   and flips `licensing:true`.
2. **The negative is decisive, not marginal** — unlike T-182's PROMOTE-LEANING middle. packEffect (45) is ~5.6×
   conceptImageEffect (8); the term is *anti-correlated* with the glance (τ=−0.14); it failed even an "easy"
   pair on the picture axis (E1). There is no split-decision ambiguity to resolve.
3. **The recalibrated term is NOT wrong to keep in the creation loop** — its E-45 mechanism win holds
   (0 wrong-style `replace` on every matched build here). What this ticket isolates is narrower and exact: its
   *signal* is pack-material agreement, not picture match. S-185 must localize the concept-image-conditioning
   fix (condition the score on rendered-build-vs-image divergence, not pack agreement) and re-run this gate.
4. **barn has no foreign-pack cell** so its picture effect (+32) can't be weighed against a pack effect — but
   the two subjects that CAN test it (gatehouse, cottage) both come out pack-driven, and pooled it's
   unambiguous. A future corpus could add foreign-pack cells per subject to sharpen magnitude (not direction).

## Critical issues needing human attention

**None blocking.** The RDSPI cycle is clean: the harness was built to FIND the failure and it did; the result is
recorded at full strength (neither softened into a promotion nor performed as brutality — the calibrated middle:
a real mechanism win in E-45, a real signal failure here); `measurements/` is untouched; the gate is reusable.
The one judgment a human may want: whether to run a human labeling pass before S-185 acts — my read is no, the
decomposition is dispositive on its own, but the instrument is ready if desired.

## Handoff to S-185

The terminal decision of the E-38→E-46 arc takes its **DO-NOT-PROMOTE branch**: do not freeze; write the
concept-image-conditioning localization + a follow-on stub. The evidence is `results/style-agreement.json` +
FINDINGS §5. The reusable bar for the fix: re-run `npm run style:agreement` and require packEffect and
conceptImageEffect to swap places (PICTURE-DRIVEN) with hard-middle agreement clearing the bar — under human
labels for the actual license.
