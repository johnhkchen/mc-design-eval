# Review — T-083-01 hollow-cottage-milestone (E-23 terminal)

Handoff for a human reviewer. The E-23 **milestone** is built: one cottage taken **end-to-end through the
2.5-D layer** — exterior-accurate (spray-paint), hollow (carve), N×M-room-divided (floorplan), ops
model-scoped (Haiku + Opus) — with **both gates** reported and the E-12 assets shipped. The live metered run
**succeeded fully**; `npm test` **976** green (965 → 976, +11 from the one new pure module).

## What this delivers

This ticket is **integration, not invention**: it chains the four dependency cores (T-079 spray-paint, T-080
hollow carve, T-081 floorplan, T-082 model routing) into **one build** and reports them together. The only
new code is a tiny render-only cutaway helper; every geometric guarantee is borrowed from an already-tested
core.

The chain (one artifact threaded through every stage): raw → **spray-paint** (recolor skin) → **seal**
(coherence holes; the door survives) → **hollow carve** → **floorplan fill**. Because paint only rewrites
skin block ids (geometry-safe), the final build is exterior-accurate **and** hollow **and** room-divided.

## Files

### Created
- `src/view/cutaway.mjs` (pure, ~70 ln) — `sectionKeys(occ, {axis, at, side})` computes the occupancy keys
  to remove for a planar section (keys in `voxelKey` form → drop straight into `carveArtifact`); `roofCut`
  (plan section, reveals the grid from above) and `frontHalfCut` (cross-section). **Render-only** (Rule 3):
  the real artifact is never edited. No model/GL/API-key/Date/random import.
- `src/view/cutaway.test.mjs` — 11 tests (planar removal exactness, partition complement, boundary/empty,
  bad-arg throws, **round-trip vs `carveArtifact`**, `roofCut`/`frontHalfCut` conveniences, source guard).
- `benchmarks/sculpture/hollow-cottage-milestone.mjs` — the chained metered/GL runner (`milestone:cottage`).
- `docs/active/work/T-083-01/{research,design,structure,plan,progress,review}.md`,
  `milestone-cottage-artifact.json` (the one finished build, AJV-valid), `milestone-report.json` (both gates +
  both exteriorHeld proofs + the two metered calls + counts), `view-milestone-{front,+x+z,threeQuarter,
  bottom}.png`, `view-cutaway-{plan,section}.png`, `view-face-front-{before,after}.png`.

### Modified
- `package.json` — `milestone:cottage` script.
- `docs/knowledge/design-learnings.md` — `## 2.5-D interaction sector (E-23)` section (AC #5).
- `pr/assets/` — `cottage-face-{before,after}.png`, `cottage-multi-angle.png`, `cottage-cutaway.png`,
  `hollow-cottage.md` (E-12 handoff, AC #6).

### Not modified (the integration surface — reused unchanged)
`src/view/{occupancy,structural-read,multi-angle,surface-grid,reference-quantize,glb-splat,face-paint,
palette-cans,face-resemblance,hollow-carve,floorplan,hollowable-mass,surface-coherence}.mjs`,
`src/model-tier.mjs`, `src/sdk-binding.mjs`, `src/artifact.mjs`, `render/src/render-tool.mjs`. If any had
needed a change, that would be a missing dependency edge, not milestone work.

## Acceptance criteria — status

- **AC #1 — end-to-end through the 2.5-D layer.** ✅ Exterior accurate: plaster `white_terracotta` **8 →
  315**, front face **0.25 → 0.40** vs concept. Hollow: **978** voxels carved (cavity 6438 → 5460),
  exteriorHeld true. N×M infill: **2×2**, 4 rooms/storey, **395** placements across 2 storeys. Model-scoped:
  hollowable on **claude-haiku-4-5** (light), floorplan-author on **claude-opus-4-8** (strong).
- **AC #2 — multi-angle + from-below/cutaway showing the hollow + floorplan.** ✅ Ortho `front`, 45°
  `+x+z`, oblique `threeQuarter`, **from-below** `bottom`; plus **two render-only cutaways** —
  `cutaway-plan` (roof removed → the grid from above) and `cutaway-section` (front half removed → stacked
  floors + hollow). Verified visually (`cottage-cutaway.png`).
- **AC #3 — both gates reported, each with a named residual.** ✅ Exterior **resemblance** (front face vs
  concept, before/after; residual = the +x side is by-construction, the face is no longer the gap). Interior
  **plausibility** (six constraints PASS; residual = `openings-align`, steered not verified). Both in
  `milestone-report.json.gates`.
- **AC #4 — before/after of the cottage face for E-12.** ✅ `cottage-face-before.png` (grey-stone drift) ∥
  `cottage-face-after.png` (spray-painted half-timber), same build, exterior.
- **AC #5 — design-learnings E-23 section.** ✅ View-matched-to-task; two paths (program vs judgement); the
  **gate-switch** (resemblance ↔ plausibility) at the craft→design line; right-sized-model results + the
  scoping rubric; where it over/under-reaches.
- **AC #6 — E-12 handoff + `npm test` green.** ✅ `pr/assets/` has the face before/after + multi-angle +
  cutaway + narrative; **976 tests pass**.

## Test coverage

- **New pure core:** `cutaway` — 11 tests (above). The load-bearing one is the **round-trip**: a section
  equals `occ` minus the section set (`carveOccupancy`), so the rendered section is a faithful clip.
- **Borrowed, already-tested:** paint/splat (T-079, 19 tests), carve/exterior-held (T-080, 17), floorplan +
  plausibility + fill-safety (T-081, 33), tier routing + detectors (T-082). The milestone composes them;
  it does not re-test them.
- **Asserted in the runner (not the suite, by the documented metered/GL boundary):** AJV validity of the
  final build (`assertArtifact`), **both `exteriorHeld` proofs throw on failure**, plaster reversal count,
  the plausibility constraints, the resemblance delta — all recorded in `milestone-report.json`.
- **Gaps (by design):** the live `claude -p` calls + GL renders + GLB decode are metered/GL, not unit-tested
  — same excluded boundary as all four sibling runners; covered by the `milestone:cottage` round-trip.

## Open concerns / notes for the reviewer

1. **The interior gate is plausibility, not truth** — there is no interior reference, so the rooms are gated
   for internal consistency only. This is the correct ceiling for design-without-reference, but a reviewer
   should read it as "plausible," not "verified-correct" rooms.
2. **The +x side is accepted by construction** (no concept side) — the exterior residual. The *front* face
   resemblance is the only true delta; the AC's "drifted with the face no longer the gap" is satisfied (the
   plaster band is restored), but the side has no resemblance signal until a GLB-render reference exists.
3. **`openings-align` is steered, not geometrically verified** — recessed doors read as no hole to the
   front-most ortho march, so interior-door↔exterior alignment trusts the LLM's `frontDoor`. A depth pass
   would close it (T-081 open concern #2, inherited).
4. **The cutaway is render-only** — clearly labelled in `cutaway.mjs`, the runner, and the report. The real
   artifact carries the exteriorHeld proofs; no build was edited to flatter a view (Rule 3).
5. **Authoring is non-deterministic** — the floorplan author returns different grids across runs (all
   gate-passing). The generator + gates are deterministic given a spec; a seed would pin a Phase-2 sweep.
6. **No stair** — reachability is per-storey; vertical circulation is the obvious next reach (inherited).
7. **Sealing did NOT close the designed door** (`watertight=false` after seal) — verified, and the reason the
   cutaway/perspective can see into a room. Sealing closes only coherence holes; the strong-tier
   `seal-authoring` (S-084) owns intended-opening policy.

## Suggested verification by a reviewer

`npm test` (976 green) → open `pr/assets/cottage-face-before.png` vs `-after.png` (grey-stone → half-timber)
and `cottage-cutaway.png` (the grid + hollow) → `node scripts/validate-artifact.mjs --expect valid
docs/active/work/T-083-01/milestone-cottage-artifact.json` (VALID) → skim `milestone-report.json` (both
`gates`, both `exteriorHeld.held:true`, `modelScoped` light+strong with cost) → optionally re-run
`npm run milestone:cottage` (metered: one Haiku + one Opus call).
