// NYC1035710: 11 East 52nd Street, a 2000 Midtown mixed-use tower. Reads as a glass-and-granite tower of the
// late-century Midtown type: a granite base with shopfronts and a street door on the 52nd Street face (z = 15),
// blue-glass curtain wall with pale spandrel lines and grey mullions, stepped massing from the lidar roof, a
// garden podium on the low back, and a penthouse with a mast on the tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035710.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 7, D = 16, H = 88;

// Lidar roof height -> a storey band (3-block storeys): 25-storey tower, 23-storey shoulder, 13-storey wing,
// 8-storey podium, 2-storey low back. Lidar zeros (no return) fall to the low band.
const band = (r) => (r >= 72 ? 75 : r >= 60 ? 69 : r >= 30 ? 39 : r >= 15 ? 24 : 6);
const raw = new Map();
const ground = new Map();
for (const [x, z, g, r] of cells) { raw.set(`${x},${z}`, band(r)); ground.set(`${x},${z}`, g); }

// Smooth the lidar noise: each cell takes the median band of its footprint neighbourhood (itself included).
const top = new Map();
for (const [key, t] of raw) {
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const v = raw.get(`${x + dx},${z + dz}`); if (v !== undefined) near.push(v);
  }
  near.sort((a, b) => a - b);
  top.set(key, near[Math.floor(near.length / 2)]);
}
const topAt = (x, z) => top.get(`${x},${z}`) ?? 0;   // outside the footprint counts as no building

// Exposed faces: the neighbour column is absent or lower than this block.
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const faces = (x, y, z) => DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);
const isShell = (x, y, z) => y === topAt(x, z) - 1 || faces(x, y, z).length > 0;
const STREET_Z = D - 1, DOOR_X = 3;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

for (const [key, T] of top) {
  const [x, z] = key.split(",").map(Number);
  const gr = ground.get(key) ?? 0;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");       // foundation down to the lowest ground
  for (let y = gr; y < T; y++) {
    const f = faces(x, y, z), corner = f.length >= 2;
    const topRow = y === T - 1;
    if (isShell(x, y, z)) {
      const onStreet = f.some(([dx, dz]) => dz === 1 && z === STREET_Z);
      const coord = f.some(([dx]) => dx !== 0) ? z : x;          // along the face
      if (y === 0) { put(x, y, z, "polished_granite"); continue; }
      if (topRow) {                                              // parapet on the rim, roof surface inside
        if (f.length) put(x, y, z, "polished_granite");
        else put(x, y, z, T === 6 ? "moss_block" : "stone");
        continue;
      }
      if (y <= 2) {                                              // granite base and shopfronts
        if (onStreet && x === DOOR_X) { put(x, y, z, "dark_oak_door", { ...DOOR, half: y === 1 ? "lower" : "upper" }); continue; }
        if (onStreet && !corner && x !== DOOR_X && (x % 2 === 1)) { put(x, y, z, "black_stained_glass"); continue; }
        put(x, y, z, "polished_granite"); continue;
      }
      if (onStreet && y === 3 && x >= DOOR_X - 1 && x <= DOOR_X + 1) { put(x, y, z, "black_concrete"); continue; }   // entrance canopy band
      if (y % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; }   // storey spandrel line
      if (corner || coord % 2 === 0) { put(x, y, z, "gray_concrete"); continue; }   // piers and mullions
      put(x, y, z, "light_blue_stained_glass");
      // Warm light behind a share of the glass: a glowstone one cell inside (the air gap is left open).
      if ((x * 7 + y * 13 + z * 29) % 6 === 0 && f.length) {
        const [dx, dz] = f[0];
        const ix = x - dx, iz = z - dz;
        if (!isShell(ix, y, iz) && y % 3 !== 0 && y !== T - 1) put(ix, y, iz, "glowstone");
      }
    } else {
      // Interior: a floor slab per storey, a roof cap on top, otherwise air (no interiors).
      if (y === 0) put(x, y, z, "stone");
      else if (y % 3 === 0) put(x, y, z, "smooth_stone");
    }
  }
}

// Rooftop plant on the tiers (boxes that stand on the roof surface, kept off the rim).
for (const [key, T] of top) {
  const [x, z] = key.split(",").map(Number);
  if (T <= 6 || faces(x, T - 1, z).length > 0) continue;
  if ((x + 2 * z) % 5 === 0 && x > 0 && x < W - 1 && z > 0 && z < D - 1) {
    put(x, T, z, "light_gray_concrete"); put(x, T + 1, z, "light_gray_concrete");
  }
}

// Tower penthouse with a mast, on the 75-block roof at x 2..4, z 3..5.
const PH = { x0: 2, x1: 4, z0: 3, z1: 5, y0: 75 };
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  put(x, PH.y0, z, edge ? "light_gray_concrete" : "smooth_stone");
  if (edge) { put(x, PH.y0 + 1, z, "light_blue_stained_glass"); }
  put(x, PH.y0 + 2, z, "gray_concrete");
}
put(3, PH.y0 + 1, 4, "glowstone");
for (let y = PH.y0 + 3; y <= PH.y0 + 5; y++) put(3, y, 4, "iron_bars");
put(3, PH.y0 + 6, 4, "lightning_rod");

const info = g.save(`${DIR}/NYC1035710.nbt`);
console.log(JSON.stringify(info));
