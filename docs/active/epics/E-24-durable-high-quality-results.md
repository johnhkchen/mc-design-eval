---
id: E-24
title: durable-high-quality-results
type: epic
status: open
priority: high
depends_on: [E-21, E-23]
spec: "§5, §6, §9"
stories: [S-085, S-086, S-087, S-088, S-089]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. Form comes from voxelizing a TRELLIS image→3D mesh; material is assigned by a
concept-grounded LLM map (E-21) and applied through the 2.5-D interaction layer (E-23 — project a face,
splat a per-cell target, back-project, gate per-face). The render lens is faithful and sign-off is a
reference-anchored resemblance gate (E-22).

**The failure this epic fixes (the cottage skin saga — all witnessed, all measured).** Getting the
cottage's half-timbered skin right exposed four problems that compound into "it still looks wrong, and we
can't reliably make it right":

1. **The splat can't establish a zone's dominant material.** The concept-COLOR splat converted only **9%**
   of the upper-storey wall to plaster — **64% stayed stone** — because quantization collapses the concept's
   cream/timber/stone to near-tones and the concept→face stretch misaligns the bands. The upper storey still
   read grey ("looks the same"). A structural **zone-fill** (fill the upper band's wall-field with plaster,
   keep the timber studs) took it to **77% plaster** — *but that was applied by hand, inline.*
2. **Not durable.** That good result exists only because an agent hand-edited the artifact; `npm run
   spray:paint` regenerates the **9% sparse-splat** version. A result the pipeline can't reproduce is not a
   result.
3. **Wrong block value.** The plaster block (`white_terracotta`) renders **pink**, not the concept's warm
   cream — the role was chosen by name, not validated for value against the concept ([[value-true-palette-codesign]],
   [[concept-image-not-color-value-preview]]).
4. **The gate was fooled again.** The per-face gate **accepted** a `0.25→0.40` marginal gain on a wall that
   was **91% un-plastered** — a number rubber-stamped an un-skinned surface ([[render-aliasing-not-material-speckle]]).

Plus the roof still reads **chunky / speckled** (coverage is watertight per S-084, but the plank *courses*
are noisy).

**The thesis.** *Zone-fill the dominant, splat/judge the details — durably, value-true, coverage-gated.*
The base coat of each structural zone is a **deterministic fill** of that zone's dominant material; the
splat + LLM place only the **secondaries** (timber studs, trim, accents). The block per role is chosen
**value-true** against the concept. The gate **rejects under-application** so an un-skinned wall can never
pass. And every result is produced by the **pipeline end-to-end** — no hand-edited artifacts.

## Goal

Make high-quality skinned builds that the **pipeline reproducibly produces** and a hardened gate **can't be
fooled** into passing when they're wrong. Prove it by re-skinning the **cottage + gatehouse** end-to-end via
`npm run` (no inline edits): full-coverage, value-true, coherent skins that pass a coverage-aware gate.

```
material map (E-21) + structural zones (E-23)
  ─▶ ZONE-FILL DOMINANT   base=stone · upper=plaster · roof=wood   (deterministic base coat, full coverage)
  ─▶ VALUE-TRUE BLOCK      each role's block validated vs the concept swatch in CIE-Lab (cream, not pink)
  ─▶ SPLAT / LLM DETAILS   timber studs, trim, accents only — the secondaries over the base coat
  ─▶ COHERENT SURFACE      clean roof courses, no stray-material salt in a zone's field
  ─▶ COVERAGE-AWARE GATE   reject if a zone's dominant is under-applied (catch "looks the same")
  ─▶ DURABLE CONSOLIDATION  produced by `npm run` end-to-end, reproducible, no hand-edits
```

## Rules of engagement (what "durable" and "quality" mean — binding)

1. **No hand-edited artifacts.** Every result is produced by a named `npm run` script **end-to-end**; a
   reviewer re-running it **reproduces** the result. An artifact that exists only because an agent edited it
   inline is **not** a result. (This epic exists because the good cottage skin was inline-only.)
2. **Deterministic where it matters.** LLM-authored steps (material refine, floorplan) are **seeded** or
   pinned so a re-run is stable; the deterministic cores (zone-fill, value-snap, gate) are pure.
3. **Coverage before polish.** A zone's **dominant material must be established** (full-coverage base coat)
   before secondaries/refine — and the gate enforces it. A skin where the dominant is under-applied is a
   **fail**, no matter the marginal score (Rule against the fooled-gate).
4. **Value-true, not name-true.** A role's block is accepted only if it matches the concept's value in
   CIE-Lab within tolerance; "it's called plaster" is not enough.
5. **Inspect the render, report the gap.** The verdict is the triptych + the coverage/value numbers; a
   residual is named, not hidden (Rule 7). A result that's *honestly* 80% there beats a faked pass.

## Scope

**In:** (a) **zone-fill of the dominant material** per structural zone (deterministic base coat,
full-coverage); (b) **value-true block selection** per material role (CIE-Lab vs the concept swatch); (c)
the **splat/LLM reduced to placing secondaries** over the base coat (not establishing it); (d) **surface
coherence of the pattern** (clean roof plank-courses; strip stray-material salt within a zone's field —
beyond S-084's watertight coverage); (e) a **coverage-aware gate** that rejects under-applied skin; (f)
**durable consolidation** — re-skin cottage + gatehouse via `npm run` end-to-end, reproducible, refreshed
triptychs, journal, E-12.

**Out:** changing the *form* geometry (E-16/E-20) or the *interior* (E-23 floorplan — this is the exterior
skin); SAM / pixel-accurate textures (deferred); the brief/rubric (immutable); sculptures (their zones are
not storeys — the building zone-fill is the scope; note the sculpture generalization, don't build it here).

## Candidate stories & DAG

```
S-085 zone-fill-dominant (the durable base coat) ──┬─▶ S-087 coherent-surface (roof courses + skin)
S-086 value-true-block-selection ──────────────────┤   S-088 coverage-aware-gate (catch under-application)
                                                    └─▶ S-089 durable-consolidation (npm-run reproducible)
```

- **S-085 — zone-fill-dominant.** For each structural zone (E-23 `structuralZones`), **deterministically
  fill** the wall-field surface with that zone's **dominant material** from the E-21 map (base=stone,
  upper=plaster, roof=wood), keeping the secondaries (timber studs) intact. Makes the cottage's 77%-plaster
  result **reproducible in the pipeline** (was inline). The splat/LLM is demoted to **secondaries only**.
- **S-086 — value-true-block-selection.** Each material role's block is **validated/selected for value**
  against the concept swatch in CIE-Lab (E-14 engine) — so plaster is a true **cream**, not pink
  `white_terracotta`. The map's name is the prior; the value gate picks the faithful block.
- **S-087 — coherent-surface.** Beyond S-084's watertight coverage: the **roof reads as clean stepped plank
  courses** (not chunky speckle), and **stray-material salt within a zone's field is stripped** (a lone
  cobble in a plaster wall). Surface *pattern* quality.
- **S-088 — coverage-aware-gate.** Harden the per-face / resemblance gate to **reject** a skin where a
  zone's **dominant material is under-applied** (coverage < threshold of the intended material) — so a
  marginal numeric gain can never pass a 91%-un-skinned wall. The gate that wouldn't have been fooled.
- **S-089 — durable-consolidation.** Re-skin **cottage + gatehouse** end-to-end via a named `npm run`
  script — **no inline edits** — reproducible (seeded). Refresh the triptychs; both pass the coverage-aware
  gate value-true; journal the zone-fill-vs-splat lesson; E-12.

## Definition of done

- **Durable:** a fresh `npm run` reproduces the high-quality cottage + gatehouse skins end-to-end — **no
  hand-edited artifacts** (Rule 1); seeded/stable (Rule 2).
- **Quality:** each zone's **dominant material is established full-coverage** (upper storey reads as plaster,
  not 9% patches), the blocks are **value-true** (cream not pink), and the surfaces are **coherent** (clean
  roof courses, no stray salt).
- **Un-foolable gate:** the coverage-aware gate **rejects** an under-applied skin; the cottage + gatehouse
  pass it honestly, with any residual named (Rule 5).
- Refreshed triptychs; `npm test` green; journal (`design-learnings.md`) + E-12 handoff.

## Orchestration notes (for the autonomous run)

- **Runs after E-21/E-23** (correct material map + the interaction layer + structural zones). On main,
  journaled.
- **GL-free where it counts.** Zone-fill, value-snap, coherence ops, and the coverage metric are
  **pure/deterministic** (built + unit-tested on synthetic occupancy); the value-validation render, the
  secondary splat/LLM refine, and the gate's judge are the metered edges.
- **The durable rule is the point.** A run that produces the right cottage only by hand-editing the artifact
  has **failed this epic** — the whole reason E-24 exists is that E-23's good skin was inline-only. The
  deliverable is a `npm run` that reproduces it.
- **Honesty.** If the zone-fill over-reaches (plaster where the concept shows stone), if no value-true block
  exists for a role, or if the roof can't be made coherent, that is a recorded result with the gap named —
  not papered over.
