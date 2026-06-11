// Concept decomposition (T-129-01, story S-129, epic E-32) — the design-backlog factory's core,
// new, consumed by T-131-01. A formed style + the current brush-registry state go in; brush
// work-item DRAFTS come out — each self-contained in house ticket style (E-32 Rule 3: the
// factory emits drafts, humans promote; the system never schedules its own work). The schema
// forces the duplicate-vs-registry distinction: a need an owned brush already covers MUST
// surface as a parametrization_note, never a duplicate work item (T-131's quality metric).
//
// Transport rides the subscription shim via the bridge (ClaudeStub is render-only). Fixture:
// one live-minted reply committed under src/baml/fixtures/decompose/ (T-114 ledger).

class BrushWorkItem {
  name string @description("registry-style brush name: lowercase, dotted family, e.g. roof.gable")
  purpose string @description("one sentence: what it paints/builds and where THIS style uses it")
  parameter_sketch string @description("the parameters and their kinds, as a compact schema-like sketch")
  composition_notes string @description("what it chains with; what must run before/after")
  test_plan string @description("the unit tests that would pin it")
  preview_subject string @description("the synthetic substrate its preview card renders on")
  context string @description("2-4 sentences of background a stranger needs to implement it")
  acceptance_criteria string[] @description("3-6 verifiable checkboxes")
}

class ParametrizationNote {
  need string @description("the style's need, in one line")
  existing_brush string @description("the owned registry brush that covers it")
  note string @description("how to parametrize the owned brush for this need")
}

class BrushBacklog {
  items BrushWorkItem[]
  parametrization_notes ParametrizationNote[]
}

function DecomposeBrushBacklog(style_summary: string, registry_state: string) -> BrushBacklog {
  client ClaudeStub
  prompt #"
    You are the design-backlog factory of a Minecraft pattern-book builder. A formed STYLE and
    the CURRENT BRUSH REGISTRY follow. A brush is a parametrized, composable, unit-tested build
    technique (a gable course, a timber panel rhythm, a dormer, a weathering pass) — designed
    once, reused everywhere.

    Decompose the style into the brushes it needs to be buildable. For each need, FIRST check
    the registry:
    - if an owned brush already covers it (directly or via its parameters), emit a
      parametrization_note naming that brush — NEVER a duplicate work item;
    - otherwise emit a work item: a self-contained draft spec another engineer can implement
      without you, named the way the registry names brushes.

    Work items are DRAFTS for human promotion — self-contained, never scheduled by you. Keep the
    list honest: only brushes THIS style actually needs to read as itself, ordered most-needed
    first.

    ## The formed style
    {{ style_summary }}

    ## The brush registry (what we already own)
    {{ registry_state }}

    {{ ctx.output_format }}
  "#
}
