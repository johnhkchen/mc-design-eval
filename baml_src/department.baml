// The typed CRITIQUE CONTRACT (T-163-01, story S-163, epic E-39) — the Department enum + the
// enriched Critique / CritiqueItem classes that bind the diagnostic judge (Layer A) to the
// builder/router (Layer B). This is the foundation E-39 binds to; it carries SCHEMA + PLUMBING
// only — no judging behaviour. The diagnostic PROMPT and the runner/creation-loop wiring are
// S-164's (DiagnoseBuild → Critique); DiagnoseBuild below is a CONTRACT CARRIER with a placeholder
// prompt so the typed Critique is parseable via b.parse — S-164 fills this body, it does not rename.
//
// THIS IS THE CREATION-LOOP CONTRACT, NOT THE FROZEN JUDGE (E-32 Rule 2 / E-39 hard rule 1): no
// gate vocabulary, no verdict aggregation — the frozen scalar instrument stays separate and
// reproducible. The judge path carries no BAML dependency (transport-guard TG4).
//
// SINGLE COMPOSITION POINT (E-39 hard rule 2): `enum Department` MIRRORS src/pack/departments.mjs
// (DEPARTMENTS, derived from the idiom registry). The mirror is pinned by
// src/pack/departments.test.mjs (DPT3) — edit the enum here and the .mjs there must agree, or the
// test bites.
//
// PROPORTION / MASSING IS A SEPARATE AXIS, NOT A DEPARTMENT (the recorded S-163 decision): no
// registry idiom resizes a mass, so proportion rides the mass `adjust-params` geometry levers, not
// a CritiqueItem. The expected/present/missing triple is an element vocabulary (missing→add,
// present-but-wrong→replace, absent→remove); proportion is resize and lives off this contract. A
// structured proportion critique, if ever needed, is a schema-v2 axis (S-165/166), not forced here.

enum Department {
  ROOF
  WALL
  OPENING
  CHIMNEY
  ROOM
}

class CritiqueItem {
  department Department
  expected string @description("what the concept's style calls for here")
  present string @description("what the build currently has (empty string if absent)")
  missing string @description("what is absent vs expected (empty string if nothing missing)")
  kind "add" | "replace" | "remove" @description("add = element absent; replace = present but WRONG style/material; remove = an element that should not be there")
  severity "minor" | "major"
}

class Critique {
  items CritiqueItem[]
}

// LAYER A — the structured DIAGNOSTIC judge (T-164-01, story S-164). Authored on the T-163-01
// carrier signature (DiagnoseBuild -> Critique, the name is fixed). It compares the build renders
// against the concept, grounded on the recognized program (the per-mass intent), and names per
// CONSTRUCTION DEPARTMENT what the style calls for (expected), what the build has (present), and
// what is absent (missing). DIAGNOSIS ONLY — it does NOT propose actions/idioms (that is Layer B,
// RouteCritique, T-164-02); it does NOT carry proportion/massing (that rides the mass adjust-params
// levers, off this contract — the S-163 decision). The serializer is src/workshop/diagnose.mjs.
function DiagnoseBuild(
  style: string,
  image_list: string,
  program_block: string,
  palette_block: string,
  style_profile: string,
  departments: string,
  max_items: int,
  concept: image,
  renders: image[]
) -> Critique {
  client ClaudeStub
  prompt #"
    You are diagnosing a Minecraft build against the CONCEPT IMAGE it should look like. The declared
    style is {{ style }}. The images are:
    {{ image_list }}

    {{ program_block }}

    THE {{ style }} PACK'S MATERIAL NAMES (a vocabulary to DESCRIBE blocks — NOT the target):
    {{ palette_block }}

    {{ style_profile }}

    THE STANDARD IS THE CONCEPT IMAGE, NOT THE VOCABULARY ABOVE. Compare the build renders against the
    CONCEPT IMAGE: the expected roof / walls / openings are whatever the CONCEPT IMAGE shows there, NOT
    whatever the pack vocabulary lists. A build that matches its concept image is CORRECT even if its
    materials differ from the vocabulary; a build that does NOT match its concept image is WRONG even if
    every material is drawn from it. The vocabulary above is only so you can NAME what you see.

    For each CONSTRUCTION DEPARTMENT where the build renders diverge FROM THE CONCEPT IMAGE, state one
    item: what the concept image shows there (expected), what the build currently has (present, empty if
    absent), and what is absent versus the concept image (missing, empty if nothing missing). Tag each
    item with its kind, judged build-render-vs-concept-image: add if the element the concept image shows
    is absent (present is empty); replace if the build's element is built genuinely UNLIKE the concept
    image (different form or material than the PICTURE shows); remove if an element is present that the
    concept image does not show. CONCEPT-CONDITIONAL: if the build's element already reads like the
    concept image and only a within-picture DETAIL differs or is still missing, tag it `add` (the
    missing detail), NOT `replace`; reserve `replace` for an element that does not look like the concept
    image at all. VOXEL MEDIUM: the build is made of Minecraft blocks at finite resolution; the concept
    image may be smooth painted art. Blockiness, stair-stepped curves and diagonals, and the coarser
    block-texture palette are the MEDIUM, not divergence from the concept — judge whether the element
    depicts the SAME THING the concept shows at block resolution (same form-class, same material family,
    same feature presence), not whether it is as smooth or finely detailed as the painting. Do NOT tag
    `replace`, and do NOT raise severity to `major`, merely because an element is blockier or
    coarser-textured than the smooth concept; that is the medium, not a divergence. Ornament finer than
    the block grid can resolve (filigree, thin scrollwork, fine moldings, hairline trim) is below the
    medium's resolution — do not flag its absence as a divergence. Reserve `replace` and `major` for an
    element that depicts a GENUINELY DIFFERENT thing than the concept image — a different form-class, a
    different material FAMILY, or an element the concept does not show — never for the right thing
    rendered blockily. Tag each item with the department that owns it — one of: {{ departments }}. Judge
    element-level construction (material, covering, feature presence) AS THE CONCEPT IMAGE SHOWS IT, NOT
    overall size or proportion. Name at most {{ max_items }} items, the most divergent first; emit no
    item for a department that already reads like the concept image.

    {{ ctx.output_format }}
    {{ concept }}
    {% for r in renders %}{{ r }}{% endfor %}
  "#
}

// LAYER B — the unified DISPATCH ROUTER (T-164-02, story S-164). Maps each Layer-A CritiqueItem to the
// CONSTRUCTION DEPARTMENT that owns the fix and one concrete idiom-registry entry that addresses it. The
// router is STYLE-AGNOSTIC by design (the S-164 split): a roof item routes to ROOF regardless of style —
// only Layer A (T-165) is per-style. The candidate idioms per department are handed in
// (department_idioms_block, single-sourced from src/pack/departments.mjs via departmentToIdioms) so the
// model can only pick a REAL, buildable idiom; `resolveDispatch` (src/workshop/route.mjs) re-checks the
// membership after parse and THROWS on an idiom outside its department's set — the "names an unbuildable
// idiom" failure made loud, routed to the bounded re-ask. The serializer is src/workshop/route.mjs.
//
// `idiom` is a free STRING (not an enum): the registry holds 28 idioms and the E-32 factory grows it; a
// second mirrored enum would be drift bait. The single authority is departments.mjs, enforced post-parse.
// DISPATCH ONLY — no construction, no gate vocabulary (this is the creation-loop router, not the frozen
// instrument; transport-guard TG5 scans this file).
class DispatchItem {
  department Department
  idiom string @description("an idiom-registry name drawn from this department's candidate set")
  why string @description("why this idiom addresses the critique item")
}

class Dispatch {
  items DispatchItem[]
}

function RouteCritique(
  critique_block: string,
  department_idioms_block: string
) -> Dispatch {
  client ClaudeStub
  prompt #"
    You are routing a build diagnosis to the construction departments and idioms that can fix it. Each
    diagnosis item names a construction department and what diverges from the concept. Your job: for EACH
    item, choose the one idiom that best addresses it, drawn from that department's candidate set below.

    THE DIAGNOSIS (one item per line — department, then expected / present / missing):
    {{ critique_block }}

    THE CANDIDATE IDIOMS PER DEPARTMENT (choose the idiom from the item's own department):
    {{ department_idioms_block }}

    For each diagnosis item emit one dispatch entry: the same department, ONE idiom from that department's
    candidate set (never an idiom from another department), and a short why naming how that idiom resolves
    the missing/divergent element. Keep the items in the diagnosis's order. Choose the most direct idiom;
    if several fit, prefer the one whose name most specifically matches the missing element.

    {{ ctx.output_format }}
  "#
}
