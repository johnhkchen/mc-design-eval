// LLM material map as a multimodal BAML function (E-21 / S-071 / T-071-01). The "define style" step:
// a multimodal model RECEIVES the concept image + design doc and NAMES the material per feature/region
// by INTENT — returning a structured material map `[{ role, block, placementRule, rationale }]`. This
// fixes the failure that mean-color CIE-Lab matching COLLAPSES near-tone-distinct materials (stone brick
// vs cobblestone — a deliberate concept distinction merged into one grey block). Material identity is
// SEMANTIC, so the model that SEES the concept distinguishes by texture/grain/role, not average color.
//
// Sibling of JudgeFacade / DiagnoseFacade (judge.baml / review.baml): multimodal in, a small enum-
// constrained LIST out. Same transport — the harness pipes the rendered prompt through claude -p
// (subscription) and feeds the reply to b.parse.MaterialMap (src/form/material-map.mts). Kept SEPARATE
// from the frozen build/judge/concept fns so their runs stay reproducible.

// The CLOSED region vocabulary the map's placementRule draws from (the AC's feature/region set). The
// pure core (src/form/material-map.mjs) maps these PascalCase names to a kebab vocabulary the downstream
// E-21 geometric-feature assignment consumes.
enum PlacementRule {
  Walls         // the main field planes — the dominant wall body
  CornersEdges  // quoins, corner buttresses / pilasters, edge trim — the rougher-grain corner material
  Roof          // the roof mass
  Base          // plinth, foundation, ground course
  Trim          // bands, string-courses, voussoirs, frames, sills, the sparing accent material
  Openings      // door / window / arch reveals, fills, shutters
}

class MaterialRole {
  role string @description("Free-text MATERIAL INTENT for this region, e.g. \"structural walls\", \"corner buttresses\", \"arch voussoir\". Names WHAT the material is FOR.")
  block string @description("A namespaced, REAL survival Minecraft block id, e.g. minecraft:cobblestone. Choose the block whose TEXTURE and GRAIN match what the concept shows here — the right MATERIAL, not the closest average color.")
  placementRule PlacementRule
  rationale string @description("One line: what IN THE CONCEPT shows this material here (texture, grain, coursing, role) — especially why a near-tone material is kept distinct.")
}

class MaterialMapResult {
  materials MaterialRole[] @description("One entry per distinct material/region the concept shows.")
}

function MaterialMap(design_doc: string, concept: image) -> MaterialMapResult {
  client ClaudeStub
  prompt #"
    You are a master Minecraft architect DEFINING THE MATERIAL PALETTE for a build, working from the
    CONCEPT IMAGE below and its design document. Your job is to name, for each visible feature/region,
    the REAL survival Minecraft block whose MATERIAL matches what the concept shows there — chosen by
    intent, texture, grain, coursing, and architectural ROLE, NOT by average color.

    {{ concept }}

    ## The design document (a strong PRIOR — not a cap)
    {{ design_doc }}

    ## The one rule that matters most — PRESERVE near-tone-distinct materials
    Two regions can look TONALLY SIMILAR yet be DIFFERENT materials — e.g. smooth STONE-BRICK walls vs
    rough COBBLESTONE corner buttresses; dark TIMBER framing vs dark ROOF planks; cream PLASTER infill vs
    light STONE. A naive color match merges these into one grey/brown block — that is the exact failure
    you must avoid. If the concept shows two regions as DIFFERENT materials (different texture, grain,
    coursing, or role), you MUST return them as SEPARATE entries with DIFFERENT blocks. NEVER collapse a
    deliberate material distinction into a single block just because the average colors are close.

    ## Palette is a PRIOR, not a cap
    Prefer the design document's named block when it matches the concept. But you MAY ADD a block the
    document omits if the concept clearly shows that material — concept-justified near-tone architectural
    materials (a second grey, a contrasting trim) are ENCOURAGED, not bloat. Do not pad with materials
    the concept does not show.

    ## placementRule — pick exactly one per entry from this closed vocabulary
    - Walls — the main field planes, the dominant wall body.
    - CornersEdges — quoins, corner buttresses / pilasters, edge trim (often a rougher-grain material).
    - Roof — the roof mass.
    - Base — plinth, foundation, ground course.
    - Trim — bands, string-courses, voussoirs, frames, sills, sparing accents.
    - Openings — door / window / arch reveals, fills, shutters.

    ## Output discipline
    - Every `block` must be a REAL, survival-obtainable Minecraft block, NAMESPACED (minecraft:...).
    - One entry per distinct material/region. It is correct to return several entries that share a
      placementRule when the concept shows several materials in that region (e.g. walls + wall banding).
    - `rationale` must point at something VISIBLE in the concept — name the texture/grain/role that
      justifies the block, especially for any two near-tone materials you keep distinct.

    {{ ctx.output_format }}
  "#
}
