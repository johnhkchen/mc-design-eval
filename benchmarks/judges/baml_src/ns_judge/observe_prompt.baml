// Layer 1 of layered judging: short factual observations of ONE build, blind (no brief), no verdict. Deterministic
// schemes score these (with Layer 0 metrics from the .nbt), so the model reports what it sees and never decides.
// Counts that code reads more reliably from the .nbt (blank walls, stray blocks, materials) are Layer 0, not asked here.
// The rubric and output format come BEFORE the image so the prefix is identical, and cached, across builds.

enum RoofForm {
    None,
    Flat,
    Gable,
    Hip,
    Gambrel,
    Cone @description("cone or spire"),
    Tiered @description("stacked roofs in tiers"),
    Dome,
    Mixed @description("several forms combined"),
}

enum Amount {
    None,
    Few,
    Many,
}

enum Depth {
    Flat @description("walls are flat planes"),
    Some @description("some things stand proud or are recessed by a block"),
    Deep @description("clear relief: frames, pillars, recesses, overhangs across the faces"),
}

enum Massing {
    Box @description("one plain box"),
    Some @description("a box with a few added parts"),
    Varied @description("several clearly composed volumes or a shaped silhouette"),
}

enum Windows {
    None,
    OneToThree,
    FourToEight,
    NineOrMore,
}

class Observations {
    building_type: string @description("what a player would call it, at most five words"),
    roof_form: RoofForm,
    roof_overhang: bool @description("the roof edge projects beyond the walls"),
    roof_lid: bool @description("the roof is a slab or block sitting on the walls with no eave, edge or shape"),
    massing: Massing,
    facade_depth: Depth,
    street_door: bool @description("a door or doorway at street level on the front"),
    street_windows: Windows @description("windows on the street face"),
    wall_gaps: Amount @description("holes through walls that are not windows or doors"),
    weathering: Amount @description("deliberate wear: patina, moss, patched or mixed blocks"),
    props: Amount @description("small details: lanterns, signs, banners, planters, barrels, furniture outside"),
    sign: bool @description("a readable sign, banner or emblem"),
    storeys: int,
}

function ObserveBuild(card: image) -> Observations {
    client: "anthropic/claude-haiku-5-5"
    prompt: `
        You will see ONE Minecraft build as a player meets it: the street view at eye height (top left), the view from down
        the street on each side, and the back. Report only what you can see, as short facts. Do not judge or rate it.
        Count conservatively; if you cannot tell, give the lower answer.

        ${ctx.output_format()}

        The build:
        ${card}
    `
}
