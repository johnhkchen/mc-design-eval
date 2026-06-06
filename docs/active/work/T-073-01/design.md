# T-073-01 — concept-refine-pass · Design

The decision: build the concept-grounded material-correction pass as **three new pure modules + one BAML
fn/bridge + one runner**, plugged into the **unchanged** E-15 `reviseLoop` exactly the way E-16 plugged in
the GLB form target. Nothing in `loop.mjs` / `region.mjs` moves. Grounded in research.md.

## The decisive constraint (and the architecture it forces)

E-15's loudest lesson: **the accept gate must be deterministic** or the hill-climb is confounded by model
variance. The form loop honors this — the gate is silhouette IoU; the model only *proposes* edits in the
async `diagnose` seam. This ticket must mirror that split exactly:

- **The MODEL provides zoning intelligence** (sees render + concept, proposes recolor swaps + palette
  additions) — in the `diagnose` seam, stashed.
- **A DETERMINISTIC colorimetric metric provides the accept signal** — the material analogue of
  silhouette IoU: "is this region's color closer to the concept's corresponding region after the swap?"

This is the single most important design choice and it is forced by the codebase, not invented.

## Decision 1 — the accept metric: deterministic region-color agreement

**Chosen:** `conceptMaterialTarget({conceptPath}).scoreRender(renderPath, R) → [0,1]`, a coverage-weighted
nearest-cluster CIE-Lab similarity between the R-framed build render and the concept. Compose the existing
engine: `decodeImage` → `aggregateForeground` (drop sky/bg) → `medianCutLab(k)` on both images; for each
render cluster find its nearest concept cluster, `similarity = 1 − min(ΔE, ΔEmax)/ΔEmax`, weight by render
cluster coverage; sum. Higher = the render's regional palette matches the concept's. Pure given decoded
images (`_decode` injectable for tests).

- **Why:** deterministic, GL-free in the kernel, hill-climbable, reuses `palette-augment`'s own
  primitives (no new color math), and mirrors `glbSilhouetteScore`'s "normalize-both-then-compare" shape.
- **Honesty ledger (documented, not hidden):** near-tone materials (cobble vs stone_bricks) differ by a
  small ΔE, so the gate's signal for *that* distinction is weak — it rewards getting a region's tone
  right, and the *semantic* zoning comes from the proposer. The gate's job is **no-regression** + a
  monotone nudge, not to independently re-discover the collapse fix. This is the same divergence E-16
  documented (per-region gate ≠ whole-object verdict).
- **Rejected — a per-iteration multimodal LLM judge as the gate.** It is what "accept-if-closer to the
  concept's material zoning" most literally suggests, but it reintroduces exactly the model variance the
  E-15 cage was built to exclude; a non-deterministic gate cannot prove P14-safety or roll-back
  correctness. Rejected on the strength of the E-15 precedent.

## Decision 2 — the editor: swap-only, reusing `applyFormEdit`

**Chosen:** `makeMaterialEditor()` returning `{diagnose, tweakFor, stash, proposals, additions}` — the
direct analogue of `makeFormEditor`. The proposer returns **swap ops only** (recolor) plus a separate
**additions** list. Apply via the EXISTING `applyFormEdit(inRegion, subBounds, ops)` filtered to
`kind:"swap"` (a swap never moves geometry → cannot escape R → no-geometry guaranteed *by the op
vocabulary*, not by a new check). Then `applyRegionEdit` (the lock) + `assertArtifact` (AJV), stash on
success.

- **Why reuse `applyFormEdit`:** it already handles swap (index-addressed, tombstone-safe, never-empty).
  Restricting to swap is "drop non-swap ops as rejected," not a reimplementation. Geometry-immutability is
  then free.
- **Rejected — a brand-new `applyMaterialEdit`.** Would duplicate the tombstone/index/never-empty logic
  `applyFormEdit` already proves (the parallel-roots-duplicate-shared-deps lesson). Reuse + a swap filter.
- **Rejected — `tweak.mjs`'s `materialPass` (whole-region uniform swap).** Too coarse: a mis-zoned region
  needs *per-placement* recolor (some cells corner, some wall), which only the indexed op list gives.

## Decision 3 — the palette policy (the new logic, pure + tested)

`src/form/material-policy.mjs`:
- `allowedPalette({mapPalette, secondary, additions}) → Set<blockId>` — the AC#3 union (design-doc
  manifest ∪ ≤2 E-19 secondary ∪ concept-justified additions). One explicit, testable place.
- `gateAddition(addition, {allowed, table}) → {ok, reason}` — the AC#2 right-to-add, gated by **concept
  justification, not a cap**: (a) `isKnownBlock` (a real survival block), (b) `block ∉ allowed` (a
  *distinct material role* — by the codebase axiom two block ids are two materials; a block already
  present is a near-*duplicate* with no new role → rejected), (c) a non-empty `conceptMaterial` AND
  `where` (names the concept material + where it appears). Near-*tone* is explicitly allowed (the point).
- `classifySwap(op, {allowed}) → "in-palette" | "needs-addition" | "off-palette"` — a swap to an
  in-`allowed` block applies; to a block backed by an accepted addition applies (and grows `allowed`); to
  an un-justified off-palette block is dropped. "Off-palette" is checked against the **augmented** set
  (no full-table snap — the 91-block-bloat guard).
- Every accepted addition is logged `{block, conceptMaterial, where, rationale}` (AC#2 "logged with
  justification").

- **Rejected — a tonal-distance gate for additions.** AC#2 is explicit that near-tone (cobblestone beside
  stone_bricks) is *allowed* — a ΔE gate would block the very thing E-21 exists to preserve. The gate is
  semantic-role (distinct block id + justification), not tonal.

## Decision 4 — wiring: the loop is reused verbatim

`liveMaterialScore(cfg)` mirrors `liveFormScore`: render R-framed via `observeRegion`, then
`resolveMaterialTarget(cfg).scoreRender(path, R)`. The runner calls:
```
reviseLoop(artifact, {
  regions, observe: observeRegion(...), diagnose: editor.diagnose,
  tweakFor: editor.tweakFor, score: liveMaterialScore({ materialTarget }),
})
```
identical in shape to `glb-voxel-surgical.mjs`. **AC#4 ("reuses the E-15 loop, not a new loop") is met by
construction** — `loop.mjs`, `region.mjs` are untouched; the swap is target+editor+score, exactly the E-16
seam.

- **Rejected — a `liveMaterialScore` baked into loop.mjs.** Keep the seam where E-16 put it: a thin
  wrapper in the new target module / runner, so `loop.mjs` stays generic.

## Decision 5 — the proposer transport (BAML)

`baml_src/materialcorrect.baml` — `CorrectRegion(subject, concept_region, current_palette, placements,
render: image, concept: image)` → `{swaps:[{target,block}], additions:[{block,conceptMaterial,where,
rationale}]}`. Two images (the build render + the concept) so the model can compare zoning.
`src/revise/baml-material-correct.mts` is the live bridge (clone of `baml-revise.mts`, two images). NOT
unit-tested (metered). The pure `defaultProposeCorrection` leaf spawns it.

- **Rejected — overloading `ReviseRegion`.** It is the frozen FORM editor (add/move/swap for shape);
  conflating material correction would muddy both prompts. A sibling fn keeps each reproducible (the
  materialmap.baml precedent of staying separate from frozen fns).

## Decision 6 — the metric is per-region but the AC verdict is whole-object

The accept gate scores R (per-region). AC#5's "material-region agreement before/after" is the
**whole-object** agreement (`scoreRender` with no region clip), measured once before the loop and once
after — the analogue of `wholeObjectIoU`. The runner records both per-region accept deltas and the
whole-object before→after, with the same `improved | held | regressed` honesty (a per-region clean need
not transfer; documented, not alarmed).

## What is explicitly OUT of scope

Geometry edits (swap-only); trim/voussoir fine placement (T-072's documented gap, finer than this coarse
pass); a second subject (gatehouse is the AC subject; cottage map exists but is a follow-up); changing the
material map or feature classifier. This pass *corrects* the T-072 build; it does not re-derive it.
