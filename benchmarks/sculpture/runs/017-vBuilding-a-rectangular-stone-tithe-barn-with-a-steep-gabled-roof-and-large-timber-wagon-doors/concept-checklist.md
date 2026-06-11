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

## Sign-off (GLB + voxelization smoke-check) — PENDING (appended after `trellis-glb.mjs`)
