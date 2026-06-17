# T-189-01 — DESIGN: the roof-material recognition hand (reconcile program ↔ material-map)

Decisions, grounded in `research.md`. The ticket builds **one** missing hand — the highest-leverage one the
S-188 climb stalls on: **roof color** (build brown, concept grey). The fix is at the **recognition/
material-map seam where material identity is decided** (research §2, §3), not a hand-paint of the build.

## The diagnosis, restated as the design target

Recognition already produced two artifacts that **disagree at the roof and were never reconciled**
(research §3): the **program** (`roof.fieldRole:"roof.trim"` → `dark_oak_planks`, brown — the "darken
toward oak as the barn does" heuristic) and the **material-map** (`roof` → `deepslate_tiles`, grey — read
from the concept image). The build's compile path consumes only the program; the material-map's
concept-true roof color is ignored. **The missing hand joins them: when the program-resolved roof block and
the material-map's roof block disagree by material family, the material-map (which read the picture) wins.**

## Decision A — Source of grey: the committed material-map, NOT a live VLM re-read

- **A1 — re-read the concept live** (a new VLM call that asks "what color is the roof?"). Rejected: metered,
  non-deterministic, untestable, and **redundant** — recognition *already did this read* and committed
  `deepslate_tiles` (research §3). Adding a VLM call to re-derive a fact already on disk is waste.
- **A2 — trust the committed material-map's roof entry.** **Chosen.** The material-map IS the
  material-identity recognition artifact (`material-map/v1`, `generatedFrom.concept`). Using it is
  deterministic, unit-testable, zero-cost, and the most literal reading of "fix where the identity is
  decided." The hand reconciles two existing recognition products; it invents no new color.

## Decision B — Fire only on a material-family disagreement (honest, general no-op)

- **B1 — always override the roof with the material-map block.** Rejected: on a matched subject (cottage,
  barn — where the program roof IS timber and the concept roof IS brown timber) this would be a pointless
  re-assignment, and on a subject with no material-map it would throw. It also hides *whether* there was a
  divergence to fix.
- **B2 — reconcile: override only when the program block and material-map block differ by COARSE MATERIAL
  FAMILY (timber vs stone).** **Chosen.** `reconcileRoofMaterial` returns `{ roofBlock, corrected, reason }`:
  - resolve `programBlock = roleBlock(pack, mass.roof.fieldRole)`;
  - read `conceptBlock` = the material-map entry with `placementRule === "roof"`;
  - `corrected = family(programBlock) !== family(conceptBlock)` AND both families are known;
  - if corrected → `roofBlock = conceptBlock` (grey), else `roofBlock = programBlock` (no-op).
  This makes the hand a **general reconciliation**: it fixes the gatehouse (timber→stone), is a **no-op on
  matched timber subjects**, and degrades gracefully (no material-map ⇒ no correction). Honest by
  construction — `corrected:false` is the eyes-still-have-hands-but-nothing-to-do answer.

## Decision C — Family classifier: name-based timber/stone, deterministic and legible

- **C1 — Lab-chroma from the block→Lab table** (warm brown has high a*,b*; grey stone ≈ 0). Rejected as the
  primary signal: chroma thresholds are tunable magic numbers, and near-tone greys (research memory
  12076: deepslate_tiles vs dark_oak_log ΔL only 2.75) make a pure-Lab split fragile — the very near-tone
  collapse the project has been bitten by ([[material-identity-is-semantic]]).
- **C2 — name-based coarse family** (`timber`: `*_log|*_planks|*_wood|oak|spruce|birch|jungle|acacia|
  mangrove|cherry|bamboo`; `stone`: `stone|cobble|deepslate|andesite|diorite|granite|tuff|*_tiles|*_bricks|
  blackstone|basalt`; else `other`). **Chosen.** Material identity is **semantic, not chromatic**
  ([[material-identity-is-semantic]], [[recognize-blocks-dont-color-match]]) — the concept shows grey
  *stone* vs brown *timber*, a material-class difference the block NAME already encodes. Deterministic, no
  thresholds, legible in tests. `other` (e.g. terracotta) is treated as "unknown family" → never triggers a
  correction (conservative: only fire on a clear timber↔stone class flip).

## Decision D — Apply as a rebuild with a grey field-only family (form-faithful, canonical)

- **D1 — remap roof-band timber cells to grey in place.** Rejected: must hand-pick which cells are "roof
  material" and rewrite their `form`/`state`; fiddly, and a stair-form cell remapped to `deepslate_tiles`
  would need a `deepslate_tile_stairs` derivation — the **name-derivation footgun** the project banned
  ([[voxel-palette-must-be-design-doc]], roof-generate header §15).
- **D2 — rebuild the gable with `FAMILY = { field: roofBlock, stairs: null, slab: null }`.** **Chosen.**
  This mirrors `apply_gable_roof` exactly but swaps the field block for the reconciled grey and drops the
  stair/slab members — which is **precisely `compile.mjs`'s canonical behavior for a field that doesn't
  match the pack roof idiom** (`roofBlocks` returns `{field, stairs:null, slab:null}`; `generateRoof`
  tolerates nulls → solid grey wedge, honest cubes — research §5). The roof FORM (correct per T-177-01) is
  preserved; only the material identity changes. No name derivation, no air-op, no recess
  ([[facade-recess-by-exclusion]]) — the wedge is rebuilt, not carved.

So the lever `recolor_roof(occ)` = `apply_gable_roof`'s geometry + the reconciled grey field-only family.
Name it for what it is at the **identity** seam, not "paint": it re-derives the roof material from
recognition and rebuilds.

## Decision E — Split: pure recognition core in `src/` (tested), thin lever in the runner (metered)

- The **decision** ("what block should the roof be?") is pure and belongs in `src/recognition/roof-material.mjs`
  with unit tests in `npm test` — `reconcileRoofMaterial` + `roofMaterialFamily`. No GL, no LLM, no I/O.
- The **lever** (`occ → occ`) lives in `experiments/eval-alignment/picture-climb.mjs` beside the other three
  hands (loads program/pack/material-map from disk, calls the pure core, rebuilds via `generateRoof`). It is
  metered/GL, out of `npm test`, like its siblings. This keeps the steering logic testable and the runner thin.
- **`climb-gate.mjs::TOOL_DEPARTMENTS`** gains `recolor_roof: ["ROOF"]` (pure, `npm test`-covered) so
  `classifyInventory` records the roof hand as acting on ROOF. A test asserts the new entry.

## Decision F — Verification: the render-beside glance is the deliverable; metered critique is the confirmation

The AC wants "critique fires → lever applied → critique clears, without regressing closure / another
department." Grounded in research §7 (GL available, DiagnoseBuild metered):

- **The glance (zero cost, the falsifiable deliverable):** render the seed roof beside the concept (brown)
  and the `recolor_roof` roof beside the concept (grey), via `renderBesideConcept`. A human glance confirms
  the roof moved from brown to grey toward the concept. **This is the evidence this ticket commits.**
- **Closure / no-regress:** `recolor_roof` rebuilds the SAME gable footprint+pitch as `apply_gable_roof`
  (only the field block differs), so the roof silhouette and `closureOf` are unchanged — a unit assertion
  on the rebuilt cell *positions* (grey rebuild vs the existing `apply_gable_roof` rebuild produce identical
  geometry; only `block` differs) proves no geometric regression without GL.
- **The metered confirmation (attempted, honestly reported):** wire `recolor_roof` into the climb so a real
  run *can* show the ROOF-color critique firing then clearing. Following the T-188 precedent (the spend was
  deferred there too), the metered single-step proof is **attempted if budget allows and reported at its
  true strength**; the glance + the geometry assertion stand on their own. No hedge: if the metered step is
  deferred, the review says so plainly and the glance carries the claim.

## How this fails (anti-hedge — lead with it)

- **The grey roof regresses another department on the glance** (e.g. the grey now matches the grey walls and
  the roof stops reading as a distinct mass). Then the fix is not local — but the material-map deliberately
  chose `deepslate_tiles` *darker* than the wall stone ("so the roof recedes … distinct dark tone, not the
  lighter wall stone"), so the distinct-mass read is preserved by the recognition that authored it. Watched
  on the beside glance; if it regresses, recorded as a finding (the cage/closure guard is the sub-problem),
  not forced.
- **The picture-critique still won't clear** because grey honest-cubes read as "blocky" not "tiled." Then it
  is the T-187 voxel-medium tolerance that must absorb it (already in `diagnose.mjs`), not a build fix —
  recorded honestly.
- **It only fixes the gatehouse.** `reconcileRoofMaterial` is general (any program+pack+material-map), but
  the *demonstration* is one subject. The no-op-on-matched behavior (Decision B) is the generality evidence;
  multi-subject proof is E-49, named not forced.

## Outputs (AC → artifacts)

1. `src/recognition/roof-material.mjs` (pure) + `src/recognition/roof-material.test.mjs` (in `npm test`).
2. `recolor_roof` hand + MENU entry in `picture-climb.mjs`; `TOOL_DEPARTMENTS.recolor_roof=["ROOF"]` in
   `climb-gate.mjs` (+ test).
3. Beside-concept renders: `builds/gatehouse/picture-climb/roof-material/{seed,recolored}-beside.png` — the
   brown→grey glance.
4. `progress.md` + `review.md` — the honest verdict (glance moved; metered confirmation attempted/deferred;
   closure held; generality = no-op on matched).
5. `measurements/` untouched; `git status` clean of frozen-instrument paths; `npm test` green.
