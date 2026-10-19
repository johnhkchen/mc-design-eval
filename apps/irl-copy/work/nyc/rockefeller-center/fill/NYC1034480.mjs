// 25 West 47th Street: a 1938 Midtown commercial and office block on a 25-foot lot (7 x 28 blocks). Read from the
// lidar: a one-storey shop front on the street (z = 0), two storeys over the middle, three storeys with a parapet at
// the back and along the west side. Limestone-coloured walls, granite base, chiselled bands at each storey line, metal-
// sash glass in the window bays, one entrance on the street, a bulkhead and lightning rod on the top tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034480.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 7, Z = 28, Y = 22;

const roof = new Map(), ground = new Map();
for (const [x, z, g, r] of cells) { roof.set(`${x},${z}`, r); ground.set(`${x},${z}`, g); }
const inFoot = (x, z) => roof.has(`${x},${z}`);

// Lidar gaps (roof under 2 blocks) and noise: take the median of the valid roofs in the 3 x 3 around each cell.
const VALID = 2;
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const smoothRoof = (x, z) => {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!inFoot(x + dx, z + dz)) continue;
    const r = roof.get(`${x + dx},${z + dz}`); if (r >= VALID) vals.push(r);
  }
  return vals.length ? median(vals) : 4;
};
// Flat tiers: 1 storey (top at 4), 2 storeys (7), 3 storeys with parapet (10). Storey floors at y = 0, 3, 6, 9.
const tierOf = (s) => (s >= 8 ? 3 : s >= 5 ? 2 : 1);
const tier = Array.from({ length: X }, () => Array(Z).fill(0));
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFoot(x, z)) continue;
  // The street frontage (z = 0) is a one-storey shop row: the lidar's low readings there are the shop roofs.
  tier[x][z] = z === 0 && x >= 1 ? 1 : tierOf(smoothRoof(x, z));
}

// Every block goes in a map first, so panes can work out their connections from their neighbours.
const K = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => { K.set(key(x, y, z), { block, state }); };
const solidAt = (x, y, z) => K.has(key(x, y, z));

const frontDoor = { facing: "north", hinge: "left", open: "false", powered: "false" };

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFoot(x, z)) continue;
  const n = tier[x][z], top = 3 * n;
  const g = ground.get(`${x},${z}`);
  // Foundation: fill from y 0 up to the cell's ground (0 here, so none).
  for (let y = 0; y < g; y++) put(x, y, z, "polished_granite");
  const perim = x === 0 || x === X - 1 || z === 0 || z === Z - 1;
  const corner = (x === 0 || x === X - 1) && (z === 0 || z === Z - 1);
  for (let y = 0; y <= top; y++) {
    if (!perim) {
      // Interior: only the floor slabs and the roof, with air between (an air gap behind the glass).
      if (y % 3 === 0) put(x, y, z, "smooth_stone");
      continue;
    }
    if (y === 0) { put(x, y, z, "polished_granite"); continue; }                // base course
    if (y % 3 === 0) { put(x, y, z, "chiseled_quartz_block"); continue; }      // storey line, cornice at the top
    // Window layer (y % 3 is 1 or 2).
    if (corner) { put(x, y, z, "quartz_pillar"); continue; }
    if (z === 0) {                                                           // street shop front
      if (x === 3 && y <= 2) { put(x, y, z, "iron_door", { ...frontDoor, half: y === 1 ? "lower" : "upper" }); continue; }
      put(x, y, z, "light_blue_stained_glass_pane"); continue;
    }
    if (z === Z - 1) { x === 3 ? put(x, y, z, "quartz_pillar") : put(x, y, z, "light_blue_stained_glass_pane"); continue; }
    // West and east faces run the length of the block: a pier every third cell, glass between.
    z % 3 === 0 ? put(x, y, z, "quartz_pillar") : put(x, y, z, "light_blue_stained_glass_pane");
  }
}

// Panes join their neighbours in the wall plane, as vanilla panes do.
for (const [k, v] of K) {
  if (v.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const alongZ = x === 0 || x === X - 1;                                    // side faces run along z
  const conn = alongZ
    ? { north: solidAt(x, y, z - 1), south: solidAt(x, y, z + 1), east: false, west: false }
    : { east: solidAt(x + 1, y, z), west: solidAt(x - 1, y, z), north: false, south: false };
  v.state = { ...Object.fromEntries(Object.entries(conn).map(([a, b]) => [a, String(b)])), waterlogged: "false" };
}

// Warm light behind some of the glass (air cells inside the shell): glowstone on the west and east faces.
for (let z = 1; z < Z - 1; z++) {
  if (z % 6 === 2) for (const storey of [1, 2, 3]) {
    const y = 3 * storey - 2;                                               // lower window layer of storey
    if (y < 3 * tier[1][z] && K.has(key(0, y, z))) put(1, y, z, "glowstone");
  }
  if (z % 6 === 4) for (const storey of [1, 2]) {
    const y = 3 * storey - 1;                                               // upper window layer of storey
    if (y < 3 * tier[5][z] && K.has(key(6, y, z))) put(5, y, z, "glowstone");
  }
}

// Roof: an elevator bulkhead and lightning rod on the top tier at the back, and a fan house on the middle.
const bulkhead = [[2, 21], [3, 21], [2, 22], [3, 22]].every(([x, z]) => tier[x][z] === 3);
if (bulkhead) {
  for (const [x, z] of [[2, 21], [3, 21], [2, 22], [3, 22]]) put(x, 10, z, "stone_bricks");
  put(2, 11, 21, "stone_bricks"); put(3, 11, 21, "stone_bricks");
  put(3, 12, 21, "lightning_rod", { facing: "up", powered: "false" });
}
if (tier[4][12] === 2 && tier[4][13] === 2) { put(4, 7, 12, "iron_block"); put(4, 7, 13, "iron_block"); }

const g = new Voxels([X, Y, Z]);
for (const [k, v] of K) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const out = `${DIR}/NYC1034480.nbt`;
const stats = g.save(out);
console.log(JSON.stringify({ out, ...stats, tiers: [0, 1, 2, 3].map((t) => cells.filter(([x, z]) => tier[x][z] === t).length) }));
