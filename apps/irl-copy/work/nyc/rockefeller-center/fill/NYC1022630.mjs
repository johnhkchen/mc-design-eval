// 111 West 44 Street, the Belasco Theatre (1907): an NYC individual and interior landmark, a Commercial & Office
// building of its years. Read as a brick office block with a theatre front: a granite plinth and shopfronts, cream
// stone storey bands, brick piers and window grids of glass panes, a stone cornice and parapet. The lidar gives three
// masses: a 20-block tower (about six storeys) along the east and the north-west screen walls, a 6-to-9-block front
// range at the north-east, and a 4-block annex. Lidar roofs are tiered to 4, 6, 9, 12 or 20 (17-19 rounds to 20).
// The lidar's roof-0 court inside the north-west screen walls is paved open ground. A one-cell lidar spike with no
// neighbour above 8 blocks is noise and is dropped. Two penthouses and a plant stack stand on the tower roof.
// Walls are one block thick: glass sits in the wall plane with air behind it, and a floor slab per storey inside.
// Every solid cell is supported: a wall stepping out over a lower roof gets a ceiling slab under it.
// Entrance: two dark-oak doors in the north wall under a black canopy band; glowstone and shroomlight behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022630.cells.json`, "utf8"));
const X = 32, Y = 32, Z = 11;

const lidar = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => lidar.has(`${x},${z}`);
const GROUND = (x, z) => lidar.get(`${x},${z}`).ground;
const NB = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

// Clean tiers: lidar roofs rounded to storeys (3 blocks; the ground storey is 4).
const tier = (r) => (r >= 17 ? 20 : r >= 12 ? 12 : r >= 8 ? 9 : r >= 6 ? 6 : r >= 4 ? 4 : 0);
const top = new Map([...lidar.keys()].map((k) => [k, tier(lidar.get(k).roof)]));
const T0 = (x, z) => (inF(x, z) ? top.get(`${x},${z}`) : 0);
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  const hasNb = NB.some(([dx, dz]) => T0(x + dx, z + dz) >= 9);
  if (top.get(k) >= 9 && !hasNb) top.set(k, 0);                  // lidar spike, not a building
}
// Tower-roof equipment: two penthouses and a plant stack (three blocks above the 20-block roof).
for (const k of ["20,5", "21,5", "22,5", "20,6", "21,6", "22,6", "28,8"]) top.set(k, 23);

const T = (x, z) => (inF(x, z) ? top.get(`${x},${z}`) : 0);
const floorK = (k) => k === 0 || k === 4 || (k >= 7 && (k - 4) % 3 === 0);   // storey lines: 4-block ground, then 3
// A side is outside at height y when it has no building there: the edge of the lot, a court, or a lower roof.
const facesOut = (x, z, y) => NB.filter(([dx, dz]) => !inF(x + dx, z + dz) || T(x + dx, z + dz) <= y);
const outer = (x, z, y) => facesOut(x, z, y).length > 0;
const solid = (x, z, y) => {
  const g = GROUND(x, z), t = T(x, z);
  if (y < g) return true;                                         // foundation to the lowest ground under the cell
  if (y >= t) return false;
  if (y === t - 1 || outer(x, z, y) || floorK(y - g)) return true;
  return y + 1 < t && outer(x, z, y + 1);                          // ceiling under a wall stepping out over a lower roof
};

const pier = (x, z, out) => (out.some(([, dz]) => dz) ? x : z) % 3 === 0;   // bays: piers every third block along the face
const DOOR = [8, 9];

function block(x, z, y) {
  const g = GROUND(x, z), t = T(x, z), k = y - g;
  if (y < g) return { name: "polished_granite" };
  if (t === 0) return g === 0 && y === 0 ? { name: "polished_andesite" } : null;   // court paving; open ground
  if (y >= t || !solid(x, z, y)) return null;
  const out = facesOut(x, z, y);
  if (out.length === 0) return { name: "smooth_stone" };                        // floor slab or ceiling inside
  if (y === t - 1) return { name: "stone_bricks" };                             // parapet
  if (y === t - 2 && t >= 9) return { name: "stone_brick_stairs", state: { facing: out[0][2], half: "bottom", shape: "straight", waterlogged: "false" } };
  if (k === 0) return { name: "polished_granite" };                             // base course
  if (z === 0 && DOOR.includes(x) && (k === 1 || k === 2)) {
    return { name: "dark_oak_door", state: { facing: "north", half: k === 1 ? "lower" : "upper", hinge: x === DOOR[0] ? "left" : "right", open: "false", powered: "false" } };
  }
  if (k < 4) {                                                                 // ground storey: shopfront under a lintel
    if (k === 3) return { name: z === 0 && x >= 7 && x <= 10 ? "black_concrete" : "stone_bricks" };
    return { name: pier(x, z, out) ? "polished_granite" : "glass_pane" };
  }
  if (floorK(k)) return { name: "smooth_sandstone" };                             // cream storey band
  return { name: pier(x, z, out) ? "bricks" : "glass_pane" };
}

const g = new Voxels([X, Y, Z]);
for (const [x, z] of [...lidar.keys()].map((k) => k.split(",").map(Number))) {
  for (let y = 0; y < Y; y++) {
    const b = block(x, z, y);
    if (b) g.set(x, y, z, b.name, b.state);
  }
}

// Warm light: glowstone or shroomlight just inside some glazed bays, where the room behind is air.
let lit = 0;
for (const [x, z] of [...lidar.keys()].map((k) => k.split(",").map(Number))) {
  const t = T(x, z), gr = GROUND(x, z);
  for (let y = gr; y < t - 2; y++) {
    const out = facesOut(x, z, y);
    if (!out.length || floorK(y - gr) || (y - gr) === 3) continue;
    const b = block(x, z, y);
    if (!b || b.name !== "glass_pane" || (x * 5 + z * 3 + y) % 11 !== 0) continue;
    const [dx, dz] = out[0];
    const ix = x - dx, iz = z - dz;
    if (!inF(ix, iz) || outer(ix, iz, y) || solid(ix, iz, y)) continue;
    g.set(ix, y, iz, lit % 3 === 0 ? "shroomlight" : "glowstone");
    lit++;
  }
}

const saved = g.save(`${DIR}/NYC1022630.nbt`);
console.log(`NYC1022630.nbt: ${saved.blocks} blocks, ${saved.palette} palette entries, ${lit} lit bays`);
