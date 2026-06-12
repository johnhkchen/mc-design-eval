# T-137-01 visibility-aware-census — Design

## The semantic decision (drives everything)

Per view, a band's census denominator is already "cells visible from that view" (the diagonal
projection census). The only defective case is `total === 0`. Three distinct conditions currently
collapse into one FAIL:

| condition | evidence | correct treatment |
|---|---|---|
| view cannot see the band, other views can | total=0 here, total>0 elsewhere | `not-visible-from-view`: exclude from THIS view's precondition; band still gated wherever visible |
| no gate view can see the band, but it EXISTS on the skin | total=0 at every view, exposure census > 0 | **named failure** `not-visible-from-any-view` — material exists that the contract lens cannot verify; passing it silently is the free pass the AC's synthetic test forbids |
| the band has no cells in the census identity at all | total=0 at every view AND exposure census = 0 | `not-on-skin`: excluded everywhere, named in the record — there is nothing to census; the form defect is T-135's measured ratio and the judge's glance (E-31: the gate must not refuse the judge over a band the camera cannot see) |

The cottage witness is the third row (band1: 0 cells anywhere under `planCensusZoneOf` — the roof
program owns its y-range), so the precondition stops refusing and T-138's judge call is unblocked.
The synthetic test constructs the second row. The first row is the general eaves/jetty case the
story names. A visible band keeps today's gating unchanged — including cottage-baseline's band1
(t290, f0): visible and failing must STILL fail.

Why exposure as the existence basis: `skin:"exposure"` is the codebase's standing definition of
"what a camera at ANY angle can see" (T-090) — zero new instruments, and it cleanly separates
"hidden mass" from "absent mass" in the same census identity (`zoneOf`) the gate already uses.

## Approaches considered

**A. Add an `emptyZones:"fail"|"not-visible"` option to `coverageGate`.** Follows the T-101
`metric` precedent, but the cross-view rule (hidden-vs-absent) cannot be decided inside a per-view
call — it needs all four totals plus the exposure tally. The option would do half the job and push
the dangerous half (when is exclusion legal?) to each caller. Rejected.

**B. New pure multi-view function composing `coverageGate` unchanged.** One function sees all four
per-view censuses + the exposure census + the policy, classifies every band (visible /
not-visible-from-view / not-visible-from-any-view / not-on-skin), then calls the EXISTING
`coverageGate` per view with a per-view gated-zone set: visible-here bands ∪ hidden-but-existing
bands (which fail on total=0 exactly as today, preserving today's failure with a sharper name);
excluded rows are re-attached to `byZone` annotated, never gated. Legacy arithmetic = the same
`coverageGate` call with the full zone set. `coverageGate` itself is byte-untouched, so the three
durable-skin `buildSkin` call sites and every other consumer carry zero risk. **Chosen.**

**C. Fix it in the census/zone derivation** (drop census-empty bands from the gated policy at
derivation time). Rejected: changes the measurement identity instead of naming the condition; the
record would silently lose the band (the opposite of the discipline — both arithmetics, named
exclusions); and it cannot express the hidden-but-existing failure at all.

**D. Surface the cross-view failure as a new overall-verdict component** (like kitPresence via a
new compose). Rejected: a hidden-but-existing band already fails every view today; keeping that
shape (per-view coverage failure, now named) means `aggregateMultiAngle`,
`composeKitAwareVerdict`, the offline checker, and `gateInstrumentDiff` all stand byte-identical —
the strongest possible "thresholds/azimuths/judge unmoved".

## The chosen API

`src/view/face-resemblance.mjs` (the gate-seam home, beside `coverageGate`):

```js
visibilityAwareCoverage({
  views,        // [{angle, coverage}] — ownCoverage/dominantCoverage records, one per gate view
  zones,        // the gated policy (zonesShipped)
  exposure,     // surfaceZoneHistogram(occ, zoneOf, {skin:"exposure"}) — the existence basis
  threshold,    // unchanged default DEFAULT_COVERAGE_THRESHOLD
  metric,       // "dominant"|"own", forwarded verbatim
})
→ {
  schema: "visibility-coverage/v1",
  views: [{angle,
    aware:  {passed, threshold, failures, byZone},   // byZone incl. excluded rows annotated
                                                     // {notVisible:true, status, excluded:true}
    legacy: {passed, threshold, failures, byZone}}], // coverageGate with the FULL zone set
  visibility: {byBand: {band: {status, visibleViews, exposedCells}},
               failures: [{band, reason:"not-visible-from-any-view"}],
               passed},
}
```

Both arithmetics come out of one call, so every new record reports them by construction. The
runner records `view.coverage = {passed: aware.passed, threshold, byZone: aware.byZone,
legacy: {passed, failures}}` plus record-level `visibility` — all additive fields, so
`gateInstrumentDiff` on any re-emitted record shows nothing but the new census fields (it compares
named keys only; `coverage` changes only on records not yet emitted with the new code).

Monotonicity is structural: per view, the aware gated-zone set ⊆ the legacy set, and gating of any
zone in both sets is identical ⇒ legacy pass ⇒ aware pass. Proven three ways (unit property test,
committed-record replay, the synthetic fixtures).

## The witness (AC2)

New impure-but-deterministic runner `benchmarks/sculpture/visibility-witness.mjs`
(proportion-witness pattern): for a committed `multi-angle/<key>-<label>.json` record, replay the
RECORDED per-view byZone rows (total + recorded fraction — no census re-derivation needed for
gating) through `visibilityAwareCoverage`, with the exposure census re-derived from the record's
pinned artifact + the gate's own zone derivation (re-derivation totals cross-checked against the
committed totals; mismatch = named `census-drift`, recorded, not silently accepted). Writes
`benchmarks/sculpture/visibility/<key>-<label>.{json,md}` — new paths, pin-guarded; committed gate
records untouched. `--repro` re-derives and byte-compares (the reproducibility flag precedent). NO
judge seam anywhere in the file. Registry-driven (`GATE_SUBJECTS`), self-grep for subject keys.

To reuse the gate's derivation without reforking it (vocabulary-authority lesson: one composition
point), the gate runner's `deriveZones`, `policyInShippedPalette`, and `GATE_SUBJECTS` become
exports of `benchmarks/sculpture/multi-angle-gate.mjs` (runner-imports-runner precedent: it already
imports `SUBJECTS` from durable-skin.mjs). Their bodies do not change.

## Live-gate wiring (lands here, executes in T-138)

`benchmarks/sculpture/multi-angle-gate.mjs` computes the four per-view censuses + the exposure
census up front (pure, GL-free — only the renders need GL), calls `visibilityAwareCoverage` once,
and consults `result.views[angle].aware` for the per-view short-circuit. The T-088 contract is
otherwise untouched: a failed view still means "judge never called". No live gate run happens in
this ticket (T-138 owns the epic's judge runs); `--offline` re-assertion of committed records is
the only gate-runner execution here, and it validates pre-existing records unchanged.

## Rejected refinements

- **Raw-band visibility basis** (band1 visible as 87/48 cells pre-routing): conflates region with
  zone — the census identity is `planCensusZoneOf` (program cells ARE roof, T-106/T-121); mixing
  identities is exactly the bug class this epic closes.
- **Failing the cottage on `not-on-skin`**: contradicts T-138 ("cottage reaches the judge via
  T-137") and S-137's stated result; the condition is named in the record and the proportion check
  (T-135) already fails the chain numerically — the instrument must not double-refuse on a band
  the camera cannot see.
- **Widening `gateInstrumentDiff` / offline checks** to validate the new fields: additive fields
  are already invisible to the diff; the offline checker gains only a tolerant (presence-optional)
  check so pre-T-137 records stay valid.
