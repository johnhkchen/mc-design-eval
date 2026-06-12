# T-137-01 visibility-aware-census — Review

## What changed (5 commits)

| commit | files | change |
|---|---|---|
| `495531b` | `src/view/face-resemblance.mjs`, `.test.mjs` | `visibilityAwareCoverage` pure core (+ schema const); V1–V7 unit tests. `coverageGate` byte-untouched — every existing consumer carries zero risk. |
| `6820192` | `src/view/visibility-monotone.test.mjs` (new) | Monotone replay over ALL committed multi-angle records; the T-127 flip; the cottage-baseline guard; the synthetic ring fixture on real projections. |
| `ac8e203` | `benchmarks/sculpture/multi-angle-gate.mjs` | Gate runner adopts the aware arithmetic for the T-088 short-circuit; legacy recorded beside it; record-level `visibility`; offline checker + md additive bits; exports for the witness. |
| `7e231ee` | `benchmarks/sculpture/visibility-witness.mjs` (new), `visibility/*` (17 records ×2 files), `package.json` | The witness runner + `visibility:cottage|all|repro` scripts + committed witness records. |
| `0f1a4f6` | gate runner + witness | Brush-door tripwire fix: `gateCensuses()` exported from the gate runner; witness consumes it (allowlist NOT widened; one census definition). |

`docs/active/work/T-137-01/{research,design,structure,plan,progress,review}.md` — RDSPI artifacts.

## Acceptance criteria — evidence

- **Visibility-aware per-view census (pure, unit-tested)** ✓ — the denominator was already the
  per-view projection visibility (reused, zero new instruments); the fix names the empty case. A
  band with zero visible cells at a view is recorded `not-visible-from-view` (`excluded: true` in
  `byZone`) and excluded from that view's precondition; it is gated normally at every view that
  sees it (V2, V5, cottage-baseline guard: band1 t290 @ fraction 0 still fails ×4). The synthetic
  ring fixture proves a band invisible from ALL views but present on the exposure skin is a NAMED
  failure (`not-visible-from-any-view`) that keeps failing every view — not a free pass.
- **The witness** ✓ — `npm run visibility:cottage`: the T-127 record re-censused at NEW paths
  (`visibility/cottage-patternbook.{json,md}`); legacy 0/4 → aware 4/4 views passing the
  precondition; band1 `not-visible-from-view` at every view, cross-view `not-on-skin` (0 cells in
  the census identity — the roof program owns its y-range; T-135's measured ridgeToEave defect is
  the form-side name for the same fact). Judge NOT called — no judge seam exists in the runner.
- **Identity-class discipline (E-33 Rule 3)** ✓ — monotone: structural (aware gated set ⊆ legacy
  set, V6), replayed over every committed record (legacy replay must first AGREE with each
  committed verdict — the replay provably reads the records faithfully — then every passing view
  still passes), and witnessed live (all 4/4 records stay 4/4). Both arithmetics in every new
  record (`coverage.legacy` per view in gate records; `views[].aware/legacy` in witness records).
  Committed records byte-untouched (git diff empty; offline re-asserts valid incl. pre-T-137
  n/a paths). Thresholds/azimuths/judge contract unmoved (contract copied verbatim; no config,
  prompt, parser, or aggregate change). Instrument-diff on a simulated re-emission shows ONLY
  `views[*].coverage` — the new census fields.
- **No per-building constants; npm test green** ✓ — runner registry-driven with the E-25 self-grep
  (which caught "cottage" in a comment during development — reworded, not exempted); threshold
  from the record/config. Full suite **2005/2005** green (the 2004/2005 brush-door catch was this
  ticket's witness import, fixed by export-not-allowlist).

## Test coverage

- 7 pure unit tests (V1–V7: semantics, both metrics, error paths, structural monotone).
- 5 proof tests (committed-record replay incl. self-validation, T-127 flip, baseline guard, two
  synthetic geometry cases through real `projectSurface`/exposure machinery).
- Live evidence: 17 witness records, `--repro` byte-identical ×17; offline re-assert across
  subjects/labels/eras (pre-T-100/T-114 records included).
- **Gaps**: the witness runner's CLI/IO paths are exercised by execution, not unit tests (runner
  precedent); the live gate's new record shape has no committed instance yet — T-138's runs emit
  the first one (its offline checks + `gateInstrumentDiff` demo cover the shape in advance).

## Open concerns for the reviewer

1. **`not-on-skin` semantics** (the load-bearing judgment call): a band declared by the concept
   but with ZERO cells in the census identity is excluded from the precondition (named, both
   arithmetics recorded) rather than failed. Grounds: T-138 requires the cottage to reach the
   judge; the proportion check (T-135) already fails the chain numerically for exactly this
   defect; the gate's identity is "is the declared dominant applied on the visible skin", which is
   vacuous when no skin exists. The alternative (fail) re-creates the T-127 refusal. Flagged, not
   silently decided: the witness md prints the status per band.
2. **Census drift on five older records** (barn-challenge ×8, church-challenge ×4, church-styled
   ×4, cottage-challenge ×12, gatehouse-generated ×4 band-views; gatehouse-current artifact-pin
   SKIP): the known pre-T-128 live-vs-pins drift, now named per band-view in the witness records.
   The witness replays RECORDED numbers, so its verdicts are exact regardless; the exposure basis
   on those five is flagged `rederived-with-drift`. Cottage-patternbook (the witness that matters)
   reproduces every committed denominator exactly.
3. **T-138 handoff**: the live gate now emits both arithmetics + `visibility`; the cottage's first
   pattern-book judge call is unblocked at the precondition. T-138 should rotate pins explicitly
   (`--rotate-pins`) when re-running gates, per T-119.
4. Sibling sessions landed T-135/T-136 commits mid-flight; all staging here was file-explicit, no
   shared files touched.
