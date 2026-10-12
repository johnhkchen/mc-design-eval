// Judge a card; a blind reply (CannotSee) is re-asked, then raised, never passed off as a verdict.

// The tools a judge may suggest (keep in step with references/roofs.md and craft.md).
function tools_note() -> string {
    "`mcd roof --preset` (cottage, shop, townhouse, civic, temple, granary, modern, barn, teahouse, tower-cap, lantern-cap, church, workshop, desert, cafe), a roof palette, dormers, chimneys, craft brushes (plaque, signboard, bunting, pilaster, surround, glazing, fixtures, planters, railing, finial, louvres, brackets, cornice, coping, plinth, quoins), B.sign, B.banner and `mcd paint`"
}

// The v1 glance judge (Sonnet, medium): renders the card, then a categorical verdict. Was `mcd-agent judge`.
function glance(plugin: string, nbt: string, brief: string, out_dir: string) -> GlanceVerdict {
    baml.fs.mkdir(out_dir, baml.fs.MkdirOptions { recursive: true });
    let card = root.card_of(plugin, nbt, `${out_dir}/card.png`);
    let c = root.eyes(plugin, "sonnet", "medium", out_dir);
    let img = baml.media.Image.from_file(card, "image/png");
    let tries = 0;
    while (tries < 3) {
        let v = JudgeGlance(brief, tools_note(), img, client = c);
        if (v.usability != Usability.CannotSee) {
            return v;
        }
        tries += 1;
    }
    throw baml.errors.InvalidArgument { message: `the judge could not see ${card}` }
}

// Acceptance rank: CannotSee never counts as a verdict.
function rank(u: Usability) -> int {
    match (u) {
        Usability.CannotSee => -1,
        Usability.Reject => 0,
        Usability.NeedsWork => 1,
        Usability.Usable => 2,
        Usability.Showcase => 3,
    }
}

function accepted(u: Usability) -> bool {
    rank(u) >= 2
}

test "CannotSee never ranks as a verdict" {
    assert.is_true(rank(Usability.CannotSee) < rank(Usability.Reject));
    assert.is_true(accepted(Usability.Usable));
    assert.is_true(!accepted(Usability.NeedsWork))
}

test "judge reply parses offline" {
    let spec = JudgeGlance@spec("a barn", "mcd roof", baml.media.Image.from_file("/dev/null", "image/png"));
    let v = spec.parse(
        `{"usability":"NeedsWork","massing":"Good","roof":"Poor","facades":"Fair","elements":"Fair","finish":"Fair","palette":"Good","summary":"Roof is a lid.","issues":[{"aspect":"Roof","severity":"Major","problem":"flat lid","fix":"mcd roof --preset barn"}]}`,
    );
    assert.equal(v.usability, Usability.NeedsWork);
    assert.equal(v.issues.length(), 1)
}
