---
id: E-54
title: relief-tolerant-closure-and-the-m1-stop-line
type: epic
status: open
priority: high
depends_on: [E-53]
spec: "§1, §5, §6, §9"
stories: [S-209, S-210, S-211]
---

## Background (one metric fix from the kept build — and a line in the sand)

**Milestone rung: M1 — land the gatehouse, or stop.** E-53 isolated the gatehouse to two clean *measurement*
seams and, decisively, **produced the best build of the whole arc** — `T-208-01/beside-batch-rollback.png` is a
closed dressed-stone box with proud corner quoins, a gable, and an arch: recognizably a little stone gatehouse.
It was **rejected by a metric bug, not a build defect.** The chain:

- **The form metric is now truthful (T-206):** the colonnade reads open (0.608), `close_shell` fires first, the
  shell closes (→1.000) and stays. Form removed as a confound.
- **Every hand works geometrically (T-207):** wide voussoir arch passes the coherence gate, slate roof, pitch
  1.63→1.32. But the per-move **median judge scores each detail move 0** and rolls it back (the wide-arch build
  drew the only non-zero vote, 44 of 3 — the judge *can* see it; the median discards it).
- **The cold-start batch escape works (T-208):** stacking detail moves and judging the *compound* gets the
  climb off 0 (+20, a trustworthy glance-agreed signal — batching solves the median-gradient problem). **The
  +20 dressed batch was then rejected** because `relief_walls` stands the wall **proud** of the footprint, and
  T-206's footprint-ring metric reads a proud-dressed closed wall as **off-ring = open** (closure 1.000→0.068),
  so the form-integrity guard rejected the glance-good build as a false "reopen."

So the build that looks like its picture *exists* and is **one metric fix away from being kept.** This epic
makes that fix, makes the gate easy to center (a real ergonomic gap the arch work exposed), re-climbs with the
batch escape on, and — **win or lose — draws the M1 stop-line.** Governed by
`docs/knowledge/project-direction.md` + `docs/knowledge/anti-hedge-directive.md`; frozen instrument untouched;
subscription shim only.

## The stop-line (pre-committed, reviewer-ratified — this is the anti-hedge spine)

This is the **sixth epic (E-48→E-53) on one house**, and the recurring binding constraint has been the
*measure*, not the build. The build is now visibly converging (colonnade → dressed gatehouse) and we are one
well-scoped fix from the kept build — so **one more focused pass is warranted, with a hard stop attached:**

> **If the E-54 re-climb's KEPT build does not pass the glance as M1** (a stranger sees the concept's gatehouse:
> closed dressed walls, a centered arched gate, a dark gabled roof, right proportion) — **we stop adding
> gatehouse epics.** The next epic is NOT a seventh gatehouse fix; it is a step back to the structural question:
> *can the picture-climb architecture finish any single subject to M1, and if not, what changes* — a reviewer
> decision, named not buried. A near-miss with a precise residual is a complete, publishable result; it does
> **not** license another gatehouse patch.

## Stories

- **S-209 — relief-tolerant closure metric (the lead fix).** Make `eaveRingClosure` tolerant of ±1 proud
  displacement (census the **wall plane**, not only the exact footprint ring), so a proud-dressed *closed* wall
  reads closed — **without** regressing T-206's core invariant: an open colonnade must still read open. (A
  proud-dressed closed wall and a proud open colonnade differ by *interior fill*, not the ring.) With it, the
  T-208 +20 dressed batch is **kept** on a stayed-closed form.
- **S-210 — center a gate on a wall, by construction (the ergonomic fix).** Today the aperture widens *wherever
  the build already has a slot* (`carveTargetCells`: "the build positions the slot"), so a centered gate depends
  on where a pre-existing void happened to sit. Add a **center-on-face** helper: given a declared wall face and
  an opening width, place the opening centered on the face by construction (column span computed from face width,
  not inherited from a stray slot), feeding `rebuild_arch`/`carve_arch`. A centered wide arch reads as a proper
  gatehouse gate.
- **S-211 — re-climb (batch on) + M1 glance verdict + the stop-line.** Re-run the metered gatehouse climb with
  the relief-tolerant closure (S-209), the centered gate (S-210), and `CLIMB_BATCH_SIZE` on (the T-208 escape).
  Judge the **kept** build on the glance against the concept. **M1 landed**, or the precise residual — and in
  the latter case **invoke the stop-line** (record the residual; the next epic is the step-back, not a patch).
  Depends on S-209 + S-210.

## How this epic can fail (state it up front — anti-hedge)

- **Relief-tolerance reopens the colonnade hole.** Making the metric forgive ±1 proud displacement also makes it
  forgive a real ±1 gap, so a colonnade (or a one-ring-thin wall) now reads closed — T-206's invariant breaks.
  Then proud-relief and open-colonnade are *not* separable on the ring alone and need interior-fill evidence
  (the harder fix, named).
- **The kept dressed build still doesn't pass the glance.** Closure-tolerance keeps the +20 batch, but the
  result is brown-roofed / grey-walled / boxy, not the concept's slate-and-pale gatehouse (recolor/scale didn't
  compound in). Then **the stop-line fires** — M1 near-miss, step back.
- **Centering fights the existing-slot logic.** Forcing a centered aperture conflicts with where the
  GLB-inherited void sits, producing a double opening or a ragged edge. Then centering needs the slot *removed*
  first (a rebuild, not an overlay) — name it.
- **Score variance still dominates the verdict.** A kept dressed build scores M1-passing one run, near-miss the
  next. Then the *verdict itself* is unreproducible and the honest output is "the judge can't certify M1" — which
  also fires the stop-line (the architecture can't *measure* a finish).

## Done when

`eaveRingClosure` reads a proud-dressed closed wall closed and an open colonnade open (invariant held, unit-
proven); a gate centers on its wall face by construction; and a re-run metered climb (batch on) keeps the
dressed build and **either passes the glance as M1** (closed dressed walls, centered arched gate, dark gabled
roof, right proportion — a stranger recognizes the concept) **or** records a precise residual and **invokes the
pre-committed stop-line** (next epic = the step-back, not a seventh gatehouse fix). Frozen instrument untouched;
subscription shim only.
