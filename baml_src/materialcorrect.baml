// The LLM material-CORRECTION function (E-21 / S-073 / T-073-01) — the recolor-only editor behind the
// surgical loop's accept-gate, the MATERIAL analogue of ReviseRegion (revise.baml). The model SEES the
// build render of one region AND the concept image, and returns a BOUNDED correction: a small list of
// RECOLOR swaps that re-block mis-zoned placements toward the concept's material zoning, plus — when it
// catches a concept material MISSING from the build's palette — concept-justified palette ADDITIONS.
// NEVER moves/adds/removes geometry (recolor only). Small, structured output (no prose-wrap risk, like
// JudgeFacade / ReviseRegion): the harness pipes the rendered prompt through claude -p (subscription) and
// feeds the reply to b.parse.CorrectRegion. The JS side (src/revise/material-edit.mjs + material-policy.mjs)
// applies the swaps under the region-lock + the palette policy + AJV, and keeps them only if the concept
// colour agreement improved. Kept SEPARATE from the frozen ReviseRegion (a FORM editor) so each prompt
// stays reproducible.

// A whole-material recolor: re-block EVERY in-region placement whose block == fromBlock to toBlock. The
// right granularity for a DENSE region (a voxelized roof/wall is thousands of cells) — one remap recolors
// the whole mis-zoned material at once. PREFER this over per-index swaps for region-wide material errors.
class MaterialRemap {
  fromBlock string @description("the namespaced block CURRENTLY mis-zoned in this region, e.g. minecraft:stone_bricks")
  toBlock string @description("the namespaced block it SHOULD be per the concept, e.g. minecraft:deepslate_tiles")
}

// A precise single recolor: re-block the in-region placement at `target` (its index in the prompt list).
class MaterialSwap {
  target int @description("index of the in-region placement to RE-BLOCK (recolor); geometry is unchanged")
  block string @description("the new namespaced block id, e.g. minecraft:cobblestone — a real survival block, preferably already in the current palette")
}

// One concept-justified ADDITION: a material the concept shows but the build's palette is missing.
class MaterialAddition {
  block string @description("the namespaced REAL survival block id to ADD to the palette")
  conceptMaterial string @description("the material AS SEEN IN THE CONCEPT (texture/grain/role), e.g. \"rough cobblestone buttress\"")
  where string @description("WHERE in the concept this material appears, e.g. \"the four corner pilasters\"")
  rationale string @description("one line: what in the concept justifies adding this distinct material")
}

class RegionCorrection {
  remaps MaterialRemap[] @description("whole-material recolors for region-wide mis-zoning — the PREFERRED tool; usually 0–2")
  swaps MaterialSwap[] @description("a SMALL set of per-cell recolor swaps for precise fixes; usually empty when a remap fits")
  additions MaterialAddition[] @description("concept materials MISSING from the current palette; usually empty")
}

function CorrectRegion(subject: string, region: string, current_palette: string, placements: string, render: image, concept: image) -> RegionCorrection {
  client ClaudeStub
  prompt #"
    You are a master Minecraft architect making a SURGICAL MATERIAL correction to ONE region of a build.
    Below are TWO images: first the CONCEPT ART (the ground truth for what material goes where), then a
    3/4 render of the CURRENT BUILD framed on this region. Your job is to make the build's MATERIALS in
    this region match the concept's material zoning — by RECOLORING placements only. You must NOT change
    any geometry (no moving, adding, or removing blocks) — only swap which block fills a cell.

    ## The concept (ground truth for materials)
    {{ concept }}

    ## The current build, framed on this region
    {{ render }}

    ## Subject
    {{ subject }}

    ## The region being corrected
    {{ region }}

    ## The placements currently in this region (each has an `index`; address each swap by it)
    {{ placements }}

    ## The current allowed palette (a strong PRIOR, not a hard cap)
    {{ current_palette }}

    ## What "material correction" means here
    The feature heuristics that placed these blocks sometimes MIS-ZONE a region — a roof filled with the
    light wall block instead of the dark roof block, a gable mis-materialed, a corner buttress filled with
    the smooth wall block. Compare the build render to the concept and fix each material that is wrong for
    where it sits. Prefer the block whose TEXTURE/GRAIN/ROLE matches what the concept shows there — the
    right MATERIAL, not the closest average colour.

    ## How to correct — PREFER whole-material remaps
    This region may contain THOUSANDS of voxel placements, so do NOT try to swap them one index at a time.
    When a whole material is mis-zoned (e.g. the roof reads as light wall stone but the concept shows a dark
    roof), emit a single `MaterialRemap` {fromBlock, toBlock} — it recolors EVERY matching cell in the
    region at once. Use the per-index `swaps` only for a few precise touch-ups a remap would over-reach.
    Read the placements list below to see which block ids are currently present in this region.

    ## The right to ADD a missing material (use sparingly, justify always)
    If the concept clearly shows a material that is MISSING from the current palette (a "missing texture"),
    you MAY add it: emit a `MaterialAddition` naming the concept material + where it appears, and use it in
    a swap. A near-TONE distinct material is encouraged (e.g. rough cobblestone beside smooth stone_bricks —
    that distinction is the whole point). Do NOT add a near-DUPLICATE of a block already in the palette
    (same material role, no new distinction). Most regions need ZERO additions.

    ## Rules — read carefully
    - RECOLOR ONLY. Never move, add, or remove geometry — emit only remaps/swaps (and, rarely, additions).
    - Be surgical — correct only the genuinely mis-zoned materials.
    - Every block id must be a REAL, survival-obtainable Minecraft block, NAMESPACED (minecraft:...).
    - If the region's materials already match the concept, return EMPTY remaps, swaps, and additions.

    {{ ctx.output_format }}
  "#
}
