---
id: E-26
title: concept-style-kit
type: epic
status: open
priority: high
depends_on: [E-21, E-25]
spec: "§5, §6, §9"
stories: [S-096, S-097, S-098, S-099, S-100, S-101]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds: TRELLIS image→3D form, concept-grounded materials (E-21), zone-filled skins (E-24/E-25),
a multi-angle resemblance gate (E-25).

**The missing ingredient (witnessed, 2026-06-10).** The cottage concept art *visibly* uses **smooth
sandstone** (the cream upper panels), **stripped logs** (the timber frame), **planks**, **trapdoor
shutters**, and **fences in the window openings**. A viewer identifies these instantly — the concept is
voxel art depicting *real, nameable Minecraft blocks*. None of them reach the build. The pipeline paints
the upper panels `white_terracotta` (which renders pink) and leaves every window bare.

**Five whys — why doesn't the build contain what the concept plainly shows?**

1. **Why are the kit blocks absent from the build?** No pipeline stage ever emits them. The cottage
   material map (`benchmarks/sculpture/material-map/cottage.json`) holds **7 full-cube roles** with 4
   coarse placement rules (`walls`/`corners-edges`/`trim`/`roof`); a repo-wide grep finds **zero**
   trapdoor/fence/stripped-log usage in any generator.
2. **Why does the map hold only coarse color roles?** Because E-21's contract asks the LLM for *color-role
   separations* (its mission was the brick-vs-cobble near-tone collapse), not *block identification*. The
   map's own rationales prove the model **saw** the materials vividly ("warm, matte CREAM", "heavy round
   structural timbers with a strong wood grain") — but the output slot forced a guess from the color
   table. It guessed `white_terracotta` for panels the concept depicts as smooth sandstone. The question
   *"which Minecraft block is this?"* is never asked.
3. **Why are fixtures never placed even though the contract supports them?** The artifact schema has
   `state` per placement and the renderer applies it (`render/src/world.mjs` writes block + orientation)
   — the capability exists **end-to-end** — but the pipeline's spine is *per-voxel color*: voxelize →
   snap → zone-fill → splat. A trapdoor's texture quantizes to "brown" (indistinguishable from planks); a
   fence has no per-voxel color identity at all. Windows became geometric `openings` and were left bare.
4. **Why did no epic ever supply a detail stage?** Each epic fixed the largest defect *visible at its
   gate*: value → form → speckle → lens → zoning → coverage. At a 512px 3/4 view, missing fixtures are
   sub-dominant: the judge names "material zoning" and "palette" gaps, never "missing trapdoor shutters."
   The gate's questions set every epic's ambition ceiling; fixtures never made the list.
5. **Why doesn't the gate ask?** Because the reference comparison is *image-resemblance-shaped* ("same
   object / drifted"), not **bill-of-materials-shaped**. Nobody ever made "the kit of ingredients the
   concept depicts" a first-class artifact — so construction can't place what was never extracted, and
   the gate can't demand what was never named. Yet extracting it is an *enumeration* task — exactly what
   a multimodal LLM is best at.

**Root cause:** the concept's **style kit** — the enumerable set of depicted blocks, fixtures, and their
placement grammar — has no representation anywhere in the pipeline contract.

**The key inversion: recognize, don't match.** `white_terracotta` was a *color guess* at cream; smooth
sandstone is *identifiable*. When concept art depicts real blocks, **name-true recognition** (verified
value-true in CIE-Lab) beats color-table matching — recognition would have gotten cream right for free.
Color-snap remains the fallback for genuinely ambiguous surfaces, never the primary for identifiable ones.

## Goal

A **style-kit stage before the skin**: extract the concept's bill of materials (blocks + fixtures + where
each goes), place it by grammar on structural features, and hold the gate accountable to it — so the
cottage build contains smooth-sandstone panels, a stripped-log frame, plank gables, trapdoor shutters,
and fence-infilled windows because the concept shows them.

```
concept (immutable) ─▶ STYLE-KIT EXTRACTION    enumerate depicted blocks + fixtures, name-true, value-verified
                       ─▶ PLACEMENT GRAMMAR    kit entry → structural feature instances (frame lines, fields, openings)
                       ─▶ FIXTURE PATH PROVEN  trapdoors/fences/stairs/slabs through schema → occupancy → render
                       ─▶ OPENING DRESSING     each window/door dressed from the kit (shutters, fence infill, lintel)
                       ─▶ KIT-AWARE GATE       missing ingredient = named gap; coarse skin alone cannot pass
```

## Rules of engagement (binding)

1. **Recognize, don't match.** The kit extractor asks *which block is this?*, not *which block is this
   color?*. Every recognized block is **value-verified** against the concept swatch in CIE-Lab; a
   verification failure is a flagged review item, never a silent fallback to color-snap. Color-snap is
   the recorded fallback only for surfaces the extractor declares unidentifiable.
2. **The kit is a reviewable artifact.** Extracted once from the immutable concept, saved beside it, and
   written so a human can hold the kit list against the picture and check it line by line. The kit is
   versioned input to construction and gate alike — neither invents ingredients the kit doesn't name.
3. **Fixtures are placed by grammar, never splatted.** A trapdoor shutter flanks an opening; a fence
   fills one; a stripped-log line follows a frame edge. Placement binds kit entries to structural-read
   features (openings, floor lines, corners, gables) — deterministic given the kit + the read.
4. **The gate names missing ingredients.** The kit-aware check runs beside the multi-angle resemblance
   gate: each kit entry is present at its grammar sites or the absence is a named gap. A build cannot
   pass on coarse skin alone.
5. **Inherited, in full:** E-24's durability (named `npm run`, no hand-edits, reproducible) and E-25's
   anti-tuning rules (subjects as registry entries; concepts immutable; no dropped angles; honest gaps).

## Scope

**In:** (a) **kit extraction** — multimodal LLM enumerates the concept's depicted blocks/fixtures with
role, form class (cube / flat fixture / rail), and where-used, validated against `minecraft-data` and
value-verified; (b) **fixture path proof** — trapdoors/fences/stairs/slabs flow through artifact schema →
occupancy → structural read → render correctly (incl. closure semantics: a fence-infilled window is a
dressed opening, not a hole); (c) **placement grammar** — kit entries bound to structural feature
instances; (d) **opening dressing** — every door/window dressed per the kit; (e) **kit-aware gate** —
bill-of-materials presence check beside the E-25 gate; (f) the **styled milestone** — the cottage built
with its actual kit, end-to-end, plus gatehouse + church through the same untuned path.

**Out:** interiors (E-23); SAM / pixel-perfect textures (deferred); inventing style where the concept
shows none (the kit records what is *depicted* — invention is the design layer, not this epic); the
brief/rubric (immutable); sculpture kits (organic subjects rarely depict nameable blocks — noted, not built).

## Candidate stories & DAG

```
S-097 fixture-path-proof (schema→render, states, closure semantics) ──┬─▶ S-099 opening-dressing
S-096 kit-extraction (name-true bill of materials) ──┬────────────────┘
                                                     ├─▶ S-098 placement-grammar ─▶ S-101 styled-milestone
                                                     └─▶ S-100 kit-aware-gate ────▶ S-101
```

- **S-096 — kit-extraction.** The concept-reading LLM enumerates the depicted ingredients name-true
  (smooth sandstone, stripped logs, planks, trapdoors, fences…), each entry validated against the
  `minecraft-data` vocabulary, value-verified vs the concept swatch, and saved as the reviewable kit
  artifact. Builds on the E-25 concept band profile (one concept-reading seam — no duplicate readers).
- **S-097 — fixture-path-proof.** Prove and harden what the contract already half-supports: non-cube
  blocks with states render correctly from artifact JSON; occupancy/structural-read/closure treat a
  dressed opening as dressed (not as a wall hole); the AJV gate accepts the states the kit needs.
- **S-098 — placement-grammar.** Bind kit entries to structural feature instances: frame lines (floor
  lines, corners, gable rakes) get the frame block; fields get the panel block; each opening instance
  gets the window/door treatment. Deterministic given kit + structural read; unit-tested on synthetic reads.
- **S-099 — opening-dressing.** The witnessed case, end-to-end: every cottage window gets its trapdoor
  shutters + fence infill + lintel per the kit; the door gets its frame. Renders prove it at gate angles.
- **S-100 — kit-aware-gate.** A bill-of-materials check beside the multi-angle gate: per kit entry,
  presence at its grammar sites; absences are named gaps. Proof both ways: the current kit-less cottage
  fails; the dressed one passes.
- **S-101 — styled-milestone (terminal).** Cottage rebuilt by one `npm run` with its actual kit — smooth
  sandstone panels, stripped-log frame, trapdoor-and-fence windows — passing kit-aware + multi-angle
  gates, reproducibly; gatehouse + church get kits through the same untuned path; journal + E-12.

## Definition of done

- **The build contains what the concept shows:** the cottage's kit ingredients are present at their
  grammar sites and visible in the gate renders; a human comparing build to concept finds the same
  ingredients, not approximations of their colors.
- **Name-true, value-verified:** every kit block recognized (not color-guessed), each verified in
  CIE-Lab; fallbacks and flags recorded.
- **Fixture-true:** trapdoors/fences render with correct orientation; closure and hollow/interior checks
  treat dressed openings correctly.
- **Accountable gate:** the kit-aware check rejects the kit-less cottage and passes the dressed one; runs
  beside (never instead of) the E-25 multi-angle gate.
- **Durable + general:** all via named `npm run`, reproducible; gatehouse + church kits through code that
  names no subject; `npm test` green; journal + E-12 handoff.

## Orchestration notes (for the autonomous run)

- **Runs on the E-25 spine.** Kit extraction builds on the concept band profile (T-092-01); the gate
  check rides beside the multi-angle gate (T-093-01); the milestone waits for E-25's terminal
  (T-095-01). S-097 is independent and can start immediately.
- **GL-free where it counts:** grammar binding, presence checks, and closure semantics are
  pure/deterministic, unit-tested on synthetic reads; the kit extractor and gate judge are the metered
  multimodal edges (strong tier — recognition is judgement; presence-at-site checks are candidates for
  the light tier per E-23's routing).
- **Honesty.** If a concept ingredient has no faithful Minecraft realization at build scale (a 1-block
  window can't hold shutters + fence + frame), the kit records the conflict and the resolution chosen —
  named, not silently dropped.
