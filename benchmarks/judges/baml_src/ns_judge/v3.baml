// Entry points for Judge V3 on existing cards: a single verdict and a pairwise compare, model and effort chosen per call.

function glance3(
    plugin: string,
    card: string,
    brief: string,
    model: string,
    effort: string,
    out_dir: string,
) -> GlanceVerdict3 {
    let c = root.eyes(plugin, model, effort, out_dir);
    let img = baml.media.Image.from_file(card, "image/png");
    let tries = 0;
    while (tries < 3) {
        let v = JudgeGlanceV3(brief, img, client = c);
        if (v.usability != Usability3.CannotSee) {
            return v;
        }
        tries += 1;
    }
    throw baml.errors.InvalidArgument { message: `the judge could not see ${card}` }
}

function pair(
    plugin: string,
    left: string,
    right: string,
    brief: string,
    model: string,
    effort: string,
    out_dir: string,
) -> PairVerdict {
    let c = root.eyes(plugin, model, effort, out_dir);
    let l = baml.media.Image.from_file(left, "image/png");
    let r = baml.media.Image.from_file(right, "image/png");
    let tries = 0;
    while (tries < 3) {
        let v = ComparePair(brief, l, r, client = c);
        if (v.overall != Side.CannotSee) {
            return v;
        }
        tries += 1;
    }
    throw baml.errors.InvalidArgument { message: `the judge could not see ${left} / ${right}` }
}

test "V3 replies parse offline" {
    let none = baml.media.Image.from_file("/dev/null", "image/png");
    let g = JudgeGlanceV3@spec("a barn", none).parse(
        `{"identity":"Generic","usability":"Rough","massing":"Fair","roof":"Poor","facades":"Fair","elements":"Poor","finish":"Fair","palette":"Good","summary":"A red shed.","issues":[]}`,
    );
    assert.equal(g.identity, Identity.Generic);
    let p = ComparePair@spec("a barn", none, none).parse(
        `{"identity":"Right","craft":"Tie","overall":"Right","margin":"Clear","why":"Gambrel roof."}`,
    );
    assert.equal(p.overall, Side.Right)
}
