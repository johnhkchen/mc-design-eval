// SEA1270159764: small transformer / equipment enclosure, 9 x 3 (footprint from the manifest).
// Stone foundation, dark gray concrete walls with a base band and pilasters, an iron door on the street side, iron-bar
// vent grilles on three walls, a flat roof with a slab edge, and a tiny brick chimney vent. The inside is a sealed
// enclosure, no interior fit-out.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "SEA1270159764";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill";
const manifest = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const leftovers = JSON.parse(readFileSync(`${DIR}/leftovers.json`, "utf8"));
const b = manifest.buildings.find((q) => q.id === ID);
const box = leftovers.find((q) => q.id === ID).box;
const [X0, Z0] = [box[0], box[1]];
const W = box[2] - box[0] + 1, D = box[3] - box[1] + 1, H = 10;
const FP = new Set(b.footprint.map(([x, z]) => `${x - X0},${z - Z0}`));
const inFP = (x, z) => FP.has(`${x},${z}`);
const edge = (x, z) => inFP(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFP(x + dx, z + dz));

const g = new Voxels([W, H, D]);
const bar = (ax) => (ax === "x"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

const cells = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFP(x, z)) cells.push([x, z]);
const walls = cells.filter(([x, z]) => edge(x, z));

// stone foundation y0-1 under the whole footprint
for (const [x, z] of cells) { g.set(x, 0, z, "stone_bricks"); g.set(x, 1, z, "stone_bricks"); }

// walls y2-3 in dark gray concrete, a polished andesite base band at y2
for (const [x, z] of walls) { g.set(x, 2, z, "polished_andesite"); g.set(x, 3, z, "gray_concrete"); }
// pilasters on the long north wall and the south wall, breaking the flat face
for (const z of [0, D - 1]) for (const x of [4]) if (inFP(x, z)) { g.set(x, 2, z, "polished_andesite"); g.set(x, 3, z, "polished_andesite"); }

// street-side iron door on the south wall at x=2 (y2 lower, y3 upper)
g.set(2, 2, D - 1, "iron_door", door("lower"));
g.set(2, 3, D - 1, "iron_door", door("upper"));

// vent grilles: a 2x2 on the north wall, one on each end wall
for (const x of [5, 6]) for (const y of [2, 3]) g.set(x, y, 0, "iron_bars", bar("x"));
for (const x of [0, W - 1]) for (const y of [2, 3]) g.set(x, y, 1, "iron_bars", bar("z"));

// flat roof at y4: stone-brick slab edge round the perimeter, stone-brick deck inside
for (const [x, z] of cells) {
  if (edge(x, z)) g.set(x, 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  else g.set(x, 4, z, "stone_bricks");
}

// tiny chimney vent: two brick courses and a slab cap
g.set(4, 5, 1, "bricks");
g.set(4, 6, 1, "bricks");
g.set(4, 7, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

const out = g.save(`${DIR}/${ID}.nbt`);
console.log(ID, "size", [W, H, D], "blocks", out.blocks, "palette", out.palette);
