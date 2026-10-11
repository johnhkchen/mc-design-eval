// Layer 1, look: short perceptual reads drawn from a human reviewer's own reasons (colour, form, detail finesse,
// grounding, odd elements). Blind, no verdict; a taste profile weights them. Rubric before the image for caching.

enum Harmony {
    Clashing @description("colours fight each other or one looks wrong"),
    Mixed @description("mostly fine, with a weak or muddy area"),
    Harmonious @description("a deliberate palette: colours relate and accents support it"),
}

enum Level {
    Low,
    Medium,
    High,
}

class Look {
    colour_harmony: Harmony,
    colour_interest: Level @description(
        "how lively and varied the colours and textures are, without judging taste",
    ),
    form_interest: Level @description("how distinctive the silhouette and shapes are (a plain box is Low)"),
    detail_finesse: Level @description(
        "how well small blocks (stairs, slabs, fences, trapdoors) shape the detail: trims, eaves, sills, frames",
    ),
    odd_element: bool @description(
        "something looks out of place: a block, flag or prop whose colour, size or position does not fit",
    ),
    grounded: bool @description("every part rests on a base or the ground; nothing hovers or perches awkwardly"),
    reads_clearly: bool @description(
        "the building's purpose is obvious at a glance from its shape (a barn, a shop, a workshop)",
    ),
}

function ObserveLook(card: image) -> Look {
    client: "anthropic/claude-haiku-5-5"
    prompt: `
        You will see ONE Minecraft build as a player meets it: the street view at eye height (top left), the view from down
        the street on each side, and the back. Answer each question briefly from what you see. Do not rate the build overall.

        ${ctx.output_format()}

        The build:
        ${card}
    `
}
