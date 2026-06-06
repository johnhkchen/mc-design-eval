---
id: E-23
title: spatial-interaction-layer-and-hollow-cottage
type: epic
status: open
priority: high
depends_on: [E-21, E-22]
spec: "§1, §5, §6, §9"
stories: [S-078, S-079, S-080, S-081, S-082, S-083]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. Form comes from voxelizing a TRELLIS image→3D mesh; material/value from CIE-Lab matching
(E-14) + concept-grounded LLM material maps (E-21); the render lens is now faithful and sign-off is a
reference-anchored resemblance gate (E-22).

**The wall this epic breaks.** Every editing lever so far operates on the **raw 3-D voxel representation**,
and it does not fit the LLM:
- The E-15 surgical loop **overflowed context** on a real build — a 57k-block region's placement list hit
  ~1.25M tokens vs the 1M limit ([[surgical-edit-path-scale-limit]]). Per-voxel 3-D editing does not scale.
- The cottage's half-timbered face failed (E-22 routed it): the material map was **correct**
  (`white_terracotta` plaster + `dark_oak_log` timber over a `stone_bricks`/`cobblestone` base), but the
  feature-aware placer **collapsed the plaster into stone** (215 → 8 plaster blocks; walls 78–88%
  stone_bricks). Cause: plaster and stone both carry `placementRule: "walls"`, and the feature classifier
  has a *geometric* axis but **no spatial/storey axis** — it cannot tell an upper-storey wall from a
  ground-floor wall, so one material ate the feature. The distinction the concept lives on (three stacked
  bands: stone / timber+plaster / roof) is exactly what a 3-D feature matcher is blind to.

**The insight.** The LLM is bad at reasoning over a 57k-point voxel cloud and great at looking at a 2-D
image and saying where things go. So **stop handing it the voxels; hand it a view.** Project a face of the
build into a 2.5-D surface (a 2-D grid backed by per-cell depth + normal), let the model *paint materials
onto the wall* with the design-doc palette (the "4 cans"), and back-project the paint to the voxels. On a
painted wall, "the upper band is plaster" is a horizontal stripe — the thing that has **no expression** in
3-D feature space becomes trivial. The abstraction is cut along the seam where the old representation made
the easy thing impossible. *(Metaphor: walking up to a wall with four spray cans, instead of breaking reeds
apart to improvise a brush.)*

**Two paths off one feature zone (the 2.5-D interaction sector).**
- **Programs where they help** — deterministic/parameterized ops the LLM *authors or steers*: hollowing the
  mass, generating an N×M floorplan grid, filling N storeys. The LLM writes/steers the generator; the
  program does the bulk placement. Inspectable, scalable, re-runnable.
- **LLM judgement where it can't be done otherwise** — visual/semantic calls only a model can make: which
  band is plaster, which parts of the roof to patch, which mass is hollowable. Scoped to a *view*, so the
  call is small and well-posed.

**Agentic-engineering stance (right-sized models).** Because each op is scoped to a view, many sub-tasks
become narrow enough for a **lighter, cheaper model tier** — "find the roof cells that need patching,"
"mark the hollowable interior." Scope a task tightly enough that a small model suffices; escalate to a
stronger tier only for judgement that demonstrably needs it. Lighter tiers are reached via the **same
`claude -p` subscription shim** with a per-task `--model` override (config.mjs single-sources the tiers) —
**never the metered API**. This is where the project starts doing real multi-model agentic engineering.

## Goal

Build the **2.5-D interaction layer** — the substrate that lets the LLM work on a build through *views
matched to the task* — and prove it with a milestone that exercises **both paths and both gates**:

> **A hollow, accurate-looking cottage with an N×M grid infill.**
> - *Accurate* (exterior, **craft / reference / resemblance-gated**): the half-timbered face is restored by
>   **spray-painting materials** on the projected wall (the plaster band returns); the build reads as the
>   concept.
> - *Hollow + N×M grid infill* (interior, **design / no-reference / plausibility-gated**): a program the LLM
>   authors **hollows the mass** to a shell + structure and **fills the N storeys** with an N×M floorplan
>   grid (floors at the structural storey lines, dividing walls, openings aligned to the exterior).

```
build (voxels) ──▶ VIEW LAYER  (read from any angle: ortho + 45° + full 3-axis;
                                 paint-back only on well-conditioned ortho/45° projections)
                        │
                        ├─ STRUCTURAL READ  → footprint, storey bands, opening positions  (shared primitive)
                        │
   PATH B (judgement) ──┤── SPRAY-PAINT materials on a face  → back-project → resemblance-gate vs concept face
   PATH A (programs)  ──┤── HOLLOW the mass (LLM marks hollowable → program carves shell)  ─┐
                        └── N×M FLOORPLAN program fills N storeys (from the below/plan view) ┘─ plausibility-gate
                        │
                        └─ ops scoped to RIGHT-SIZED MODEL TIERS (light for narrow detectors; strong for judgement)
```

## Why now / why this shape

- **It's the fix for the bug we just found** (cottage face) *and* the lever that scales (a face is hundreds
  of cells, not 57k voxels — it fits context where the 3-D region did not).
- **It matches the tool to the model.** The LLM's strength is 2-D visual reasoning against a reference; the
  spray-can interface and the view-matched-to-task pattern play to it instead of fighting it.
- **It is the first deliberate step across craft → design — done consciously.** Interiors have **no
  reference** (the concept and GLB are exterior shells), so "break the space into rooms" is *invention*, not
  reproduction. We handle it with the **program-author pattern** (the world-builder shape in miniature:
  decompose → generate → verify) and a **constraint/plausibility gate**, because the resemblance gate has
  nothing to compare an interior to.
- **It opens multi-model agentic engineering** — the scoped-view ops are where lighter tiers first earn
  their place.

## Scope

**In:**
- (a) **View layer** — render/read the build from ortho + 45° + arbitrary 3-axis angles (the E-22 fixed
  lens), and a **2.5-D projected surface grid** (2-D cells + depth + normal) for paint-back on the
  well-conditioned ortho/45° projections.
- (b) **Structural read** — footprint, storey bands, opening positions from the occupancy (pure/geometric).
  The shared primitive: the storey line serves *both* material banding (where plaster starts) *and* floor
  heights (where storeys sit).
- (c) **Spray-paint (Path B, craft)** — a face-paint tool with the **enforced** design-doc palette
  (∪ E-21 concept-justified additions); LLM paints → back-project → per-face accept-if-closer vs the
  concept face (resemblance-gated). Fixes the cottage face.
- (d) **Hollow (Path A, program)** — LLM marks the hollowable interior (scoped detector) → a deterministic
  program carves it to a shell + structural members, **preserving the exterior skin** the resemblance gate
  signed off.
- (e) **N×M floorplan (Path A, design)** — from the below/plan view, the LLM **authors/steers a floorplan
  generator** that partitions the footprint into an N×M grid and fills the N storeys (floors at the
  structural storey lines, dividing walls, openings aligned to the shell). **Constraint/plausibility-gated.**
- (f) **Right-sized model routing** — a per-op model-tier seam over the `claude -p` subscription shim;
  exemplar narrow detectors (roof-patch, hollowable-mass) on a light tier; the principle + the seam.
- (g) **Milestone consolidation** — the hollow accurate cottage, shown from ortho + 45° + oblique + a
  from-below/cutaway view; both gates reported; journaled; E-12.

**Out:** SAM / pixel-accurate region textures (deferred); changing the *form* geometry from E-16/E-20
(the shell's massing stays; we hollow and skin it, we don't re-sculpt it); world-scale multi-building
composition (this is one building — the substrate it proves *is* the later composition substrate, but the
composition epic is separate); the brief/rubric (immutable); arbitrary-oblique **paint-back** (reading from
any angle is in; *writing* paint stays on ortho/45° where back-projection is unambiguous).

## Candidate stories & DAG

```
S-078 view layer + structural read (substrate)
   ├─▶ S-082 right-sized model routing (seam + exemplar detectors)
   ├─▶ S-079 spray-paint materials (Path B, craft, resemblance-gate) ─┐
   └─▶ S-080 hollow the mass (Path A, program) ─▶ S-081 N×M floorplan  ┤
                                                  (Path A, design,      │
                                                   plausibility-gate)   │
                                                                        ▼
                                              S-083 milestone: hollow accurate cottage + consolidation
```

- **S-078 — view-layer-and-structural-read.** The substrate: read from ortho/45°/full-3-axis (E-22 lens);
  the 2.5-D projected surface grid (cell + depth + normal) for paint-back on ortho/45°; the structural read
  (footprint / storey bands / openings). Projection math + structural read are pure/GL-free + unit-tested;
  only the rendered views need GL.
- **S-079 — spray-paint-materials (Path B / craft).** The "4 cans" face-paint tool: project a face, LLM
  paints with the enforced palette, back-project, per-face accept-if-closer vs the concept face
  (resemblance-gated). Restores the cottage plaster band (215→8 regression reversed).
- **S-080 — hollow-the-mass (Path A / program).** LLM marks the hollowable interior (scoped detector) → a
  deterministic carve to shell + structure, exterior skin preserved (resemblance unchanged after hollowing).
- **S-081 — nxm-floorplan-infill (Path A / design).** From the below/plan view, the LLM authors/steers a
  floorplan generator → N×M grid, N storeys filled (floors at storey lines, dividing walls, aligned
  openings). **Plausibility-gated** (valid rooms, reachable, fits envelope, storey count matches) — not
  resemblance.
- **S-082 — right-sized-model-routing (agentic).** A per-op model-tier seam over the subscription shim;
  exemplar light-tier detectors (roof-patch, hollowable-mass); the scope-tight-→-light-model principle.
- **S-083 — hollow-cottage-milestone.** Bring it together: exterior accurate (S-079), hollowed (S-080),
  N×M-infilled (S-081), ops model-scoped (S-082). Both gates; multi-angle + from-below cutaway renders;
  journal; E-12.

## Definition of done

- **The milestone exists:** a cottage that (1) reads as the concept on the exterior — plaster band restored,
  resemblance gate at *same-object* or a materially-narrowed *drifted* with the face no longer the gap — and
  (2) is **hollow** (shell + structure) with an **N×M grid floorplan filling N storeys**, the interior
  passing a **plausibility gate** (valid, reachable rooms; floors at storey lines; openings aligned).
- **Both paths are demonstrated off the one feature zone:** a **judgement** op (spray-paint) and **program**
  ops (hollow, floorplan), all driven through the 2.5-D view layer.
- **Right-sized models are real:** at least the two exemplar detectors run on a **light tier via the
  subscription shim** (never the API), with the scoping rationale recorded.
- The exterior **resemblance** gate (E-22) and the new interior **plausibility** gate are both reported,
  honestly (Rule 7 — a residual is named, not hidden); multi-angle + from-below cutaway renders saved;
  `npm test` green; journal + E-12 handoff.

## Orchestration notes (for the autonomous run)

- **Runs after E-21/E-22** (correct materials + honest gate first; this layer fixes the *placement* the
  material map already got right, and reuses the resemblance gate). On main, journaled.
- **GL-free where it counts.** Projection math, the structural read, the carve, and the floorplan generator
  are **pure/deterministic** (built + unit-tested on synthetic occupancy — lisa has no headless GL); the
  rendered views, the spray-paint judgement, the detectors, and the floorplan reasoning are the metered
  multimodal/`claude -p` edges. Paint-back is verified on ortho/45° only.
- **Model tiers stay on the subscription shim.** "Smaller models" = a per-task `--model` override on
  `claude -p` (config.mjs single-sources the tier IDs); the API key must never enter the path (the standing
  Phase-1 invariant).
- **Two gates, not one.** Exterior = resemblance (reference = concept). Interior = plausibility (no
  reference — do NOT route an interior through the resemblance gate; it has nothing to compare to). Keep them
  separate in code and in the report.
- **Honesty.** If a face won't paint clean, if the carve breaks the skin, or if the floorplan is implausible,
  that is a recorded result with the gap named — not papered over. A hollow cottage that's *almost* right
  with a named residual beats a faked pass.
