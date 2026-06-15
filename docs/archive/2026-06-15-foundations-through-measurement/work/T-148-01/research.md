# T-148-01 Research — relief-aware-gate

Descriptive map of the frozen instrument's composite gate, the relief primitives S-146 shipped, the
facade-grammar recognition S-145 shipped, the identity-class discipline the budget work (T-144-01)
established, and the calibration-sweep pattern this ticket reuses. Sources cited `file:line`. No
solutions here.

## 1. What the ticket asks (restated from the AC)

- **A relief/rhythm precondition or lens in the instrument**: measured from the build's OWN surface
  (rhythm period, proud-cell fraction, field/frame contrast) vs the concept's RECOGNISED grammar
  (T-145-01) — **not a colour metric**. A flat mono-fill wall FAILS (or carries a named relief
  residual) when the concept is articulated; an articulated build passes.
- **Calibrated from committed verdicts**: the flat barn that PASSED (T-143-01,
  `barn-patternbook.json`) is the anti-anchor — under the lens it moves to FAIL or a named relief
  residual; an articulated reference passes. Calibration evidence committed (a sweep over committed
  builds); thresholds derived from data; **no per-building constants**.
- **Identity-class proof**: aggregation/precondition only (no judge call, no re-judge); both
  arithmetics reported where a threshold changes; committed records re-derive unchanged or are
  reported beside; the policy tag versioned (prior tag valid forever). Frozen judge contract
  byte-unmoved (`instrument.diffs: []`).
- **Tests** (anti-anchor + articulated pass + monotone re-derivation of committed records); offline
  checker tolerant of the new field; `npm test` green; `--repro`/`--offline` byte-identical.

## 2. The composite gate today (the instrument)

**Pure core:** `src/form/multi-angle-gate.mjs` (T-093-01, S-093). Schema tags: record envelope
`multi-angle-gate/v1` (`:34`); per-view verdict `multi-angle-verdict/v1` (`:33`); the DECIDING
arithmetic versioned SEPARATELY as `multi-angle-budget/v2` (`:37`) — the precedent for "version the
policy tag not the envelope."
- `buildMultiAngleViewPrompt`/`parseMultiAngleVerdict` (`:53,:88`) — the FROZEN per-view judge
  contract (Rule 5, never tuned per run).
- `budgetVerdict(decidedViews, {gapBudget, minorBudget})` (`:155`) — v2 PASS ⇔ no identity failure ∧
  `majorCount===0` ∧ `minorCount ≤ minorBudget`, with the LEGACY ≤2 arithmetic computed BESIDE
  (`legacyPassed`, `:181`). One definition shared by the runner and the calibration sweep.
- `aggregateMultiAngle(views, opts)` (`:205`) — REFUSE (missing/unparsed view) / DECIDE; returns the
  v2 verdict plus `legacy:{passed,gapBudget,gapCount}` beside.
- `gateInstrumentDiff(before, after)` (`:271`) — the re-judge tripwire: frozen fields (schema,
  subject, label, artifact, contract, zones, kitPresence) + per-view byte-equality where a verdict
  was already parsed. Returns `[]` when the instrument is untouched.

**The kit-presence COMPANION precondition** (the pattern this ticket mirrors): `src/form/kit-presence.mjs`
(T-100-01).
- `kitPresence(occ, {...})` (`:73`) — the FIXPOINT rule: a kit entry is present iff RE-RUNNING the
  pure op that supplies it is a NO-OP there (`missing===0`). **No thresholds.** Tolerated geometry is
  inherited from the supplying op, never re-encoded.
- `composeKitAwareVerdict(aggregate, presence)` (`:262`) — ANDs the presence check with the
  multi-angle aggregate; BOTH run, BOTH reported; a resemblance REFUSAL stays a refusal; presence
  may be `{ran:false,...}` (treated as not-run → passthrough). Returns `kit-aware-gate/v1`.

**The composite `overall`** in a committed record = `composeKitAwareVerdict(aggregate, kitPresence)`
(runner `benchmarks/sculpture/multi-angle-gate.mjs:549`). `barn-patternbook.json overall`:
`{schema:"kit-aware-gate/v1", decided:true, passed:true, components:{resemblance:{decided,passed},
kitPresence:{ran,passed,gaps}}}`. The record also carries optional `visibility` (T-137, additive).

## 3. The relief primitives S-146 already shipped (the reusable engine)

`src/view/surface-relief.mjs` (T-146-01, the crux):
- `surfaceRelief(occ, {material, faces, rhythm:{axis,every,span,phase}, depth, zoneOf, zone})`
  (`:64`) — emits proud cells in front of EXISTING skin cells on a column/row rhythm. **Idempotent
  on its own output** (a cell already carrying the relief material is never re-emitted; the proud ray
  stops at the first occupied cell, `:106,:116`). Returns `{placements, report:{strips, proudCells,
  fieldCells, ...}}`.
- `reliefNoRegress(occBefore, placements, {faces, opts})` (`:156`) — proves relief is in-plane
  invisible by construction (own-face `maskProportions` + whole-build `ridgeToEave`/`roofShare`
  byte-identical). **Exported precisely so S-148 reuses the same predicate** (header `:150`).
- `RELIEF_DEFAULTS = {depth:1, span:1, phase:0}` (`:32`) — `every` has NO universal value; the caller
  supplies the period from the recognized grammar (the no-per-building-constant posture).

`src/view/surface-grid.mjs`:
- `projectSurface(occ, dir)` (`:170`) — the build's own-surface read at a face (pure, GL-free).
- `reliefProfile(grid)` (`:242`) — modal wall plane + per-cell `{proud, flush, recessed}` counts and
  `byCell`. **This is "proud-cell fraction" and "field/frame contrast" directly.**

**Feasibility confirmed** (smoke over the committed barn artifact): flat barn `+z` face,
`surfaceRelief(every=4)` emits **300** proud cells (the residual); after applying them, re-run emits
**0** (idempotent). The fixpoint separates flat from articulated with NO threshold — the demand is the
supply, exactly like kit-presence.

## 4. The concept's recognised grammar (S-145, the demand side)

`src/recognition/facade-grammar.mjs` + `schema/building-program.schema.json` (T-145-01). The optional
per-mass `facade` block carries: `eaveOverhang`, `faces[]` each with `wall` (+x/-x/+z/-z),
`rhythm` (`{period,phase}|{count}`), `memberRole`, `fields`, `quoins{role,run}`, `courseLines[{y,role}]`,
`jettyDepth`, `openingsRhythm`, `evidence{source,layoutOnly}`. **Roles only, no block field** (the
diegetic proof). `parseFacadeReply`/`validateProgramAgainstPack` validate it pack-diegetic.
- **Recorded, not realized**: `realizeProgram` ignores `facade` (T-145-01 review §"the one thing");
  every committed build is still flat. No LIVE facade run exists (no model in CI); the only committed
  facade pin is `benchmarks/sculpture/recognition/facade/fixture-house/*`.
- **Consequence for this ticket**: the demand grammar must be supplied to the lens as DATA. The
  committed gate records carry NO facade in their programs, so a lens reading only the program is a
  no-op on them (they re-derive unchanged) — which is exactly the identity-class requirement; the
  anti-anchor flip must be demonstrated in a CALIBRATION fixture (barn occupancy + a recorded barn
  grammar), not by mutating the committed barn record.
- **role→block**: `roleToBlock(pack, role)` (`src/recognition/compile.mjs:26`) is the one resolution
  point; the lens resolves `memberRole` to a block the same way compile does.

## 5. The calibration-sweep pattern (T-144-01, the exact template)

`benchmarks/sculpture/budget-calibration.mjs` (`BUDGET_CALIBRATION_SCHEMA = "budget-calibration/v1"`):
- **Pure re-derivation** over committed `multi-angle/*.json`, READ-ONLY: recomputes both arithmetics
  from each record's committed `views[].gaps[]` — NO judge, NO render, NO re-judge.
- Binding ANCHORS asserted (barn PASS, cottage FAIL); coverage-refused records NOTED not re-scored;
  writes `{json,md}` via `guardedWriteRecord` (pin-guard); `--rotate-pins` to re-bank; non-zero exit
  on anchor miss. `--repro` is just re-running (deterministic → byte-identical).
- Committed evidence: `benchmarks/sculpture/multi-angle/budget-calibration.{json,md}`.

This is the template for the relief calibration: load committed builds (occupancy via
`artifactOccupancy`, `src/view/occupancy.mjs:103` — pure, GL-free), apply the relief lens, assert the
anti-anchor + articulated anchors, dual-report the committed kit-aware verdict beside.

## 6. The offline checker (AC4 "tolerant of the new field")

`benchmarks/sculpture/multi-angle-gate.mjs` `--offline` (`:283-345`) validates committed gate records
field-by-field, each additive feature checked INDEPENDENTLY, absence tolerated: `kitAware` (`:303`,
re-composes `composeKitAwareVerdict` and checks it matches `overall`), `visibility` (`:320`),
`rejudge.instrumentDiff===[]` (`:326`). The pattern to extend: an optional `relief` block, checked
for internal consistency only when present, absent on every committed record (→ byte-identical).

## 7. Constraints & assumptions surfaced

- **Additive / byte-identical** ([[challenge-repro-drift-preexisting]], [[shared-file-commit-sweep]]):
  every committed program/artifact/gate record stays valid and `--repro` byte-identical. The lens
  attaches a NEW optional field only when a grammar is supplied; no committed subject has one → no
  byte change. Schema already has `facade` (S-145) — no schema edit needed.
- **No per-building constants** (E-25 Rule 3 self-grep): the period/phase/material come from the
  recognized grammar (committed fixture data), never from runner source. The fixpoint predicate
  (`missing===0`) has no threshold at all.
- **Not a colour metric**: the lens is geometry (proud cells, rhythm), reusing `surfaceRelief`/
  `reliefProfile`; material identity stays the judge's/kit's job ([[facade-grammar-recolor-vs-construction]]).
- **Identity-class discipline** ([[glance-true-budget-v2]]): aggregation/precondition only; version
  the policy tag (`relief-aware-gate/v1`) not the envelope; legacy kit-aware verdict valid forever
  beside; the frozen judge contract is byte-unmoved (the lens never calls the judge).
- **Pin-guard** ([[pin-guard-is-structural]]): the calibration record is written through
  `guardedWriteRecord`; rotation needs `--rotate-pins` in this owning ticket.
- **S-146 handoff** (T-146-01 review follow-up #2): "add a relief-aware precondition to the gate
  (S-148) reusing `reliefNoRegress`." This ticket is that follow-up; the engine is in place.
