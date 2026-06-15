---
id: E-16
title: glb-grounded-form-and-revision
type: epic
status: open
priority: high
depends_on: [E-09, E-10, E-11, E-15]
spec: "§1, §5, §6, §9"
stories: [S-048, S-049, S-050, S-051, S-052, S-053]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. The working pipeline (`vConcept`): a **term** → an imagined **design doc** → a **concept
image** (Nano-Banana, 3/4 view, solid-black background) → a **build** (the model emits a JSON
`DesignArtifact` of voxel placements) → a **render** (headless `prismarine-viewer` → PNG) → a **judge**.

**The two measured gaps, and where we are.** Running `vConcept` across sculptural subjects (E-13) showed
text→JSON keeps **palette + parts** but loses **value** (closed by E-14: a shared block-Lab palette +
a Δvalue gate) and **form/line** (a koi's swimming **S-curve** flattens to a straight body; an
anatomical **heart's aortic arch never builds as a loop**). E-15 built a **surgical revision loop** to
attack form — region-scoped *observe → diagnose → bounded tweak → re-observe → **accept-if-improved***,
P14-safe (lock-additive, rolls back any non-improving edit). On koi + heart it **rolled back 2 of 2**
edits and moved nothing — **honestly**, because its accept signal was one 3/4 render's **silhouette IoU
vs a flat concept**, which is too blunt for a local edit to climb and gives no honest region-vs-region
target. E-15 deliberately left a **`glbFormTarget` seam** (`src/form/form-target.mjs`, currently throws)
for the one thing that fixes that: a **real 3-D form target**.

**That target now exists.** We ran our concept images through **TRELLIS 2** (image→3D, on Modal) and have
real GLB meshes on disk: `benchmarks/sculpture/glb/{koi,heart}.glb` (~95–106K verts, textured, valid
glTF v2 — manifest at `benchmarks/sculpture/glb/README.md`; regenerable via
`benchmarks/sculpture/trellis-glb.mjs` if absent). This epic puts them to work.

## Goal

Use the real GLBs as both a **target** and a **source**, and prove the configuration the form gap has been
pointing at all along: **a GLB-grounded voxel set, refined by surgical region tweaks against the GLB
itself.** Three things, measured head-to-head against the E-13 text→JSON baseline:

1. **GLB as form *target*** — implement `glbFormTarget` and re-run the E-15 loop on the existing text→JSON
   koi/heart builds. *Does a 3-D target unlock the form improvement the flat concept couldn't?*
2. **GLB as geometry *source*** — voxelize the mesh into a `DesignArtifact` (occupancy + E-10 CIE-Lab
   color). *Is the voxelizer's starting form better than text→JSON's?* (the founding E-09 question).
3. **The synthesis (the payoff)** — run the surgical region loop **on the voxelized-GLB build, with the
   GLB as the target.** The voxelizer supplies a real 3-D *starting form* (where text→JSON loses line);
   the loop, now with an honest per-region 3-D signal, *polishes* specific regions (cleans voxelization
   stair-stepping, sharpens a fin, closes the arch). *Is "GLB voxel set + surgical region tweaks" the
   capable combination?*

```
concept.png ─(TRELLIS)─▶ GLB ──┬─ as TARGET ─▶ glbFormTarget ─▶ re-run E-15 loop on the text-JSON build  (Arm A)
                               │
                               └─ as SOURCE ─▶ voxelize+color ─▶ DesignArtifact (the GLB voxel build)     (Arm B)
                                                                      │
                                                  surgical region loop, GLB as target ─▶ refined build    (SYNTHESIS)
                                                                      │
                          head-to-head: text-JSON  vs  GLB-voxel  vs  GLB-voxel+surgical   (form IoU + judge)
```

## Why a 3-D target changes the math (the crux)

A flat concept silhouette is a single 2-D outline: a small in-region 3-D edit barely perturbs it, and "is
this *region* the right shape" has no honest answer from one flat view. A GLB is a real solid: it can be
**projected from the build's exact camera, masked to a region's projected bounds**, yielding a *true
per-region target silhouette* the loop can hill-climb — and projected from *other* angles too, so the
loop is no longer blind to the single-view reconstruction limit. The accept-gate stops being too blunt to
reward a good local edit. That is the entire bet of this epic, and it is now testable.

## Scope

**In:** a pure GLB **silhouette rasterizer** (software triangle projection → binary mask, whole +
per-region — no GL needed for a silhouette); `glbFormTarget` behind the existing `scoreRender(renderPath,
R)` interface (zero change to observe/diagnose/accept); re-running the E-15 loop on the text→JSON builds
with the GLB target (Arm A); GLB **voxelization** (mesh → occupancy grid) + **color** (E-10 CIE-Lab
nearest-block on GLB surface color) → a `DesignArtifact` (Arm B); the **synthesis** (surgical loop on the
voxel-GLB build with the GLB target); a **head-to-head** consolidation (text-JSON vs GLB-voxel vs
GLB-voxel+surgical, form IoU + judge) on koi + heart, journaled, with an E-12 handoff.

**Out:** TRELLIS/Modal *generation* itself (already done — the GLBs exist; a ticket may regen if a file is
missing, but generation is not the work); animating/rigging the mesh; whole-scene composition; the rubric
and brief (immutable during measurement). Subjects are the two measured-gap GLBs (koi, heart) — no new
subjects, so every comparison is apples-to-apples against a known baseline.

## Candidate stories & DAG (an overnight chain — gated, journaled, run on main)

```
S-048 GLB silhouette rasterizer ─▶ S-049 glbFormTarget + loop on text-JSON  ─┐
                                                                             │
S-050 GLB → voxel occupancy ─▶ S-051 voxel color + DesignArtifact ─▶ S-052 ──┴─▶ S-053
                                          (the GLB-voxel build)     surgical loop      head-to-head
                                                                    on voxel-GLB        consolidation
                                                                    w/ GLB target       + journal + E-12
```

- **S-048 — glb-silhouette-rasterizer.** Pure software projection of a GLB mesh from a camera view → a
  binary silhouette mask (whole-object + masked to a region's projected 3-D bbox). No GL — a silhouette is
  just filled projected triangles. The primitive `glbFormTarget` and the per-region 3-D signal need.
- **S-049 — glb-form-target-and-loop-rerun (Arm A).** Implement `glbFormTarget({glbPath, view})` behind
  `scoreRender(renderPath, R)` using S-048; re-run the E-15 `reviseLoop` on the **text→JSON** koi/heart
  builds with `formTarget: glbFormTarget(...)`; record before/after IoU + judge vs E-13. Proves the seam
  swaps in with **no loop change**.
- **S-050 — glb-voxelize-occupancy (Arm B).** Mesh → occupancy voxel grid at a target scale
  (point-in-mesh / surface-intersection; deterministic, pure, testable). The GLB's *form* as voxels.
- **S-051 — glb-voxel-build (Arm B).** Color the occupied voxels via **E-10 CIE-Lab** nearest-block on the
  GLB surface color (vertex color / texture sample) → compile to a valid `DesignArtifact`; render + judge.
  The "is the voxelizer's form better than text→JSON?" build.
- **S-052 — surgical-loop-on-voxel-glb (the synthesis).** Run the E-15 surgical region loop **on the
  S-051 voxel-GLB build, with the GLB as the form target** — region tweaks (both procedural and LLM-edit)
  that polish the voxelized form against its own 3-D source. The capability this epic exists to test.
- **S-053 — glb-grounded-consolidation.** Head-to-head on koi + heart: **text-JSON vs GLB-voxel vs
  GLB-voxel+surgical** — form IoU + judge categorical, before/after table. Journal a **GLB-grounded form**
  section in `docs/knowledge/design-learnings.md` (did the 3-D target move the loop? is the voxel set +
  surgical tweaks the capable combo? honest residual). E-12 handoff (`pr/assets/`).

## Definition of done

- `glbFormTarget` implements `scoreRender(renderPath, R)` and the E-15 loop runs with it **unchanged**
  (the seam invariant holds, proven by S-049 needing no loop edit).
- A GLB voxelizes to a **valid `DesignArtifact`** that renders and scores (the E-09 path closed in JS).
- The **synthesis** runs end-to-end: the surgical loop refines the voxel-GLB build against the GLB target,
  P14-safe (no regression; rolls back non-improving region tweaks).
- A **measured head-to-head** exists for koi + heart — text-JSON vs GLB-voxel vs GLB-voxel+surgical, form
  IoU + judge — and the journal states **honestly** whether a 3-D target unlocked form, with the residual.
- `npm test` green.

## Orchestration notes (for the autonomous overnight run)

- **Gated DAG, on main, journaled diffs** — the proven E-08 overnight shape. Two roots (S-048, S-050) run
  in parallel under `max_threads=2`; the chain converges at the synthesis then the consolidation.
- **GL-free where it counts.** The silhouette rasterizer (S-048), voxel occupancy (S-050), and color
  mapping (S-051 logic) are **pure/deterministic** — the lisa agents (whose env lacks headless GL) can
  build and fully unit-test the hard logic; only the final render/judge needs GL, isolated behind the
  existing seam (the user's env has GL for the live renders).
- **Local GLB dependency.** The GLBs are gitignored local artifacts; a ticket that needs one should read
  `benchmarks/sculpture/glb/<subj>.glb` and, if missing, regenerate via `trellis-glb.mjs` (needs the
  `.env` `MODAL_ENDPOINT_URL` — never printed). Geometry logic should unit-test against a tiny synthetic
  mesh, not the 5 MB GLB, so the suite stays fast and offline.
- **Honesty + cost.** TRELLIS isn't bit-deterministic and the LLM-edit route is metered (`claude -p`), so
  the run isn't fully reproducible and burns some calls — acceptable (same as prior overnights), named.
  A null result (the 3-D target *still* doesn't move it) is a real, publishable finding — report it.
