// Part: roofs (P3). Every plot's main roof through the library's roof() (one call per building, so each keeps its own
// style, pitch, palette and keep boxes for its stacks and cupola), then the hand-built pieces the roof tool does not
// make: the farmhouse porch shed, the forge and barn lean-tos, the cupola cap and the church spire (vocab spireCap).
// Coordinates per plan.md ROOFS. Runs after the shells, so the walls are built and each roof stands on them. No roof.json:
// the roof is laid here per building, which runParts' single roof spec cannot do for eight different styles.
import { roof, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { spireCap } from "./../vocab/h3.mjs";

const PALETTE_SLATE = { mix: [["deepslate_tiles", 3], ["cobblestone", 1], ["deepslate_bricks", 1]], eave: "cobblestone", ridge: "deepslate_tiles", verge: "stripped_spruce_log" };

// The roof tool derives its stair and slab forms from each material's name (its verge, trim and mix defaults), and some
// of those forms are not in palette.json. Each is swapped at the write for the palette block of the same shape.
const FORM_SWAP = {
  deepslate_brick_stairs: "deepslate_tile_stairs", deepslate_brick_slab: "deepslate_tile_slab",
  polished_andesite_stairs: "andesite_stairs",
  stripped_spruce_log_stairs: "spruce_stairs", stripped_spruce_log_slab: "spruce_slab",
  dark_oak_stairs: "mangrove_stairs", dark_oak_slab: "mangrove_slab",
  oak_stairs: "bamboo_stairs", oak_slab: "bamboo_slab",
  stripped_oak_log_stairs: "bamboo_stairs", stripped_oak_log_slab: "bamboo_slab",
  stripped_dark_oak_log_stairs: "waxed_exposed_cut_copper_stairs", stripped_dark_oak_log_slab: "waxed_exposed_cut_copper_slab",
  // the crib and granary mix (bamboo, oak) is widened by the texture's tone-matched neighbours: the grey members are not in
  // palette.json, so each takes the grey palette block of its shape
  tuff_brick_stairs: "stone_brick_stairs", tuff_bricks: "stone_bricks",
  cobbled_deepslate_stairs: "deepslate_tile_stairs", polished_deepslate_stairs: "deepslate_tile_stairs", polished_deepslate: "deepslate_tiles",
};
// The shell's cells are locked: a roof write into a block an earlier part built (the calcite cornice on the church's side
// walls at y 8) is dropped here, not sent on to be refused. Cells this part has already written stay open to the roof.
function paletteForms(g) {
  const placed = new Set();
  return new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => {
        const key = `${x},${y},${z}`, there = target.get(x, y, z);
        if (there && !/(^|_)air$/.test(there.block) && !placed.has(key)) return;
        placed.add(key);
        const id = String(block).replace(/^minecraft:/, "");
        return target.set(x, y, z, FORM_SWAP[id] ? `minecraft:${FORM_SWAP[id]}` : block, state, nbt);
      };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

// A lean-to or shed row: stairs stepping up toward the wall, one stair per cell along the run.
function leanTo(g, cells, facing, state) {
  for (const [x, y, z] of cells) g.set(x, y, z, ...B.stairs(state.mat, facing, "bottom"));
}

// A stepped cone of rings, each ring one course higher than the last and stepped in one cell a side (cupola cap).
function stepCap(g, [x0, z0, x1, z1], y, rows, mat) {
  for (let r = 0; r < rows; r++) {
    const xa = x0 + r, xb = x1 - r, za = z0 + r, zb = z1 - r;
    if (xa > xb || za > zb) break;
    for (let x = xa; x <= xb; x++) {
      g.set(x, y + r, za, ...B.stairs(mat, "south", "bottom"));
      g.set(x, y + r, zb, ...B.stairs(mat, "north", "bottom"));
    }
    for (let z = za + 1; z <= zb - 1; z++) {
      g.set(xa, y + r, z, ...B.stairs(mat, "east", "bottom"));
      g.set(xb, y + r, z, ...B.stairs(mat, "west", "bottom"));
    }
  }
}

export function build(grid) {
  const g = paletteForms(grid);
  // plot 0: cotton gin, tall front gable to the lane, louvred monitor on the ridge; keep the hoist beam and the hay door
  // no fascia board: at overhang 1 it would sit at x -1, off the row, and roof() would grow the grid and shift every cell
  // no louvred monitor: the library's monitor hangs its upper louvres over air (the core at y 16 is air), so they float
  roof(g, [[1, 9, 10, 16]], "granary", {
    y: 10, ridgeAxis: "z", front: "n", pitch: 1, material: PALETTE_SLATE, verge: "stripped_spruce_log", overhang: 1,
    edges: { fascia: false }, keep: [{ from: [6, 8, 7], to: [6, 10, 9] }], monitor: false,
  });

  // plot 1: schoolhouse, steep gable on the classroom; cloakroom porch with its own lower gable; the cupola stands through
  // the back eave stops at the ring (z 18): an overhang to z 19 would leave the row
  // the classroom's front gable is z 12 (the window sits in it); the cloakroom roof owns z 9..11, so the gable starts at z 12
  roof(g, [[13, 12, 22, 18]], "cottage", {
    y: 7, ridgeAxis: "z", front: "n", pitch: 1, material: { mix: [["andesite", 3], ["polished_andesite", 1]], eave: "stone_bricks", ridge: "andesite", verge: "stripped_spruce_log" },
    overhang: { north: 1, south: 0, east: 1, west: 1 },
    // the gable window (x 17..18, y 9..10) is the schoolhouse's (fittings part): the roof's gable fill leaves it open
    keep: [{ from: [16, 7, 13], to: [19, 16, 16] }, { from: [17, 9, 12], to: [18, 10, 12] }],
  });
  // its back is the classroom's front wall (z 12): the roof stops at z 11 and dies into that wall, no south overhang
  roof(g, [[15, 9, 20, 11]], "gable", {
    y: 5, ridgeAxis: "z", front: "n", pitch: 1, material: { mix: [["andesite", 3], ["polished_andesite", 1]], eave: "stone_bricks", ridge: "andesite", verge: "stripped_spruce_log" },
    overhang: { north: 1, south: 0, east: 1, west: 1 },
  });
  // cupola cap: stepped rings at y16 with a lightning rod on the apex (plan y 19)
  stepCap(g, [16, 13, 19, 16], 16, 2, "andesite");
  // the cap's centre deck at y 16 (the ring's inside), so the stepped cone above it stands on something
  for (let x = 17; x <= 18; x++) for (let z = 14; z <= 15; z++) g.set(x, 16, z, ...B.block("andesite"));
  g.set(17, 18, 14, ...B.block("lightning_rod"));

  // plot 2: farmhouse body, 1.5 storeys; the kitchen ell at the back is its own low gable
  roof(g, [[25, 10, 34, 14]], "cottage", {
    y: 8, ridgeAxis: "z", front: "n", pitch: 1, material: { mix: [["mangrove_planks", 3], ["spruce_planks", 1], ["dark_oak_planks", 1]], eave: "spruce_planks", ridge: "mangrove_planks", verge: "stripped_spruce_log" }, overhang: 1,
    keep: [{ from: [33, 7, 14], to: [34, 14, 16] }],
  });
  // the ell's back row is the body's back wall (z 14): its roof starts at z 15 and dies into that wall
  roof(g, [[26, 15, 32, 17]], "gable", {
    y: 5, ridgeAxis: "z", front: "n", pitch: 1, material: { mix: [["mangrove_planks", 3], ["spruce_planks", 1], ["dark_oak_planks", 1]], eave: "spruce_planks", ridge: "mangrove_planks", verge: "stripped_spruce_log" },
    overhang: { north: 0, south: 1, east: 1, west: 1 },
    keep: [{ from: [33, 4, 14], to: [34, 14, 16] }],
  });
  // porch shed roof: stairs at the front edge, slabs back to the body wall (plan: the roof sits under the loft window)
  for (let x = 25; x <= 34; x++) {
    g.set(x, 6, 7, ...B.stairs("mangrove", "south", "bottom"));
    g.set(x, 6, 8, ...B.slab("mangrove", "top"));
    g.set(x, 6, 9, ...B.slab("mangrove", "top"));
  }

  // plot 3: forge shed, open front, gable ridge along x at z 12; the forge chimney passes through the back
  // eave course y 6: the shell's head beam runs along the open front at y 5 (z 9), so the roof's first course sits on it
  roof(g, [[36, 9, 44, 15]], "gable", {
    y: 6, ridgeAxis: "x", front: "n", pitch: 1, material: PALETTE_SLATE, verge: "stripped_spruce_log", overhang: 1,
    keep: [{ from: [39, 4, 16], to: [41, 10, 17] }],
  });
  // cart lean-to on the east, low slope falling east
  for (let z = 8; z <= 16; z++) {
    g.set(45, 5, z, ...B.stairs("deepslate_tile", "west", "bottom"));
    g.set(46, 4, z, ...B.stairs("deepslate_tile", "west", "bottom"));
  }

  // plot 4: church nave, steep gable to the lane, tower rising through the front; calcite verge
  roof(g, [[49, 9, 56, 17]], "cottage", {
    y: 8, ridgeAxis: "z", front: "n", pitch: 1, material: { mix: [["deepslate_tiles", 3], ["cobblestone", 1], ["deepslate_bricks", 1]], eave: "stone_bricks", ridge: "deepslate_tiles", verge: "calcite" }, overhang: 1,
    keep: [{ from: [51, 8, 9], to: [54, 18, 12] }],
  });
  // steeple spire: stepped cap from the tower top (y 19) up to the apex (plan y 24) with a rod
  spireCap(g, 51, 19, 9, { size: 4, rows: 6 });

  // plot 5: tobacco barn, tall steep gable to the lane, copper roof; the flue stack passes the back
  roof(g, [[63, 9, 68, 15]], "gable", {
    y: 11, ridgeAxis: "z", front: "n", pitch: 1, material: { mix: [["waxed_exposed_cut_copper", 3], ["cobblestone", 1]], eave: "waxed_exposed_cut_copper", ridge: "waxed_exposed_cut_copper", verge: "stripped_dark_oak_log" }, overhang: 1,
    // the flue's north side at y 13..14 is air, so the roof's back eave stays off (65, 13..14, 15) and the flue reads open
    keep: [{ from: [64, 10, 16], to: [66, 15, 17] }, { from: [65, 13, 15], to: [65, 14, 15] }],
  });
  // stripping shed lean-to on the west, copper stairs falling west (plan: y 5 at x61, y 6 at x62)
  for (let z = 8; z <= 16; z++) {
    g.set(61, 5, z, ...B.stairs("waxed_exposed_cut_copper", "east", "bottom"));
    g.set(62, 6, z, ...B.stairs("waxed_exposed_cut_copper", "east", "bottom"));
  }

  // plot 6: corn crib (narrow gable) and granary (gable), bamboo planks
  roof(g, [[73, 9, 75, 16]], "gable", {
    y: 8, ridgeAxis: "z", front: "n", pitch: 1, material: { mix: [["bamboo_planks", 3], ["oak_planks", 1]], eave: "oak_planks", ridge: "bamboo_planks", verge: "stripped_oak_log" }, overhang: 1,
  });
  roof(g, [[77, 9, 82, 15]], "gable", {
    y: 7, ridgeAxis: "z", front: "n", pitch: 1, material: { mix: [["bamboo_planks", 3], ["oak_planks", 1]], eave: "oak_planks", ridge: "bamboo_planks", verge: "stripped_oak_log" }, overhang: 1,
  });

  // plot 7: owner's house, hip roof in verdigris copper, short ridge along x; the stack passes the back
  roof(g, [[85, 9, 92, 15]], "hip", {
    y: 11, pitch: 1, material: { mix: [["waxed_oxidized_cut_copper", 3], ["calcite", 1]], eave: "calcite", ridge: "waxed_oxidized_cut_copper" }, overhang: 1,
    // the stack runs solid through the back eave: its walls at y 9..10 are the chimney's, so the eave stops against them
    keep: [{ from: [90, 11, 16], to: [92, 17, 17] }, { from: [90, 9, 16], to: [92, 10, 17] }],
  });
}
