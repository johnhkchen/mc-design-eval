---
id: E-17
title: consolidation-sweep
type: epic
status: open
priority: high
depends_on: [E-13, E-14, E-15, E-16]
spec: "§1, §5, §6, §9"
stories: [S-054, S-055, S-056, S-057]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds (`vConcept`: term → design doc → concept image → build → render → judge). Over several
epics we accumulated techniques that each attacked one failure mode of the baseline text→JSON build:

- **E-14 value-true palette** — closed *value* drift (the moai's faithful form but too-dark block) by
  binding concept + build to a shared block-Lab palette + a Δvalue gate. (`src/color/`.)
- **E-15 surgical revision loop** — a region-scoped *observe → tweak → accept-if-improved* cage to attack
  *form*; P14-safe (never regresses). Against a **flat concept** target it moved nothing (the signal was
  too blunt). (`src/form/`.)
- **E-16 GLB-grounded form** — real TRELLIS image→3D meshes used as a form **target** and a geometry
  **source**. The decisive finding: **voxelizing the GLB is the form win** (koi +0.150, heart +0.421 IoU
  vs text→JSON), far larger than any edit on a text build. (`benchmarks/sculpture/glb*`, `src/form/`.)

**The problem this epic solves.** These wins were each measured on **one or two subjects in isolation**
(koi/heart), with different baselines and different metrics per epic. **It is hard to tell what each
improvement actually bought** across the board — there is no single, legible, apples-to-apples picture.
And E-16 surfaced a concrete loose end: the GLB-voxel build wins on *form* but its per-voxel color came
out **speckled/noisy** (each voxel sampled the TRELLIS texture independently), so silhouette IoU rewards
it while it reads busy up close — *form solved, material not*.

## Goal

**Bring it all together in one measured sweep.** Take **every** E-13 sculptural subject (the 8: dancing
man, moai, pineapple, bow & arrow, heart, sword, mushroom, koi) up a **single canonical technique ladder**,
score every rung the same way, and produce **one scorecard** that shows — per subject and on average —
**the marginal contribution of each technique**. Plus build the one missing rung the sweep needs: a
**material-clean pass** that fixes E-16's speckle (the new lever; the rest is composition of proven work).

### The canonical ladder (each rung adds exactly one technique; same metrics throughout)

```
R0  text→JSON          the E-13 baseline build                                  (where we started)
R1  glb-voxel          voxelize the TRELLIS GLB → DesignArtifact   (E-16)        (form win)
R2  + material-clean   denoise/quantize the per-voxel color into clean material  (NEW, this epic)
                       regions via value-true palette (E-14) + material passes (E-11)
R3  + surgical         E-15 region polish against the GLB target   (E-15+E-16)   (final cleanup)
```

Every rung scored identically: **form IoU vs the GLB**, **value ΔE** (palette cleanliness), **judge
categorical**. The scorecard then reads off, for each technique, *what it bought* (ΔIoU, Δcleanliness,
Δverdict) — the legible answer the isolated experiments couldn't give.

```
                R0        R1         R2              R3
subject     text→JSON  glb-voxel  +mat-clean   +surgical     ← per-rung metric, and the MARGINAL Δ each adds
koi           …          …          …             …
heart         …          …          …             …
…(×8)
AVG / Δ     baseline   +form      +material     +polish       ← "what each improvement bought," on average
```

## Why now / why this shape

- **Attribution, not anecdote.** One ladder, one metric set, all 8 subjects → the contribution of value,
  form (voxelization), material, and surgical polish becomes a *number you can point at*, with a visual
  march-of-progress per subject. That is the deliverable.
- **It closes E-16's loose end.** The material-clean rung (R2) is the one genuinely new build technique;
  it turns the speckled-but-correct-shape GLB-voxel build into a finished-looking one, reusing E-14's
  value-true palette + E-11's material passes. Without it the voxel win looks unfinished.
- **It's mostly composition + measurement.** R0/R1/R3 already exist (E-13/E-16/E-15); the net-new code is
  R2 + the sweep harness + the scorecard. Low risk, high legibility.
- **The GLBs are provisioned.** All 8 subjects now have a TRELLIS GLB on disk (`benchmarks/sculpture/glb/
  *.glb`, gitignored; manifest in `glb/README.md`; regen via `benchmarks/sculpture/trellis-glb.mjs`), so
  the sweep is pure local computation — no network, ideal for the autonomous run.

## Scope

**In:** the **material-clean pass** (denoise/quantize GLB-voxel color → clean material regions, value-true
+ height-varied — the new lever); the **glb-voxel build across all 8 subjects** (generalize E-16's
koi/heart path); the **ablation sweep harness** (assemble the 4-rung ladder × 8 subjects, run the surgical
rung, collect form-IoU + value-ΔE + judge per rung); the **consolidation scorecard + per-subject
march-of-progress** (the legible answer), journaled, with an E-12 handoff.

**Out:** generating GLBs (already done — the 8 are on disk; a ticket may regen a missing one via
`trellis-glb.mjs`, but generation is not the work); new subjects beyond the E-13 set (apples-to-apples
against a known baseline is the point); the rubric and brief (immutable during measurement); a fresh
from-scratch re-generation of builds (the sweep consumes the existing E-13 builds + the GLBs).

## Candidate stories & DAG (overnight chain — gated, journaled, on main)

```
S-054 glb-voxel ×8 ─▶ S-055 material-clean ×8 ─▶ S-056 ablation sweep (4-rung ladder ×8, collect) ─▶ S-057 scorecard + march
   (R1 for all)         (R2: the new lever)        (adds R3 surgical; gathers all metrics)            (the legible answer)
```

- **S-054 — glb-voxel-breadth.** Run E-16's `glbVoxelBuild` across all 8 subjects (the GLBs exist) →
  the R1 `glb-voxel` build + render + form-IoU for every subject. Generalizes the koi/heart path; little
  new code, broad coverage.
- **S-055 — material-clean-pass (the new lever).** Build + apply a pass that turns the speckled per-voxel
  GLB color into **clean material regions**: cluster the voxel colors (median-cut in Lab, as
  `palette-extract` does), snap to **value-true blocks** (E-14), and apply **E-11 material passes**
  (same-hue set, height-varied) for texture instead of noise — optionally spatial-smoothing a voxel to its
  neighborhood's dominant block. → the R2 `+material-clean` build for all 8. Pure logic unit-tested.
- **S-056 — ablation-sweep.** Assemble the full 4-rung ladder (R0 text→JSON, R1 glb-voxel, R2
  +material-clean, R3 +surgical) for all 8 subjects — running the **E-15 surgical rung** on the cleaned
  voxel build with the GLB target — and **collect form-IoU + value-ΔE + judge per rung per subject** into
  one structured record.
- **S-057 — consolidation-scorecard-and-march.** The legible answer: a **scorecard** (subject × rung, with
  the **marginal Δ each technique bought**, plus the AVG row), a **per-subject march-of-progress** visual
  (R0→R3 side by side), the journal section, and the E-12 handoff (the "bringing it all together" beat).

## Definition of done

- All 8 subjects have the full 4-rung ladder (R0–R3) built, rendered, and **scored on the same axes**
  (form IoU vs GLB, value ΔE, judge).
- A **single scorecard** states, per technique, **what it bought** on average and per subject — including
  where a rung **didn't help or hurt** (honest, like E-14/E-15/E-16).
- The **material-clean pass** demonstrably reduces color noise on the GLB-voxel build (a value-ΔE /
  palette-count drop), shown before/after.
- A per-subject **march-of-progress** (R0→R3) exists for E-12; `npm test` green.

## Orchestration notes (for the autonomous overnight run)

- **Gated linear-ish DAG, on main, journaled diffs** — the proven E-08/E-16 overnight shape. The sweep
  itself (S-056) fans out over 8 subjects, which the agent parallelizes internally.
- **GL-free where it counts.** The material-clean clustering/quantization and the metric collection are
  **pure/deterministic** — built and unit-tested without GL (on synthetic occupancy/color); only the
  final renders need GL, isolated behind the existing seam (the user's env has GL).
- **Local GLB + build dependency.** Reads the gitignored GLBs (`glb/*.glb`) and the E-13 builds
  (`runs/00[2-9]-*`); regen a missing GLB via `trellis-glb.mjs` (needs `.env` `MODAL_ENDPOINT_URL` —
  never printed). Unit-test against tiny synthetic data, not the 5 MB GLBs, so the suite stays fast.
- **Honesty + cost.** The surgical rung spends metered `claude -p` calls; a rung that doesn't help is a
  real result, reported. The scorecard must not flatter the stack — show the marginal Δ, including zeros
  and regressions.
