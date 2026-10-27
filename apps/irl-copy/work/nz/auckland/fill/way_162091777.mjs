// Way 162091777, Mt Eden side of the CBD: a 1930s plastered shop-top block. Two storeys over shops with a parapet,
// a single-storey lower wing on the east, and a three-storey corner tower on the west (the lidar's 14-block roof),
// set back from its podium. Cream plaster, black basalt plinth and piers, glazed bays, one lit row of windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162091777.cells.json`, "utf8"));
const X = 44, Z = 25, Y = 27;

// footprint: "x,z" -> { g: ground, T: smoothed roof top (tier) }
const at = new Map();
for (const [x, z, g, r] of cells) at.set(`${x},${z}`, { g, r });
const cell = (x, z) => at.get(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACE = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const keyOf = (x, z) => `${x},${z}`;
const xyOf = (k) => k.split(",").map(Number);

// lidar noise -> three flat tiers: the mean of each cell's 3x3 footprint neighbourhood, quantised to 8 / 10 / 14
// (the median erased the 14-block tower; the mean keeps it as a mass and leaves the east side as a lower wing)
const avg = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = cell(x + dx, z + dz); if (c) v.push(c.r); }
  return v.reduce((a, b) => a + b, 0) / v.length;
};
const tier = (m) => (m >= 11 ? 14 : m >= 9.5 ? 10 : 8);
for (const [k, c] of at) { const [x, z] = xyOf(k); c.T = tier(avg(x, z)); }

// the tower's setback: its outer ring (distance 1 from the footprint edge) drops to the 10-block podium roof
const dist = new Map(), q = [];
for (const k of at.keys()) {
  const [x, z] = xyOf(k);
  if (NB.some(([dx, dz]) => !cell(x + dx, z + dz))) { dist.set(k, 1); q.push([x, z]); }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i], d = dist.get(keyOf(x, z));
  for (const [dx, dz] of NB) {
    const k = keyOf(x + dx, z + dz);
    if (at.has(k) && !dist.has(k)) { dist.set(k, d + 1); q.push([x + dx, z + dz]); }
  }
}
for (const [k, c] of at) if (c.T === 14 && dist.get(k) === 1) c.T = 10;

// a wall cell is on the outside, or against a neighbour with a different top (a cliff face of a taller tier)
const isWall = (x, z) => {
  const c = cell(x, z);
  return NB.some(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || n.T !== c.T; });
};
const outward = (x, z) => NB.filter(([dx, dz]) => !cell(x + dx, z + dz)).map(([dx, dz]) => FACE[`${dx},${dz}`]);

// the entrance: a glazed bay (not a pier) on a north-facing street wall, the easternmost found
let door = null;
for (const [k, c] of at) {
  const [x, z] = xyOf(k);
  if (!outward(x, z).includes("north") || (x + z) % 3 === 0 || c.T < 10) continue;
  if (!door || x > door.x) door = { x, z, face: "north" };
}
if (!door) throw new Error("no north street wall for the entrance");

const g = new Voxels([X, Y, Z]);
const lit = (x, y, z) => (x * 7 + z * 5 + y * 3) % 9 === 0;   // a deterministic one in nine
const roofPlant = (x, z) => (x * 5 + z * 3) % 23 === 0;

let walls = 0, glazed = 0, slabs = 0, plant = 0;
for (const [k, c] of at) {
  const [x, z] = xyOf(k), { g: G0, T } = c;
  for (let y = 0; y < G0; y++) g.set(x, y, z, "stone_bricks");       // the terrain under the floor, up to the ground
  const wall = isWall(x, z);
  if (!wall) {
    // interior: a floor slab per storey, the roof deck at T-2 and its covering at T-1 (level with the parapet caps,
    // so the roofline is flat), air between
    for (let y = G0; y <= T - 1; y++) if ((y - G0) % 4 === 0 || y >= T - 2) { g.set(x, y, z, "smooth_stone"); slabs++; }
    // roof plant: a 2x2 iron block on the covering, where all four cells are roof and at the same top
    const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    const roofQuad = quad.every(([a, b]) => cell(a, b) && cell(a, b).T === T && !isWall(a, b));
    if (T >= 10 && roofPlant(x, z) && roofQuad) { for (const [a, b] of quad) g.set(a, T, b, "iron_block"); plant++; }
    continue;
  }
  walls++;
  const p = (x + z) % 3 === 0;                      // every third block along the wall is a pier, so the glazing reads as bays
  const doorHere = door && door.x === x && door.z === z;
  for (let y = G0; y < T; y++) {
    const rel = y - G0;
    if (y === T - 1) { g.set(x, y, z, "chiseled_quartz_block"); continue; }      // parapet cap
    if (y === T - 2) { g.set(x, y, z, "quartz_bricks"); continue; }              // cornice course under the cap
    if (rel === 0) { g.set(x, y, z, "polished_blackstone_bricks"); continue; }   // basalt plinth
    if (rel % 4 === 0) { g.set(x, y, z, "quartz_bricks"); continue; }            // storey string course
    const ground = rel < 4;
    if (p) { g.set(x, y, z, "quartz_pillar"); continue; }
    if (ground && rel === 3) { g.set(x, y, z, "black_concrete"); continue; }     // shop transom
    if (doorHere && rel <= 2) {
      g.set(x, y, z, "dark_oak_door", { facing: door.face, half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ground) {
      if (lit(x, y, z) && rel === 2) { g.set(x, y, z, "glowstone"); glazed++; continue; }
      g.set(x, y, z, "glass_pane"); glazed++; continue;
    }
    if (rel % 4 === 2 && lit(x, y, z)) { g.set(x, y, z, "glowstone"); glazed++; continue; }
    g.set(x, y, z, "glass_pane"); glazed++;
  }
}

// door flank lanterns: hung from the transom, beside the door on the same wall
{
  const dc = cell(door.x, door.z);
  for (const dx of [-1, 1]) {
    const lx = door.x + dx, lz = door.z, c = cell(lx, lz);
    if (c && c.T === dc.T && isWall(lx, lz) && (lx + lz) % 3 !== 0) {
      g.set(lx, dc.g + 2, lz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

const stats = { cells: at.size, walls, glazed, slabs, plant, door, tiers: {} };
for (const c of at.values()) stats.tiers[c.T] = (stats.tiers[c.T] || 0) + 1;
const saved = g.save(`${DIR}/way_162091777.nbt`);
console.log(JSON.stringify({ ...stats, saved }));
