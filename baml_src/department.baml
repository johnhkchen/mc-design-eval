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
  departments: string,
  max_items: int,
  concept: image,
  renders: image[]
) -> Critique {
  client ClaudeStub
  prompt #"
    You are diagnosing a Minecraft build against the concept it should read as. The style is
    {{ style }}. The images are:
    {{ image_list }}

    {{ program_block }}

    THE STYLE'S MATERIAL VOCABULARY (what the concept's blocks should be):
    {{ palette_block }}

    Compare the build renders against the concept. For each CONSTRUCTION DEPARTMENT that diverges,
    state one item: what the style calls for there (expected), what the build currently has (present,
    empty if absent), and what is absent versus expected (missing, empty if nothing missing). Tag
    each item with the department that owns it — one of: {{ departments }}. Judge element-level
    construction (material, covering, feature presence), NOT overall size or proportion. Name at most
    {{ max_items }} items, the most divergent first; emit no item for a department that already reads
    correctly.

    {{ ctx.output_format }}
    {{ concept }}
    {% for r in renders %}{{ r }}{% endfor %}
  "#
}
