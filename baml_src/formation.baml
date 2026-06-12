// Style formation (T-130-01, story S-130, epic E-32) — the two missing chain stages between
// the material story (vernacular.baml) and the brush-needs decomposition (decompose.baml):
// palette derivation and proportion rules. E-32 Rule 4: materials are DIEGETIC, not optical —
// every role choice cites the story's source keys; the block vocabulary arrives as TEXT (names
// + Lab lightness from the committed table); no image input exists anywhere in formation.
//
// Transport rides the subscription shim via the bridge (ClaudeStub is render-only); the runner
// is scripts/form-style.mjs, re-asks bounded by src/baml/ask.mjs (T-114 semantics).
//
// PARSE LENIENCY (the FX-D1 class): PaletteDerivation is an all-array class — any malformed
// reply SAP-degrades to {roles: [], decoration: []}; the runner's classifyPalette treats zero
// roles as MALFORMED. ProportionRules is all-scalar — SAP coerces numerics, so out-of-vocabulary
// pitches and min>max survive parsing; classifyProportions is the gate. Both gates re-ask the
// SAME prompt (never mutate it), and both rules are taught in the prompt below so a compliant
// model can infer them (the same-prompt seam contract).

class PaletteRoleChoice {
  role string @description("lowercase dotted role name, e.g. wall.field.ground, roof.trim, chimney.cap")
  block string @description("a bare block id chosen FROM THE SUPPLIED VOCABULARY, e.g. stone_bricks")
  rationale string @description("why THIS block for this role — must read from the material story, naming the craft and economy, never just the color")
  provenance string[] @description("one or more source keys from the supplied list this choice derives from")
  band string? @description("optional zone band this role seats in (e.g. base, upper, roof)")
  tier ("dominant" | "preserve")? @description("the seat: each named band needs exactly ONE dominant; accents are preserve")
}

class DecorationChoice {
  item string @description("short name, e.g. door-lantern")
  block string @description("bare block id from the supplied vocabulary")
  where string[] @description("feature anchors, e.g. door, eave")
}

class PaletteDerivation {
  roles PaletteRoleChoice[]
  decoration DecorationChoice[]
}

function DerivePalette(story_digest: string, source_keys: string, block_vocabulary: string) -> PaletteDerivation {
  client ClaudeStub
  prompt #"
    You are the palette author of a Minecraft pattern-book builder. A MATERIAL STORY of a place
    follows, with its named material sources, and the legal BLOCK VOCABULARY. Derive the style's
    palette: which block plays each architectural role, and why — in the story's terms.

    Materials are DIEGETIC, never optical: a building is made from what its place affords. Each
    rationale must read from the story (the craft, the economy, who pays), and each choice must
    cite the source keys it derives from. Rules you must satisfy:

    - every `block` is a bare id picked FROM THE VOCABULARY BELOW — nothing outside it;
    - every `provenance` entry is one of the SOURCE KEYS listed below — nothing else;
    - cover at least the load-bearing roles a building needs to read as this style: wall field(s),
      wall dressing/trim, roof field, roof trim, roof course members (stairs + slab of the roof
      family), door(s), window treatment, chimney if the story heats with fire;
    - role names are lowercase dotted (wall.field.ground, roof.trim, door.main);
    - zone seats: where a role clearly lives in a band (base / upper / roof), give band AND tier
      TOGETHER (a half-seat — either one alone — is dropped); give each named band exactly ONE
      dominant; accents and trims are preserve;
    - the Lab L value beside each cube block is its true rendered lightness (0 black … 100
      white): use it — a "dark" material story choice must actually be dark on screen;
    - decoration is the small vocabulary of fittings (a door lantern, a window box) — optional,
      only what the story supports.

    ## The material story
    {{ story_digest }}

    ## Source keys (the only legal provenance citations)
    {{ source_keys }}

    ## Block vocabulary (the only legal blocks)
    {{ block_vocabulary }}

    {{ ctx.output_format }}
  "#
}

class ProportionRules {
  storey_min int @description("minimum storey height in blocks (>= 1)")
  storey_max int @description("maximum storey height in blocks (>= storey_min)")
  pitch_classes float[] @description("roof pitches the style uses, ONLY from: 0.5 (shallow slab), 1 (stair), 2 (steep)")
  opening_min int @description("minimum spacing between wall openings, in cells (>= 1)")
  opening_max int @description("maximum spacing between wall openings, in cells (>= opening_min)")
}

function DeriveProportions(story_digest: string, palette_digest: string) -> ProportionRules {
  client ClaudeStub
  prompt #"
    You are the proportion author of a Minecraft pattern-book builder. A MATERIAL STORY and the
    style's derived PALETTE follow. State the style's proportion rules — the numbers a generator
    obeys so buildings of this style read right.

    Reason from the place: timber lengths and wall material set storey heights; the roofing
    economy sets pitch (thatch and shingle want steep; turf and plank tolerate shallow); wealth
    and window glass set how often openings interrupt a wall. Rules you must satisfy:

    - storey heights in whole blocks, storey_min <= storey_max, both >= 1 (vernacular dwellings
      sit around 3-4; grand or lofty traditions may go higher);
    - pitch_classes ONLY from the realizable vocabulary: 0.5 (shallow, slab courses), 1
      (45-degree stair courses), 2 (steep); list every pitch the style genuinely uses,
      most common first;
    - opening spacing in wall cells, opening_min <= opening_max, both >= 1.

    ## The material story
    {{ story_digest }}

    ## The derived palette
    {{ palette_digest }}

    {{ ctx.output_format }}
  "#
}
