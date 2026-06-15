# Research — T-083-01 hollow-cottage-milestone (E-23 terminal, S-083)

Descriptive map of what exists. This is the **integration milestone** of E-23: it proves the 2.5-D
interaction sector by exercising **both paths** (judgement + program) and **both gates** (resemblance +
plausibility) on **one** build — a hollow, accurate-looking cottage with an N×M grid infill. Almost all the
machinery already exists in the four dependency tickets; this ticket is mostly **wiring already-tested cores
into one chain** plus the milestone's own deliverables (a cutaway view, both gates in one report, the E-12
handoff, the design-learnings section).

## The four dependencies (all `phase: done`)

| Ticket | Path / role | Key pure cores (`src/view/`) | Runner | Live result |
| --- | --- | --- | --- | --- |
| **T-079-01** spray-paint | judgement path — restore exterior accuracy | `face-paint`, `glb-splat`, `palette-cans`, `face-resemblance` | `spray-paint.mjs` (`spray:paint`) | plaster `white_terracotta` **8 → 315**, front face gate 0.25→0.40 |
| **T-080-01** hollow-the-mass | program path — carve interior | `hollow-carve` (`markHollowable`/`carveArtifact`/`exteriorHeld`) | `hollow-cottage.mjs` (`hollow:cottage`) | cavity 6438→5465 (**973 carved**), exterior byte-identical |
| **T-081-01** N×M floorplan | program path crossing into **design** | `floorplan` (`generateFloorplan`/`gateFloorplan`/`isFillHidden`) | `floorplan-cottage.mjs` (`floorplan:cottage`) | 2×3 grid, 433 placements, plausibility **PASS**, exteriorHeld true |
| **T-082-01** model routing | model-scoped ops | `model-tier` (`runTieredOp`/`OP_ROUTING`), `roof-patch`, `hollowable-mass` | `detector-routing.mjs` (`detect:routing`) | hollowable on **Haiku** (light), floorplan-author **strong** |

Each runner is **self-sufficient** and writes to its own `docs/active/work/T-0XX-01/`. They share one subject:
the raw cottage at `benchmarks/sculpture/concept-materials/cottage/after-artifact.json`, its concept at
`benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png`, and its textured GLB at
`benchmarks/sculpture/glb/cottage.glb`.

## The chain that produces ONE milestone build

The geometry of each stage is **append-only / flatten-by-exclusion** (no air op — `[[facade-recess-by-
exclusion]]`), so the stages compose cleanly on a single artifact:

1. **raw cottage** → **spray-paint** recolors *skin* placements (front via concept-splat, side via GLB-splat).
   Paint is **geometry-safe** (T-079 invariant: expand positions identical, only block ids change), so every
   downstream geometric read/carve/fill is unaffected by whether the build is painted.
2. **paint → seal** (`sealRoof` + `sealWalls`): closes **coherence holes** in the skin so the interior is
   enclosable. **It does NOT close the designed door/window openings** — `watertightCheck` reports the sealed
   cottage is still `watertight:false` (2507 ray-interior cells reach outside via real doors). This is why
   the front camera can later look *through the front door* into a room.
3. **seal → hollow carve** (`markHollowable` → `carveArtifact`): removes the enclosed mass minus protected
   structure (`cornerPostKeys ∪ tallColumnKeys`); `exteriorHeld` proves the 6-ortho digest is invariant.
4. **hollow → floorplan fill** (strong-tier `floorplan-author` → `generateFloorplan` → `applyFloorplan`):
   N×M grid, floors at storey lines, walls on the grid, doorways by exclusion; every placement gated by
   `isFillHidden` (10-camera occlusion); `gateFloorplan` scores six plausibility constraints.

Because paint only rewrites skin block ids, the final build is **exterior-accurate (half-timber) AND hollow
AND room-divided** — the milestone build.

## What is genuinely NEW for this ticket (small)

- **A render-only cutaway.** AC #2 needs "a from-below / cutaway view that *shows the hollow interior and the
  N×M floorplan*." The perspective renders already glimpse one room through the front door (T-081 residual),
  but that is not a clear section. The robust answer is a **render-only section copy** of the final artifact —
  clip the roof (plan/top section → shows the N×M grid from above) and/or clip the front half (3-Q section →
  shows stacked floors + grid walls in cross-section). The clip is **flatten-by-exclusion** — exactly the
  `carveArtifact(artifact, removeSet)` mechanism already shipped — so the only new pure piece is computing the
  remove-set from a clip plane. **The real build is never edited** (Rule 3); the section exists only to be
  photographed.
- **One report with BOTH gates.** Each dependency reports one gate. The milestone must report exterior
  **resemblance** (front face vs concept, before/after) AND interior **plausibility** (per-constraint), each
  with a **named residual** (Rule 7).
- **The E-12 handoff** (`pr/assets/`): face before/after + multi-angle + cutaway, plus a `pr/assets/*.md`
  narrative (the pattern of `beyond-facade.md`, `voxel-cleanup.md`).
- **The design-learnings §** (E-23): the view-matched-to-task abstraction, the two paths, the gate-switch at
  the craft→design line, the right-sized-model results, and where it over/under-reaches.

## Relevant shared infrastructure (reused, not modified)

- `src/view/occupancy.mjs` — `artifactOccupancy`, `bareBlock`. The voxel-world primitive every stage reads.
- `src/view/structural-read.mjs` — `structuralRead` (footprint **26×32 / 662**, `floorLines [0,14]` → 2
  storeys), `openings(occ, dir)` (returns `[]` on this cottage — recessed doors read as no hole; the
  in-gate `openings-align` residual).
- `src/view/multi-angle.mjs` — `renderViews` (E-22 fixed lens, SSAA ×3) + the angle table. Names available:
  ortho `front/back/right/left/top/bottom`, diagonals `+x+z/+x-z/-x-z/-x+z`, `threeQuarter`. **`bottom`
  (elevationDeg −89.9) is the "from-below" angle**; `top` is the plan.
- `src/model-tier.mjs` — `runTieredOp({tier, prompt, images, invoke})` over the `claude -p` shim;
  `OP_ROUTING` already has `floorplan-author=strong`, detectors `=light`.
- `src/sdk-binding.mjs` — `requestTextWithImage` (the DI-able metered invoker).
- `render/src/render-tool.mjs` — `renderArtifact` (the GL edge, lazy-imported).
- `src/artifact.mjs` — `assertArtifact` (AJV gate; the painted/carved/filled build must stay valid —
  `[[prompt-vs-live-artifact-schema]]`).

## Constraints / assumptions surfaced

1. **No build edits to flatter the verdict (Rule 3).** Paint reverses a *real* regression; the cutaway is a
   render-only section, clearly labelled. The exterior-held proof is on the **real** final artifact.
2. **Both gates must be honest (Rule 7).** Resemblance: the E-22 cottage verdict was `drifted`, residual =
   *material zoning @ upper-story walls* → spray-paint targets exactly that, so the residual should move
   **off the face** (the AC's "drifted with the face no longer the gap"). Plausibility: the floorplan gate's
   `openings-align` is a steered, not geometrically-verified, residual.
3. **Metered cost is two calls.** The milestone fires the **light** hollowable detector and the **strong**
   floorplan-author — both tiers exercised (the model-scoped AC). Spray-paint's splat path is deterministic
   (`--refine` stays off). Each runner already **degrades gracefully** if the shim / GL / `dwebp` is absent.
4. **Same-object correspondence assumption.** The concept's front is the **+z** face; `DIR_TO_ANGLE` maps it
   to the `front` render. If a subject's designed front sat elsewhere this mapping would need revisiting
   (T-079 open concern #3) — fine for the cottage.
5. **No stair / vertical circulation.** Reachability is per-storey (T-081 open concern #4) — out of scope.
6. **`npm test` baseline** was **965** after T-081. The milestone adds only a small pure cutaway helper +
   tests; the chain itself reuses tested cores and is exercised by the (metered/GL) runner, not the suite.
