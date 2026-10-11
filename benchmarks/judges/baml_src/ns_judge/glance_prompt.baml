// The glance judge: a skilled builder's categorical verdict on a 2x3 card.

enum Usability {
    CannotSee
        @description("the image did not load or the build is not visible: say so, never guess"),
    Reject @description("broken, ugly or unreadable at a glance; not worth fixing"),
    NeedsWork
        @description("a good base, but at least one major problem a player would notice at once"),
    Usable @description("a player would happily place it in their world as-is; only minor nits"),
    Showcase @description("portfolio quality: crafted, characterful, nothing obvious to improve"),
}

class GlanceVerdict {
    usability: Usability,
    massing: root.Grade,
    roof: root.Grade,
    facades: root.Grade,
    elements: root.Grade,
    finish: root.Grade,
    palette: root.Grade,
    summary: string @description("one sentence, as a skilled builder would say it"),
    issues: root.Issue[] @description("the problems that matter most, major first, at most 5"),
}

function JudgeGlance(brief: string, tools: string, card: image) -> GlanceVerdict {
    client: "anthropic/claude-sonnet-5-5"
    prompt: `
        You are a skilled Minecraft builder reviewing a build for a shared world. The image shows views of ONE build:
        street view at eye height (top left), front-left 3/4 (top right), front-right 3/4 (middle left), back elevation (middle right),
        and a roof close-up (bottom row) when present.

        ${card}

        The brief it was built to: ${brief}

        Judge it AT A GLANCE, the way a player walking past would, and as a builder deciding whether to use it.
        Grade each aspect, then give the overall usability. Usability is your holistic call, not an average:
        one major problem (a roof that reads as a lid, a blank side wall, a sign that reads as a plank) makes it NeedsWork.
        Showcase is rare. List the issues that matter most, major first, each with a concrete fix.
        Grade the roof against the brief's roof type (a barn's gambrel, a tea house's upturned eaves, a tower's cone).
        Suggest only tools that exist: ${tools}; never a tool that is not named here.
        If you cannot see the image, answer CannotSee and leave the rest minimal.

        ${ctx.output_format()}
    `
}
