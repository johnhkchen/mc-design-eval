// NYC1022676: Hampshire Hotel Suites, 157 West 47 Street (1906). A ten-storey brick hotel block in the 1906 Midtown
// manner: a red-brick body on a granite base, stone belt courses every storey, a shop front to the street and a
// recessed lobby with a canopy, a stone cornice and parapet, and a stone penthouse on the crown.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 22, D = 28, Y = 45;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022676.cells.json`, "utf8"));

// The footprint and the lidar roof per cell (height above y 0; the ground is 0 across the lot).
const raw = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, , roof] of cells) raw[z][x] = roof;
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && raw[z][x] !== null;

// Lidar noise: a 3x3 median of the footprint's roofs, snapped to the massing's tiers (9 front, 27 wing, 30 body,
// 33 crown, 4 the one-storey link), then a 3x3 mode of the tiers so the tier edges come out clean.
const tierOf = (v) => (v >= 31 ? 33 : v >= 29 ? 30 : v >= 25 ? 27 : v >= 6 ? 9 : 4);
const around = (x, z, f) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) v.push(f(x + dx, z + dz));
  return v;
};
const median = (x, z) => { const v = around(x, z, (a, b) => raw[b][a]).sort((p, q) => p - q); return v[v.length >> 1]; };
const mode = (grid, x, z) => {
  const n = {}; for (const v of around(x, z, (a, b) => grid[b][a])) n[v] = (n[v] || 0) + 1;
  return Number(Object.entries(n).sort((p, q) => q[1] - p[1] || q[0] - p[0])[0][0]);
};
const first = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => (inFp(x, z) ? tierOf(median(x, z)) : 0)));
const hgt = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => (inFp(x, z) ? mode(first, x, z) : 0)));
const H = (x, z) => (inFp(x, z) ? hgt[z][x] : 0);

const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const k = (x, y, z) => `${x},${y},${z}`;
const vox = new Map();              // "x,y,z" -> [block, state]; a missing key is air
const put = (x, y, z, block, state) => vox.set(k(x, y, z), [block, state]);
const solid = (x, y, z) => vox.has(k(x, y, z));

// The outward face of a wall voxel: exposed where the neighbour is off the lot, or lower than this voxel.
const faceOf = (x, z, y) => {
  const ex = DIRS.filter(([, dx, dz]) => !inFp(x + dx, z + dz) || H(x + dx, z + dz) <= y);
  return ex.find(([, dx, dz]) => !inFp(x + dx, z + dz)) ?? ex[0] ?? null;
};

const pockets = new Map();          // the air gap behind each window: "x,y,z" -> "air" | "glowstone"
const STAIRS = (facing, half) => ({ facing, half, shape: "straight", waterlogged: "false" });
const lit = (x, y, z) => (x * 5 + z * 3 + y) % 13 === 0;

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const h = H(x, z); if (!h) continue;
  for (let y = 0; y < h; y++) {
    const f = faceOf(x, z, y);
    if (!f) { put(x, y, z, y === 0 ? "stone" : y === h - 1 ? "black_concrete" : "bricks"); continue; }   // body and roof
    const [face, dx, dz] = f;
    const along = dx !== 0 ? z : x;                 // position along the wall, for the bay pattern
    const inward = [x - dx, z - dz];
    if (y === 0) { put(x, y, z, "polished_granite"); continue; }                        // base course
    if (y === h - 1) { put(x, y, z, "stone_brick_stairs", STAIRS(face, "top")); continue; }   // cornice lip
    // canopy over the lobby door on the south frontage
    if (face === "south" && y === 3 && z === D - 1 && along >= 7 && along <= 11) {
      put(x, y, z, "dark_oak_stairs", STAIRS(face, "top")); continue;
    }
    if (y % 3 === 0) { put(x, y, z, "stone_bricks"); continue; }                        // storey belt course
    // the window rows of a storey: a pier every third bay, glass between, an air gap behind each pane
    const ground = y <= 2;
    if (face === "south" && ground && z === D - 1 && along >= 7 && along <= 11) {     // lobby
      if (along === 9) put(x, y, z, "dark_oak_door", { facing: face, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (along === 7 || along === 11) put(x, y, z, "polished_granite");
      else put(x, y, z, "glass_pane");
      if (along >= 8 && along <= 10 && inFp(inward[0], inward[1])) pockets.set(k(inward[0], y, inward[1]), "air");
      continue;
    }
    const pier = along % 3 === 0;
    if (pier) { put(x, y, z, face === "north" && ground ? "polished_granite" : "bricks"); continue; }
    put(x, y, z, "glass_pane");
    if (inFp(inward[0], inward[1]) && H(inward[0], inward[1]) > y) {
      pockets.set(k(inward[0], y, inward[1]), lit(x, y, z) ? "glowstone" : "air");
    }
  }
}

// Penthouse: a stone box on the crown's flattest 4 x 4 patch of 33-tier roof, glass on its ring, stone cap, rod.
let site = null;
for (let x0 = 1; x0 <= W - 5; x0++) for (let z0 = 1; z0 <= D - 5; z0++) {
  let ok = true;
  for (let dz = 0; dz < 4 && ok; dz++) for (let dx = 0; dx < 4 && ok; dx++) ok = H(x0 + dx, z0 + dz) === 33;
  if (!ok) continue;
  const score = Math.abs(x0 + 1.5 - W / 2) + Math.abs(z0 + 1.5 - 14);
  if (!site || score < site.score) site = { x0, z0, score };
}
if (site) {
  const { x0, z0 } = site;
  for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) {
    const x = x0 + dx, z = z0 + dz;
    const ring = dx === 0 || dz === 0 || dx === 3 || dz === 3;
    const corner = (dx === 0 || dx === 3) && (dz === 0 || dz === 3);
    for (let y = 33; y <= 35; y++) {
      if (ring && !corner && y === 34) put(x, y, z, "glass_pane");
      else put(x, y, z, "stone_bricks");
    }
    put(x, 36, z, "stone_bricks");
  }
  put(x0 + 1, 37, z0 + 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Apply the air gaps and the lit windows, then write the blocks with pane connections from the built neighbours.
for (const [key, what] of pockets) {
  if (what === "air") vox.delete(key); else vox.set(key, ["glowstone", undefined]);
}
const g = new Voxels([W, Y, D]);
for (const [key, [block, state]] of vox) {
  const [x, y, z] = key.split(",").map(Number);
  if (block === "glass_pane") {
    const conn = (dx, dz) => (solid(x + dx, y, z + dz) && !(vox.get(k(x + dx, y, z + dz))[0] === "glowstone") ? "true" : "false");
    g.set(x, y, z, block, { north: conn(0, -1), south: conn(0, 1), west: conn(-1, 0), east: conn(1, 0), waterlogged: "false" });
  } else g.set(x, y, z, block, state);
}
const saved = g.save(`${DIR}/NYC1022676.nbt`);
console.log(`NYC1022676.nbt: ${saved.blocks} blocks, ${saved.palette} palette entries; penthouse ${site ? `at ${site.x0},${site.z0}` : "none"}`);
