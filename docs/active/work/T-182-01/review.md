# T-182-01 — Review

The E-45 payoff. Re-ran the T-178-01 crater on the re-calibrated style-distance term (T-181-01's S+R fixes) at
VOTES=6, `CRATER_ONLY=1`, `CRATER_BUILD=builds/gatehouse/faithful-covered`. **Result: the recalibration worked
at the mechanism level — matched lifts 13→41, `replaceContrast` flips −0.20→+0.245 — but the scalar separation
is marginal and pack-confounded → PROMOTE-LEANING, gate on the labeled corpus, do NOT freeze.** Commit
`d9aff20`. `npm test` 2289/2289 green. `measurements/` untouched. Recommend, do not freeze.

## What changed (files)

**No production code, no instrument edits.** This is a measurement ticket — the deliverable is a run + a report.

- **Created (committed):**
  - `experiments/eval-alignment/results/corpus-referee-recalibrated.json` — the full crater result (4
    conditions × 6 votes, per-item audit, spreads, `kindReliability`). **AC1.**
  - `docs/active/work/T-182-01/crater-{matched,wrongstyle,wrongstyle-2}.png` — beside-concept composites. **AC2.**
  - `docs/active/work/T-182-01/{research,design,structure,plan,progress,review}.md` + `FINDINGS.md` — RDSPI trail
    + the interpreted report. **AC2/3/4.**
- **NOT modified (verified clean via `git status --short`):** `corpus-referee.mjs` (run via env knobs only),
  `corpus-referee-faithful-covered.json` (T-178-01 baseline — byte-unchanged, preserved for the comparison),
  `src/workshop/bakeoff-score.mjs`, `baml_src/department.baml`, `baml_client/`, anything under `measurements/`.
- **Gitignored (not committed):** `run-votes6.log` — `*.log` is gitignored. **Not a gap:** every per-vote score
  is in the committed JSON (`crater.conditions[].votes[].score`) and quoted verbatim in FINDINGS.

## The result (one screen)

| | A-matched | B-arc | B2-chapelle | C-control |
|---|---|---|---|---|
| score (mean±std) | **41±7** | 19±9 | 20±0 | 48±10 |
| per-vote | [44,44,24,44,44,44] | [28,20,20,28,4,12] | [20×6] | [52,44,32,64,44,52] |
| `replace` tags (of nItems) | **0 / 25** | 6 / 25 | 6 / 24 | 0 / 21 |

`A−B = 22` (outside ±12 noise, below the strict 2·NOISE=24 crater bar). `replaceContrast = +0.245` →
DISCRIMINATES (was −0.20 → NO CONTRAST in T-178-01). `spreads`: pack effect C−B=+29, concept-image effect
A−C=−7.

## Test coverage

- **Full suite:** 2289/2289 green — no production change, so nothing should move, and nothing did.
- **No new unit tests by design.** The S-fix mechanism (`styleFidelityScore`/`itemStyleClass`/graded cap) was
  unit-covered in T-181-01 (BO14a–f). This ticket's "test" is the **empirical** two-sided crater — its result
  is the committed JSON, reproducible by re-running the one command in `plan.md` Step 2 (idempotent, overwrites
  its own sink). That is the correct coverage instrument for a live-judge behavior question; a unit test cannot
  assert what the model emits under a new prompt.
- **Verification performed:** GUARD_ONLY pre-flight (7 assets); R fix confirmed compiled into
  `baml_client/inlinedbaml.ts`; result JSON has 4 conditions × 6 votes; T-178-01 baseline byte-unchanged;
  per-item audit cross-checked against `kindReliability` aggregates.

## Open concerns / what a human reviewer should weigh

1. **Marginal magnitude (the honest shortfall).** A−B=22 clears the noise but misses the 2·NOISE=24 bar by 2
   points. Robust in direction (A still > B at the mean±std edges: 34 vs 28), thin in absolute margin. A
   promotion bet should not ride 2 points on one subject — hence "gate on the corpus," not "promote."
2. **Pack confound (the structural caveat).** The separation tracks the **pack**, not the concept **image**:
   swapping the pack moves the score 29 points (C−B), swapping the concept image moves it −7 (A−C). The term
   discriminates style-spec agreement strongly and concept-picture match weakly. Benign in production (pack is
   recognized *from* the concept, so they co-vary) but it means this fixture cannot prove the term reads the
   *picture*. The labeled corpus must carry the concept-image signal to license promotion.
3. **The deciding gate is the labeled multi-state corpus** — E-40's standing debt (restated in T-181-01 review
   #4 and the T-180-01 AUDIT). The **next ticket** is that corpus run (term-vs-human-labels across a
   population), **not** another gatehouse re-run. This is the single most important handoff.
4. **Freeze is NOT executed** (correctly). The style-distance term is not yet in the frozen instrument (grep
   over `measurements/` is empty → promotion is an ADD). FINDINGS spells out the exact guarded freeze step
   (which files, which pin, PinGuard allowlist) for the future promotion ticket — unexecuted, as the AC requires.

## Critical issues needing human attention

**None blocking.** The RDSPI cycle is clean: the metered run executed, the result is recorded honestly (neither
the "cratered!" overclaim nor the T-178-01 "collapse" — the calibrated middle), the recommendation is
actionable (gate on the corpus), and the instrument is untouched. The one judgment call a human may want to
revisit: whether A−B=22 + the positive replaceContrast is "enough" to *attempt* the corpus validation now
(my read: yes — the mechanism is demonstrably fixed; the corpus is the right next gate), or whether the pack
confound should be addressed in the harness first (decouple pack from concept in the term's input). I lean
toward the corpus run; either is defensible.

## Handoff (S-182 / E-45 close)

E-45's arc — locate (S-180: BOTH loci) → recalibrate (S-181: graded cap + concept-conditional) → two-sided
crater (S-182, this) — lands with the **measure fixed and discriminating**. The term is no longer the collapse
T-178-01 exposed. What remains before promotion is the population test, not more single-subject craters. The
recalibrated term should stand in the creation loop as-is; `measurements/` stays frozen until the labeled corpus
confirms the concept-image signal.
