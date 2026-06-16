# T-168-01 Review — style-distance severity in the scoring core

Handoff doc. What changed, test coverage, open concerns. Commits `ffd692c` (term) + `9ee21aa` (docs).

## What changed

Additive only, two source files + three docs. No deletions, no renames, no schema/corpus/harness edits.

| File | Change |
|------|--------|
| `src/workshop/bakeoff-score.mjs` | +`WRONG_STYLE` constant; +`itemStyleClass` (pure classifier); `styleFidelityScore` rewritten as a per-item loop with the capping-major term; `critiqueEvidence` +2 additive fields |
| `src/workshop/bakeoff-score.test.mjs` | BO7 extended; +BO8/BO9/BO10/BO11 |
| `docs/active/work/T-168-01/schema-feedback.md` | the scoped E-39 typed-grammar-tag gap (AC bullet 3) |
| `…/research.md, design.md, structure.md, plan.md, progress.md` | RDSPI artifacts |

### The mechanism, in one paragraph
`styleFidelityScore` was `100 − Σ severity-penalty` — blind to the `present` field, so a complete
wrong-style build and an incomplete-but-right one tied (the E-39 "DID NOT CRATER" result). Now each item is
classed by `itemStyleClass`: present-but-wrong-style (`present` non-empty **and** `missing` non-empty) is a
**capping major** — it subtracts `PENALTY.major + WRONG_STYLE.distance` (12) and caps the whole score at
`WRONG_STYLE.cap` (40); absent/match items keep the unchanged severity path. So completeness can no longer
rescue a wrong-style build, and a build that is merely unfinished-but-right is untouched by the new term.

## Test coverage

`npm test`: **2239 pass, 0 fail** (was 2226 pre-ticket). The term is pure arithmetic; the test surface is
exhaustive of its branches.

- **Back-compat (regression guard):** BO4/BO5 unchanged-green — their items have no `present` field ⇒ all
  class `"absent"` ⇒ the exact pre-E-40 math. This is the load-bearing invariant for the additive change.
- **BO8** — `itemStyleClass` truth table: all three structural classes, whitespace-empty, defensive
  defaults (no fields ⇒ `absent`), and the typed-`kind` short-circuit winning over structure.
- **BO9 (the AC headline)** — matched vs wrong-style with an *identical severity profile*: the old scalar
  scores both 40 (asserted inline ⇒ "was tied" is proven, not claimed); the new scalar scores matched 40,
  wrong-style 4 (capped) — a 36-point separation past the E-38 noise band of 12.
- **BO10** — incomplete-but-right-style (`absent`, `present:""`) scores 72 (pure severity), **not** capped.
  Pins AC test (b): the new term does not over-penalize it.
- **BO11** — pins the known F1 over-penalty + its typed-tag correction.

### Coverage gaps (flagged, by design)
- **No live/integration test here.** Feeding *real* Layer A critiques through the T-167 corpus is
  **T-169-01** (metered, model-spend). T-168 is the synthetic scoring core only (ticket Note). The risk
  this defers: whether the live Layer A actually emits a distinguishing `present` for matched vs wrong-style
  (failure mode F3). The scalar is *proven correct given* a distinguishing read; the read itself is T-169's
  gate.
- **The distance term is breadth-graded, not depth-graded.** `Σ distance` over wrong-style departments
  grades by *how many* are wrong, not *how far* each is from the target style. Depth needs content the
  scalar cannot see (the typed tag); T-169-01 validates whether breadth suffices (failure mode F2).

## Open concerns for the human reviewer

1. **The F1 over-penalty is real and pinned (BO11), not fixed.** A present-but-detail-incomplete item
   (`present:"plain plaster", missing:"timber studs"` — the corpus's `cottage-plain-upper` shape, against
   its *matched* concept) is structurally identical to a wrong-material replace, so it is currently classed
   `"wrong-style"` and caps the score. Separating them needs reading content (brittle, AC-forbidden) or the
   typed `kind` tag. **Decision deferred to T-169-01**: if the live matched-cottage run is mis-capped, land
   the `schema-feedback.md` tag *before* T-169's corpus run; if the structural rule separates the corpus
   cleanly, the tag is a precision upgrade. This doc is the flag, the scoring core is already wired to read
   the tag (BO11 asserts the corrected `"absent"`), so closing it is a one-line baml edit in the owning
   E-39 ticket (will re-pin the `DiagnoseBuild` prompt golden — do it there, not here).
2. **Constants are tunable, single-sourced.** `WRONG_STYLE = {cap:40, distance:12}`. The cap must sit below
   a typical matched score and the distance must drive multi-department wrong-style toward 0; both hold for
   the corpus shapes, but T-169's live scores may warrant a tune. One object, one place — no second source.
3. **`critiqueEvidence` shape is a live contract** with `clean-wrong-style.mjs:138`. I added fields, removed
   none; the harness reads `score/nMajor/departments/missing` (all unchanged). T-169 can additionally read
   `nWrongStyle/wrongStyleCapped` to report the crater cause.

## AC checklist

- [x] Pure classifier in `bakeoff-score.mjs`; capping MAJOR + distance folded into `styleFidelityScore`;
      one source for the constants (`WRONG_STYLE`, the `PENALTY` pattern).
- [x] Unit tests: matched-vs-wrong-style pair that now separates (BO9, was tied at 40 → 40 vs 4) +
      incomplete-but-right-style not over-penalized (BO10, 72, uncapped).
- [x] Typed-grammar-tag need documented as scoped E-39 schema feedback (`schema-feedback.md`); no brittle
      keyword matching (BO11 refuses the string hack, pins the limit + the tag remedy).
- [x] `npm test` green (2239); pure — no GL/IO/model/Date/random; frozen instrument untouched (the module
      is creation-loop measurement by its own contract).

## Recommendation
Mergeable as the scoring core. The one substantive open item (the F1 typed-tag) is correctly a T-169-01
decision with the remedy pre-staged and the scoring side already forward-compatible — not a blocker on this
ticket.
