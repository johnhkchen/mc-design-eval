// Entry point for Layer 1 observations on an existing card (model and effort per call).

function observe(
    plugin: string,
    card: string,
    model: string,
    effort: string,
    out_dir: string,
) -> Observations {
    ObserveBuild(
        baml.media.Image.from_file(card, "image/png"),
        client = root.eyes(plugin, model, effort, out_dir),
    )
}

test "observations parse offline" {
    let o = ObserveBuild@spec(baml.media.Image.from_file("/dev/null", "image/png")).parse(
        `{"building_type":"red barn","roof_form":"Gambrel","roof_overhang":true,"roof_lid":false,"massing":"Some","facade_depth":"Some","street_door":true,"street_windows":"OneToThree","wall_gaps":"None","weathering":"Few","props":"Few","sign":false,"storeys":2}`,
    );
    assert.equal(o.roof_form, RoofForm.Gambrel);
    assert.equal(o.storeys, 2)
}

function look(
    plugin: string,
    card: string,
    model: string,
    effort: string,
    out_dir: string,
) -> Look {
    ObserveLook(
        baml.media.Image.from_file(card, "image/png"),
        client = root.eyes(plugin, model, effort, out_dir),
    )
}

test "look parses offline" {
    let l = ObserveLook@spec(baml.media.Image.from_file("/dev/null", "image/png")).parse(
        `{"colour_harmony":"Harmonious","colour_interest":"High","form_interest":"Medium","detail_finesse":"Low","odd_element":false,"grounded":true,"reads_clearly":true}`,
    );
    assert.equal(l.form_interest, Level.Medium)
}
