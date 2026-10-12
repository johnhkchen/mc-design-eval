// Judge V3: identity (is it the subject at all?) apart from craft, a finer usability ladder, and a pairwise compare.

enum Identity {
    Unrecognisable @description("could be anything; the brief's building does not come through"),
    Generic
        @description(
            "the right broad kind of building (a house, a tower, a shed) but not THIS one: the brief's defining features are missing",
        ),
    Recognisable
        @description("reads as the brief's building once you look; some defining features weak or missing"),
    Unmistakable
        @description("a passer-by would name it at once; the defining features read clearly"),
}

enum Usability3 {
    CannotSee
        @description("the image did not load or the build is not visible: say so, never guess"),
    Reject @description("broken, ugly or unreadable; not worth fixing"),
    Rough @description("several major problems; a long way from placeable"),
    NeedsWork
        @description("a good base with one or two major problems a player would notice at once"),
    NearlyUsable
        @description(
            "no major problem left; only polish (trim, props, small finish) stands between it and placing it",
        ),
    Usable @description("a player would happily place it as-is; only minor nits"),
    Showcase @description("portfolio quality: crafted, characterful, nothing obvious to improve"),
}

class GlanceVerdict3 {
    identity: Identity,
    usability: Usability3,
    massing: root.Grade,
    roof: root.Grade,
    facades: root.Grade,
    elements: root.Grade,
    finish: root.Grade,
    palette: root.Grade,
    summary: string @description("one sentence, as a skilled builder would say it"),
    issues: root.Issue[] @description("the problems that matter most, major first, at most 5"),
}

function JudgeGlanceV3(brief: string, card: image) -> GlanceVerdict3 {
    client: "anthropic/sonnet"
    prompt: `
        You are a skilled Minecraft builder reviewing a build for a shared world. The image shows views of ONE build:
        street view at eye height (top left), front-left 3/4 (top right), front-right 3/4 (middle left), back elevation (middle right),
        and a roof close-up (bottom row) when present.

        ${card}

        The brief it was built to: ${brief}

        First IDENTITY: does it read as the brief's building, or only as a generic building of that broad kind? List to yourself
        the brief's defining features (a barn's gambrel roof, a tea house's paper screens and curved eaves) and check them.
        Then grade each aspect, then USABILITY, your holistic call (not an average): one or two major problems (a roof that
        reads as a lid, a blank side wall, a sign that reads as a plank) is NeedsWork, several is Rough; NearlyUsable means
        only polish is left. A Generic build is at best NeedsWork. Showcase is rare. List the issues that matter most, major
        first, each with a concrete fix. If you cannot see the image, answer CannotSee and leave the rest minimal.

        ${ctx.output_format()}
    `
}

enum Side {
    CannotSee @description("one or both images did not load"),
    Left,
    Right,
    Tie @description("no real difference a player would notice"),
}

enum Margin {
    Slight,
    Clear,
    Decisive,
}

class PairVerdict {
    identity: Side @description("which reads more clearly as the brief's building"),
    craft: Side @description("which is better built: massing, roof, facades, finish, palette"),
    overall: Side @description("which a player would rather place in their world"),
    margin: Margin @description("how big the overall difference is"),
    why: string @description("one sentence naming the deciding differences"),
}

function ComparePair(brief: string, left: image, right: image) -> PairVerdict {
    client: "anthropic/sonnet"
    prompt: `
        You are a skilled Minecraft builder choosing between two builds made to the same brief. Each image is a card of ONE
        build (street view, two 3/4 views, back elevation, roof close-up).

        LEFT build:
        ${left}

        RIGHT build:
        ${right}

        The brief: ${brief}

        Compare them at a glance, as a player deciding which to place. Judge identity (which reads as the brief's building,
        with its defining features) and craft separately, then pick overall. Ignore which one is shown first. Say Tie only
        when a player would not notice a difference.

        ${ctx.output_format()}
    `
}
