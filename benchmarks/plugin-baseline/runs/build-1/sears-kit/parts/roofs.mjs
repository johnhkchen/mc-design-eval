// Part "roofs": the eight roofs (plan.md ROOFS). Plot 0's hip is roof.json, laid by runParts right after the shell; the
// other seven are laid here by the roof tool, one per plot, with the chimney stacks and the other plots' wall tops kept.
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// keep boxes as { from, to }: the chimney stacks (y0..20) and anything a part builds above the eave that must stay
const stack = (x0, z0, x1, z1) => ({ from: [x0, 0, z0], to: [x1, 20, z1] });

export function build(g) {
  // plot 0 Magnolia: low hip over the two storeys (plan ROOFS; the roof.json file was never written, so the plot had none).
  // The portico's pediment is the porch part's; the chimney stacks pass through the eaves, kept.
  roof(g, [2, 13, 13, 21], "hip", { texture: false, edges: { fascia: false }, soffit: "spruce",
    y: 9, pitch: 45, material: "deepslate_tiles", overhang: 1,
    // the chimney stacks, and the attic room's headroom (x5..10, y10..11, z15..19; rooms.json) with the ladder column x11 left
    // as air under the hip; the roof above y12 still carries the ridge
    keep: [stack(0, 16, 2, 18), stack(13, 16, 15, 18), { from: [5, 10, 15], to: [11, 11, 19] }],
  });

  // plot 1 Alhambra: front-gabled low roof behind the shaped parapet (ridge along z), red-tile, eaves on the sides only.
  // No fascia: the spruce trapdoors would hang off the corners of the eave with nothing behind them.
  roof(g, [18, 13, 29, 21], "gable", { texture: false, edges: { fascia: false }, soffit: "spruce",
    y: 9, ridgeAxis: "z", pitch: "half", material: "bricks", overhang: { north: 0, south: 1, east: 1, west: 1 },
    keep: [{ from: [18, 9, 13], to: [29, 14, 13] }, stack(26, 21, 28, 23)],
  });

  // plot 2 Vallonia: side-gabled cottage sweeping down over the full-width porch (ridge along x)
  roof(g, [35, 9, 45, 21], "cottage", { texture: false, fascia: "spruce", soffit: "spruce",
    y: 5, ridgeAxis: "x", material: "spruce_planks", verge: "birch_planks", overhang: 1,
    keep: [stack(33, 16, 35, 18)],
  });

  // plot 3 Puritan: gambrel, ridge along x, steep lower course, shallow upper, long front shed dormer
  roof(g, [51, 13, 61, 21], "gambrel", { texture: false, fascia: "spruce", soffit: "spruce",
    // no overhang over the front (north, z12): its eave drops to y3 across the entry porch's headroom and the shutters
    y: 5, ridgeAxis: "x", pitch: 2, upperPitch: "half", lower: 2, material: "deepslate_tiles", verge: "dark_oak_planks", overhang: { north: 0, south: 1, east: 1, west: 1 },
    steep: true, dormers: { face: "north", style: "shed", width: 7, count: 1 },
    keep: [stack(49, 16, 51, 18), { from: [51, 5, 13], to: [51, 10, 21] }, { from: [61, 5, 13], to: [61, 10, 21] }],
  });

  // plot 4 Cornell: low hip, wide eaves, hipped dormer on the front, and the hip porch roof over the full-width porch
  // plain eave and soffit, no fascia (plan ROOFS); the wide eave's end would otherwise float past the plot
  roof(g, [67, 13, 77, 21], "hip", { texture: false, edges: { fascia: false }, soffit: "spruce",
    y: 9, pitch: 45, material: "deepslate_tiles", overhang: 2,
    dormers: { face: "north", style: "hip", count: 1, width: 5 },
    keep: [stack(77, 16, 79, 18)],
  });
  roof(g, [67, 9, 77, 12], "hip", { texture: false, fascia: "spruce", soffit: "spruce",
    // no overhang front or back (z8, z13): the eave would drop to y3 over the ramp's headroom (z7..8) and the front wall's
    // door and sidelight cells; the sides keep theirs
    y: 5, pitch: 45, material: "deepslate_tiles", overhang: { north: 0, south: 0, east: 1, west: 1 },
    keep: [{ from: [67, 5, 13], to: [77, 8, 13] }],
  });

  // plot 5 Stanford: steep side gable with two gabled dormers on the front
  roof(g, [83, 14, 93, 21], "cottage", { texture: false, fascia: "spruce", soffit: "spruce",
    y: 7, ridgeAxis: "x", pitch: 45, material: "deepslate_tiles", verge: "smooth_quartz", overhang: 1,
    dormers: { face: "north", count: 2, style: "gable", width: 3 },
    // the side gable walls (shell) already stand at x 83 and 93 up the rake: the roof leaves those cells to them
    keep: [stack(87, 17, 89, 19), { from: [83, 6, 14], to: [83, 9, 21] }, { from: [93, 6, 14], to: [93, 9, 21] }],
  });

  // plot 6 Winona: front gable, ridge along z at x 104 (gable end to the street)
  roof(g, [100, 13, 108, 22], "gable", { texture: false, fascia: "spruce", soffit: "spruce",
    y: 5, ridgeAxis: "z", pitch: 45, material: "spruce_planks", verge: "birch_planks", overhang: 1,
    // the front and back gable triangles are the shell's sandstone infill: the roof leaves them to the walls
    keep: [stack(108, 17, 110, 19), { from: [100, 5, 13], to: [108, 9, 13] }, { from: [100, 5, 22], to: [108, 9, 22] }],
  });

  // plot 7 Craftsman: front gable with wide eaves and a half pitch, dark slate; the porch roof is a shed low to the north
  // no fascia: its east end at x 128 would be outside the site (the build grows to 129) and float
  roof(g, [114, 13, 125, 21], "gable", { texture: false, edges: { fascia: false }, soffit: "spruce",
    y: 9, ridgeAxis: "z", pitch: "half", material: "deepslate_tiles", verge: "dark_oak_planks", overhang: 2,
    // the gable triangles at z 13 and z 21 are the shell's spruce_planks upper storey: the roof leaves them to the walls
    keep: [stack(125, 16, 127, 18), { from: [114, 9, 13], to: [125, 13, 13] }, { from: [114, 9, 21], to: [125, 13, 21] }],
  });
  roof(g, [114, 9, 125, 12], "shed", { texture: false, edges: { fascia: false }, soffit: "spruce",
    y: 5, pitch: "half", material: "deepslate_tiles", overhang: 1,
    keep: [{ from: [114, 5, 13], to: [125, 8, 13] }],
  });
}
