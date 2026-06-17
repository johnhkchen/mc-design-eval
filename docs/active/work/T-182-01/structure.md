# T-182-01 — Structure

This is a **measurement** ticket: the blueprint is a run + a report, not a code change. No production source
file is created, modified, or deleted. The "shape" is the set of artifacts the run produces and the report
that interprets them.

## Files — created

| path | kind | by whom | purpose |
|---|---|---|---|
| `experiments/eval-alignment/results/corpus-referee-recalibrated.json` | result (committed) | the harness (`REFEREE_RESULTS`) | the re-run's full crater JSON — conditions, per-vote scores, spreads, `kindReliability`. **AC1 deliverable.** |
| `docs/active/work/T-182-01/crater-matched.png` | render | harness `composeTwo` | matched rustic concept ‖ build. **AC2 renders.** |
| `docs/active/work/T-182-01/crater-wrongstyle.png` | render | harness | B-arc classical concept ‖ build. |
| `docs/active/work/T-182-01/crater-wrongstyle-2.png` | render | harness | B2-chapelle gothic concept ‖ build. |
| `docs/active/work/T-182-01/run-votes6.log` | log | shell redirect | full stdout of the metered run (per-vote scores, verdict line) — provenance. |
| `docs/active/work/T-182-01/FINDINGS.md` | report | me | the interpreted result + recommendation. **AC2/3/4 deliverable.** |
| `docs/active/work/T-182-01/{research,design,structure,plan,progress,review}.md` | RDSPI artifacts | me | the six-phase trail. |

## Files — modified

**None in production.** Explicitly NOT touched:
- `experiments/eval-alignment/corpus-referee.mjs` — run via env knobs only (design Option A).
- `experiments/eval-alignment/results/corpus-referee-faithful-covered.json` — the T-178-01 no-separation
  baseline; preserved on disk for the AC2 comparison. The new run writes a *different* filename.
- `experiments/eval-alignment/results/corpus-referee.json` — the E-40 Section-B/C baseline; not the sink.
- `src/workshop/bakeoff-score.mjs`, `baml_src/department.baml`, `baml_client/` — the term under test; frozen
  as landed by T-181-01. Editing them would invalidate the "differ in exactly one variable" comparison.
- Anything under `measurements/` — the frozen instrument. Hard constraint.

## The run command (the executable blueprint)

```
CRATER_ONLY=1 \
CRATER_BUILD=builds/gatehouse/faithful-covered \
VOTES=6 \
REFEREE_RESULTS=experiments/eval-alignment/results/corpus-referee-recalibrated.json \
REFEREE_OUT_DIR=docs/active/work/T-182-01 \
npm run corpus-referee
```

Pre-flight (no spend): the same command with `GUARD_ONLY=1` — already verified clean (7 assets present).

## Data shapes the report consumes

From `corpus-referee-recalibrated.json` → `.crater`:
- `.scores` = `{A, B, B2, C}` (per-condition `scoreMean`).
- `.conditions[k].scoreStd`, `.conditions[k].votes[v].{score,nWrongStyle,wrongStyleCapped,items}` — the per-
  vote arrays + per-item `{department,severity,present,missing,kind,styleClass}` audit trail. Note: under the
  S fix, `votes[v]` also reflects the graded cap; `critiqueEvidence` adds `wrongStyleBreadth`/`gradedCap` but
  the harness's `votes` push records `nWrongStyle`/`wrongStyleCapped` — breadth is recoverable from `items`.
- `.spreads` = `{"A-B","A-B2","A-C","C-B (pack effect)"}`.
- `.kindReliability.replaceContrast` + `.kindReliability.verdict` — the R-fix discriminator metric.
- `.cratered`, `.collapsed`, `.verdict` — the harness's own call (A−B vs 24; A,B ≤12).

## Report structure (`FINDINGS.md`)

1. **Headline** — separated two-sided / one-sided lift / under-penalty, in one sentence, lead with how it
   could have failed (anti-hedge).
2. **Spread table** — A/B/B2/C ± std, A−B vs ±12, alongside T-178-01 (13/0) and T-173-01 (28/0) rows.
3. **Per-vote arrays** — the variance story (is the separation robust or a draw?).
4. **Per-item audit** — does matched now drop WALL/OPENING `replace` against its own concept while the wrong
   twin keeps them? `replaceContrast` sign. This is the mechanism, not the scalar.
5. **Renders** — the three beside-concept PNGs, what they show.
6. **Localization + recommendation** — PROMOTE / RE-LOCALIZE / TIGHTEN, with the breadth caveat. If PROMOTE:
   the exact guarded freeze step (file + pin), **unexecuted**.
7. **Anti-hedge note** — was this the embarrassing branch? Reported in full either way.

## Ordering

1. Pre-flight guard (done). 2. Metered run (background) → JSON + PNGs + log. 3. Read JSON. 4. Write FINDINGS.
5. `npm test` (green, instrument untouched). 6. Commit results + work dir. 7. review.md. No step depends on a
production edit, so commits are: one commit for the result+report+artifacts (the run is the unit of work).
