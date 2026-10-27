// Way 912170813, Auckland: a 6 x 6 block footprint (23 cells, an L-ish plan) read as a two-storey, 1920s-30s brick
// shop-top with a plastered string course, a dark shopfront on the north (street) face, sash-style glass in quartz
// surrounds, and a flat roof behind a capped parapet. Lidar roof height is 10 above y 0 on every cell, so the body is
// y 0..9 with the roof cap at y 10 (11 blocks, the brief's "about 11").
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170813.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const plan = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inF = (x, z) => plan.has(key(x, z));
const TOP = 10;
if (cells.some(([, , , roof]) => roof !== TOP)) throw new Error("roof heights differ; the tiers below assume one roof level");
if (cells.some(([, , ground]) => ground !== 0)) throw new Error("ground differs; the foundation below assumes y 0 everywhere");

// the four faces: N is -z (the street side with the shopfront), S +z, W -x, E +x
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };
const exposed = (x, z) => Object.keys(DIR).filter((d) => !inF(x + DIR[d][0], z + DIR[d][1]));
const interior = (x, z) => inF(x, z) && exposed(x, z).length === 0;

const g = new Voxels([6, 23, 6]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// a window on face d of an edge cell: the glass sits in the wall, the cell behind it (inward) is air
const pane = (ns) => ns ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" };

function windowOn(x, z, d, { door = false } = {}) {
  const planeNS = d === "W" || d === "E";
  const shop = d === "N" && z === 0;
  if (door) {
    put(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    put(x, 1, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });   // shopfront bulkhead
    put(x, 2, z, "glass_pane", pane(planeNS));
  }
  // transom / canopy band over the front, quartz lintel elsewhere on the ground floor
  put(x, 3, z, shop ? "dark_oak_slab" : "quartz_slab", { type: "top", waterlogged: "false" });
  // upper storey: quartz sill, glass, quartz head
  put(x, 5, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  put(x, 6, z, "glass_pane", pane(planeNS));
  put(x, 7, z, "quartz_slab", { type: "top", waterlogged: "false" });
}

// 1. foundation and floors across the whole footprint, then the plan's edges read as walls
for (const [x, z] of cells) {
  const edge = exposed(x, z).length > 0;
  put(x, 0, z, edge ? "polished_andesite" : "stone_bricks");        // plinth / base course, a floor slab inside
  put(x, 4, z, edge ? "quartz_block" : "smooth_stone");              // storey line, upper floor
  put(x, 8, z, edge ? "quartz_block" : "stone");                     // cornice, roof deck inside
  put(x, 9, z, edge ? "bricks" : "gray_concrete");                   // parapet, roof covering inside
  if (edge) put(x, 10, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // parapet cap
}

// 2. walls: brick on every edge cell (corners too: full-height quartz columns read as render, not brick), then the openings
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (ex.length === 0) continue;
  for (const y of [1, 2, 3, 5, 6, 7]) put(x, y, z, "bricks");
  // an opening only where the cell behind it is room air (an interior cell), never a wall
  const face = ex.find((d) => interior(x + DIR[OPP[d]][0], z + DIR[OPP[d]][1]));
  if (face === undefined) continue;
  windowOn(x, z, face, { door: x === 2 && z === 0 });
}

// 3. articulation on the roof: a small plant unit on the membrane
put(3, 10, 2, "iron_block");

// 4. warm light behind the glass: glowstone at the shopfront and one window, lanterns standing on the upper floor
put(3, 2, 1, "glowstone");
put(2, 2, 2, "glowstone");
for (const [x, z] of [[2, 1], [4, 2], [2, 3]]) put(x, 5, z, "lantern", { hanging: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170813.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
