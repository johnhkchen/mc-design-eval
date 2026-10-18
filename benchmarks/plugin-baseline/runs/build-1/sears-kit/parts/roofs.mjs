// Part "roofs": the eight roofs (plan.md ROOFS). Plot 0's hip is roof.json, laid by runParts right after the shell; the
// other seven are laid here by the roof tool, one per plot, with the chimney stacks and the other plots' wall tops kept.
import { roof, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { P2_SLABS, P3_SLABS } from "./shell-west.mjs";

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

  // plot 0 Magnolia, after the hip: the attic keep box left the roof open along its front and back rows (y11, z15 and z19, x5..11):
  // close them with the hip's own stairs, then three small gabled dormers on the north slope (x3..5, x7..8, x10..12)
  for (let x = 5; x <= 11; x++) {
    g.set(x, 11, 15, ...B.stairs("deepslate_tile", "south"));
    g.set(x, 11, 19, ...B.stairs("deepslate_tile", "north"));
  }
  const wall = "white_concrete";
  for (const [x0, x1, cheeks] of [[3, 5, true], [7, 8, false], [10, 12, true]]) {
    const lo = cheeks ? x0 : x0 - 1, hi = cheeks ? x1 : x1 + 1;
    for (let x = lo; x <= hi; x++) {
      const pane = cheeks ? x > x0 && x < x1 : x >= x0 && x <= x1;
      for (const y of [10, 11]) {
        if (!cheeks && !pane && y === 10) continue;           // the middle dormer's cheeks stand on the roof stairs at y11 only
        if (pane) g.set(x, y, 14, "glass_pane", { east: "true", west: "true" }); else g.set(x, y, 14, wall);
      }
      if (x === lo) g.set(x, 12, 14, ...B.stairs("deepslate_tile", "east"));
      else if (x === hi) g.set(x, 12, 14, ...B.stairs("deepslate_tile", "west"));
      else g.set(x, 12, 14, "deepslate_tiles");
    }
    for (let x = x0; x <= x1; x++) if (x >= 4 && x <= 11) g.set(x, 12, 15, "deepslate_tiles");
  }

  // plot 1 Alhambra: front-gabled low roof behind the shaped parapet (ridge along z), red-tile, eaves on the sides only.
  // No fascia: the spruce trapdoors would hang off the corners of the eave with nothing behind them.
  roof(g, [18, 13, 29, 21], "gable", { texture: false, edges: { fascia: false }, soffit: "spruce",
    y: 9, ridgeAxis: "z", pitch: "half", material: "bricks", overhang: { north: 0, south: 1, east: 1, west: 1 },
    keep: [{ from: [18, 9, 13], to: [29, 14, 13] }, stack(26, 21, 28, 23)],
  });

  // plot 2 Vallonia: a LOW half-pitch side gable (1 up in 2) in dark shingle slabs, swept on down over the full-width porch at
  // the same pitch, with a wide shed dormer on the front slope (x36..44, face z13). The profile is shell-west's P2_SLABS.
  // The beam row y5 at z9 and the soffit over the porch (y5, z10..12) are laid here; the stack x33..34 z16..18 is left clear.
  for (let x = 34; x <= 46; x++) {
    for (const [zs, [y, type]] of Object.entries(P2_SLABS)) {
      const z = +zs;
      
      if ((z === 22 && (x === 34 || x === 46)) || (x === 34 && z >= 15 && z <= 19) || (x === 35 && z >= 16 && z <= 18)) continue;
      const dormer = x >= 36 && x <= 44 && (z === 13 || z === 14);
      if (dormer) { g.set(x, 9, z, "deepslate_tile_slab", { type: "bottom" }); continue; }
      g.set(x, y, z, "deepslate_tile_slab", { type });
      // the verge: a spruce plank under the outer slab of each end so the roof reads as framed
    }
  }
  g.fill([35, 5, 9], [45, 5, 9], "stripped_spruce_log", { axis: "x" });
  g.fill([35, 5, 10], [45, 5, 12], "spruce_planks");
  // exposed rafter ends: the beam row's trapdoors are the porch part's (rafterTails at z8)

  // plot 3 Puritan: a gambrel, ridge along x: a vertical lower slope (shell-west: slate y5..8 front cheeks and rear) breaking to a
  // shallow slab upper slope (P3_SLABS), the long shed dormer across the front (x53..59: its face and roof one course up)
  for (let x = 50; x <= 62; x++) for (const [zs, [y, type]] of Object.entries(P3_SLABS)) {
    const z = +zs;
    if ((x === 62 && z === 17) || (x === 50 && z >= 15 && z <= 19) || (x === 51 && z >= 16 && z <= 18)) continue;
    if (x >= 53 && x <= 59 && (z === 13 || z === 14)) { g.set(x, 10, z, "deepslate_tile_slab", { type: "bottom" }); continue; }
    g.set(x, y, z, "deepslate_tile_slab", { type });
  }
  // the slab edge of the lower slope: a drip course of upside-down slate stairs along the front cheeks' foot and the rear
  // the lower slope (spruce shingle, shell-west) leans out one cell at its foot: a block at y5 and a steep stair at y6 (the wall
  // above stays vertical), so the front cheeks and the rear show the steep lower slope, then the break at y9 into the shallow
  // slate upper slope
  for (let x = 51; x <= 61; x++) if (x < 53 || x > 59) {
    g.set(x, 5, 12, "spruce_planks");
    g.set(x, 6, 12, ...B.stairs("spruce", "south"));
  }
  for (let x = 51; x <= 61; x++) {
    g.set(x, 5, 22, "spruce_planks");
    g.set(x, 6, 22, ...B.stairs("spruce", "north"));
  }

  // plot 4 Cornell: low hip, wide eaves, hipped dormer on the front, and the hip porch roof over the full-width porch
  // plain eave and soffit, no fascia (plan ROOFS); the wide eave's end would otherwise float past the plot
  roof(g, [67, 13, 77, 21], "hip", { texture: false, edges: { fascia: false }, soffit: "spruce",
    y: 10, pitch: 45, material: "deepslate_tiles", overhang: 1,
    dormers: { face: "north", style: "hip", count: 1, width: 5 },
    keep: [stack(77, 16, 79, 18)],
  });
  // the porch roof is a flat slab deck at y5 (z10..12, the frieze row z9 is the porch part's) instead of a 45 degree hip: the hip
  // climbed to y7 against the wall and hid the upper windows, so the house read as one storey. Overhang one cell each side.
  for (let x = 66; x <= 78; x++) for (let z = 8; z <= 12; z++) if (z !== 9 || x < 67 || x > 77) g.set(x, 5, z, "deepslate_tile_slab", { type: "bottom" });

  // plot 5 Stanford: steep side gable with two gabled dormers on the front
  roof(g, [83, 14, 93, 21], "cottage", { texture: false, fascia: "spruce", soffit: "spruce",
    y: 7, ridgeAxis: "x", pitch: 45, material: "deepslate_tiles", verge: "smooth_quartz", overhang: 1,
    // no dormers option: its quartz-edged dormers read as loose white stair pieces; the two dormers are built by hand below.
    // chimneys: [] drops the cottage preset's own cobblestone stub (x92 z18), a stray pillar through the roof and the attic
    chimneys: [],
    // the side gable walls (shell) already stand at x 83 and 93 up the rake: the roof leaves those cells to them
    keep: [stack(87, 17, 89, 19), { from: [83, 6, 14], to: [83, 9, 21] }, { from: [93, 6, 14], to: [93, 9, 21] }],
  });

  // plot 5 Stanford: two neat gabled dormers (x85..87, x89..91), their front wall flush with the house wall (z14) through the eave:
  // two short walls (calcite, as the house), a 1x2 double-hung window x86 / x90 (y8..9), and a small gable roof of the main
  // roof's own slate: stairs on each side with a slate ridge course, the gable front calcite. Nothing white on the roof but the wall.
  for (const cx of [86, 90]) {
    for (const x of [cx - 1, cx + 1]) for (const z of [14, 15, 16]) for (const y of [8, 9]) g.set(x, y, z, "calcite");
    for (const y of [8, 9]) g.set(cx, y, 14, "glass_pane", { east: "true", west: "true" });
    for (const z of [15, 16]) for (const y of [8, 9]) g.set(cx, y, z, "air");
    for (const z of [14, 15, 16]) {
      g.set(cx - 1, 10, z, ...B.stairs("deepslate_tile", "east"));
      g.set(cx + 1, 10, z, ...B.stairs("deepslate_tile", "west"));
      g.set(cx, 10, z, z === 14 ? "calcite" : "deepslate_tiles");
    }
  }

  // plot 6 Winona: front gable, ridge along z at x 104 (gable end to the street)
  roof(g, [100, 13, 108, 22], "gable", { texture: false, fascia: "spruce", soffit: "spruce",
    y: 5, ridgeAxis: "z", pitch: 45, material: "spruce_planks", verge: "birch_planks", overhang: 1,
    // the front and back gable triangles are the shell's sandstone infill: the roof leaves them to the walls
    keep: [stack(98, 17, 99, 19), { from: [100, 5, 17], to: [100, 9, 19] }, { from: [100, 5, 13], to: [108, 9, 13] }, { from: [100, 5, 22], to: [108, 9, 22] }],
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
    // the shed's soffit also wrote spruce slabs into the front wall's ground cells (y3, z13), which closed the front door and the
    // upper half of the windows: keep the front wall rows y2..4 (the shell and fittings own them)
    keep: [{ from: [114, 2, 13], to: [125, 8, 13] }],
  });
}
