# Concept sanity checklist — `barn` (T-116-01, E-29 fourth subject)

Gate BEFORE registration (E-25 Rule 2: once registered, the concept is immutable). Items 1–6 are
the standing S-094 checklist; item 7 is the TRELLIS-viability constraint. Judged by visual
inspection of the PNG. Provisioning: `provision-concept.mjs` (vConcept building mode, stages 1+2;
design doc by the pinned Phase-1 model, image by Nano Banana pro via BAML
`BuildingConceptPrompt`, gemini-3-pro-image-preview).

## Subject decision — tithe barn, not the L-plan coaching inn (recorded per AC 1)

The ticket's candidate was an *L-plan coaching inn with a jettied upper storey*; its fallback —
taken here — a *rectangular tithe barn*. Reasons, grounded in the T-115 component set:

1. **No valley rung exists.** The `provision-fit.mjs` roof ladder is gable-pair → hip-cap →
   flat-cap; nothing fits two perpendicular ridges meeting in a valley, so an L-roof lands on
   `flat-cap` *by construction* — the milestone would measure a known-missing rung, not
   generate-first transfer to a new subject.
2. **D2 decompose merges the L.** `component-decompose.mjs` splits masses by protrusion + height
   class; two same-height wings are one height class / one 4-connected plan component ⇒ ONE mass,
   so the per-mass ladder never even sees two roof regions.
3. **The jetty is pruned.** `provision-generate.mjs` omits unsupported protrusions
   (`mass-unsupported`, the gatehouse ×3 / church ×2 precedent) — the jettied overhang is exactly
   the geometry the support check removes, so the second test feature would be silently absent.

The barn is the cleanest subject inside the component set's expressive envelope that is still new
to every pipeline file; ≥3 material zones are supplied by the concept design instead of massing.

## Attempt 1 — `concept.png` — ✓ PASSED (first attempt; no regeneration needed)

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Single building | ✓ | One barn; no second copy, no turnaround panels |
| 2 | Clean background | ✓ | Solid uniform near-black — the prompt's asked-for ideal TRELLIS input |
| 3 | One canonical 3/4 view | ✓ | Long front facade + full gable end + roof read at once, slightly elevated |
| 4 | ≥3 distinct material zones | ✓ | Grey cobblestone wall field · lighter stone-brick quoins/buttresses/plinth · brown plank roof · timber wagon doors (×2, planked with hinge studs) |
| 5 | Readable silhouette | ✓ | Long box + steep gable — instantly "tithe barn" |
| 6 | No environmental clutter | ✓ | No ground plane, terrain, or scenery; floats on the dark field |
| 7 | Bulky throughout | ✓ | No spire, finial, pole, or thin freestanding member; the gable slit vent is recessed INTO the wall, not protruding; buttresses are thick engaged piers |

Bonus shape note: the buttress/quoin vs wall-field split depicts the E-21 brick≠cobble
near-tone distinction by *geometric feature* — exactly what the material map and feature
assignment are built to preserve.

## Sign-off (GLB + voxelization smoke-check) — ✓ PASSED with one NAMED deviation, registered 2026-06-11

`trellis-glb.mjs` (MODAL_ENDPOINT_URL from the gitignored `.env`, defaults decimation 150000 /
texture 1024 / seed 42) → `glb/barn.glb`: 6,511,456 bytes, glTF v2, magic OK, 322.2s.
Mesh: 138,513 verts / 141,220 tris.
sha256 `38de9931c26a70f9e6d0b7ed56702030913705149d16bb1cfd336a96639e5985` (the binary is
gitignored; this pin is the durable record).

`glb-smoke.mjs` swept scales 32/40/48/56/64 → 26-conn components 8 / 4 / 2 / 7 / 2, largest
fraction 0.9813 / 0.9962 / **0.9997** / 0.9973 / 0.9995. **The strict single-component gate FAILS
at every scale** — at the chosen working scale 48 the residue is exactly ONE floating cell at
(35,15,17) out of 3,579 (dims 48×21×26), TRELLIS mesh debris near the roof.

**Named deviation, and why it is accepted rather than re-rolled:**
- The defect class the gate exists to catch is *moai-style multi-mass fragmentation* (the recorded
  control: 3 components, largestFraction 0.5213). A 0.03% single-cell speck is not that class.
- The generate-first chain never consumes the raw voxelization: evidence is conditioned through
  `shellStage` before any fit (generated-milestone.mjs provisionStage). Probed through that exact
  call path (voxelize @48 → keysToArtifact → shellStage with the 4 gate-azimuth GLB silhouettes):
  **conditioned evidence = 7,157 cells, 26-conn = 1 component** — the speck is stripped before the
  component set ever sees the occupancy. The artifact itself contains zero blob cells by
  construction (`assertGeneratedProvenance`), so no mesh speck can reach the build.
- Re-running TRELLIS cannot help (seed 42 pinned ⇒ same mesh); regenerating a checklist-clean
  concept to chase one mesh cell would trade a measured, conditioned-away defect for concept
  roulette. E-25's regeneration license is for *concept* failures; items 1–7 above all pass.

Working scale: **48** for both `provision.scale` and `generated.scale` (registry-scale alignment,
T-115). Note this supersedes the design.md tiebreaker toward 32 — raw connectivity at 32 is
strictly worse (8 components, 19 stray cells); 48 follows the church building precedent.

**`barn` is hereby registered** (SUBJECTS in `benchmarks/sculpture/durable-skin.mjs` + the
kit-extract.mjs / material-map.mjs DATA lists: concept = this run's `concept.png`, glb =
`glb/barn.glb`, scale = 48). The concept is IMMUTABLE from this point (E-25 Rule 2). No build,
material map, zone map, or kit exists yet — the pipeline consumes it UNTUNED (E-25 Rule 3); the
records land in T-116-01 bootstrap order (material-map → challenge provision → zone-map → kit →
generated milestone).
