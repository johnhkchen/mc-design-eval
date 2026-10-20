import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1077417";
const W = 33, H = 46, D = 32;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const c of cells) {
  const [x, z, gr0, roof0] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  raw.set(key(x, z), { gr: Math.max(0, Math.min(20, Math.round(gr0))), roof: roof0 });
}

// Smooth lidar roof noise: 3x3 mean, then quantise to 4-block setback tiers.
const info = new Map();
for (const [k, v] of raw) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const q = raw.get(key(x + dx, z + dz));
    if (q) { sum += q.roof; n++; }
  }
  const mean = sum / n;
  let R = 4 * Math.round(mean / 4);
  R = Math.max(v.gr + 8, Math.min(38, R));
  info.set(k, { gr: v.gr, R });
}

const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

function facesOf(x, z) {
  const out = [];
  for (const [dx, dz, name] of DIRS) {
    if (!info.has(key(x + dx, z + dz))) out.push({ dx, dz, name });
  }
  return out;
}
const isPerim = (x, z) => facesOf(x, z).length > 0;

// Entrance: north-face cell nearest the frontage middle, with the lowest ground around it.
let doorCell = null;
{
  let best = Infinity;
  for (const [k, v] of info) {
    const [x, z] = k.split(",").map(Number);
    if (!facesOf(x, z).some((f) => f.name === "north")) continue;
    const score = Math.abs(x - Math.floor(W / 2)) + (v.gr - 0) * 0.5;
    if (score < best) { best = score; doorCell = { x, z }; }
  }
}

for (const [k, { gr, R }] of info) {
  const [x, z] = k.split(",").map(Number);
  const faces = facesOf(x, z);
  const perim = faces.length > 0;

  // Foundation solid from y 0 to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (perim) {
    const f = faces[0];
    const idx = (f.name === "north" || f.name === "south") ? x : z;
    const pier = idx % 3 === 0;
    // Ground floor shopfront: stone base course, then glass with stone piers.
    g.set(x, gr, z, pier ? "stone_bricks" : "glass");
    g.set(x, gr + 1, z, pier ? "stone_bricks" : "glass");
    // Lintel course above shopfront at gr+2 is the first floor spandrel (drawn below).
    // Warm shopfront light behind some glass.
    if (!pier && (x + z) % 4 === 0) {
      const ix = x - f.dx, iz = z - f.dz;
      if (info.has(key(ix, iz)) && !isPerim(ix, iz)) g.set(ix, gr, iz, "glowstone");
    }
  }

  // Storeys: floor slab at base b, spandrel brick at b, window row at b+1.
  for (let b = gr + 2; b <= R - 4; b += 2) {
    g.set(x, b, z, "gray_concrete");
    if (perim) {
      const f = faces[0];
      const idx = (f.name === "north" || f.name === "south") ? x : z;
      const pier = idx % 3 === 0;
      g.set(x, b, z, "bricks");
      g.set(x, b + 1, z, pier ? "smooth_stone" : "glass");
      if (!pier && (x * 3 + z + b) % 5 === 0) {
        for (const ff of faces) {
          const ix = x - ff.dx, iz = z - ff.dz;
          if (info.has(key(ix, iz)) && !isPerim(ix, iz)) {
            g.set(ix, b + 1, iz, "glowstone");
            break;
          }
        }
      }
    }
  }

  // Roof: interior roof slab, perimeter cornice and parapet.
  if (!perim) {
    g.set(x, R - 1, z, "gray_concrete");
  } else {
    g.set(x, R - 2, z, "smooth_stone");
    g.set(x, R - 1, z, "smooth_stone");
  }
}

// Roof plant: a few 2x2 bulkheads placed only on tiers that are the local maximum.
for (const [k, { R, gr }] of info) {
  const [x, z] = k.split(",").map(Number);
  if (isPerim(x, z)) continue;
  if (!((x % 6 === 2) && (z % 6 === 2))) continue;
  let isMax = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const q = info.get(key(x + dx, z + dz));
    if (q && q.R > R) isMax = false;
  }
  if (!isMax || R - gr < 8 || R + 2 > H) continue;
  for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    if (info.has(key(x + ox, z + oz))) {
      g.set(x + ox, R, z + oz, "light_gray_concrete");
      g.set(x + ox, R + 1, z + oz, "light_gray_concrete");
    }
  }
}

// Entrance: stone surround, glass vestibule, door, lantern and a canopy on posts.
if (doorCell) {
  const { x, z } = doorCell;
  const { gr, R } = info.get(key(x, z));
  // Door on the street face.
  g.set(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Stone surround on either side of the door.
  for (const dx of [-1, 1]) {
    if (info.has(key(x + dx, z))) {
      g.set(x + dx, gr, z, "stone_bricks");
      g.set(x + dx, gr + 1, z, "stone_bricks");
      g.set(x + dx, gr + 2, z, "stone_bricks");
    }
  }
  // Canopy over the door at the first-floor spandrel level, held by two outer posts.
  const cy = gr + 2;
  const canopy = [];
  for (const dx of [-1, 0, 1]) {
    if (info.has(key(x + dx, z))) canopy.push(dx);
  }
  for (const dx of canopy) {
    g.set(x + dx, cy, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  // Lantern under the canopy, warm light at the door.
  g.set(x, gr + 2, z - 1 >= 0 ? z - 1 : z, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
