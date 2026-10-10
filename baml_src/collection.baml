// The COLLECTION pipeline's typed judgements: categorical, never numeric (AI scores are unreliable on a 1-10 line).
// Rendered by BAML, piped through claude -p (see benchmarks/collection/baml-call.mts), SAP-parsed back into these types.

enum Usability {
  Reject      @description("broken, ugly or unreadable at a glance; not worth fixing")
  NeedsWork   @description("a good base, but at least one major problem a player would notice at once")
  Usable      @description("a player would happily place it in their world as-is; only minor nits")
  Showcase    @description("portfolio quality: crafted, characterful, nothing obvious to improve")
}

enum Grade {
  Poor
  Fair
  Good
  Excellent
}

enum Aspect {
  Massing
  Roof
  Facades
  Elements      @description("the recognisable things the brief asks for (signs, banners, props...) read as what they are")
  Finish        @description("edges, trim, depth, no noise or broken bits")
  Palette
}

enum Severity {
  Major
  Minor
}

class Issue {
  aspect Aspect
  severity Severity
  problem string @description("what is wrong, where (face / part), in a few words")
  fix string @description("a concrete change a builder could make with the toolkit")
}

class GlanceVerdict {
  usability Usability
  massing Grade
  roof Grade
  facades Grade
  elements Grade
  finish Grade
  palette Grade
  summary string @description("one sentence, as a skilled builder would say it")
  issues Issue[] @description("the problems that matter most, major first, at most 5")
}

function JudgeGlance(brief: string, card: image) -> GlanceVerdict {
  client ClaudeStub
  prompt #"
    You are a skilled Minecraft builder reviewing a build for a shared world. The image shows four views of ONE build:
    street view at eye height (top left), front-left 3/4 (top right), front-right 3/4 (bottom left), back elevation (bottom right).

    {{ card }}

    The brief it was built to: {{ brief }}

    Judge it AT A GLANCE, the way a player walking past would, and as a builder deciding whether to use it.
    Grade each aspect, then give the overall usability. Usability is your holistic call, not an average:
    one major problem (a roof that reads as a lid, a blank side wall, a sign that reads as a plank) makes it NeedsWork.
    Showcase is rare. List the issues that matter most, major first, each with a concrete fix.

    {{ ctx.output_format }}
  "#
}

enum ChangeVerdict {
  Improves
  Neutral     @description("no visible difference, or as good as before")
  Worse
}

class ChangeReview {
  verdict ChangeVerdict
  why string @description("one sentence")
}

function ReviewChange(task: string, brief: string, closeups: image[]) -> ChangeReview {
  client ClaudeStub
  prompt #"
    One small improvement task was applied to a Minecraft build ({{ brief }}). Task: "{{ task }}".
    Each image is a close-up of one view around the change: LEFT = before, RIGHT = after.

    {% for c in closeups %}{{ c }}{% endfor %}

    As a skilled builder: does the change make the build better and more usable at a glance (it reads as what it is
    meant to be, crafted), or is it noise, clutter, a clashing colour, floating or broken bits?

    {{ ctx.output_format }}
  "#
}

enum TaskKind {
  Sign
  Banner
  Detail
  Props
  Roof
  Fix
}

class ImprovementTask {
  title string
  kind TaskKind
  aspect Aspect
  where string @description("face and position in block coordinates")
  instruction string @description("exactly what to make and with which tool; signs with exact text, banners with colours and patterns")
}

class TaskList {
  tasks ImprovementTask[]
}

// Parse-only: the builder agent writes its task list as text; this types and validates it.
function ParseTasks(text: string) -> TaskList {
  client ClaudeStub
  prompt #"
    {{ text }}
    {{ ctx.output_format }}
  "#
}
