// Vernacular reasoning (T-129-01, story S-129, epic E-32) — the material-story author, new,
// consumed by T-130-01 style-formation. E-32 Rule 4: materials are DIEGETIC, not optical — a
// palette derives from what a place affords, authored in language space (the model's
// vernacular-architecture knowledge) and ratified by a human once per style. GLB textures are
// never read. The downstream palette derivation must be able to CITE this story per role, so
// available_materials carries the hooks.
//
// Transport rides the subscription shim via the bridge (ClaudeStub is render-only). Fixture:
// one live-minted reply committed under src/baml/fixtures/vernacular/ (T-114 ledger).

class AvailableMaterial {
  material string @description("a buildable material the story affords, in plain words (e.g. quarried granite, riven oak shingle)")
  source string @description("where it comes from in the story — the citation hook")
  abundance "abundant" | "common" | "scarce" | "imported"
  typical_use string @description("where this material shows up on a building")
}

class MaterialStory {
  style_name string @description("short lowercase slug-like name for the style")
  setting string @description("ONE line placing the style — pack provenance.setting shaped")
  geology string
  timber string
  wealth_class string
  roofing_economy string
  trade string
  available_materials AvailableMaterial[]
}

function AuthorMaterialStory(theme_brief: string) -> MaterialStory {
  client ClaudeStub
  prompt #"
    You are the vernacular-architecture reasoner of a Minecraft pattern-book builder. A theme
    brief follows. Author the MATERIAL STORY of that place — materials are DIEGETIC, never
    optical: a building is made from what its place affords ("locally quarried stone and
    plaster"), so reason about the place, not about colors:

    - geology: the ground underfoot — stone, clay, sand; what is quarried, dug, or fired locally;
    - timber: what grows, in what sizes and quality; the framing/plank/shingle economy it allows;
    - wealth_class: who builds here and what they can pay for — where dressed work appears and
      where it is spared;
    - roofing_economy: what covers roofs and why (thatch, shingle, slate, tile, turf), and who
      gets which;
    - trade: what arrives from elsewhere, how dear it is, and where imported material is spent.

    Then list the available_materials the story implies. Downstream, a palette derivation will
    cite THIS story per role — write each entry so a choice can point back at it. Set style_name
    to a short lowercase slug-like name and setting to ONE line placing the style.

    ## Theme brief
    {{ theme_brief }}

    {{ ctx.output_format }}
  "#
}
