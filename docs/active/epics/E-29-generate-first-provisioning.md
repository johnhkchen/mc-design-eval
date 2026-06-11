---
id: E-29
title: generate-first-provisioning
type: epic
status: open
priority: high
depends_on: [E-27, E-28]
spec: "§1, §5, §6, §9"
stories: [S-112, S-113, S-114, S-115, S-116]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds, produced by a durable pipeline (named `npm run` per subject, registry-only,
reproducible) and judged by a frozen kit-aware + 4-azimuth same-object gate.

**The arc this epic concludes.** Since the GLB was integrated (E-16), the build's substrate has been a
**voxelized TRELLIS mesh** — lumpy, decimated, semantics-free — and eleven epics have been, in effect,
one long migration away from it: structural read → zones → kit → component decomposition → parametric
roofs → gable/ridge fits. The verified pattern (E-27/E-28 records): **every surface the pipeline
re-authors from fitted geometry passes its checks; every surface inherited from the blob fails.**
Spikes fell ~5× when the roof was *generated*; azimuth verdicts moved from zero same-object to
three the same day. The repair path works — it just pays an exorcism per surface, per subject.

**The thesis: invert provisioning.** Concept art + GLB are sufficient — **as references**. The mistake
was wiring the GLB in as the substrate. So: **fit the components from concept + GLB, generate the build
from parameters + kit, and use the blob only as the cage's fit evidence — it never becomes the build.**
E-27/E-28 already built every piece this needs (decomposition, fits, the construction vocabulary, the
cage, component-fed skinning); this epic re-orders them so generation is the default path for new
subjects, with the repair path kept for the legacy three.

**Folded in: the three gaps E-28 named (T-109/T-110 records, 2026-06-10)** — each needed by *both*
paths:
1. **Tower-cap vocabulary gap** — the church tower's roof fit took a named fallback: *"a pyramidal cap
   is not a ridge pair."* The vocabulary has gables/ridges but no **hip/pyramid cap**.
2. **Stage-vocabulary disagreement** — the styled church fails at the settle stage (4 re-runs,
   `foreign fill 170`; kit presence FAIL `frame lines 169/544 missing` as `polished_basalt`): grammar
   and dressing hold **different opinions about the same role's block set**. The census fix (role-family
   identity, T-110) was this lesson on the *gate* side; the construction side still has two
   authorities.
3. **Unparsed-judge REFUSAL** — one malformed judge reply at 225° turned the church's aggregate into
   REFUSAL, and the no-re-roll rule (correctly) forbade an inline retry. A **parse failure is not a
   verdict** — the instrument needs a bounded, recorded re-ask policy distinct from re-rolling.

**Sequencing note:** T-111-01 (the E-28 closure milestone) is re-judging all three subjects as this
epic is drafted. Its verdicts pin this epic's milestone targets (S-116) and define the head-to-head
baseline (S-115). All E-29 tickets are sequenced after it.

## Goal

A **new subject's first run looks like the cottage's latest run**: provision = fit + generate, not
voxelize + repair.

```
concept (immutable) + GLB (evidence, not substrate)
  ─▶ FIT COMPONENTS        footprint, storeys, wall slabs, roof forms, openings — parameters vs the GLB, errors recorded
  ─▶ GENERATE THE BUILD    walls, roofs (gable/hip/pyramid), arches, openings — from parameters + kit, zero blob cells
  ─▶ CAGE VS THE BLOB      the voxelized mesh is the fit target: per-azimuth silhouette IoU, closure — never copied
  ─▶ SKIN ON DEFINITIONS   one material-vocabulary authority; grammar/dressing/gates all consume the same role→block-set
  ─▶ THE FROZEN GATES      kit-aware + 4-azimuth same-object; robust judge I/O; verdicts with receipts
```

## Rules of engagement (binding)

1. **The blob never ships.** On the generate-first path, no cell of the voxelized mesh enters the final
   artifact — the blob is fit evidence and cage target only. A generated component that can't be fitted
   within tolerance is a **named finding** (and, for a new subject, a registered limitation), never a
   silent fallback to blob cells.
2. **One vocabulary authority.** A single role→block-set contract, derived from the material map + kit,
   consumed by zone-fill, grammar, dressing, settle, and both gates. Two stages disagreeing about a
   role's blocks is a contract violation, not a tuning problem.
3. **A parse failure is not a verdict.** The judge seam distinguishes malformed replies from judgements:
   bounded re-ask (declared limit), **every reply committed** (the malformed ones included), aggregate
   REFUSAL only when the re-ask budget is exhausted. Verdict re-rolling remains forbidden — this policy
   applies only where no verdict was parsed.
4. **Head-to-head, frozen instrument.** Generate-first is judged by the unchanged gates, side-by-side
   with the repair path's T-111 results — same azimuths, thresholds, judge contract, instrument-diff
   receipts. The comparison is the epic's evidence; neither path gets a friendlier ruler.
5. **Inherited in full:** E-24 durability, E-25 anti-tuning (registry-only subjects, immutable
   references, all azimuths, named gaps, no re-rolls), E-26 kit accountability, E-27/E-28 fit-don't-
   invent + cage.

## Scope

**In:** (a) **hip/pyramid cap generator** (the tower's named need; completes the roof vocabulary); (b)
the **material-vocabulary authority** (one role→block-set contract; fixes the church settle
non-convergence at its root); (c) **judge-reply robustness** (Rule 3); (d) **generate-first provision**
— fit components from concept+GLB, generate the build, cage vs the blob; head-to-head vs the repair
path on the legacy subjects; (e) the **generalization milestone** — a fourth subject, registry-only,
through generate-first end-to-end, plus closure of whatever residuals T-111 names (targets pinned when
it lands).

**Out:** organic/sculpture subjects (no parametric grammar — the repair path remains theirs); interiors
(E-23); TRELLIS quality; any gate threshold/azimuth/judge-contract change (Rule 3 touches I/O handling
only); the brief/rubric (immutable).

## Candidate stories & DAG

```
                 ┌─ S-112 hip-pyramid-cap ──────┐
T-111-01 (E-28) ─┼─ S-113 vocabulary-authority ─┼─▶ S-115 generate-first-provision ─▶ S-116 fourth-subject-milestone
                 └─ S-114 judge-reply-robustness ┴───────────────────────────────────▶ S-116
```

- **S-112 — hip-pyramid-cap.** The roof vocabulary gains hip ends and pyramidal caps (fit: apex +
  slope per face vs the GLB component; construction: stair/slab courses, correct states). Proven on the
  church tower — the named fallback becomes an accepted fit.
- **S-113 — vocabulary-authority.** One role→block-set module, derived from map + kit, consumed by
  every construction stage and both gates. The church settle converges (the `foreign fill 170` /
  missing-frame-lines disagreement resolved by contract, not tuning); a conformance test pins every
  consumer to the authority.
- **S-114 — judge-reply-robustness.** The parse-failure policy (Rule 3): schema-validated judge replies,
  bounded re-ask on malformed output, every reply committed, REFUSAL only at budget exhaustion. The
  church 225° case is the regression test.
- **S-115 — generate-first-provision.** The inversion: a provision mode that fits components from
  concept+GLB and **generates** the build (walls, roofs, openings from parameters + kit), blob as cage
  target only (Rule 1). Run head-to-head on cottage + gatehouse + church vs their T-111 repair-path
  results — same frozen gates, both result sets side-by-side.
- **S-116 — fourth-subject-milestone (terminal).** A new building subject — candidate: an **L-plan
  coaching inn with a jettied upper storey** (two wings → a roof junction; the jetty → generated
  overhang massing); fallback if the L-valley proves unfittable: a rectangular tithe barn — registered
  behind the S-094 concept sanity checklist, then taken through generate-first **end-to-end on its
  first run**, judged by the frozen gates. Plus closure of the residuals T-111 names. **Targets pinned
  after T-111-01 lands.**

## Definition of done

- **The vocabulary is complete enough for the roster:** hip/pyramid caps fitted and accepted on the
  church tower (or the residual named with its fit error).
- **One authority:** the conformance test pins all construction stages + gates to the same
  role→block-set; the church styled chain settles (converges) without tuning.
- **Robust instrument I/O:** no aggregate REFUSAL from a single malformed reply; the re-ask ledger
  committed; verdict re-rolling still impossible.
- **The inversion measured:** generate-first results beside repair-path results on the legacy three,
  frozen instrument, receipts committed — whatever they show.
- **The generalization claim tested:** the fourth subject's first-ever run produces a build judged by
  the full gates, with verdicts recorded honestly. (Pass thresholds pinned post-T-111.)
- **Durable + general:** named `npm run` per subject/mode, reproducible, registry-only; `npm test`
  green; journal + E-12 handoff.

## Orchestration notes (for the autonomous run)

- **Everything sequences after T-111-01** (in flight at drafting time): its verdicts are S-115's
  baseline and S-116's target-pinning input; serializing also avoids interleaving with the milestone's
  judge runs (the T-110 review's concurrency concern). S-112/S-113/S-114 are then mutually independent
  (disjoint seams: roof vocabulary / material contract / judge I/O) and can run in parallel.
- **S-116's targets are provisional until pinned.** The planner pins them from T-111's record before
  the ticket is scheduled; the ticket states this in its AC. If T-111 delivers full passes, S-115/S-116
  are pure scaling claims; if named residuals, S-115 doubles as their fix-of-last-resort and the
  targets say which.
- **GL-free where it counts:** fits, generators, the authority module, reply-schema validation are
  pure/deterministic, unit-tested on synthetic inputs; renders and the judge are the metered edges.
- **Honesty.** If generate-first loses the head-to-head somewhere (a fitted wall worse than a repaired
  one), that is a recorded finding with the fit errors that explain it. The epic's value is knowing
  which path to scale, with receipts.
