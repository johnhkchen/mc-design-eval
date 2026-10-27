// The Lordaeron forum centrepiece: a timber market cross round the town's bell. 7 x 7, ground 0 (layer 0 is the
// paving). The bell already stands in the world, so its cell and the one under it are left as they are
// (structure_void) and declared as the bell marker; the cross is built round it: a raised octagonal step of half
// slabs, four oak posts on stone pads with braces, a hipped tile canopy with a finial, benches facing out between the
// posts, planters at the corners, lanterns under the eaves. Walkable all round, lit.
import { Grid } from "../grid.mjs";

const POST = "dark_oak_log[axis=y]", PAD = "chiseled_stone_bricks";
const STEP = "stone_brick_slab[type=bottom,waterlogged=false]", PAVE = "polished_andesite";
const RS = (f, half = "bottom") => `granite_stairs[facing=${f},half=${half},shape=straight,waterlogged=false]`;
const BRACE = (f) => `dark_oak_stairs[facing=${f},half=top,shape=straight,waterlogged=false]`;
const BENCH = (f) => `spruce_stairs[facing=${f},half=bottom,shape=straight,waterlogged=false]`;

export function marketCross() {
  const g = new Grid([7, 10, 7]), c = 3;
  // paving, and a raised octagon of half slabs (the corners cut)
  for (let x = 0; x < 7; x++) for (let z = 0; z < 7; z++) {
    const corner = (x === 0 || x === 6) && (z === 0 || z === 6);
    g.set(x, 0, z, PAVE);
    if (!corner && x >= 1 && x <= 5 && z >= 1 && z <= 5) g.set(x, 1, z, STEP);
    else if (!corner) g.set(x, 1, z, "air");
  }
  // the bell's cell and the block under it: left as the world has them
  g.set(c, 0, c, "structure_void"); g.set(c, 1, c, "structure_void"); g.set(c, 2, c, "structure_void");
  // four posts on pads, braces to the plate, a plate ring at y 5
  for (const [x, z] of [[1, 1], [5, 1], [1, 5], [5, 5]]) { g.set(x, 1, z, PAD); for (let y = 2; y <= 5; y++) g.set(x, y, z, POST); }
  for (let x = 1; x <= 5; x++) for (const z of [1, 5]) g.set(x, 5, z, "stripped_dark_oak_log[axis=x]");
  for (let z = 2; z <= 4; z++) for (const x of [1, 5]) g.set(x, 5, z, "stripped_dark_oak_log[axis=z]");
  for (const [x, z, f] of [[2, 1, "west"], [4, 1, "east"], [2, 5, "west"], [4, 5, "east"], [1, 2, "north"], [1, 4, "south"], [5, 2, "north"], [5, 4, "south"]]) g.set(x, 4, z, BRACE(f));
  // the hipped canopy: three courses of tile stairs stepping in, a slab cap, a finial lantern on a post
  for (let k = 0; k < 3; k++) {
    const lo = k, hi = 6 - k, y = 6 + k;
    for (let x = lo; x <= hi; x++) { g.set(x, y, lo, RS("south")); g.set(x, y, hi, RS("north")); }
    for (let z = lo + 1; z < hi; z++) { g.set(lo, y, z, RS("east")); g.set(hi, y, z, RS("west")); }
    for (let x = lo + 1; x < hi; x++) for (let z = lo + 1; z < hi; z++) g.set(x, y, z, "spruce_planks");     // the ceiling
  }
  g.set(c, 9, c, "granite_slab[type=bottom,waterlogged=false]");
  // the bell hangs from the ceiling over its cell: a chain from the ceiling down to the bell's top is the placer's
  // business (the bell is the world's); light under the eaves on all four sides and benches facing out between posts
  for (const [x, z] of [[c, 1], [c, 5], [1, c], [5, c]]) g.set(x, 4, z, "lantern[hanging=true,waterlogged=false]");
  for (const [x, z, f] of [[2, 0, "north"], [4, 0, "north"], [2, 6, "south"], [4, 6, "south"], [0, 2, "west"], [0, 4, "west"], [6, 2, "east"], [6, 4, "east"]]) g.set(x, 1, z, BENCH(f === "north" ? "south" : f === "south" ? "north" : f === "west" ? "east" : "west"));
  for (const [x, z] of [[0, 0], [6, 0], [0, 6], [6, 6]]) { g.set(x, 1, z, "spruce_trapdoor[facing=north,half=top,open=false,powered=false,waterlogged=false]"); g.set(x, 2, z, "potted_red_tulip"); }
  for (const [x, z] of [[0, 3], [6, 3], [3, 0], [3, 6]]) { g.set(x, 1, z, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(x, 2, z, "lantern[hanging=false,waterlogged=false]"); }
  return { grid: g, meta: { footprint: [7, 7], height: 10, ground: 0, mirror: true, entrances: [], beds: [], workstations: [], lockers: [],
    markers: [{ at: [c, 1, c], what: "bell", note: "the town's bell stands here already; the cell and the one under and over it are structure_void" }], pilings: [], entities: [] } };
}
