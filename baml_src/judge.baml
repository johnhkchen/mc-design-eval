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
    rendered head-on below. Judge each dimension with ONE category. Judge only what the render shows.

    Be hard to please. The default ceiling is "strong" — a strong build is already very good. Reserve
    "exceptional" as a RARE apex: the roughly one-in-ten build you would stop and screenshot, where the
    dimension is resolved with intent end to end AND there is something surprising about it, and you
    cannot name an easy improvement. If you can name one, it is "strong", not "exceptional". Never award
    exceptional to be generous or to reward effort; most builds top out at competent or strong.

    {{ render }}

    ## The brief the build was meant to satisfy
    {{ brief }}

    ## Dimensions — anchors for each category
    - proportion — bay rhythm, balance, a coherent base→middle→crown. weak = arbitrary/awkward;
      competent = balanced but unremarkable; strong = deliberate and coherent; exceptional (rare) =
      every measure feels inevitable — a designer could not improve the rhythm or massing.
    - color — palette discipline + a harmony (dominant/supporting/accent). weak = monochrome OR
      garish; competent = pleasant but unconsidered; strong = disciplined and harmonious; exceptional
      (rare) = a scheme so well-judged it becomes the building's identity — nothing to add or remove.
    - detail — relief depth, articulation, ornament vs. flat fields. weak = flat/blocky; competent =
      some articulation; strong = rich, purposeful detail; exceptional (rare) = layered relief AND
      ornament resolved across the WHOLE facade — no flat field anywhere — rewarding close inspection.
    - fidelity — does it read as a grand TEMPLE (identity, presence, clear entrance)? weak = generic
      wall; competent = recognizable; strong = clear, characterful; exceptional (rare) = iconic —
      reads as a namable landmark, not merely an unmistakable temple.

    overall is your holistic judgement (not a mechanical combination of the others).

    {{ ctx.output_format }}
  "#
}
