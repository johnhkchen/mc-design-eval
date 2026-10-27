import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s brick-and-render commercial block on Eden Terrace, read from the lidar record: a stone plinth on the
// foundation, brick walls with smooth-stone sill and lintel bands on 4-block storeys, glazed bays on a 3-cell pier
// rhythm, a shopfront and door on the south face, a parapet coping, a roof plant pair, and a stepped tower on the
// west edge where the lidar stands 49 blocks up. Roof heights snap to the storey grid (21, 25, ... 49).
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_909555509.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_909555509.nbt";
const SIZE = [17, 62, 19];
const FLOORS = [5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45];   // storey bases: a floor slab each, sill at +0, lintel at +3
const DOOR = { x: 10, z: 17, face: "S" };
const OFF = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const fp = new Map();
const k2 = (x, z) => `${x},${z}`;
for (const [x, z, ground, roof] of cells) {
  const top = roof < 23 ? 21 : Math.min(49, 21 + 4 * Math.round((roof - 21) / 4));
  fp.set(k2(x, z), { g: ground, T: top });
}
const cellAt = (x, z) => fp.get(k2(x, z));

// the faces of a cell at height y that look onto air: off the footprint, or standing lower than y
function faces(x, z, y) {
  return Object.keys(OFF).filter((d) => { const n = cellAt(x + OFF[d][0], z + OFF[d][1]); return !n || y >= n.T; });
}

const g = new Voxels(SIZE);
const placed = new Map();
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); placed.set(`${x},${y},${z}`, block); };
const panes = [], lanterns = [];

function facade(x, y, z, gr, out) {
  if (y === gr) return put(x, y, z, "polished_andesite");                        // plinth course
  const ground = y < 5;
  const L = ground ? gr : Math.max(...FLOORS.filter((f) => f <= y));              // storey base
  if (ground ? y === 4 : (y === L || y === L + 3)) return put(x, y, z, "smooth_stone"); // sill / lintel bands
  const face = out[0], u = face === "N" || face === "S" ? x : z;
  if (face === DOOR.face && x === DOOR.x && z === DOOR.z && (y === gr + 1 || y === gr + 2)) {
    return put(x, y, z, "oak_door", { facing: "south", hinge: "left", open: "false", powered: "false", half: y === gr + 1 ? "lower" : "upper" });
  }
  if (out.length > 1 || u % 3 === 0) return put(x, y, z, "bricks");              // corners and piers
  put(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  panes.push([x, y, z]);
  if (y === L + 1 && (x * 3 + z) % 5 === 0) {                                     // warm light behind some panes
    const [dx, dz] = OFF[face];
    lanterns.push([x - dx, y, z - dz]);
  }
}

for (const [key, { g: gr, T }] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }                       // foundation under the slope
    const out = faces(x, z, y);
    if (y === T - 1) { put(x, y, z, out.length ? "smooth_stone" : "light_gray_concrete"); continue; }   // cornice / roof deck
    if (out.length) { facade(x, y, z, gr, out); continue; }
    if (y === gr || FLOORS.includes(y)) put(x, y, z, "light_gray_concrete");     // floor slab per storey, air above
  }
  const edge = Object.keys(OFF).some((d) => { const n = cellAt(x + OFF[d][0], z + OFF[d][1]); return !n || n.T < T; });
  if (edge) put(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // parapet coping
}

// roof plant: 2x2 units on the body roof, spaced apart
const plant = [];
for (const [key, c] of fp) {
  if (c.T !== 21) continue;
  const [x, z] = key.split(",").map(Number);
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const ok = quad.every(([a, b]) => cellAt(a, b)?.T === 21 && faces(a, b, 20).length === 0);
  if (ok && plant.every(([px, pz]) => Math.abs(px - x) > 4 || Math.abs(pz - z) > 4)) plant.push([x, z]);
  if (plant.length === 2) break;
}
for (const [x, z] of plant) for (const [a, b] of [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]]) {
  put(a, 21, b, "gray_concrete"); put(a, 22, b, "gray_concrete");
}

// glass panes connect to the walls and panes beside them, as vanilla does
const solidish = (x, y, z) => { const b = placed.get(`${x},${y},${z}`); return b && !["lantern", "oak_door"].includes(b); };
for (const [x, y, z] of panes) {
  g.set(x, y, z, "glass_pane", {
    north: String(!!solidish(x, y, z - 1)), south: String(!!solidish(x, y, z + 1)),
    east: String(!!solidish(x + 1, y, z)), west: String(!!solidish(x - 1, y, z)), waterlogged: "false",
  });
}
let lit = 0;
for (const [x, y, z] of lanterns) {
  const c = cellAt(x, z);
  if (!c || y >= c.T || y < c.g || placed.has(`${x},${y},${z}`) || faces(x, z, y).length) continue;
  put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" }); lit++;
}

const { blocks, palette } = g.save(OUT);
console.log(`way_909555509: ${blocks} blocks, ${palette} palette entries, ${panes.length} panes, ${lit} lanterns, ${plant.length} plant units`);
