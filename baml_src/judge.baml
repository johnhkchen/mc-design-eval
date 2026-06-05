// LLM-as-judge as a BAML function: a categorical rubric whose output is constrained by an enum
// (output_format lists the allowed categories) and SAP-parsed. Small output, so no prose-wrap
// issues. The render image is passed in; the harness pipes the rendered prompt through claude -p
// and feeds the reply to b.parse.JudgeFacade.

enum Category {
  Weak
  Competent
  Strong
  Exceptional
}

class FacadeScore {
  proportion Category
  color Category
  detail Category
  fidelity Category
  overall Category
  notes string
}

function JudgeFacade(brief: string, render: image) -> FacadeScore {
  client ClaudeStub
  prompt #"
    You are a rigorous, discriminating architecture critic judging a Minecraft TEMPLE FACADE,
    rendered head-on below. Judge each dimension with ONE category. Be hard to please — reserve
    "exceptional" for genuinely outstanding work; most builds are competent or strong. Judge only
    what the render shows.

    {{ render }}

    ## The brief the build was meant to satisfy
    {{ brief }}

    ## Dimensions — anchors for each category
    - proportion — bay rhythm, balance, a coherent base→middle→crown. weak = arbitrary/awkward;
      competent = balanced but unremarkable; strong = deliberate and coherent; exceptional = refined,
      reads as carefully designed.
    - color — palette discipline + a harmony (dominant/supporting/accent). weak = monochrome OR
      garish; competent = pleasant but unconsidered; strong = disciplined and harmonious; exceptional
      = a distinctive, intentional scheme that elevates the whole.
    - detail — relief depth, articulation, ornament vs. flat fields. weak = flat/blocky; competent =
      some articulation; strong = rich, purposeful detail; exceptional = layered throughout.
    - fidelity — does it read as a grand TEMPLE (identity, presence, clear entrance)? weak = generic
      wall; competent = recognizable; strong = clear, characterful; exceptional = unmistakable.

    overall is your holistic judgement (not a mechanical combination of the others).

    {{ ctx.output_format }}
  "#
}
