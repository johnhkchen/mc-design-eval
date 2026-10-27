// AIG Building, Auckland CBD (way 147110848): a late-20th-century office tower, 24 storeys of glass curtain wall
// with a concrete podium, a setback ring at y 88 and a plant crown, on a lower north wing.
// Footprint and heights from the LINZ lidar cells (x, z, ground, roof); y 0 is the lowest ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_147110848.cells.json`, "utf8"));
const OUT = `${DIR}/way_147110848.nbt`;

// Storey grid: every cell's ground (0..4) is filled solid up to the ground floor at y 4, so the building stands on
// one level. Storeys are 4 blocks (about 3.3 m), the tower's tiers stack on that grid.
const FLOOR = 4, STOREY = 4;
const PODIUM_TOP = 24;                   // y below this is the podium: solid walls with punched windows
const TOWER_MIN = 90, TOWER_ROOF = 104;  // lidar roof at or above this is tower (flat top after noise smoothing)
const RING = 3, SETBACK_Y = 88;          // the outer 3 cells of the tower step down to y 88 (setback terrace)

const FOUND = "stone", PLINTH = "stone_bricks", SLAB = "smooth_stone", SOLID = "light_gray_concrete";
const BAND = "white_concrete", GLASS = "light_blue_stained_glass", CORNICE = "stone_bricks", ROOF = "light_gray_concrete";
const PLANT = "light_gray_concrete", PLANT_CAP = "smooth_stone";
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { ...DOOR_LOWER, half: "upper" };
const LIGHT = "glowstone", WARM = "shroomlight";
const DOOR = "dark_oak_door";
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, r });
const key = (x, z) => `${x},${z}`;
const inFp = (x, z) => cell.has(key(x, z));
const cols = cells.map(([x, z]) => [x, z]);
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 1. Tower or wing, from the lidar. A cell is tower where its roof is 90+, or where most of its 3x3 neighbourhood
//    is (this irons out the noisy single cells on the tower's edge).
const rawTower = (x, z) => inFp(x, z) && cell.get(key(x, z)).r >= TOWER_MIN;
const tower = new Set();
for (const [x, z] of cols) {
  let n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (rawTower(x + dx, z + dz)) n++;
  if (n >= 5) tower.add(key(x, z));
}

// 2. Depth in from the tower's edge (multi-source BFS): the outer RING cells step down to the setback.
const dist = new Map(), queue = [];
for (const k of tower) {
  const [x, z] = k.split(",").map(Number);
  if (N4.some(([dx, dz]) => !tower.has(key(x + dx, z + dz)))) { dist.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of N4) {
    const k = key(x + dx, z + dz);
    if (tower.has(k) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}

// 3. Each cell's top: tower core 104, tower ring 88. Wings take the median roof of their wing neighbours (lidar noise
//    gives single cells of 40..80 that would stand up as posts), quantised to 8-block tiers (16, 24, 32).
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const T = new Map();
for (const [x, z] of cols) {
  const k = key(x, z);
  if (tower.has(k)) { T.set(k, dist.get(k) <= RING ? SETBACK_Y : TOWER_ROOF); continue; }
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (inFp(x + dx, z + dz) && !tower.has(key(x + dx, z + dz))) near.push(cell.get(key(x + dx, z + dz)).r);
  }
  T.set(k, Math.max(16, Math.round(median(near) / 8) * 8));
}
// A wing cell still standing 4+ blocks above every wing neighbour is a noise post: bring it down to them.
for (const [x, z] of cols) {
  const k = key(x, z);
  if (tower.has(k)) continue;
  const nb = N4.filter(([dx, dz]) => inFp(x + dx, z + dz) && !tower.has(key(x + dx, z + dz)))
    .map(([dx, dz]) => T.get(key(x + dx, z + dz)));
  if (nb.length && T.get(k) >= Math.max(...nb) + 4 && T.get(k) < SETBACK_Y) T.set(k, Math.max(...nb));
}
const top = (x, z) => T.get(key(x, z));

const V = new Voxels([53, 117, 82]);

// 4. Foundation, floor slabs per storey, and the roof surface under each cell's top.
for (const [x, z] of cols) {
  const t = top(x, z);
  for (let y = 0; y < FLOOR; y++) V.set(x, y, z, FOUND);
  for (let y = FLOOR; y < t; y += STOREY) V.set(x, y, z, SLAB);
  V.set(x, t - 1, z, ROOF);
}

// 5. Facade: a cell whose outward side is off the footprint, or whose neighbour stands lower, is exposed on that side.
function facade(y, t, u, corner, entrance, x) {
  if (y < FLOOR) return [PLINTH];
  if (y === t - 1) return [CORNICE];
  if (corner) return [BAND];
  const k = Math.floor((y - FLOOR) / STOREY), rel = (y - FLOOR) % STOREY;
  if (k === 0 && entrance) {
    if (rel === 0) return x === 40 ? [DOOR, DOOR_LOWER] : [PLINTH];
    if (rel === 1) return x === 40 ? [DOOR, DOOR_UPPER] : [GLASS];
    if (rel === 2) return [GLASS];
    return [SLAB];                                          // canopy over the entrance
  }
  if (rel === 0) return [k === 0 ? PLINTH : BAND];         // floor line: plinth course, then white spandrels
  if (k === 0 && rel === 3) return [SOLID];               // ground-floor fascia
  const mullion = u % 3 === 0;
  if (y < PODIUM_TOP) {
    if (k === 0) return [mullion ? BAND : GLASS];          // shopfront
    return [u % 3 === 1 && rel < 3 ? GLASS : SOLID];       // podium: punched, solid between
  }
  return [mullion ? BAND : GLASS];
}

for (const [x, z] of cols) {
  const t = top(x, z);
  const sides = Object.keys(DIRS).filter(s => {
    const [dx, dz] = DIRS[s];
    return !inFp(x + dx, z + dz) || top(x + dx, z + dz) < t;
  });
  if (!sides.length) continue;
  const corner = sides.length > 1, side = sides[0];
  const u = side === "N" || side === "S" ? x : z;
  const entrance = !corner && side === "S" && x >= 38 && x <= 42;   // the south face of the stepped edge (row 79)
  for (let y = 0; y < t; y++) {
    const [name, state] = facade(y, t, u, corner, entrance, x);
    V.set(x, y, z, name, state);
  }
}

// 6. Warm light behind some glass: a glowstone or shroomlight one cell inside the centre of a window.
for (const [x, z] of cols) {
  const t = top(x, z);
  const sides = Object.keys(DIRS).filter(s => {
    const [dx, dz] = DIRS[s];
    return !inFp(x + dx, z + dz) || top(x + dx, z + dz) < t;
  });
  if (sides.length !== 1) continue;
  const side = sides[0], [dx, dz] = DIRS[side];
  const u = side === "N" || side === "S" ? x : z;
  for (let y = FLOOR; y < t - 1; y++) {
    const rel = (y - FLOOR) % STOREY;
    if ((rel !== 1 && rel !== 2) || u % 3 !== 2) continue;
    if (!V.get(x, y, z)?.block.endsWith(GLASS)) continue;   // get() names are "minecraft:"-prefixed
    const ix = x - dx, iz = z - dz;                          // inward
    if (!inFp(ix, iz) || top(ix, iz) <= y || V.get(ix, y, iz)) continue;
    const h = (x * 73 + z * 151 + y * 37) % 11;
    if (h === 0) V.set(ix, y, iz, LIGHT);
    else if ((x * 31 + z * 17 + y * 5) % 23 === 0) V.set(ix, y, iz, WARM);
  }
}

// 7. Plant crown: a pair of boxes on the tower roof, set well in from the edge.
for (const [x, z] of cols) {
  const k = key(x, z);
  if (!tower.has(k) || dist.get(k) < 6 || x < 14 || x > 36 || z < 54 || z > 70) continue;
  V.set(x, TOWER_ROOF, z, PLANT);
  V.set(x, TOWER_ROOF + 1, z, PLANT);
  V.set(x, TOWER_ROOF + 2, z, PLANT_CAP);
}

// 8. Check: every block stands on something (below it, or beside it at its own level), so nothing floats.
const [X, Y] = V.size;
let floating = 0;
V.forEachCell((i) => {
  const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  if (y === 0) return;
  if (V.val(x, y - 1, z)) return;
  if (N4.some(([dx, dz]) => V.val(x + dx, y, z + dz))) return;
  floating++;
});

const stats = V.save(OUT);
console.log(JSON.stringify({ ...stats, floating, tower: tower.size, cells: cols.length, top: TOWER_ROOF }));
