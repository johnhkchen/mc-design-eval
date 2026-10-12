// Entry points for blind judging on existing cards (model and effort per call).

function read_blind(
    plugin: string,
    card: string,
    model: string,
    effort: string,
    out_dir: string,
) -> BlindRead {
    let c = root.eyes(plugin, model, effort, out_dir);
    let img = baml.media.Image.from_file(card, "image/png");
    let tries = 0;
    while (tries < 3) {
        let v = ReadBlind(img, client = c);
        if (v.usability != Usability3.CannotSee) {
            return v;
        }
        tries += 1;
    }
    throw baml.errors.InvalidArgument { message: `the judge could not see ${card}` }
}

function pair_blind(
    plugin: string,
    left: string,
    right: string,
    model: string,
    effort: string,
    out_dir: string,
) -> BlindPair {
    let c = root.eyes(plugin, model, effort, out_dir);
    let l = baml.media.Image.from_file(left, "image/png");
    let r = baml.media.Image.from_file(right, "image/png");
    let tries = 0;
    while (tries < 3) {
        let v = ComparePairBlind(l, r, client = c);
        if (v.overall != Side.CannotSee) {
            return v;
        }
        tries += 1;
    }
    throw baml.errors.InvalidArgument { message: `the judge could not see ${left} / ${right}` }
}

function match_guess(
    plugin: string,
    subject: string,
    guess: string,
    out_dir: string,
) -> MatchVerdict {
    MatchGuess(subject, guess, client = root.thinker(plugin, "haiku", "low", out_dir))
}

test "blind replies parse offline" {
    let none = baml.media.Image.from_file("/dev/null", "image/png");
    let b = ReadBlind@spec(none).parse(
        `{"what":"a red barn","style":"American farm","confidence":"Sure","looks":"red planks, white trim","texture":"Weathered","usability":"NeedsWork","massing":"Good","roof":"Fair","facades":"Fair","elements":"Fair","finish":"Fair","palette":"Good","summary":"A barn."}`,
    );
    assert.equal(b.confidence, Confidence.Sure);
    let m = MatchGuess@spec("Farm barn", "a red barn").parse(`{"fit":"Exact"}`);
    assert.equal(m.fit, GuessMatch.Exact)
}
