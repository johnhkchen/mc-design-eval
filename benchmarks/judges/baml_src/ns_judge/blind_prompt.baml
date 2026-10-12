// Blind judging: the judge never sees the brief. It says what it thinks the build is, and grades it as a builder would;
// identity is scored afterwards by matching that guess to the subject (MatchGuess, text only), so it cannot keyword-match.

enum Confidence {
    Unsure,
    Fairly,
    Sure,
}

enum Texture {
    Clean @description("crisp, uniform materials"),
    Weathered
        @description(
            "deliberate wear or age: patina, moss, mixed or patched blocks, soot, asymmetry; a style choice",
        ),
    Damaged @description("reads as broken: holes, missing wall sections, floating or stray blocks"),
}

class BlindRead {
    what: string @description(
        "what this building is, in a few words, as a player would name it (e.g. 'a Dutch windmill')",
    ),
    style: string @description("its style or setting in a few words"),
    confidence: Confidence,
    looks: string @description(
        "before judging: what you see, neutrally - forms, materials, colours, textures, details",
    ),
    texture: Texture,
    usability: Usability3,
    massing: root.Grade,
    roof: root.Grade,
    facades: root.Grade,
    elements: root.Grade,
    finish: root.Grade,
    palette: root.Grade,
    summary: string @description("one sentence, as a skilled builder would say it"),
}

function ReadBlind(card: image) -> BlindRead {
    client: "anthropic/sonnet"
    prompt: `
        You are a skilled Minecraft builder walking through a shared world. The image shows ONE build as a player meets it:
        the street view at eye height (top left), the view from down the street on each side, and the back.

        ${card}

        First say what building you think this is, as you would name it to a friend, and its style. Then DESCRIBE how it
        looks before judging it. Weathering, patina, moss, patched or mixed materials and asymmetry are usually deliberate
        style: say so, judge whether they are done with purpose, and count them against the build only where they read as
        broken (holes, missing wall sections, floating blocks). Then judge it at a
        glance as a builder deciding whether to place it: grade each aspect and give your holistic usability (one or two
        major problems a player would notice at once is NeedsWork, several is Rough; NearlyUsable means only polish is
        left; Showcase is rare). If you cannot see the image, answer CannotSee and leave the rest minimal.

        ${ctx.output_format()}
    `
}

class BlindPair {
    left_looks: string @description(
        "before judging: the left build's look, neutrally (forms, materials, textures, details)",
    ),
    right_looks: string @description("the same for the right build"),
    craft: Side @description("which is better built: massing, roof, facades, finish, palette"),
    overall: Side @description("which a player would rather place in their world"),
    margin: Margin @description("how big the overall difference is"),
    why: string @description("one sentence naming the deciding differences"),
}

function ComparePairBlind(left: image, right: image) -> BlindPair {
    client: "anthropic/sonnet"
    prompt: `
        You are a skilled Minecraft builder choosing between two builds of the same kind of building. Each image shows ONE
        build as a player meets it (street view at eye height, down-the-street views, the back).

        LEFT build:
        ${left}

        RIGHT build:
        ${right}

        Describe each build's look first, neutrally. Weathering, patina, moss, patched or mixed materials and asymmetry
        are usually deliberate style, not damage: count them against a build only where they read as broken (holes,
        missing wall sections, floating blocks). A plain build is not better just for being tidy.
        Then: which would a player rather place in their world? Judge the whole impression first: does it read clearly as a
        building with character, is it well made, would it look good on a street. Judge craft separately. Ignore which one
        is shown first. Say Tie only when a player would not notice a difference.

        ${ctx.output_format()}
    `
}

enum GuessMatch {
    Exact
        @description(
            "names the subject or an obvious synonym (a 'pagoda-roofed teahouse' for a Japanese tea house)",
        ),
    Close
        @description(
            "the right building type with a wrong or missing style, or a near neighbour (a 'Japanese temple' for a tea house)",
        ),
    Kind @description("only the broad kind (a 'house', a 'tower', a 'shed')"),
    Wrong @description("something else"),
}

class MatchVerdict {
    fit: GuessMatch,
}

function MatchGuess(subject: string, guess: string) -> MatchVerdict {
    client: "anthropic/haiku"
    prompt: `
        A player looked at a Minecraft build and named it. How well does their name match what it was built to be?

        Built to be: ${subject}
        Player's name for it: ${guess}

        ${ctx.output_format()}
    `
}
