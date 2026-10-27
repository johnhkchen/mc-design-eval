// Way 912170786: a two-storey brick commercial block with a stone base, a cream string course at each floor and a
// parapet, the street (south) face a shopfront under a stone lintel, upper windows on every face. The footprint is
// 7 x 9 with cut corners; lidar gives every cell a roof at 11 blocks above y 0, so the layout is fixed to that height:
// foundation y 0..ground, base course y 1, storey 1 walls y 2..4, floor y 5, storey 2 walls y 6..8, deck y 9, parapet y 10.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170786.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170786.nbt";

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
for (const { roof } of foot.values()) if (roof !== 11) throw new Error(`layout is fixed to a roof at 11, got ${roof}`);
const inF = (x, z) => foot.has(key(x, z));

const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];
const outward = (x, z) => DIRS.filter((d) => !inF(x + d.dx, z + d.dz));

// every block goes through here, so the glass panes can read their neighbours before the file is written
const blocks = new Map();
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { x, y, z, block, state });
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);

// the facade groups: the cells on one face line (north/south share z, east/west share x), with their run's ends
const faceLine = (d, x, z) => (d.name === "north" || d.name === "south" ? z : x);
const faceAlong = (d, x, z) => (d.name === "north" || d.name === "south" ? x : z);
const runs = new Map();
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z);
  if (out.length !== 1) continue;
  const d = out[0], id = `${d.name}:${faceLine(d, x, z)}`;
  const a = faceAlong(d, x, z), r = runs.get(id) ?? { min: a, max: a };
  r.min = Math.min(r.min, a); r.max = Math.max(r.max, a); runs.set(id, r);
}

const LIT = (x, z, y) => (x + z + y) % 3 === 1;   // a few warm windows, spread across the block

for (const [k, { ground }] of foot) {
  const [x, z] = k.split(",").map(Number);
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y <= ground; y++) put(x, y, z, "stone_bricks");
  const out = outward(x, z);
  if (out.length === 0) {
    // interior: a floor slab per storey, air between
    for (const y of [1, 5, 9]) put(x, y, z, "smooth_stone");
    continue;
  }
  // perimeter: base course, string courses, deck cornice, parapet
  put(x, 1, z, "polished_andesite");
  put(x, 5, z, "white_concrete");
  put(x, 9, z, "white_concrete");
  put(x, 10, z, "stone_bricks");
  const walls = [2, 3, 4, 6, 7, 8];
  if (out.length > 1) {
    // a corner: stone quoins, the full height
    for (const y of walls) put(x, y, z, "stone_bricks");
    continue;
  }
  const d = out[0];
  const run = runs.get(`${d.name}:${faceLine(d, x, z)}`);
  const along = faceAlong(d, x, z), rel = along - run.min, mid = Math.floor((run.min + run.max) / 2);
  const street = d.name === "south";
  for (const y of walls) put(x, y, z, "bricks");

  if (street) {
    // the shopfront: a kickplate, glazing in every bay, a door at the middle, a stone lintel with a shroomlight over it
    for (const y of [2, 3, 4]) if (along !== mid) put(x, y, z, y === 2 ? "polished_andesite" : y === 3 ? "glass" : "stone_bricks");
    if (along === mid) {
      put(x, 2, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, 3, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, 4, z, "shroomlight");
    }
    // upper windows on the street face, piers between them
    if (rel % 2 === 1) {
      put(x, 6, z, "smooth_stone");
      put(x, 7, z, LIT(x, z, 7) ? "glowstone" : "glass_pane");
      put(x, 8, z, "stone_bricks");
    }
  } else if (rel % 2 === 1) {
    // a window bay on the other faces: sill, glazed pane, lintel on each storey
    for (const [y0, y1, y2] of [[2, 3, 4], [6, 7, 8]]) {
      put(x, y0, z, y0 === 2 ? "polished_andesite" : "smooth_stone");
      put(x, y1, z, LIT(x, z, y1) ? "glowstone" : "glass_pane");
      put(x, y2, z, "stone_bricks");
    }
  }
}

// roof plant: a small 2 x 2 unit on the deck, inside the parapet
for (const [x, z] of [[2, 4], [3, 4], [2, 5], [3, 5]]) put(x, 10, z, "iron_block");

// glass panes join the neighbours they touch (pane, block or door), as the game draws them
const connects = (x, y, z) => { const b = at(x, y, z); return b && b.block !== "minecraft:air"; };
for (const b of blocks.values()) {
  if (b.block !== "glass_pane") continue;
  const st = {};
  for (const d of DIRS) st[d.name] = connects(b.x + d.dx, b.y, b.z + d.dz) ? "true" : "false";
  b.state = { ...st, waterlogged: "false" };
}

const g = new Voxels([7, 24, 9]);
for (const b of blocks.values()) g.set(b.x, b.y, b.z, b.block, b.state);
const info = g.save(OUT);
console.log(`way_912170786: ${info.blocks} blocks, ${info.palette} palette entries -> ${OUT}`);
