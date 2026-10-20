import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540298927";
const W = 13, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Lookup of footprint cells -> their ground height
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const inside = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
const corner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// Superstructure datum = lowest ground under the footprint
const B = Math.min(...cells.map((c) => c[2]));

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Glass-fronted piers/windows: window every cell except every third along the wall
const isPier = (x, z) => corner(x, z) || (x + z) % 3 === 0;

// Lit windows: a subset gets a glowstone one cell inside, behind the glass
const isLit = (x, z) => ((x * 7 + z * 3) % 5 === 0);

// Entrance: on the northern (min z) perimeter row, nearest to the middle
let doorX = null;
{
  const minZ = Math.min(...cells.filter((c) => perim(c[0], c[1])).map((c) => c[1]));
  const row = cells.filter((c) => c[1] === minZ && perim(c[0], c[1])).map((c) => c[0]);
  doorX = row.reduce((best, x) => (Math.abs(x - 6) < Math.abs(best - 6) ? x : best), row[0]);
}
const doorZ = Math.min(...cells.filter((c) => c[0] === doorX).map((c) => c[1]));

for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to the cell's own ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const edge = perim(x, z);

  for (let y = Math.max(gy, B); y <= B + 13; y++) {
    const k = y - B;

    // Storey floor slabs (interior) and roof deck
    if (k === 0 || k === 5) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (k === 11) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    if (!edge) continue; // interior air gap

    // Ground storey: plinth, shopfront glazing, transom
    if (k === 0) { put(x, y, z, "stone_bricks"); continue; }
    if (k >= 1 && k <= 3) {
      if (isPier(x, z)) put(x, y, z, "black_concrete");
      else put(x, y, z, "glass_pane");
      continue;
    }
    if (k === 4) { put(x, y, z, "smooth_stone"); continue; }

    // Upper storey: white plaster piers and windows
    if (k >= 6 && k <= 8) {
      if (isPier(x, z)) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane");
      continue;
    }
    if (k === 9) { put(x, y, z, "white_concrete"); continue; }

    // Cornice
    if (k === 10) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }

    // Parapet and coping
    if (k === 12) { put(x, y, z, "white_concrete"); continue; }
    if (k === 13) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
  }

  // Warm glowstone behind a subset of upper and ground windows
  if (edge && !corner(x, z) && isLit(x, z)) {
    const ix = x === 0 ? x + 1 : x === W - 1 ? x - 1 : x;
    const iz = z === 0 ? z + 1 : z === D - 1 ? z - 1 : z;
    const ix2 = ix !== x ? ix : x;
    const iz2 = ix2 !== x ? z : iz;
    if (inside(ix2, iz2)) {
      put(ix2, B + 2, iz2, "glowstone");
      put(ix2, B + 7, iz2, "glowstone");
    }
  }
}

// Rooftop plant: an AC block and a lightning rod on the interior of the roof
for (let x = 3; x <= 4; x++) for (let z = 4; z <= 5; z++) {
  if (inside(x, z)) put(x, B + 12, z, "light_gray_concrete");
}
if (inside(1, 1)) put(1, B + 12, 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
if (inside(1, 1)) put(1, B + 13, 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Entrance door on the street side: lower and upper halves, with a dark recess
if (inside(doorX, doorZ)) {
  put(doorX, B + 1, doorZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, B + 2, doorZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(doorX, B + 3, doorZ, "black_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
