---
id: E-27
title: parametric-reconstruction
type: epic
status: open
priority: high
depends_on: [E-25, E-26]
spec: "§1, §5, §6, §9"
stories: [S-102, S-103, S-104, S-105, S-106, S-107]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. The pipeline is now durable and accountable end-to-end (E-24/E-25/E-26): one named
`npm run` per subject runs shell → concept-derived zones → full-shell skin → placement grammar → opening
dressing → a kit-aware, 4-azimuth same-object gate, reproducibly, with subjects entering as registry
entries only.

**The finding that motivates this epic (E-25/E-26 milestones, measured 2026-06-10).** The styled cottage's
**walls are right** — banded, framed, shuttered, kit presence PASS with zero gaps — and the build still
**fails the resemblance gate on `form @ roof` at every oblique azimuth** (gatehouse likewise:
form/massing). Measured on the styled cottage artifact: **265 protruding cells with ≥4 of 6 faces
exposed** (spikes/fins — the fake criss-crossing "rafters" in every render), 146 of them in the roof band;
**21.7% of columns have a ≥3-block height cliff** against a neighbor. Decisively: the **shell-stage
artifact already carries 276 protrusions / 23.9% ragged columns** — the noise enters at **voxelization of
the decimated TRELLIS mesh**, and nothing downstream touches it: the component strip (T-091) removes only
*disconnected* debris (these are attached); void repair fills holes, it doesn't shave bumps; and the
full-shell zone-fill then paints every protrusion clean roof-brown, making the noise *more* convincing.

**The pattern, stated plainly:** every surface that now looks right is one the pipeline **re-authors from
geometry** (wall fields between frame lines, dressed openings); every surface that still looks wrong is
one it **inherits raw from the decimated mesh** (the roof, the gatehouse massing). The walls escaped
because zone-fill + grammar rewrite them wholesale. The roof is the last major surface still inherited —
and the instrument names it on every failing subject.

**The thesis: the reference is the spec, not the substrate.** Stop *sampling* the mesh into a blob and
skinning the blob. Instead: **regularize** the voxelized mass under a no-regress cage, **decompose** it
into major structural components, **fit parameters** to each component against the GLB (roof: eave line,
pitch, overhang, ridge; openings: arch spring line and radius), and **regenerate clean constructed voxel
geometry** from those parameters — including the Minecraft-native construction vocabulary a player would
use: **stair-block roof slopes, slab half-steps, arches**. This is the step from *approximating a 3-D
reference* to **building from it**. And it pays twice: a parametric component has clean planes, lines,
and fields, so the entire downstream skin/grammar/kit pipeline (E-24/E-26) operates on *defined*
structure instead of re-deriving it from noisy occupancy — the skinning pass gets easier because the
build is components, not one big blob.

Two prior lessons make this safe where free-form editing failed: the E-15 surgical loop proved whole-form
voxel edits **regress without a 3-D target** — here every fit is least-squares against the GLB with the
fit error recorded; and stair/slab/arch placement rides the **proven fixture-state path** (T-097: schema
`state` → renderer orientation, occupancy third-class semantics).

## Goal

From a 3-D reference to **clean constructed voxel constructs**: regularized mass, named parametric
components, Minecraft-native construction (stairs/slabs/arches), the skin applied to defined components —
and the gate verdicts move because the named gap (`form @ roof`) is removed at its source.

```
voxelized GLB (the blob)
  ─▶ REGULARIZATION CAGE      morphological de-spike/de-pit under no-regress (IoU vs GLB, closure, protected regions)
  ─▶ COMPONENT DECOMPOSITION  roof planes · wall slabs · masses · openings — named candidates with geometry
  ─▶ PARAMETRIC FIT + REBUILD roof-as-program (eave/pitch/overhang/ridge fit to the GLB) → regenerate clean geometry
  ─▶ SHAPED VOCABULARY        stair-run slopes, slab half-steps, arches over openings — built, not sampled
  ─▶ COMPONENT-AWARE SKINNING zone-fill / grammar / kit consume component definitions, not noisy occupancy
  ─▶ THE E-25/E-26 GATES      kit-aware + 4-azimuth same-object — the same instrument, honest verdicts
```

## Rules of engagement (binding)

1. **The reference is the spec, not the substrate.** Every reconstructed component's parameters are
   **fitted to the GLB** (least-squares or equivalent) with the **fit error recorded**. No freehand form
   invention on referenced exteriors — if a component can't be fitted within tolerance, that is a named
   finding, and the regularized sampled mass stays (honest fallback), never a made-up shape.
2. **No-regress cage on every form op.** Per gate azimuth, the build's silhouette IoU against the GLB
   must not drop beyond a declared tolerance; six-direction closure must hold; **protected sub-regions**
   (chimney, dormers, declared thin features) are never eroded or replaced unfitted. An op that regresses
   is rolled back automatically — the E-15 cage, now with the 3-D target it was waiting for.
3. **Constructs, not blobs.** A reconstructed component is **generated geometry with named parameters**
   — reviewable, unit-testable, reproducible. Stairs/slabs/arches are placed with correct block states
   through the proven T-097 path; an `unmapped` state in the render is a failure, not a warning.
4. **Components are the contract.** Downstream skin/grammar/kit consume the **component definitions**
   (planes, edges, fields, openings); they do not re-derive structure from occupancy where a definition
   exists. One source of truth — re-derivation from the blob is how the noise got skinned in the first
   place.
5. **Inherited, in full:** E-24 durability (named `npm run`, no hand-edits, seeded/reproducible), E-25
   anti-tuning (registry-only subjects, immutable concepts/GLBs, all azimuths, honest named gaps), E-26
   kit accountability.

## Scope

**In:** (a) the **regularization cage** — deterministic morphological open/close de-spiking/de-pitting
under Rule 2, generic over subjects; (b) **component decomposition** — segment the shell into named
structural components (roof planes, wall slabs, attached masses, openings) from the structural read +
GLB; (c) **roof-as-program** — fit and regenerate the roof (gable/hip first), including **stair-course
slopes** and slab transitions; (d) **shaped construction vocabulary** — generalize clean-construct
generation: stair runs for slopes, slabs for half-steps, **arches over openings** (the gatehouse arch,
church windows); (e) **component-aware skinning** — the E-24/E-26 skin/grammar pipeline consuming
component definitions (roof courses follow generated planes; frame lines from component edges; zone maps
re-pinned where the rebuilt geometry shifts bands — expected to unblock the church's band0 0.33 skin-gate
refusal); (f) the **reconstructed milestone** — cottage + gatehouse + church through the full styled
pipeline on reconstructed forms, judged by the unchanged gates.

**Out:** organic/sculpture reconstruction (no parametric grammar for a koi — the cage-guarded
regularization may help them later; noted, not built); interiors (E-23); changing the gates to flatter
the rebuild (the instrument is frozen — the whole point is moving the *verdict*, not the bar); TRELLIS
itself (mesh quality is upstream; we reconstruct from whatever it gives); the brief/rubric (immutable).

## Candidate stories & DAG

```
S-102 regularization-cage (de-spike under no-regress) ──────────────┬─▶ S-107 reconstructed-milestone
S-103 component-decomposition (blob → named components) ─┬─▶ S-104 roof-as-program ──┬─▶ S-106 component-aware-skinning ─┘
                                                         └─▶ S-105 shaped-vocabulary ┘
```

- **S-102 — regularization-cage.** Morphological open/close on the voxel shell: shave attached
  spikes/fins (the 265 protrusions), fill pits — every step accepted only if the cage holds (silhouette
  IoU vs GLB per azimuth, closure, protected regions). Generic; runs before decomposition and stands
  alone for subjects with no parametric grammar.
- **S-103 — component-decomposition.** Segment the regularized shell into **named components with
  geometry**: roof planes (normal, extent), wall slabs, attached masses (tower vs nave), opening groups —
  from the structural read + GLB. The decomposition is the contract everything downstream consumes.
- **S-104 — roof-as-program.** Fit the roof component parametrically against the GLB (eave line, pitch,
  overhang, ridge; gable/hip), **replace** the sampled roof mass with generated geometry, and build the
  slopes the Minecraft-native way: **stair courses** with slab transitions, full blocks where pitch
  demands. Fit error recorded; cage enforced; the fake rafters gone at the source.
- **S-105 — shaped-vocabulary.** The general clean-construct generators: stair-run slopes, slab
  half-steps, **arches** (spring line + radius fit to the opening) — applied to the gatehouse arch and
  church openings. Pure generators, unit-tested on synthetic specs, placed via the proven state path.
- **S-106 — component-aware-skinning.** The E-24/E-26 skin/grammar/kit pipeline consumes component
  definitions: roof courses follow the generated planes; frame lines come from component edges; zone maps
  re-derived/re-pinned on the rebuilt geometry (church band0 re-measured — the expected unblock). No
  re-derivation from occupancy where a definition exists (Rule 4).
- **S-107 — reconstructed-milestone (terminal).** Cottage, gatehouse, church through the full styled
  pipeline on reconstructed forms — one named `npm run` each, reproducible — judged by the **unchanged**
  kit-aware + multi-angle gates. The claim under test: removing `form @ roof` at the source moves the
  verdicts; protrusion/raggedness metrics before/after recorded beside the sheets.

## Definition of done

- **Clean constructs:** protrusions (≥4-face-exposed cells) and ragged-column rate reduced to declared
  targets on all three subjects (from 265 / 21.7% on the styled cottage), with the roof a generated
  parametric component (fit error recorded), not a sampled blob — and no cage regression anywhere.
- **Built, not approximated:** roof slopes read as stair-course construction; the gatehouse arch and
  church openings are generated arches; all states render correctly (`unmapped` empty).
- **Components feed the skin:** skin/grammar/kit run on component definitions; the church passes its
  skin-gate refusal point or the residual is named with its measured cause.
- **The verdict moves:** the multi-angle gate re-judged on all three subjects with the instrument
  unchanged; `form @ roof` no longer the named gap — full passes or honestly named residuals, per
  subject, recorded beside before/after sheets and metrics.
- **Durable + general:** all via named `npm run`, reproducible, registry-only subjects; `npm test` green;
  journal (`design-learnings.md`) + E-12 handoff.

## Orchestration notes (for the autonomous run)

- **Runs on the E-25/E-26 spine**; the gates are consumed frozen (Rule on not moving the bar). S-102 and
  S-103 are independent of each other and can start immediately; S-104/S-105 need S-103; S-106 composes;
  S-107 is terminal.
- **GL-free where it counts:** the cage metrics (IoU, closure, protrusion census), decomposition, fits,
  and generators are pure/deterministic, built and unit-tested on synthetic shells first; renders and the
  judge are the metered edges. GLB silhouettes for the cage come from the existing mesh-render path.
- **The cage is the safety system.** Every form op in this epic mutates geometry — the one thing no prior
  epic dared. The cage (Rule 2) is what makes that safe: target-anchored, auto-rollback, protected
  regions. Build the cage first (S-102), then let everything else operate inside it.
- **Honesty.** If a roof can't be fitted within tolerance (a genuinely irregular mesh), if stair-course
  construction reads worse than full blocks at some scale, or if the church stays blocked, those are
  recorded findings with measurements — not papered over.
