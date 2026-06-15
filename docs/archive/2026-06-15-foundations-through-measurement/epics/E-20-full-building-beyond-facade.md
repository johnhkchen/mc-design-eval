---
id: E-20
title: full-building-beyond-facade
type: epic
status: open
priority: high
depends_on: [E-15, E-16, E-19]
spec: "§1, §5, §6, §8, §9"
stories: [S-067, S-068, S-069, S-070]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. **Phase 1 was deliberately "facade only"** — a single grand *face*, not a whole
structure — because the original **text→JSON** build path **cannot place a whole building**: the model
emits voxel placements by hand, and at building scale it doesn't overflow, *it narrates* (a documented
limit — the JSON stays tiny while the prose balloons). A full building (four sides, roof, depth, hundreds
or thousands of blocks) was simply infeasible to author one placement at a time.

**That bottleneck is now gone.** The arc since then built the pipeline that removes it:
- **E-16 GLB-voxel** — voxelize a TRELLIS image→3D mesh → a `DesignArtifact`. This **places the bulk
  automatically** (thousands of cells from one concept image) — the thing text→JSON never could.
- **E-19 cleanup** — the GLB-voxel materials now read **as clean as text→JSON** (flat palette, region
  coherence, no speckle, no stray geometry).
- **E-15 surgical loop** — region-scoped *observe → tweak → accept-if-improved* edits (LLM or procedural)
  against the GLB target, P14-safe, to refine specific regions without a destructive global re-emit.

So the combination is exactly what a full building needs: **GLB→voxel for fast bulk placement + clean
materials + regional surgical LLM edits for refinement.** This epic uses it to **break past the
facade-only limitation** with a flagship demonstration.

## Goal

Produce a **full-fledged 3-D building** (all sides, roof, real depth — not a facade) through the matured
pipeline, at **higher resolution than anything before** (a larger build, more blocks), refined to a
**high standard** (a categorical judge verdict of **Strong or better**), rendered in the round (360
turntable), and shown side-by-side against the old single-face facades to make the leap legible.

```
building brief ─▶ design doc ─▶ 3/4 concept (ONE whole building) ─▶ TRELLIS GLB ─▶ voxelize @high scale
                                                                                        │
                          clean materials (E-19) ─▶ surgical regional refinement (E-15, GLB target)
                                                                                        │
                              render 360 + judge to a HIGH STANDARD ─▶ facade→full-building showcase
```

## Why now / why this is the payoff

- **It's the thesis, demonstrated.** "Our system is the sculptor; image→3D removes the placement
  bottleneck." A whole building is the proof: text→JSON *can't*, the matured pipeline *can*.
- **It uses every piece.** TRELLIS bulk (E-16), clean materials (E-19), surgical refinement (E-15),
  value-true palette (E-14), the form metric (E-15) — composed, at scale.
- **It moves past Phase-1 scope on purpose.** Facade-only was a *cost/comparability* choice, not a
  capability ceiling; the user is explicitly lifting it now that the bulk-placement tool exists.

## Scope

**In:** a **full-building vConcept mode** (a single 3/4 concept of *one whole building* — all sides + roof,
high architectural detail; explicitly ONE building, ONE view to avoid the multi-copy contact-sheet trap
that wrecked the moai); the **building GLB** (provisioned via TRELLIS); a **high-resolution voxel build**
(large footprint, more blocks — a deliberate scale bump) cleaned by the E-19 pipeline (flat palette,
segmentation, stray-pruning); **surgical regional refinement** (E-15 loop, GLB target) pushing it to a
**Strong+** categorical bar; a **360 turntable** + final judge; a **facade→full-building consolidation**
(before/after vs the old facades, journal, E-12 handoff).

**Out:** functional interiors / walkable rooms (the demo is the *exterior massing + detail* in the round —
implied interior depth, not furnished rooms); a breadth sweep of many buildings (this is a **flagship**
build to a high bar, 1 hero + at most 1 backup, not N); the rubric/brief (immutable); SAM / region textures
(deferred); changing the backend off TRELLIS.

## Candidate stories & DAG (overnight chain — gated, journaled, on main)

```
S-067 full-building archetype + GLB ─▶ S-068 high-res voxel build ─▶ S-069 surgical refine to standard ─▶ S-070 showcase
   (ONE whole building, 3/4 concept,     (large/high-scale voxelize     (E-15 loop, GLB target, push to     (360 + judge +
    TRELLIS GLB provisioned)              + E-19 clean materials)         Strong+; quality-gated, bounded)    facade→full leap)
```

- **S-067 — full-building-archetype.** Generalize `vConcept` to a **building** subject: a design doc for a
  whole structure + a Nano-Banana **3/4 concept of ONE complete building** (all sides + roof, bold
  block-scale architectural detail; hard constraint: a *single* building in a *single* view — no
  turnaround sheet). Provision its **TRELLIS GLB** (validate TRELLIS actually reconstructs a building — a
  bulky-angular form; honest if it struggles). The break-facade foundation.
- **S-068 — high-res-voxel-build.** Voxelize the building GLB at a **deliberately higher scale** (a larger
  build, more blocks than the ~32 sculptures), color value-true within the design-doc **flat** palette,
  segment + prune (E-19), render. Record block count + form IoU — the "higher resolution, more blocks"
  artifact. (Note the scale↔fidelity caveat: angular forms can regress at very high scale — pick the scale
  that reads best, don't just maximize.)
- **S-069 — surgical-refine-to-standard.** Run the E-15 surgical loop (GLB form target) region-by-region
  to push the build to a **high standard**: iterate bounded rounds until the **categorical judge reaches
  Strong (or better)**, or report honestly where it tops out (that ceiling is itself a valid measurement).
  P14-safe (no regression; non-improving edits rolled back).
- **S-070 — full-building-showcase.** A **360 turntable** of the finished building + the final judge
  verdict; a **before/after vs the Phase-1 facades** (one face → a whole building in the round); journal a
  **beyond-facade (E-20)** section (what the pipeline made possible, the scale, the standard reached, the
  honest residual); E-12 handoff (`pr/assets/`) — the "we broke facade-only" hero beat.

## Definition of done

- A **full 3-D building** (all sides + roof, real depth) exists as a valid `DesignArtifact`, **markedly
  larger / more blocks** than the sculptures, with **clean text→JSON-grade materials** (E-19 axes hold).
- It reaches a **Strong+ categorical verdict** (or the topping-out point is measured and explained).
- A **360 turntable** shows it genuinely in the round (not a facade); a before/after vs the facades makes
  the leap obvious.
- The pipeline ran **end-to-end** (concept → GLB → voxel → clean → surgical → judge); `npm test` green.

## Orchestration notes (for the autonomous overnight run)

- **Runs after E-19** (depends on the clean materials + stray-pruning + the fixed metrics). Gated linear
  chain, on main, journaled.
- **GL-free where it counts** (voxelize, palette, segmentation, metrics are pure); the building GLB +
  concept are **network/host** steps provisioned outside the GL-less lisa env (the same pattern as the
  sculpture GLBs — generate locally, commit the manifest, gitignore the binary).
- **Honest risks to surface, not hide:** TRELLIS may lose fine architectural detail (windows/cornices
  stair-step) — the surgical pass is the remedy, and where it can't reach Strong, *say so* (the project's
  job is to find where quality tops out). Higher scale is **not** monotonically better for angular forms —
  choose the scale that reads best. A building concept must be a **single** structure — guard against the
  contact-sheet failure that produced the moai's duplicate masses.
