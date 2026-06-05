// The temple-facade design output, in BAML's terse type syntax. The model emits only the
// DESIGN (style + palette + placements); the harness attaches schema_version/metadata in code.
// {{ ctx.output_format }} renders this concisely into the prompt — replacing the ~2k-token
// JSON Schema we currently staple on — and BAML's SAP parses the model's reply robustly.

class Style {
  name string
  rationale string
}

class Palette {
  palette_id string?
  manifest string[]
}

// Op-tagged placements (mirror the design-artifact schema's discriminated union).
class Voxel {
  op "voxel"
  pos int[] @description("[x, y, z]")
  block string @description("namespaced, e.g. minecraft:cut_sandstone")
  state map<string, string>?
}

class Line {
  op "line" @description("AXIS-ALIGNED or a uniform diagonal ONLY: every nonzero axis delta (to-from) must have equal magnitude. Good: [0,0,0]->[0,10,0] (vertical), [2,2,0]->[8,8,0] (45deg). BAD: [0,0,0]->[7,10,0] (unequal deltas) — that is rejected, not rasterized. For an arbitrary slope, step it with several voxels/short lines.")
  from int[]
  to int[]
  block string
  state map<string, string>?
}

class Box {
  op "box" @description("hollow rectangular shell from..to inclusive")
  from int[]
  to int[]
  block string
  state map<string, string>?
}

class Fill {
  op "fill" @description("solid cuboid from..to inclusive")
  from int[]
  to int[]
  block string
  state map<string, string>?
}

class TempleFacade {
  style Style
  palette Palette
  placements (Voxel | Line | Box | Fill)[] @description("application order; last-writer-wins on overlap")
}

function BuildTempleFacade(brief: string, design_doc: string) -> TempleFacade {
  client ClaudeStub
  prompt #"
    You are a master Minecraft architect. Build a TEMPLE FACADE as structured data that
    faithfully realizes the FINALIZED design document below, at GENEROUS SCALE with DEEP RELIEF.

    Orientation: the facade FACES +Z, in the X-Y plane (X = width, Y = height, y = 0 ground);
    relief recedes into -Z; the front face is at the highest Z. Model only the front and its relief.

    Scale & relief (use it): width up to ~48, height up to ~40 including the crown; DEEP relief up
    to ~16 into -Z, genuinely used — columns/buttresses project several blocks proud, the central
    portal recesses several blocks, cornices and the crown step across multiple Z-layers. The crown
    spans the facade's full width with real height. Avoid uniform 45-degree slopes; use slabs/stairs
    (block state) for trim; use fill/box/line for masses and line for shafts/edges.

    Materials: survival-obtainable Minecraft 1.20.1 blocks, namespaced, primarily the document's
    palette. Put the blocks you place in palette.manifest. Set style.name to the document's style
    label and style.rationale to one line.

    ## Brief
    {{ brief }}

    ## Finalized design document
    {{ design_doc }}

    {{ ctx.output_format }}
  "#
}
