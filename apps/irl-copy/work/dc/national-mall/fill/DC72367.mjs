import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC72367.cells.json`, "utf8"));

const W = 29, HT = 22, D = 23;
const g = new Voxels([W, HT, D]);

// Footprint lookup
const info = new Map();
let minG = Infinity, roofs = [];
for (const [x, z, gr, roof] of cells) {
  const ground = Math.round(gr);
  info.set(`${x},${z}`, { x, z, gr: ground });
  minG = Math.min(minG, ground);
  roofs.push(roof);
}
const has = (x, z) => info.has(`${x},${z}`);
const at = (x, z) => info.get(`${x},${z}`);

// One smoothed roof tier for the whole building, on a common storey grid
// anchored at the lowest ground so every window band lines up across the lot.
roofs.sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const base = minG;
let nStor = Math.round((medRoof - base - 1) / 3);
nStor = Math.max(3, Math.min(5, nStor));
const TOP = Math.min(base + 3 * nStor, 18); // top of wall; parapet sits above
for (const c of info.values()) {
  if (c.gr > TOP - 4) c.gr = TOP - 4; // safety for odd lidar ground
}

let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
for (const c of info.values()) {
  minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
  minZ = Math.min(minZ, c.z); maxZ = Math.max(maxZ, c.z);
}
const xc = Math.round((minX + maxX) / 2);

const GLASS = "light_blue_stained_glass_pane";
const WALL = "quartz_block";
const LINE = "smooth_quartz";
const BASE = "polished_diorite";
const FOUND = "polished_andesite";
const DECK = "smooth_quartz";

const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const band = (y) => (y - base) % 3; // 0 = storey line, 1/2 = window band

// Pass 1: foundation, floor slabs on the storey grid, roof deck
for (const c of info.values()) {
  const { x, z, gr } = c;
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  g.set(x, gr, z, LINE);
  for (let y = gr + 1; y < TOP; y++) if (band(y) === 0) g.set(x, y, z, LINE);
  g.set(x, TOP, z, DECK);
}

// Pass 2: perimeter walls with window grids and pilasters
for (const c of info.values()) {
  const { x, z, gr } = c;
  if (!isPerim(x, z)) continue;
  const alongX = (z === minZ || z === maxZ);
  const idx = alongX ? x : z;
  const corner = (alongX ? (x === minX || x === maxX) : (z === minZ || z === maxZ));
  for (let y = gr; y < TOP; y++) {
    if (y === gr) { g.set(x, y, z, BASE); continue; }
    const b = band(y);
    if (b === 0) { g.set(x, y, z, LINE); continue; }
    if (corner || idx % 3 === 0) { g.set(x, y, z, WALL); continue; }
    g.set(x, y, z, idx % 3 === 1 ? GLASS : WALL);
  }
  // balustrade on the parapet, alternating
  if ((x + z) % 2 === 0) g.set(x, TOP + 1, z, "diorite_wall");
}

// Pass 3: warm lights behind some windows (inner neighbour, off the storey lines)
for (const c of info.values()) {
  const { x, z, gr } = c;
  if (!isPerim(x, z)) continue;
  let dx = 0, dz = 0;
  if (z === minZ) dz = 1; else if (z === maxZ) dz = -1;
  else if (x === minX) dx = 1; else if (x === maxX) dx = -1;
  if (dx === 0 && dz === 0) continue;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  const alongX = (z === minZ || z === maxZ);
  const idx = alongX ? x : z;
  if (idx % 3 !== 1) continue;
  for (let y = gr + 1; y < TOP; y++) {
    if (band(y) === 0) continue;
    if ((x * 7 + y * 3 + z) % 5 === 0) g.set(ix, y, iz, "glowstone");
  }
}

// Pass 4: Beaux-Arts portico on the minZ face, centred
const frontZ = minZ;
if (has(xc, frontZ)) {
  const grF = at(xc, frontZ).gr;
  for (let dx = -7; dx <= 7; dx++) {
    const x = xc + dx;
    if (!has(x, frontZ)) continue;
    const a = Math.abs(dx);
    for (let y = grF + 1; y < TOP; y++) {
      if (band(y) === 0) { g.set(x, y, frontZ, LINE); continue; }
      if (a >= 2 && a <= 6 && a % 2 === 0) { g.set(x, y, frontZ, "quartz_pillar"); continue; }
      if (a === 0) continue; // doorway
      if (a % 2 === 1 && a <= 5) g.set(x, y, frontZ, GLASS);
      else g.set(x, y, frontZ, WALL);
    }
    // entablature over the portico, one course above the top window band
    if (TOP - 1 > grF) g.set(x, TOP - 1, frontZ, LINE);
    if (a <= 5) g.set(x, TOP + 1, frontZ, "quartz_block");
  }
  // doorway and flanking lanterns
  g.set(xc, grF + 1, frontZ, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(xc, grF + 2, frontZ, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const s of [-1, 1]) {
    if (has(xc + s, frontZ)) g.set(xc + s, grF + 1, frontZ, "lantern", { hanging: "false" });
  }
  // stepped pediment above the portico, sitting on the roof deck
  const ped = [[2, 5, "quartz_block"], [3, 3, "quartz_block"], [4, 1, LINE]];
  for (const [j, half, blk] of ped) {
    const y = TOP + j;
    if (y > HT - 1) continue;
    for (let dx = -half; dx <= half; dx++) {
      const x = xc + dx;
      if (has(x, frontZ)) g.set(x, y, frontZ, blk);
    }
  }
  if (TOP + 5 < HT) g.set(xc, TOP + 5, frontZ, "lantern", { hanging: "false" });
}

g.save(`${DIR}/DC72367.nbt`);
