import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low two-storey concrete shophouse block (mid-century Xinyi infill):
// stone-brick plinth, white-painted wall, light-grey concrete piers,
// shopfront glass at street level, glass upper storey, flat roof with parapet
// and roof plant. Warm glowstone sits behind some glass at dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587177078";
const W = 25, H = 20, D = 16;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, gr] of raw) {
  if (x >= 0 && x < W && z >= 0 && z < D) cells.set(`${x},${z}`, gr);
}
const has = (x, z) => cells.has(`${x},${z}`);
const ground = (x, z) => cells.get(`${x},${z}`);

const m = Math.min(...cells.values());   // lowest ground under the footprint
const F = m + 4;                          // upper floor slab (storey line)
const T = m + 7;                          // roof deck / parapet top (8 blocks above lowest ground)

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Faces on the outside of the footprint: N = z-min (street front), S, W, E
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

// Entrance: street-front cell nearest the middle of the frontage
const frontCells = [];
for (const key of cells.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z - 1)) frontCells.push([x, z]);
}
frontCells.sort((a, b) => Math.abs(a[0] - 12) - Math.abs(b[0] - 12));
const [ex, ez] = frontCells[0];

// Piers every 3 blocks along each face, always at corners
const isPier = (x, z, f) => {
  if (f.length > 1) return true;
  if (f[0] === "N" || f[0] === "S") return x % 3 === 0;
  return z % 3 === 0;
};

const WALL = "white_concrete";
const PIER = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const BASE = "stone_bricks";
const SLAB = "smooth_stone";

for (const [key, gr] of cells) {
  const [x, z] = key.split(",").map(Number);
  const fc = faces(x, z);
  const shell = fc.length > 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  for (let y = gr; y <= T; y++) {
    if (y === T) { put(x, y, z, PIER); continue; }                 // roof deck / parapet
    if (y === F) { put(x, y, z, SLAB); continue; }                 // storey line
    if (y === gr) {
      put(x, y, z, shell ? BASE : SLAB);                           // base course or ground floor slab
      continue;
    }
    if (!shell) continue;                                          // air gap behind glass

    const pier = isPier(x, z, fc);
    if (y < F) {
      // ground storey: shopfront glass on posts
      put(x, y, z, pier ? PIER : GLASS);
    } else {
      // upper storey: glass grid with frames
      put(x, y, z, pier ? PIER : GLASS);
    }
  }
}

// Interior warm light behind selected glass (in the air gap, one block in)
for (const [key] of cells) {
  const [x, z] = key.split(",").map(Number);
  if (z !== 1 || !has(x, 1) || faces(x, 1).length) continue;
  if (x % 6 !== 1) continue;
  const gr = ground(x, 0) ?? m;
  // ground-floor shop lamp
  if (has(x, 0) && ground(x, 0) + 1 < F - 1) put(x, F - 2, 1, "glowstone");
  // upper room lamp
  if (has(x, 0)) put(x, F + 1, 1, "glowstone");
}

// Entrance door (lower and upper halves) and hanging lantern above
const doorBase = { facing: "north", hinge: "left", open: "false", powered: "false" };
const gEnt = ground(ex, ez);
put(ex, gEnt + 1, ez, "oak_door", { ...doorBase, half: "lower" });
put(ex, gEnt + 2, ez, "oak_door", { ...doorBase, half: "upper" });
if (gEnt + 3 < F) put(ex, gEnt + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant: two air-conditioning units and a water tank
const roofBlock = (x0, x1, z0, z1, block, h = 1) => {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (has(x, z))
        for (let k = 1; k <= h; k++) put(x, T + k, z, block);
};
roofBlock(3, 5, 3, 4, "iron_block");
roofBlock(19, 21, 10, 11, "iron_block");
roofBlock(9, 10, 3, 4, "oak_planks", 2);

g.save(`${DIR}/${ID}.nbt`);
