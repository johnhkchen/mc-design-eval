// Vocabulary helpers from plan.md VOCABULARY (h3): post, orange_entry, beam_line, stepping_pad, barrel_cactus,
// patio_table, panel_wall, coffee_table, galley_kitchen. Each takes its position (and facing) as arguments and
// returns { placed, blocked }: blocked counts cells that already held a block, which the helper leaves alone.
// Each writes only its own footprint and nothing under it (stepping_pad paves the sand/dirt top of its own
// y=0 cells, the one exception). States are the ones `mcd states` lists: B.slab/B.trapdoor/B.door add
// waterlogged/powered, which these blocks don't list, so those states are written out.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = new Set(["minecraft:air", "minecraft:cave_air"]);
const SURFACE = new Set(["minecraft:sand", "minecraft:dirt", "minecraft:gravel", "minecraft:grass_block"]);

/** Write [x, y, z, block, state, nbt] cells into air (or onto a `top` block when given). */
function place(g, cells, top = null) {
  let placed = 0, blocked = 0;
  for (const [x, y, z, block, state, nbt] of cells) {
    const here = g.blockAt(x, y, z);
    if (!AIR.has(here) && !top?.has(here)) { blocked++; continue; }
    g.set(x, y, z, block, state, nbt);
    placed++;
  }
  return { placed, blocked };
}

/** post(x, z, y0=2, y1=4): dark_oak_log posts (axis y) on a beam line. */
export function post(g, x, z, y0 = 2, y1 = 4) {
  const cells = [];
  for (let y = y0; y <= y1; y++) cells.push([x, y, z, ...B.log("dark_oak", "y")]);
  return place(g, cells);
}

/** beam_line(x): dark_oak_log beam (axis z) at y=5 over z=5..28, on beam line x (or a wall line x=10/31). */
export function beam_line(g, x) {
  const cells = [];
  for (let z = 5; z <= 28; z++) cells.push([x, 5, z, ...B.log("dark_oak", "z")]);
  return place(g, cells);
}

/**
 * orange_entry(x, z, facing="north"): the front door in cell (x, z) (acacia_door, both halves), orange panels either
 * side of it and an orange transom above, on the ground floor (y=2..4). facing = the way the door faces.
 */
export function orange_entry(g, x, z, facing = "north") {
  const [dx, dz] = facing === "north" || facing === "south" ? [1, 0] : [0, 1];
  const cells = [];
  for (let y = 2; y <= 4; y++) {
    cells.push([x - dx, y, z - dz, ...B.block("orange_concrete")], [x + dx, y, z + dz, ...B.block("orange_concrete")]);
  }
  cells.push([x, 2, z, "acacia_door", { facing, half: "lower", hinge: "left", open: "false" }]);
  cells.push([x, 3, z, "acacia_door", { facing, half: "upper", hinge: "left", open: "false" }]);
  cells.push([x, 4, z, ...B.block("orange_concrete")]);
  return place(g, cells);
}

/** stepping_pad(x, z): a 3x1 smooth_stone pad at y=0 across x..x+2 on row z, paving the sand/dirt top of its own cells. */
export function stepping_pad(g, x, z) {
  const cells = [0, 1, 2].map((i) => [x + i, 0, z, ...B.block("smooth_stone")]);
  return place(g, cells, SURFACE);
}

/** barrel_cactus(x, z, y=1): a two-high cactus on the sand (the sand under it belongs to the site part). */
export function barrel_cactus(g, x, z, y = 1) {
  return place(g, [0, 1].map((i) => [x, y + i, z, ...B.block("cactus")]));
}

/**
 * patio_table(x, z, y=1, axis="x"): dark_oak_fence leg, smooth_quartz_slab top at y+1, and a smooth_quartz_stairs
 * chair either side along axis, its back turned away from the table. Writes nothing on the lane either side of it.
 */
export function patio_table(g, x, z, y = 1, axis = "x") {
  const [dx, dz] = axis === "x" ? [1, 0] : [0, 1];
  const cells = [
    [x, y, z, ...B.fence("dark_oak")],
    [x, y + 1, z, "smooth_quartz_slab", { type: "bottom" }],
    [x - dx, y, z - dz, "smooth_quartz_stairs", { facing: axis === "x" ? "west" : "north", half: "bottom", shape: "straight" }],
    [x + dx, y, z + dz, "smooth_quartz_stairs", { facing: axis === "x" ? "east" : "south", half: "bottom", shape: "straight" }],
  ];
  return place(g, cells);
}

/**
 * panel_wall(x, y0..y1, z, facing): a column of open spruce_trapdoors in cells (x, y0..y1, z), halves alternating
 * per row. facing = the side the panel hinges from, i.e. the wall it lies against.
 */
export function panel_wall(g, x, y0, y1, z, facing) {
  const cells = [];
  for (let y = y0; y <= y1; y++) {
    cells.push([x, y, z, "spruce_trapdoor", { facing, half: (y - y0) % 2 ? "top" : "bottom", open: "true" }]);
  }
  return place(g, cells);
}

/** coffee_table(x, z, y): one spruce_slab (bottom half) at cell (x, y, z). A flower pot would float on it, so none. */
export function coffee_table(g, x, z, y) {
  return place(g, [[x, y, z, "spruce_slab", { type: "bottom" }]]);
}

/**
 * galley_kitchen(x0, z0, y, len=5, barZ=z0+3): counter row along x on row z0 (furnace hob at x0+1, cauldron sink at
 * x0+3, iron_block fridge at the last cell), spruce_trapdoor wall cabinets above it (hinged on the wall to the north),
 * a breakfast bar on row barZ (spruce_fence legs every other cell, spruce_slab top) and birch_slab stools on row
 * barZ+1 at the leg columns. Rows z0+1..barZ-1 stay clear at y..y+1 as the walking lane.
 */
export function galley_kitchen(g, x0, z0, y, len = 5, barZ = z0 + 3) {
  if (len < 5) throw new Error("galley_kitchen: len must be at least 5 (hob, sink, fridge)");
  const cells = [];
  for (let i = 0; i < len; i++) {
    const x = x0 + i;
    if (i === 1) cells.push([x, y, z0, "furnace", { facing: "south", lit: "false" }]);
    else if (i === 3) cells.push([x, y, z0, ...B.block("cauldron")]);
    else if (i === len - 1) cells.push([x, y, z0, ...B.block("iron_block")], [x, y + 1, z0, ...B.block("iron_block")]);
    else cells.push([x, y, z0, ...B.block("white_concrete")]);
    if (i < len - 1) cells.push([x, y + 2, z0, "spruce_trapdoor", { facing: "north", half: "top", open: "true" }]);
  }
  for (let i = 0; i < len; i++) {
    const x = x0 + i;
    if (i % 2 === 0) cells.push([x, y, barZ, ...B.fence("spruce")]);
    cells.push([x, y + 1, barZ, "spruce_slab", { type: "bottom" }]);
  }
  for (let i = 0; i < len; i += 2) cells.push([x0 + i, y, barZ + 1, "birch_slab", { type: "bottom" }]);
  return place(g, cells);
}
