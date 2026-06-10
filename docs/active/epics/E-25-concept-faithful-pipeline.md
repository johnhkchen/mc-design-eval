---
id: E-25
title: concept-faithful-pipeline
type: epic
status: open
priority: high
depends_on: [E-22, E-24]
spec: "§2, §5, §6, §9"
stories: [S-090, S-091, S-092, S-093, S-094, S-095]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. Form comes from voxelizing a TRELLIS image→3D mesh; materials are assigned by a
concept-grounded LLM map (E-21) through the 2.5-D interaction layer (E-23) with a deterministic zone-fill
base coat (E-24); sign-off is a reference-anchored resemblance gate (E-22).

**The state of the art, measured honestly (2026-06-10, on the committed cottage artifact).** A full audit
of every current render against its concept art found these defects, ordered by severity:

1. **Roofs pass "covered from the sky" but fail "reads as a roof from anywhere a viewer stands."** The
   cottage roof is **96.7% spruce when projected straight down** (640/662 columns) — yet the roof band's
   full *exposed surface* is only **42.7% spruce, with 33.5% stone bricks + 10.2% cobblestone** (over a
   thousand grey cells, far beyond any chimney). At the oblique angles every triptych uses, the roof reads
   as a chaotic grey-and-brown jumble with sky visible between course steps. The zone-fill covered the
   plan view; the **side faces of the roof zone were never skinned**.
2. **Shell voids and floating debris.** The gatehouse has a gaping dark cavity in its upper-right that the
   concept does not have. The cottage artifact contains **23 connected components — 126 floating cells**
   (one 54-cell chunk, one 20-cell) visible as debris around the silhouette. A retired subject (moai) was
   dominated by leftover rail/beam debris joining two fragmented masses.
3. **The zone *map* itself doesn't match the concept.** The cottage concept is a half-timbered building on
   a low stone **plinth** — cream plaster + dark timber on **both** storeys, stone only at the base course
   and corners. Our zone model hard-assigns the whole ground storey to stone (57.9% of the base band's
   surface). Even *perfect execution* of the current map produces a different cottage than the concept's.
   The gatehouse map invented a brown base band on an all-stone building. The boundaries and dominants
   come from **building priors**, not from the concept.
4. **Single-angle gating lets oblique failures hide.** The resemblance gate (E-22) judges one shared 3/4
   view. The roof jumble, side-wall residue, and shell voids are at their worst precisely on the views the
   gate never sees.

**The lesson behind all four:** every fix so far that *worked* was a deterministic pipeline stage grounded
in geometry (zone-fill, seal, floor-lines); every defect that *persists* is a surface or view the pipeline
never enumerated (roof side faces, off-main components, non-gated azimuths) or a parameter a prior
hard-coded instead of reading from the concept (zone bands). This epic closes those by construction, not
by per-subject patching.

## Goal

A **working concept→model pipeline**: one named `npm run` per subject that takes an immutable concept
image to a build a human can put **next to the concept art and see the same building, from any angle** —
proven by a subject the pipeline has never been tuned on.

```
concept image (immutable, sanity-checked)
  ─▶ TRELLIS GLB ─▶ voxelize ─▶ SHELL INTEGRITY     one component, no voids, closed from all 6 directions
  ─▶ CONCEPT-DERIVED ZONE MAP                       band boundaries + dominants read FROM the concept, not priors
  ─▶ FULL-SHELL ZONE-FILL (E-24 core, extended)     every exposed face of every zone — roof sides included
  ─▶ value-true blocks (E-24) ─▶ secondaries splat/LLM ─▶ coherence (courses, salt, debris)
  ─▶ MULTI-ANGLE SAME-OBJECT GATE                   concept | build at 4 azimuths; judge each; gaps named
```

## Rules of engagement (stronger goal requirements — binding)

1. **The deliverable is the picture.** The terminal verdict is a **multi-angle contact sheet** (concept
   beside the build at all 4 gated azimuths) that a human can look at and recognize the concept's
   building. Coverage numbers, IoU, and ΔE are supporting evidence; **no number substitutes for the
   sheet**. A claim of success that does not attach the fresh contact sheet is not a result.
2. **The concept is immutable once registered.** No re-generating, cropping, color-adjusting, or swapping
   concept art mid-loop to flatter the build. If a concept is genuinely unusable (the moai lesson), it is
   **retired with a recorded rationale and replaced before kickoff**, never during a loop.
3. **No subject-specific hand-tuning.** A subject enters the pipeline as a **registry entry only**
   (concept path, GLB path, scale). A per-subject constant, branch, or threshold inside pipeline code is a
   **fail** — that's patching the test, not building the system. The challenge subject (S-094/S-095)
   exists to make this checkable: it must pass through code that has never seen it.
4. **No shrinking the test.** All 4 gate azimuths render at the contract resolution every time. Dropping
   an angle, gating only the friendliest view, lowering resolution, or shrinking the build to dodge a
   defect is a fail (inherits E-22's resolution floor).
5. **Robust over quick.** Every fix lands as a **unit-tested pipeline stage** behind the named `npm run`
   (inherits E-24 Rules 1–2: no hand-edited artifacts, seeded/stable re-runs). A defect fixed by editing
   an artifact, or by a one-off script outside the pipeline, is not fixed.
6. **Honest gaps beat faked passes.** "Drifted, gap named, here is the angle and region" is a valid
   recorded result. Silently relaxing a threshold, or reporting the one angle that passes, is not.

## Scope

**In:** (a) **full-shell zone-fill** — extend E-24's base coat to *every exposed face* of every zone
(roof side faces, under-eave, gable edges); (b) **shell integrity & debris** — single connected component,
void/cavity repair distinguished from legitimate concept openings, closure from all six directions; (c)
**concept-derived zone map** — band boundaries and per-zone dominants read from the concept image aligned
to floor-lines, replacing the stone-base prior; (d) **multi-angle same-object gate** — 4 fixed azimuths,
per-angle categorical judgement, contact sheet as the verdict artifact; (e) **subject roster refresh** —
retire moai (ambiguous concept: three statues in one frame, black background, fragmented mesh), add one
new challenge building subject behind a concept sanity checklist; (f) the **challenge milestone** — the
new subject passes end-to-end through untuned code, alongside cottage + gatehouse.

**Out:** interiors (E-23 floorplan path — this epic is the exterior promise); SAM / pixel-accurate region
textures (deferred); sculpture-specific zone generalization (pineapple's palette drift is noted; organic
zones are a follow-on — this epic proves the *building* pipeline); the brief/rubric (immutable); form
sculpting beyond shell repair (the capability-class problem stays behind the E-15 cage).

## Candidate stories & DAG

```
S-094 subject-roster-refresh (retire moai, add challenge subject)──────────────┐
S-091 shell-integrity-and-debris (component strip, void repair, 6-dir closure)─┤
S-090 full-shell-zone-fill (roof side faces; every exposed face)──┬────────────┼─▶ S-095 challenge-milestone
S-092 concept-derived-zone-map (bands + dominants from concept)───┤            │   (untuned subject passes,
S-093 multi-angle-same-object-gate (4 azimuths, contact sheet)────┴────────────┘    contact sheets, E-12)
```

- **S-090 — full-shell-zone-fill.** E-24's zone-fill covers wall fields; the roof zone's *side-exposed*
  faces stayed grey (42.7% spruce on a roof that's 96.7% spruce from above). Fill **every exposed face**
  of every zone with the zone's dominant (secondaries preserved), so the build is skinned from any angle.
- **S-091 — shell-integrity-and-debris.** One connected component (strip the cottage's 22 off-main
  components / 126 floating cells); detect and repair shell voids that the concept doesn't show (the
  gatehouse cavity) while preserving legitimate openings (doors, windows); closure verified from all six
  directions, not just the sky.
- **S-092 — concept-derived-zone-map.** Read the band structure *from the concept*: a height-band color
  profile of the concept image, aligned to the structural floor-lines, yields each band's boundary and
  dominant role. Fixes the cottage plinth-vs-storey error and the gatehouse's invented brown base. The
  prior becomes a fallback, never an override.
- **S-093 — multi-angle-same-object-gate.** The E-22 gate, widened: 4 fixed azimuths × the categorical
  judge, a coverage precondition per angle (E-24), and a **contact sheet** as the verdict artifact. Pass =
  same-object at every angle, ≤2 named minor gaps total.
- **S-094 — subject-roster-refresh.** Retire moai from the resemblance roster with recorded rationale.
  Add the new challenge subject — **a village church with a square bell tower** — generated behind a
  **concept sanity checklist** (single building, clean background, canonical 3/4 view, ≥3 distinct
  material zones, no thin/freestanding features per the TRELLIS thin-subject limit).
- **S-095 — challenge-milestone (terminal).** Cottage, gatehouse, and the church each produced by one
  named `npm run` end-to-end; the church proves generalization (registry-entry-only — zero
  subject-specific code); all three pass the multi-angle gate; contact sheets + before/after saved;
  journal + E-12 handoff.

## Definition of done

- **Visible resemblance:** for cottage, gatehouse, and the church, the multi-angle contact sheet shows the
  concept's building at every gated azimuth — judged same-object per angle, residual gaps named (≤2 minor).
- **No hidden surfaces:** every exposed face of every zone carries its zone's skin (roof side faces
  included); the build is one connected component; no voids the concept doesn't show; closed from all six
  directions except declared openings.
- **Concept-derived, not prior-derived:** the zone map's bands and dominants trace to the concept image
  (cottage shows plaster+timber storeys on a stone plinth; gatehouse shows no brown base).
- **Generalization:** the church passes through pipeline code that contains no reference to it beyond its
  registry entry — checked by review, not assertion.
- **Durable:** fresh `npm run` re-runs reproduce all three results (E-24 Rules inherited); `npm test`
  green; journal (`design-learnings.md`) + E-12 handoff.

## Orchestration notes (for the autonomous run)

- **Runs after E-24's core lands.** S-090/S-092 build on the E-24 zone-fill (T-085-01) and value-true
  selection (T-086-01); S-093 builds on the coverage gate (T-088-01); the terminal milestone (T-095-01)
  waits for E-24's consolidation (T-089-01). S-091 and S-094 are independent and can start immediately.
- **The challenge subject needs the metered edges**: concept generation (GEMINI key from `.env`) and
  TRELLIS (`MODAL_ENDPOINT_URL`, run unsandboxed). Both are existing, proven paths (`trellis-glb.mjs`).
  Secrets stay in `.env` — never committed, never printed.
- **GL-free where it counts:** shell ops (component strip, closure check, full-shell fill) and the
  concept band profile are pure/deterministic, built and unit-tested on synthetic occupancy first; the
  judge and concept/TRELLIS calls are the metered edges.
- **Honesty.** If the church comes out drifted, that is the epic's *finding* — name the gap, attach the
  sheet. The epic fails only if the result is untrustworthy (hand-edits, dropped angles, swapped concepts),
  not if it is honestly imperfect.
