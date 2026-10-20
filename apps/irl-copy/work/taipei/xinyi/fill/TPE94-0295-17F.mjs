import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE94-0295-17F.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE94-0295-17F.nbt";

// 皇翔御琚A棟 (2005): white-tiled Xinyi residential tower, blue-grey glazing,
// stone-clad podium, cornice and parapet, roof roughly 83 blocks above lowest ground.
const W = 32, H = 95, D = 69;
const TOP = 82;          // top block of parapet/roof cap (roof ~83 blocks)
const CORNICE = 80;      // cornice course
const PODIUM_TOP = 4;    // ground storey ends here (absolute y)

const cellList = JSON.parse(readFileSync(CELLS, "utf8"));
const vox = new Voxels([W, H, D]);

const kk = (x, z) => x + "," + z;
const gMap = new Map();
let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
for (const [x, z, gy] of cellList) {
  gMap.set(kk(x, z), gy);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const inF = (x, z) => gMap.has(kk(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const midX = (minX + maxX) / 2;

// Distance from the outside edge of the footprint (0 = facade, 1 = air gap, >=2 = core)
const dist = new Map();
const q = [];
for (const [x, z] of cellList.map(c => [c[0], c[1]])) {
  if (DIRS.some(([dx, dz]) => !inF(x + dx, z + dz))) {
    dist.set(kk(x, z), 0);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dist.get(kk(x, z));
  for (const [dx, dz] of DIRS) {
    const a = x + dx, b = z + dz;
    if (inF(a, b) && !dist.has(kk(a, b))) {
      dist.set(kk(a, b), d + 1);
      q.push([a, b]);
    }
  }
}

const pane = (alongX) => alongX
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const glowAt = [];
const doorAt = [];

for (const [x, z, gy] of cellList) {
  const k = dist.get(kk(x, z)) ?? 0;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) vox.set(x, y, z, "stone_bricks");

  if (k >= 2) {
    // Solid core
    for (let y = gy; y <= TOP; y++) vox.set(x, y, z, "white_concrete");
    continue;
  }

  if (k === 1) {
    // Air gap behind glass with a floor slab per storey, cornice and roof deck
    for (let y = gy; y <= TOP; y++) {
      if (y === gy || y % 5 === 0 || y >= CORNICE) {
        vox.set(x, y, z, "light_gray_concrete");
      }
    }
    continue;
  }

  // k === 0: facade cell
  const missing = DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
  const corner = missing.length >= 2 && missing.some(([dx]) => dx !== 0) && missing.some(([, dz]) => dz !== 0);
  const [odx, odz] = missing[0];
  const alongX = odx !== 0;                // face normal is x, so the run is along z
  const idx = alongX ? (z - minZ) : (x - minX);
  const frame = corner || idx % 3 === 0;
  // Lobby: centre three cells of the south (min-z) face
  const entrance = !corner && odz === -1 && Math.abs(x - midX) <= 1;
  const inwardX = x - odx, inwardZ = z - odz;
  const hasInward = inF(inwardX, inwardZ) && dist.get(kk(inwardX, inwardZ)) === 1;

  for (let y = gy; y <= TOP; y++) {
    if (y === gy) { vox.set(x, y, z, "stone_bricks"); continue; }      // base course
    if (y === CORNICE) { vox.set(x, y, z, "light_gray_concrete"); continue; }
    if (y === CORNICE + 1) { vox.set(x, y, z, "white_concrete"); continue; } // parapet
    if (y === TOP) { vox.set(x, y, z, "light_gray_concrete"); continue; }   // roof cap
    if (y > CORNICE + 1) continue;

    if (entrance && y > gy && y <= gy + 3) {
      // Double glass-and-oak door under a stone lintel; placed after the loop
      if (y <= gy + 2) doorAt.push([x, y, z, alongX, odz]);
      continue;
    }

    if (y <= PODIUM_TOP) {
      if (y === PODIUM_TOP) { vox.set(x, y, z, "light_gray_concrete"); continue; }
      if (frame) vox.set(x, y, z, "white_concrete");
      else vox.set(x, y, z, "light_blue_stained_glass_pane", pane(alongX));
      continue;
    }

    const r = y % 5;
    if (r === 0) { vox.set(x, y, z, "light_gray_concrete"); continue; }   // storey line
    if (r === 4) { vox.set(x, y, z, "smooth_quartz"); continue; }         // spandrel, lighter than the walls

    // window band
    if (frame) {
      vox.set(x, y, z, "white_concrete");
    } else {
      vox.set(x, y, z, "light_blue_stained_glass_pane", pane(alongX));
      if (hasInward && (x * 31 + z * 17 + y * 7) % 19 === 0) {
        glowAt.push([inwardX, y, inwardZ]);
      }
    }
  }
}

// Warm light sitting just behind some glass panes
for (const [x, y, z] of glowAt) vox.set(x, y, z, "glowstone");

// Lobby doors: two-cell-wide oak double door, hinged on the outer face
for (const [x, y, z, alongX] of doorAt) {
  const lower = y === doorAt.find(d => d[0] === x && d[2] === z)?.[1] ? "lower" : "lower";
  void lower;
}
{
  const byRow = new Map();
  for (const d of doorAt) {
    const key = d[1];
    if (!byRow.has(key)) byRow.set(key, []);
    byRow.get(key).push(d);
  }
  for (const [y, list] of byRow) {
    for (const [x, , z] of list) {
      const half = y === Math.min(...list.map(d => d[1])) ? "lower" : "upper";
      void half;
    }
  }
  // Doors: lower and upper halves at ground+1 and ground+2
  for (const [x, y, z] of doorAt) {
    const gyCell = gMap.get(kk(x, z));
    const isLower = y === gyCell + 1;
    const isLeft = x <= Math.round(midX);
    vox.set(x, y, z, "dark_oak_door", {
      facing: "north",
      half: isLower ? "lower" : "upper",
      hinge: isLeft ? "left" : "right",
      open: "false",
      powered: "false",
    });
  }
}

// Mechanical penthouse on the inner core (smaller than before), then a lightning rod on the deepest cell
let deepest = null, deepestD = -1;
for (const [x, z] of cellList.map(c => [c[0], c[1]])) {
  const d = dist.get(kk(x, z)) ?? 0;
  if (d >= 8) {
    vox.set(x, TOP + 1, z, "light_gray_concrete");
    vox.set(x, TOP + 2, z, "light_gray_concrete");
  }
  if (d > deepestD) { deepestD = d; deepest = [x, z]; }
}
if (deepest) {
  const [rx, rz] = deepest;
  for (let y = TOP + 3; y <= TOP + 7; y++) {
    vox.set(rx, y, rz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

vox.save(OUT);
