# T-182-01 — Design

**Decision: run the existing `corpus-referee.mjs` crater section unchanged, via env knobs, at VOTES=6, on
`faithful-covered`, with output routed to a NEW results file so the T-178-01 baseline survives.** No code
change. The harness already has every seam the ticket names; the work is to *run it on the re-calibrated term*,
read the two-sided result, and write the report + recommendation. This is a measurement ticket, not a build
ticket.

## What must be decided

1. How to invoke the re-run (knobs vs edits).
2. Where to write the result (clobber-safe).
3. How to read the two-sided result and choose the recommendation.
4. What to do about renders.

## Option space

### Invocation

- **(A) Env knobs only — CHOSEN.** `CRATER_ONLY=1 CRATER_BUILD=builds/gatehouse/faithful-covered VOTES=6
  REFEREE_RESULTS=…corpus-referee-recalibrated.json npm run corpus-referee`. The harness was *built* for this
  (T-178-01 added `VOTES`; T-173-01 added `CRATER_ONLY`/`CRATER_BUILD`). Zero code change → the re-run is a
  same-term, same-build, same-conditions comparison against T-178-01, differing in exactly one variable: the
  re-calibrated scoring + prompt that landed between them. That single-variable cleanliness is the whole point.
- (B) Fork a T-182 crater script. Rejected — duplicates a working harness, invites drift, and breaks the
  "differ in exactly one variable" comparison.
- (C) Edit corpus-referee to bump defaults. Rejected — mutates a file whose committed defaults keep the
  E-40/T-170-02/T-173-01 reproductions byte-identical; the env defaults exist precisely so we never do this.

### Output sink (clobber safety)

- **CHOSEN:** `REFEREE_RESULTS=experiments/eval-alignment/results/corpus-referee-recalibrated.json` and
  `REFEREE_OUT_DIR=docs/active/work/T-182-01`. T-178-01's `corpus-referee-faithful-covered.json` is the
  no-separation baseline; it must remain on disk untouched so AC #2's "compare vs T-178-01 (13/0)" is a file
  diff, not a memory. The beside-PNGs land in the work dir (the harness writes `crater-matched.png` etc.).
- Rejected: default sink (`corpus-referee.json`) — that is the E-40 baseline; clobbering it destroys the
  Section-B/C agreement history.

### Reading the two-sided result

The harness emits the numbers; the *judgement* is mine. The ticket's falsifiable claim defines the decision
table precisely. I will classify into exactly one:

| outcome | signature | recommendation |
|---|---|---|
| **two-sided separation** | A−B **> 24** (outside 2·NOISE), matched std modest, `replaceContrast > 0`, B (wrong twin) stays ≤~cap-floor | **PROMOTE** (with breadth caveat + spelled-out, unexecuted freeze step) |
| **one-sided lift** | A lifts AND B **also** lifts (wrong twin no longer capped) | **TIGHTEN** the cap — the softening went too far |
| **under-penalty / non-separation** | A still floored (R fix didn't stop spurious matched `replace`) → A−B inside ±12 | **RE-LOCALIZE** — hand back to the judge model; the reading, not the prompt |
| **fixture over-fit** | separation rides on a constant tuned to this one fixture | report sensitivity, name the breadth gap, do **not** promote |

The decisive secondary evidence (not just A−B): the per-item `kind`/`styleClass` audit. Two-sided success
*requires* that matched **no longer earns WALL/OPENING `replace` against its own concept** (R fix worked →
breadth drops, e.g. only the legit dark-oak ROOF) while the wrong-style twin **still does** (breadth stays
high → cap stays low). I will read `kindReliability.replaceContrast` and the per-vote item tags, not only the
scalar — T-178-01 taught that the scalar can hover at 13 while the *mechanism* is fully collapsed.

### Renders

- **CHOSEN:** the harness writes `crater-matched.png`, `crater-wrongstyle.png`, `crater-wrongstyle-2.png` into
  the out dir automatically (beside-concept composites, no GL, no model — `composeTwo` decodes PNGs directly).
  AC requires "renders beside all concepts"; the harness satisfies it as a side effect. I will confirm the
  three PNGs exist and reference them in the report. The build's four azimuths already exist under
  `builds/gatehouse/faithful-covered/view-*.png`.

## Why this is the right altitude

The E-45 thesis is that the *measure* was broken, not the build (T-178-01's localization). The fix lives
entirely in the creation-loop scoring + the judge prompt; the **only** way to know if it worked is to run the
same metered crater that exposed the collapse and read whether the two conditions now *diverge*. There is no
unit-test substitute — `itemStyleClass`/`styleFidelityScore` are proven in isolation (BO14), but whether the
live judge stops emitting spurious `replace` on a faithful build against its own concept is an empirical
question about the model's behavior under the new prompt. That is exactly what S-182 was scoped to answer, and
exactly the question the env-knob re-run isolates.

## Risk register

- **R fix may not bite.** The most likely "embarrassing branch": the concept-conditional sentence doesn't
  change the judge's behavior and matched stays floored. This is a *valid result* — record it as RE-LOCALIZE,
  do not soften. T-181-01 review concern #1 pre-registered this exact hedge.
- **Vote variance.** VOTES=6 with std reported is the robustness guard; T-173-01's 28 was a 2-sample artifact.
  I report `scoreStd` and the full per-vote arrays, and read A−B at `mean` AND `mean−std`.
- **Over-fit to the gatehouse.** Necessary-not-sufficient. The recommendation MUST carry the breadth caveat and
  name the labeled multi-state corpus as the real bar, whatever the sign of the result.
- **Cost/time.** ~24 strong-tier calls; run in background, monitor to completion, then read the JSON.

## Acceptance mapping

AC1 → the run + committed `corpus-referee-recalibrated.json`. AC2 → report table (A−B vs ±12, std, contrast,
per-item audit, vs T-178-01 13/0 and T-173-01 28/0) + the 3 beside PNGs. AC3 → the honest classification.
AC4 → PROMOTE/RE-LOCALIZE/TIGHTEN + breadth caveat + (if PROMOTE) the exact unexecuted freeze step. AC5 →
`npm test` green, `measurements/` untouched.
