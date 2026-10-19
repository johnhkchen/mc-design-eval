// NYC1034798: 7 West 54 Street, a 1900 mixed residential and commercial row building (NYC individual landmark).
// Read from the lidar record: a 7 x 23 lot, a six-storey brick front on a stone base and shopfront, the front stepped
// down two blocks at the south end, a lower four-storey rear wing at the north end and a small yard open to the east.
// Solid masonry with a one-block air gap behind each window (some lit by glowstone), so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1034798.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 7, D = 23, H = 35;
const BAND = new Set([1, 4, 7, 10, 13, 16, 19]);     // calcite string courses, one per storey
const DIRS = { "+x": [1, 0], "-x": [-1, 0], "+z": [0, 1], "-z": [0, -1] };
const SHOP = new Set([2, 3]);                          // glazed shopfront rows on the street face

// Lidar roof -> clean tiers: the front steps down to 20, the rear wing sits at 14, the body at 22 (top row = roof - 1).
const fp = new Map();
for (const [x, z, g, R] of cells) {
  const yard = R <= g;
  const top = yard ? 1 : R <= 16 ? 15 : R <= 21 ? 21 : 23;
  fp.set(`${x},${z}`, { g, top, yard });
}
const cell = (x, z) => fp.get(`${x},${z}`);
const solid = (x, y, z) => { const c = cell(x, z); return !!c && y >= 0 && y < c.top; };

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const paneAxis = new Map();      // pane key -> the wall axis it sits in ("x" on a z-face, "z" on an x-face)
const gaps = [];                 // cells behind windows: air, or glowstone for a lit window

const windowAt = (x, y, z, d) => {
  if (d === "+z" || d === "-z") {
    if (x < 1 || x > 5) return false;
    return SHOP.has(y) || x % 2 === 1;
  }
  // Side walls: party walls are plain brick; notch and yard faces are windowed.
  const [dx] = DIRS[d];
  const nb = cell(x + dx, z);
  if (x === 0 || x === 6) return !!nb && nb.yard;
  return z % 2 === 1;
};

for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.top; y++) {
    const ex = {};
    for (const d of Object.keys(DIRS)) ex[d] = !solid(x + DIRS[d][0], y, z + DIRS[d][1]);
    ex["+y"] = !solid(x, y + 1, z);
    const horiz = Object.keys(DIRS).filter((d) => ex[d]);

    if (ex["+y"] && y === c.top - 1) {
      if (c.yard) put(x, y, z, "stone_bricks");                       // yard paving
      else if (horiz.length) put(x, y, z, "calcite");                // parapet
      else put(x, y, z, "deepslate_tiles");                          // tarred roof deck
      continue;
    }
    if (horiz.length === 0) { put(x, y, z, y === 0 ? "stone" : BAND.has(y) ? "smooth_stone" : "stone_bricks"); continue; }
    if (y === 0) { put(x, y, z, "polished_granite"); continue; }     // plinth
    if (horiz.length >= 2) { put(x, y, z, "calcite"); continue; }    // quoin
    if (BAND.has(y)) { put(x, y, z, "calcite"); continue; }          // string course / sill / lintel
    const d = horiz[0];
    if (windowAt(x, y, z, d)) {
      put(x, y, z, "glass_pane");
      paneAxis.set(`${x},${y},${z}`, d[1] === "z" ? "x" : "z");
      const [dx, dz] = DIRS[d];
      gaps.push([x - dx, y, z - dz, (x * 7 + y * 3 + z * 5) % 3 === 0]);
    } else if (horiz.every((dd) => dd[1] === "x") && z % 6 === 0) put(x, y, z, "calcite");   // party-wall pilasters
    else put(x, y, z, "bricks");
  }
}

// Air gap behind each window; a third of them lit by a glowstone behind the glass.
for (const [x, y, z, lit] of gaps) {
  if (!solid(x, y, z)) continue;
  if (lit) put(x, y, z, "glowstone"); else plan.delete(`${x},${y},${z}`);
}

// Street door at the south-west bay, with a glazed transom above.
put(2, 1, 22, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(2, 2, 22, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// Rooftop: a brick stair bulkhead with a spruce water tank on it, and two weathered copper units.
for (const x of [2, 3]) for (const z of [6, 7]) { put(x, 23, z, "bricks"); put(x, 24, z, "bricks"); put(x, 25, z, "spruce_planks"); }
put(5, 23, 6, "weathered_copper"); put(5, 23, 7, "weathered_copper");

// Panes join their neighbours in the wall plane: a pier, another pane or any solid block.
const full = (k) => { const p = plan.get(k); return !!p && p.block !== "oak_door"; };
for (const [k, axis] of paneAxis) {
  if (!plan.has(k)) continue;
  const [x, y, z] = k.split(",").map(Number);
  const link = (nk) => full(nk) ? "true" : "false";
  const state = axis === "x"
    ? { east: link(`${x + 1},${y},${z}`), west: link(`${x - 1},${y},${z}`), north: "false", south: "false", waterlogged: "false" }
    : { north: link(`${x},${y},${z - 1}`), south: link(`${x},${y},${z + 1}`), east: "false", west: "false", waterlogged: "false" };
  put(x, y, z, "glass_pane", state);
}

const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = `${FILL}/NYC1034798.nbt`;
const stats = g.save(out);
console.log(`NYC1034798: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${out}`);
