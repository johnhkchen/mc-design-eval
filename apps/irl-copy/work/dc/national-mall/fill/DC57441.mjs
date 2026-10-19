// DC57441: 715 North Capitol St NE, a c.1920s brick warehouse of three tall storeys on a stone base, the kind that lined the
// rail yards north of Union Station. Red brick walls, stone string courses at each floor line and a stone coping; the
// glazing is recessed one block behind the brick with the piers between the bays. Lidar roof heights are quantised to
// four tiers: 2 and 3 are the one-storey lean-tos on the south side, 8 the warehouse, 9 the raised monitor down the middle,
// 10 the tower bay at the east end. Roof equipment: a penthouse on the tower, a vent stack on the warehouse roof.
// Every column is filled from y 0 up to its tier, so each setback stands on the tier below and nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57441.cells.json`, "utf8"));   // [x, z, ground, roof]

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const tierOf = (r) => (r <= 2 ? 2 : r <= 3 ? 3 : r <= 8 ? 8 : r === 9 ? 9 : 10);

// Lidar speckle: a cell alone in its tier among its neighbours takes the majority tier of the ring around it.
const raw = new Map();
for (const [x, z, g, r] of cells) raw.set(key(x, z), { g, T: tierOf(r) });
const foot = new Map();
for (const [k, v] of raw) {
  const [x, z] = k.split(",").map(Number);
  const counts = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!dx && !dz) continue;
    const n = raw.get(key(x + dx, z + dz)); if (n) counts.set(n.T, (counts.get(n.T) ?? 0) + 1);
  }
  const own = counts.get(v.T) ?? 0;
  const [best, bestN] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [v.T, 0];
  foot.set(k, { g: v.g, T: own <= 2 && bestN >= 5 ? best : v.T });
}

const at = (x, z) => foot.get(key(x, z));
const T = (x, z) => at(x, z)?.T ?? 0;                                   // outside the footprint is no roof at all
const exposed = (x, z) => DIRS.filter(([dx, dz]) => T(x + dx, z + dz) < T(x, z));   // faces to a missing or lower neighbour

// Storey lines: a floor slab at 0, 3 and 6 inside; window rows between them; the top row is the roof edge.
const FLOORS = [0, 3, 6];
const WIN = { 3: [1], 8: [1, 2, 4, 5], 9: [1, 2, 4, 5, 7], 10: [1, 2, 4, 5, 7, 8] };
const G = new Voxels([60, 22, 12]);
const SIDE = (dir) => ({ facing: dir, half: "bottom", shape: "straight", waterlogged: "false" });

// Pass 1: the hollow interior (floor slab per storey, roof membrane on top) and the outer skin.
for (const [k, { g, T: t }] of foot) {
  const [x, z] = k.split(",").map(Number);
  const exp = exposed(x, z);
  if (!exp.length) {
    for (const y of FLOORS) if (y < t - 1) G.set(x, y, z, "smooth_stone");
    G.set(x, t - 1, z, "gray_concrete");
    continue;
  }
  const quoin = exp.length > 1;                                          // a corner: stone quoins up the building
  const [ox, oz] = exp[0];
  const along = ox !== 0 ? z : x;                                        // position along the face the window sits on
  const [ix, iz] = [x - ox, z - oz];                                     // one block in, behind the wall
  const [jx, jz] = [x - 2 * ox, z - 2 * oz];
  for (let y = 0; y < t; y++) {
    if (y === t - 1) { G.set(x, y, z, "stone_bricks"); continue; }      // coping on the roof edge
    const winRow = !quoin && (WIN[t] ?? []).includes(y);
    const glazed = winRow && along % 3 !== 0 && at(ix, iz) && !exposed(ix, iz).length && y <= T(ix, iz) - 2;
    if (glazed) {
      G.set(x, y, z, "air");                                             // the opening in the brick
      G.set(ix, y, iz, "glass");                                         // the sash, one block back in the hollow
      if ((x * 7 + z * 5 + y * 3) % 23 === 0 &&at(jx, jz) && !exposed(jx, jz).length && y <= T(jx, jz) - 2) {
        G.set(jx, y, jz, "glowstone");                                   // a lit office behind some sashes
      }
      continue;
    }
    if (quoin) G.set(x, y, z, "stone_bricks");
    else if (y === 0) G.set(x, y, z, "stone_bricks");                    // base course
    else if (y === 3 || y === 6) G.set(x, y, z, "smooth_stone");         // string courses: sills and lintels
    else G.set(x, y, z, "bricks");
  }
}

// Front (z 0) entrance: a stair up from the street, a dark oak door behind a clear bay, a lantern in the next bay.
if (!at(19, 0) || !exposed(19, 0).some(([dx, dz]) => dz === -1)) throw new Error("entrance cell is not on the front");
G.set(19, 0, 0, "stone_brick_stairs", SIDE("north"));
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
G.set(19, 1, 0, "dark_oak_door", { ...door, half: "lower" });
G.set(19, 2, 0, "dark_oak_door", { ...door, half: "upper" });
G.set(19, 1, 1, "air"); G.set(19, 2, 1, "air");
G.set(20, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });

// Rear (z 9) loading bays: two iron grilles in the ground-floor bay, the hollow behind left open.
for (const x of [31, 32]) {
  if (!exposed(x, 9).some(([dx, dz]) => dz === 1)) throw new Error(`rear cell ${x},9 is not on the rear face`);
  for (const y of [1, 2]) { G.set(x, y, 9, "iron_bars"); G.set(x, y, 8, "air"); }
}

// Roof equipment: a vent stack on a warehouse roof cell, and a two-by-two penthouse on the tower bay.
const interiorRoof = [...foot.keys()].map((k) => k.split(",").map(Number))
  .find(([x, z]) => T(x, z) === 8 && z === 1 && x > 20 && !exposed(x, z).length);
if (!interiorRoof) throw new Error("no interior warehouse roof cell for the vent stack");
const [sx, sz] = interiorRoof;
for (let y = 8; y <= 10; y++) G.set(sx, y, sz, y === 10 ? "stone_bricks" : "bricks");

const tower = [...foot.keys()].map((k) => k.split(",").map(Number))
  .find(([x, z]) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => T(x + dx, z + dz) === 10));
if (!tower) throw new Error("no 2x2 tower bay for the penthouse");
const [px, pz] = tower;
for (let y = 10; y <= 11; y++) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
  const top = y === 11;
  G.set(px + dx, y, pz + dz, top ? "smooth_stone" : "stone_bricks");
}

const { blocks, palette } = G.save(`${DIR}/DC57441.nbt`);
console.log(`DC57441.nbt: ${blocks} blocks, palette ${palette}, tiers ${JSON.stringify([...foot.values()].reduce((m, v) => ((m[v.T] = (m[v.T] ?? 0) + 1), m), {}))}`);
