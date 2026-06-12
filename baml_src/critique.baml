// Workshop critique (T-129-01, story S-129, epic E-32) — the T-126-01 exchange as a typed BAML
// function. The template is a BYTE-IDENTICAL transplant of the retired buildWorkshopPrompt
// (src/workshop/critique.mjs): per-round data arrives pre-serialized by critiqueRenderArgs (the
// pure .mjs serializer — image list, program JSON, palette block, conformance block, last-round
// note), the prose skeleton lives HERE. The fixture test pins the rendered bytes against the
// captured golden (src/baml/fixtures/critique/prompt.golden.txt).
//
// THIS IS WORKSHOP CRITIQUE, NOT THE FROZEN JUDGE (E-32 Rule 2): no gate vocabulary, no verdict
// aggregation — the judge path carries no BAML dependency (transport-guard test). The live
// reply gate stays parseWorkshopReply + parseAction (data-dependent grounding against the
// current program and pack); these classes are the typed mirror for b.parse fixture tests.

class WorkshopIssue {
  region string
  issue string
  severity "minor" | "major"
}

class WorkshopCritique {
  issues WorkshopIssue[]
}

class WorkshopAdjustParams {
  action "adjust-params"
  elementId string
  spec_params map<string, int | float | bool | string> @alias("params") @description("spec keys to replace")
}

class WorkshopPaintBounds {
  min int[] @description("[x, y, z]")
  max int[] @description("[x, y, z]")
}

class WorkshopSprayPaint {
  action "spray-paint"
  dir string @description("+x|-x|+z|-z|+y|-y|+x+z|+x-z|-x+z|-x-z")
  toBlock string
  fromBlock string?
  bounds WorkshopPaintBounds?
}

class WorkshopReRecognize {
  action "re-recognize"
  elementId string
}

class WorkshopReply {
  critique WorkshopCritique
  decision "revise" | "done"
  action (WorkshopAdjustParams | WorkshopSprayPaint | WorkshopReRecognize)? @description("required when revising, forbidden when done")
  rationale string
}

function CritiqueWorkshopRound(
  round_num: int,
  budget: int,
  image_list: string,
  program_json: string,
  source_block: string,
  palette_block: string,
  conformance_block: string,
  last_round_note: string,
  live_actions: string,
  max_issues: int,
  concept: image,
  renders: image[]
) -> WorkshopReply {
  client ClaudeStub
  prompt #"
    You are the builder in the workshop (round {{ round_num }} of {{ budget }}). The images are:
    {{ image_list }}

    This build is YOURS and you may revise it. Compare your build against the concept and decide.

    THE CURRENT PROGRAM (the revisable object — elements realize in order):
    ```json
    {{ program_json }}
    ```
    {{ source_block }}
    THE PACK VOCABULARY (every block you paint or assign must come from it):
    {{ palette_block }}

    THE CONFORMANCE GATE on the current build (a revision that scores worse is rolled back):
    {{ conformance_block }}
    {{ last_round_note }}
    SANCTIONED ACTIONS (choose exactly ONE per round; live now: {{ live_actions }}):
      - {"action":"adjust-params","elementId":"<element id>","params":{<spec keys to replace>}}
        (with a MASS id instead, params are the GEOMETRY levers — proportion fixes go here)
      - {"action":"spray-paint","dir":"+x|-x|+z|-z|+y|-y|+x+z|+x-z|-x+z|-x-z","toBlock":"<pack block>","fromBlock":"<block, optional>","bounds":{"min":[x,y,z],"max":[x,y,z]} (optional)}
      - {"action":"re-recognize","elementId":"<element id or mass id>"}

    Reply with EXACTLY ONE fenced json block, nothing else fenced:
    ```json
    {
      "critique": { "issues": [ { "region": "<where on the build>", "issue": "<what is wrong vs the concept>", "severity": "minor|major" } ] },
      "decision": "revise" | "done",
      "action": { ... },        // required when revising, forbidden when done
      "rationale": "<one or two sentences>"
    }
    ```
    Name at most {{ max_issues }} issues. Prefer fixing FAILING conformance checks and major visual
    divergences first. Declare "done" only when the build reads as the concept's building and the
    conformance gate passes.
    {{ concept }}
    {% for r in renders %}{{ r }}{% endfor %}
  "#
}
