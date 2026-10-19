// 1290 Avenue of the Americas, Sperry Rand Building, 1963: a glass-and-aluminium curtain-wall office block of the
// Miesian years, set on a plinth and a stepped set of wings. Footprint 123 x 55 (x across the streets, low z = north).
// The lidar roof is quantised into flat tiers at storey multiples of 3: a 156-block tower (52 storeys) on the west
// half, an 54-block wing on the east, 42- and 33-block shoulders to the south, 24- and 12-block plinths on the north
// and south edges. Every tier stands on the one below and the foundation fills from y 0 to each cell's ground.
// Facades: a light-grey spandrel band at each floor line, blue-glass panes between iron mullions every third block,
// a granite base course on the ground floor with a lobby on the Avenue (west) face under a stone canopy, a
// glowstone light in some panes (set in the air gap behind the glass). The shell is a one-block air gap behind the
// facade with a floor slab per storey and a solid core behind it (no interiors). Roofs are gravel, with a cornice
// and a parapet, a steel-and-quartz mechanical penthouse on the tower and a row of plant boxes on the wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034510.cells.json`, "utf8"));
const X = 123, Z = 55;

// Per cell: ground (y of the surface under it) and top (block height of the built mass; 0 = open ground in the lot).
const ground = Array.from({ length: Z }, () => Array(X).fill(0));
const top = Array.from({ length: Z }, () => Array(X).fill(0));
const inFoot = Array.from({ length: Z }, () => Array(X).fill(false));
for (const [x, z, g, r] of cells) {
  inFoot[z][x] = true; ground[z][x] = g;
  top[z][x] = r === 0 ? 0 : r >= 100 ? 156 : r >= 50 ? 54 : r >= 40 ? 42 : r >= 30 ? 33 : r >= 20 ? 24 : 12;
}
const H = Math.max(...top.flat());

const inGrid = (x, z) => x >= 0 && z >= 0 && x < X && z < Z;
const solid = (x, z, y) => inGrid(x, z) && top[z][x] > y;
const DIRS = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];
const faceOf = (x, z, y) => { for (const [dx, dz, f] of DIRS) if (!solid(x + dx, z + dz, y)) return f; return null; };

// Shell depth at each height: 0 = the facade, 1 = the air gap behind it, 2+ = the solid core.
const depth = [];
for (let y = 0; y < H; y++) {
  const d = new Int8Array(X * Z).fill(-1), q = [];
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    if (solid(x, z, y) && faceOf(x, z, y)) { d[z * X + x] = 0; q.push(z * X + x); }
  }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % X, z = (i - x) / X;
    for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx, nz = z + dz;
      if (solid(nx, nz, y) && d[nz * X + nx] < 0) { d[nz * X + nx] = d[i] + 1; q.push(nz * X + nx); }
    }
  }
  depth.push(d);
}

const g = new Voxels([X, H + 4, Z]);
const over = new Map();   // "x,y,z" -> [block, state]: entrance, canopy, penthouse, plant boxes, drawn after the walls
const put = (x, y, z, block, state) => over.set(`${x},${y},${z}`, [block, state]);

// The lobby sits on the Avenue (west) face of the tower at the middle of its west side.
const west = (z) => { for (let x = 0; x < X; x++) if (top[z][x] > 0) return x; return -1; };
const LZ = 26, LX = west(LZ);
const doorFacing = { facing: "west", hinge: "left", open: "false", powered: "false" };

// 1. Walls, floors, roofs: everything the depth map says is solid, from its foundation up to its top.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const t = top[z][x]; if (!t) continue;
  const gr = ground[z][x];
  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }
    const d = depth[y][z * X + x];
    if (y === t - 1) { g.set(x, y, z, d === 0 ? "light_gray_concrete" : "gray_concrete"); continue; }   // roof cap, cornice on the edge
    if (d === 0) {
      // Facade: granite base on the ground floor, then spandrel at each floor line and glass between mullions.
      const face = faceOf(x, z, y), u = face === "N" || face === "S" ? x : z;
      const mullion = u % 3 === 0;
      if (y === 0) g.set(x, y, z, "polished_granite");
      else if (mullion) g.set(x, y, z, "iron_block");
      else if (y % 3 === 0) g.set(x, y, z, "light_gray_concrete");
      else g.set(x, y, z, "light_blue_stained_glass");
    } else if (d === 1) {
      // Air gap: a floor slab per storey (and under the first one); a warm light behind some panes.
      if (y % 3 === 0 || y === gr) { g.set(x, y, z, "smooth_stone"); continue; }
      const behindPane = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => {
        const nx = x + dx, nz = z + dz;
        return solid(nx, nz, y) && depth[y][nz * X + nx] === 0 && faceOf(nx, nz, y) && !((faceOf(nx, nz, y) === "N" || faceOf(nx, nz, y) === "S" ? nx : nz) % 3 === 0) && y % 3 !== 0;
      });
      if (behindPane && (x * 5 + y * 7 + z * 3) % 9 === 0) g.set(x, y, z, "glowstone");
    } else {
      g.set(x, y, z, "light_gray_concrete");   // core
    }
  }
}

// 2. Parapet: a block on each tower or wing edge cell (not on the penthouse or the plant boxes).
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const t = top[z][x]; if (!t) continue;
  if (solid(x, z, t) || !faceOf(x, z, t - 1)) continue;
  put(x, t, z, "smooth_stone");
}

// 3. Lobby: iron doors on the Avenue face, granite and glass shopfront either side, a warm light inside, a canopy.
if (LX >= 0) {
  put(LX, 0, LZ, "iron_door", { ...doorFacing, half: "lower" });
  put(LX, 1, LZ, "iron_door", { ...doorFacing, half: "upper" });
  put(LX, 2, LZ, "light_blue_stained_glass");
  for (const dz of [-1, 1]) { put(LX, 0, LZ + dz, "polished_granite"); put(LX, 1, LZ + dz, "light_blue_stained_glass"); put(LX, 2, LZ + dz, "light_blue_stained_glass"); }
  put(LX + 1, 1, LZ, "glowstone");
  for (let dz = -2; dz <= 2; dz++) put(LX, 3, LZ + dz, "smooth_stone");        // canopy over the entrance
  for (let dz = -2; dz <= 2; dz++) put(LX + 1, 3, LZ + dz, "smooth_stone");
}

// 4. The tower's mechanical penthouse, in the middle of its roof, two storeys of quartz under an iron cap.
for (let z = 23; z <= 31; z++) for (let x = 31; x <= 43; x++) {
  if (top[z][x] !== 156) continue;
  put(x, 156, z, "smooth_quartz"); put(x, 157, z, "smooth_quartz"); put(x, 158, z, "iron_block");
}

// 5. Plant boxes and vents on the wing roof.
for (const [x0, x1, z0, z1] of [[76, 86, 17, 24], [93, 103, 28, 36], [106, 117, 17, 25]]) {
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    if (top[z][x] !== 54) continue;
    const plant = (x === x0 || x === x1 || z === z0 || z === z1);
    put(x, 54, z, "light_gray_concrete"); put(x, 55, z, plant ? "light_gray_concrete" : "iron_block");
    if (!plant) put(x, 56, z, "iron_block");
  }
}

for (const [k, [block, state]] of over) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}

const stats = g.save(`${DIR}/NYC1034510.nbt`);
console.log(JSON.stringify({ size: g.size, lobby: [LX, LZ], ...stats }));
