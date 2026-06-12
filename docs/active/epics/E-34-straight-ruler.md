---
id: E-34
title: straight-ruler
type: epic
status: open
priority: high
depends_on: [E-33]
spec: "§1, §5, §6, §9"
stories: [S-139, S-140, S-141, S-142, S-143, S-144]
---

## Background (read this first — self-contained)

**Milestone rung: M1, the last mile — "the house looks like its picture" must be measured by a
ruler that is straight.** The M3 town composer (a street that belongs together) multiplies whatever
the proportion instrument gets wrong; this epic fixes the named instrument defects first. The user's
direction, verbatim intent: *fixes before we proceed to town layouts.*

**Where E-33 landed (2026-06-12, verified at T-138-02).** The proportion loop works when the ruler
is straight: both barns aimed geometry levers on their first live run (`eaveHeight:12`, `depth:26`
ACCEPTED), all three ratios into tolerance in 3/6 rounds. The cottage produced its first-ever
pattern-book verdict (2/4 same-object, 7 minor + 4 major) — and the milestone's headline finding:

1. **The loop hill-climbed a bent ruler.** `maskProportions` (`src/form/silhouette-proportion.mjs`)
   defines the eave as *the topmost row whose extent ≥ `eaveWidthFrac` (0.98) × the max row
   extent*. The cottage's realized plinth band (y3–4, 1–2 blocks wider than the walls) **is** the
   max extent, so no wall row ever qualifies — the "eave" lands on the plinth top and everything
   above reads as roof (recorded ridge:eave 5.5 vs corrected ≈1.7 vs target 1.4145). The gradient
   inverted: the model aimed the CORRECT wall-raise in 5/6 rounds (refused by the rustic
   storeyHeight band + the schema storeys cap) and the one ACCEPTED move (`storeys:3`) was
   wrong-direction (1.55→2.75). An armed gate with a bent metric is worse than no gate.
2. **The pack refused the correct move.** `packs/rustic.json` proportions: `storeyHeight {min:3,
   max:4}`, `pitchClasses [1]`. The storey band blocked the cottage's wall-raise; the class-1 pitch
   ceiling is the barns' last surviving proportion-flavored gap (T-138-01). Both are per-STYLE rows
   — editable under the per-style-not-per-building rule, with the taste justification recorded.
3. **The ruler's vocabulary is ambiguous.** Program-level and occupancy-level ratio lenses disagree
   by up to 3× (the cottage proves it); records do not name which lens produced their numbers.
   `tolerance: 0.15` is uncalibrated. And pitch targets read from the conditioned sketch inherit
   TRELLIS's flattening (both E-33 sketches measured ≤45°, so the steep door went unused even where
   the concept reads steeper) — the concept is the contract; the sketch is the fallback.
4. **Three witness families FAIL-not-SKIP after sanctioned rotations** (S-138 review, concern 3 —
   provenance-proven, none in `npm test`): `proportion:repro` (its `replayLedger` call never passes
   the pack; geometry-bearing ledgers throw), `visibility:repro` (`DIVERGES` on rotated
   pattern-book gate records; the SKIP guard covers artifact pins only), `measured:repro/:offline`
   (`ratios.before` reads live workshop programs, which the re-runs rotated). The expected
   named-SKIP behavior exists only on the artifact-pin path (gatehouse-current shows it).
   Refreshing these is a pin rotation needing an owning ticket — this epic is that owner.

## Goal

**Every number the loop steers by is trustworthy, and every witness survives a sanctioned
rotation** — then prove it where it failed:

```
SKIRT-AWARE EAVE        the plinth never reads as the eave; the wall column owns the line
NAMED LENS + CALIBRATION  records name program vs occupancy; tolerance set from cross-subject data;
                          concept-over-sketch pitch precedence
PACK HEADROOM (rustic)    the storey band and pitch ceiling stop refusing vernacular-plausible moves
WITNESS PIN POLICY        the three FAIL families go green-or-named-SKIP; rotations stop breaking them
RE-VERDICT                cottage (mandatory) + barns back through the loop; the epic's only judge
                          runs; does the residual collapse to real-only?
```

## Rules of engagement (binding)

1. **Instrument changes follow the identity-class discipline** (T-095/T-101/T-110/T-137 precedent):
   monotone proof (every mask whose old and new eave lines agree is byte-unchanged in its derived
   ratios; correction only where a skirt band exists), **both rulers reported** (old beside new) in
   any record that re-derives, committed records untouched and valid, the frozen judge contract
   unmoved. The proportion check is workshop-side (creation, free) — its tolerance may be
   calibrated, but only **cross-subject from committed E-33 data**, never per-building.
2. **Pack edits are per-STYLE policy, taste recorded.** The rustic rows change only with a recorded
   vernacular justification tied to the pack's material story; saltcrag is NOT touched (its
   ratification taste pass still rests with the user). No per-building constants, anywhere.
3. **Pin rotations only in their owning ticket, pin-guard preflight always** (T-119). The witness
   ticket owns the measured-record refresh; the re-verdict ticket owns the chain/gate rotations.
   Baselines are quoted pre-rotation and never re-banked.
4. **The gap budget: DECIDED by the reviewer 2026-06-12** — the budget must track the desired
   look; the glance is the bar. S-144 owns the implementation (severity-aware identity-first v2,
   calibrated from committed verdicts, legacy arithmetic reported beside; the judge contract
   unmoved — aggregation only, never a re-judge). Likewise decided: **saltcrag is ratified**
   (`style:ratify`, by John Chen, 2026-06-12). **Inherited in full:** workshop/ruler mode split (the terminal story owns the
   epic's only judge runs), replay reproducibility, reply policy (T-114), brush door (export, never
   widen).

## Candidate stories & DAG

```
S-139 skirt-aware-eave ──┬─▶ S-142 witness-pin-policy ──▶ S-143 re-verdict (terminal)
S-140 ruler-calibration ─┤                                  ▲
S-141 rustic-headroom ───┴──────────────────────────────────┤
S-144 glance-true-budget ───────────────────────────────────┘
```

- **S-139 — skirt-aware-eave.** The eave detection ignores bottom-anchored bands wider than the
  wall column above them; frozen op parameters, never subject-tuned; the cottage artifact becomes
  the regression fixture (recorded 5.5/0.8182 → corrected ≈1.7/0.45 vs targets 1.4145/0.293).
- **S-140 — ruler-calibration.** Every proportion record and gate row names its lens
  (program-level vs occupancy-level); `tolerance` calibrated from the three subjects' committed
  data; pitch-target precedence recorded: concept silhouette over TRELLIS-flattened sketch.
- **S-141 — rustic-headroom.** The storeyHeight band and pitch-class ceiling gain vernacular-
  justified headroom (the two refusals E-33 measured); schema caps reviewed alongside; taste
  justification in the pack's provenance note and the review.
- **S-142 — witness-pin-policy.** The three FAIL-not-SKIP families fixed at their seams (pack
  threading; record-pin SKIP guard; measured `ratios.before` refresh under explicit rotation) plus
  the missing SKIP-vs-FAIL regression test; bar: a subsequent sanctioned rotation must NOT return
  them to FAIL — S-143 proves it.
- **S-144 — glance-true-budget.** The reviewer's 2026-06-12 decision implemented: the flat ≤2
  aggregate budget becomes a severity-aware identity-first policy (v2) calibrated from committed
  verdicts — the glance-passing class (4/4 same-object all-minor: T-127/T-132/T-138-01 barns)
  passes, the glance-failing class (the T-138-02 cottage, 2 drifted + 4 major) fails. Aggregation
  only: no judge call, no re-judge; legacy arithmetic reported beside, forever.
- **S-143 — re-verdict (terminal).** Cottage (mandatory) and both barns (their consumed pack row
  changed) back through the full loop; **this story owns the epic's only judge runs**; verdicts vs
  the T-138-02 baselines (cottage 2/4, 7m+4M; barns 4/4, 8 minor) decided under the v2 budget with
  the legacy arithmetic beside; the sheets beside the concepts — the question answered: with a
  straight ruler, headroom, and a glance-true budget, does the cottage residual collapse to
  real-only, and do the barns finally RECORD the pass the glance already gives them?

## Definition of done

- The cottage fixture's eave line is correct and every skirt-free mask is provably unchanged
  (monotone proof committed); records name their lens; tolerance carries its calibration evidence;
  pitch targets cite their source with concept precedence.
- Rustic headroom landed with recorded taste justification; no per-building constants.
- `proportion:repro`, `visibility:repro`, `measured:repro/:offline` green or named-SKIP at HEAD,
  **and still green after S-143's rotations** (the regression that matters).
- The re-verdict recorded honestly vs baselines, both arithmetics, sheets beside concepts; journal +
  E-12; `npm test` green; replay byte-identical everywhere.

## Orchestration notes

- S-139/S-140/S-141/S-144 are mutually independent (disjoint seams: detection code / record
  vocabulary + calibration / pack data / gate aggregation) — parallel. S-142 follows S-139+S-140 so
  the witness pins rotate once, after ratio derivation has settled. S-143 is terminal and owns the
  only judge runs.
- **Honesty.** If the corrected ruler says the cottage was never roof-heavy, that is the finding —
  the judge's two drifted views named roof-heaviness independently, so expect part-real residual.
  If the barns' pitch stays within class 1 when measured against the concept (not the flattened
  sketch), the headroom row simply goes unused — recorded, not forced.
- Both formerly-pending user decisions landed 2026-06-12: saltcrag ratified (done, pack of
  record updated); the gap budget rationalized to the glance (S-144 implements). The remaining
  user-owned item is nothing — this epic has no decision debt.
