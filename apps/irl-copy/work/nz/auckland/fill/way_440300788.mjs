// Longview Apartments (way 440300788): a 1970s reinforced-concrete residential tower in Mt Eden, on the lidar footprint.
// Reading of the record: roof about 60 blocks (15 storeys of 4) across the body, a penthouse core up to 66-67 where the
// lidar peaks; the ground falls across the footprint, so the downhill side carries more storeys. Walls are white concrete
// with light-grey spandrels and mullions, glazing in a 1-deep room gap with a floor slab per storey, a stone base course.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_440300788.cells.json`, "utf8"));
const W = 29, H = 79, D = 33;
const BODY = 60;   // the tower top (lidar 60-61 over most of the footprint = 15 storeys of 4 blocks)
const PEAK = 67;   // the lidar's highest roof above y 0 (66-ish on the core)
const STOREY = 4;  // 4 blocks = 4.8 m per storey at 1.2 blocks a metre (3 blocks of room under a 1-block floor)

const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const grid = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const at = (x, z) => grid.get(key(x, z));
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };

// 1. Roof: a 3x3 median of the lidar roof over the footprint (edge noise out), then the tiers.
for (const c of grid.values()) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) near.push(n.r); }
  c.rs = median(near);
}

// 2. Depth: 1 = the outer skin (a 4-neighbour is outside the footprint), 2 = the room gap behind it, 3+ = the core.
const q = [];
for (const c of grid.values()) if (dirs.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) { c.d = 1; q.push(c); }
for (let i = 0; i < q.length; i++) {
  const c = q[i];
  for (const [dx, dz] of dirs) { const n = at(c.x + dx, c.z + dz); if (n && n.d === undefined) { n.d = c.d + 1; q.push(n); } }
}
for (const c of grid.values()) {
  if (c.d === undefined) c.d = 1;
  c.top = c.d >= 3 && c.rs >= 62 ? PEAK : BODY;   // one flat penthouse tier (the lidar's 63-66 peak snapped to 67), set back 2 cells in
}

// 3. The entrance: the outer skin cell on the south (high z) edge nearest the middle of the front.
const front = [...grid.values()].filter((c) => c.d === 1 && !at(c.x, c.z + 1));
const midX = median(front.map((c) => c.x));
const door = front.reduce((best, c) => (Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best));

// 4. Build: foundation to each cell's ground, then storeys on the cell's own ground (the penthouse on the 60 line).
const vox = new Voxels([W, H, D]);
const glass = "light_blue_stained_glass", concrete = "white_concrete", trim = "light_gray_concrete", base = "stone_bricks";
const hash = (x, y, z) => (Math.imul(x, 73856093) ^ Math.imul(z, 19349663) ^ Math.imul(y, 83492791)) >>> 0;
const isWindow = (x, z) => (x + z) % 3 !== 0;   // a mullion every third cell in each facade
const isLit = (x, y, z) => hash(x, y, z) % 6 === 0;

for (const c of grid.values()) {
  const { x, z, g, d, top } = c;
  const pent = top > BODY;
  for (let y = 0; y < top - 1; y++) {
    const b = pent && y >= BODY ? BODY : g;          // storey lines: the cell's ground, or the penthouse's 60
    const e = pent && y >= BODY ? d - 2 : d;         // depth inside the penthouse's own skin
    const r = (y - b) % STOREY;
    if (y < g) { vox.set(x, y, z, base); continue; }
    if (e === 1) {
      if (door === c && y < g + 2) { vox.set(x, y, z, "oak_door", { facing: "south", half: y === g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (r === 0) vox.set(x, y, z, y === g ? base : trim);          // base course, then spandrel bands at each floor
      else if (door && Math.abs(x - door.x) <= 1 && z === door.z && y === g + 2) vox.set(x, y, z, base);   // lintel over the door
      else if (isWindow(x, z)) vox.set(x, y, z, glass);
      else vox.set(x, y, z, trim);                                   // mullion
      continue;
    }
    if (e === 2) {
      if (r === 0) { vox.set(x, y, z, trim); continue; }             // floor slab per storey
      const ent = door && x === door.x && z === door.z - 1;
      if (ent) continue;                                             // the hall behind the door stays open
      const facing = dirs.map(([dx, dz]) => at(x + dx, z + dz)).filter((n) => n && n.d === 1 && isWindow(n.x, n.z));
      if (r === 1 && facing.length && isLit(x, y, z)) vox.set(x, y, z, hash(x, y, z) % 12 === 0 ? "shroomlight" : "glowstone");
      continue;                                                      // air behind the glass
    }
    // e >= 3: the core is solid concrete; the penthouse's own roof is set at its top
    vox.set(x, y, z, concrete);
  }
  // roof: a concrete slab on the top course, a parapet on the outer skin, plant on the penthouse roof
  vox.set(x, top - 1, z, trim);
  if (d === 1 && !pent) vox.set(x, BODY, z, trim);
  if (pent && d >= 5 && x % 4 === 1 && z % 4 === 1) vox.set(x, top, z, trim);
}

// 5. Checks: every block that is not on the ground must touch solid material on some face; no column may float.
let floating = 0;
for (const c of grid.values()) for (let y = 1; y < H; y++) {
  if (!vox.val(c.x, y, c.z)) continue;
  const solid = [[0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]].some(([dx, dy, dz]) => vox.val(c.x + dx, y + dy, c.z + dz));
  if (!solid) floating++;
}
const stats = vox.save(`${DIR}/way_440300788.nbt`);
const tops = [...grid.values()].map((c) => c.top);
console.log(JSON.stringify({ cells: grid.size, tops: { min: Math.min(...tops), max: Math.max(...tops) }, penthouseCells: tops.filter((t) => t > BODY).length, floating, ...stats }));
