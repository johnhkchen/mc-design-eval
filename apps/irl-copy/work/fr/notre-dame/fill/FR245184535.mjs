// FR245184535: a Haussmann-era residential block (1800, five storeys under a deepslate mansard), on the lidar footprint.
// Storeys: a 5-block ground floor, then 4-block storeys. String courses sit on y = 1 mod 4, windows on 2 and 3, lintels on
// 0 mod 4, so every storey and cornice lines up across the block. Roof tiers snap to 9, 13, 17, 21 (setbacks); the 21 tier
// carries a stepped mansard rising to 27. Walls are one block of shell over an air gap, floor slabs at each storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184535.cells.json`, "utf8"));

const W = 26, H = 39, D = 32;
const vox = new Voxels([W, H, D]);
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const TIERS = [9, 13, 17, 21];                 // wall tops; the 21 tier is the attic under the mansard
const MANSARD = 21;
const GROUND_TOP = 5;                          // the ground floor's wall runs y 0..4
const FLOORS = [5, 9, 13, 17];                 // interior floor slabs (the storey lines above the ground floor)

const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { x, z, ground, lidar: roof });
const at = (x, z) => fp.get(`${x},${z}`);

// Lidar noise: 3x3 median, then the wall top (roof less its one-block cap) snaps to the nearest tier (ties go up).
for (const c of fp.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)] - 1;
  c.Wt = TIERS.reduce((best, t) => (Math.abs(t - med) <= Math.abs(best - med) ? t : best));
  c.core = c.Wt === MANSARD;
}

// Mansard depth: distance inward from the attic's edge (edge = 0). Each step in adds a block, up to six.
const dist = new Map(), queue = [];
for (const c of fp.values()) {
  if (c.core && NEI.some(([, dx, dz]) => !at(c.x + dx, c.z + dz)?.core)) { dist.set(c, 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [, dx, dz] of NEI) {
    const n = at(c.x + dx, c.z + dz);
    if (n?.core && !dist.has(n)) { dist.set(n, dist.get(c) + 1); queue.push(n); }
  }
}
// Highest solid block in a column: the wall's cap, or the top of the mansard.
const topOf = (c) => (c.core ? 20 + Math.min(6, (dist.get(c) ?? 0) + 1) : c.Wt);

// Air at (x, y, z): no footprint cell there, or the column stands below y.
const airAt = (x, z, y) => { const n = at(x, z); return !n || y > topOf(n); };
const exposure = (c, y) => NEI.filter(([, dx, dz]) => airAt(c.x + dx, c.z + dz, y));

// The street face: the exposed run at ground level with the most cells; its middle cell takes the door.
const street = { north: [], south: [], west: [], east: [] };
for (const c of fp.values()) { const ex = exposure(c, c.ground); if (ex.length === 1) street[ex[0][0]].push(c); }
const doorDir = Object.keys(street).reduce((a, b) => (street[b].length > street[a].length ? b : a));
const run = street[doorDir].sort((p, q) => (doorDir === "north" || doorDir === "south" ? p.x - q.x : p.z - q.z));
const doorCell = run[Math.floor(run.length / 2)];
const doorKey = `${doorCell.x},${doorCell.z}`;

const glassState = (dx) => (dx ? { north: "true", south: "true", east: "false", west: "false" }
  : { north: "false", south: "false", east: "true", west: "true" });   // panes join along the face they sit in
const lights = [];

for (const c of fp.values()) {
  const { x, z } = c, top = topOf(c);
  for (let y = 0; y <= top; y++) {
    // Foundation: solid from y 0 up to this cell's ground.
    if (y < c.ground) { vox.set(x, y, z, "stone_bricks"); continue; }
    // Roof: the cap of a flat tier, and the whole mansard above the attic's base.
    if (y === top || (c.core && y >= MANSARD)) { vox.set(x, y, z, "deepslate_tiles"); continue; }

    const ex = exposure(c, y);
    if (!ex.length) {                          // inside: an air gap, with a floor slab per storey
      if (y === 0 || FLOORS.includes(y)) vox.set(x, y, z, "oak_planks");
      continue;
    }
    if (ex.length >= 2) { vox.set(x, y, z, "cut_sandstone"); continue; }   // quoins at the corners

    const [, dx, dz] = ex[0];
    const outward = ex[0][0];
    const along = dx ? z : x;
    const row = y % 4;
    const ground = y < GROUND_TOP;

    if (`${x},${z}` === doorKey && outward === doorDir) {
      if (y === c.ground || y === c.ground + 1) {
        const state = { facing: outward, half: y === c.ground ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        vox.set(x, y, z, "dark_oak_door", state); continue;
      }
      if (y === c.ground + 2) { vox.set(x, y, z, "cut_sandstone"); continue; }  // the doorway's lintel
    }

    if (y === 0) { vox.set(x, y, z, "stone_bricks"); continue; }                   // plinth
    if (row === 1) { vox.set(x, y, z, "smooth_sandstone"); continue; }             // string course
    if (row === 0) { vox.set(x, y, z, "cut_sandstone"); continue; }                // lintel and cornice
    // rows 2 and 3: piers in stone, windows between them
    if (along % 3 === 0) { vox.set(x, y, z, ground ? "stone_bricks" : "sandstone"); continue; }
    const floorIdx = Math.floor(y / 4);
    if (y === 6 && !ground) { vox.set(x, y, z, "iron_bars", glassState(dx)); continue; }   // balcony rail, piano nobile
    vox.set(x, y, z, "glass_pane", glassState(dx));
    if (row === 3 && (along + floorIdx) % 4 === 1) lights.push([x - dx, y, z - dz]);    // a lit room behind the glass
  }
}

// Warm rooms: glowstone in the air gap directly behind some windows (never in the shell).
for (const [x, y, z] of lights) {
  if (!at(x, z) || vox.get(x, y, z)) continue;
  if (exposure(at(x, z), y).length) continue;
  vox.set(x, y, z, "glowstone");
}

// Chimney stacks on the attic, three bricks high above the mansard.
for (const c of fp.values()) {
  if (c.core && dist.get(c) >= 3 && (c.x + c.z) % 5 === 0) {
    for (let y = topOf(c) + 1; y <= topOf(c) + 3; y++) vox.set(c.x, y, c.z, "bricks");
  }
}

const out = `${DIR}/FR245184535.nbt`;
const stats = vox.save(out);
console.log(`door ${doorDir} at ${doorKey}; wrote ${out}: ${stats.blocks} blocks, ${stats.palette} block states`);
