import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833599";
const W = 19, H = 23, D = 20;

// Footprint: [x, z, ground] per cell
const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(x + "," + z, gr);
}
const inF = (x, z) => ground.has(x + "," + z);
const G = (x, z) => ground.get(x + "," + z);

const gvals = [...ground.values()];
const minG = Math.min(...gvals);
const maxG = Math.max(...gvals);

// Roof surface level (flat roof), about 11 blocks above lowest ground,
// never lower than six blocks above the highest ground so storeys fit.
const T = Math.min(Math.max(minG + 11, maxG + 6), H - 3);
const lineY = T - 5; // upper-floor slab / storey band

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const edge = (x, z) =>
  !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

// First missing neighbour gives the outward face
const outward = (x, z) => {
  if (!inF(x, z - 1)) return { dx: 0, dz: -1 };
  if (!inF(x, z + 1)) return { dx: 0, dz: 1 };
  if (!inF(x - 1, z)) return { dx: -1, dz: 0 };
  if (!inF(x + 1, z)) return { dx: 1, dz: 0 };
  return null;
};

const doorCandidates = [];

for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  if (!edge(x, z)) {
    // Interior: floor slab at storey line and roof slab, no air-filled interiors beyond that
    put(x, lineY, z, "light_gray_concrete");
    put(x, T - 1, z, "light_gray_concrete");
    // Roof plant box in the middle of the roof
    if (x >= 6 && x <= 12 && z >= 7 && z <= 13) {
      put(x, T, z, "light_gray_concrete");
      put(x, T + 1, z, "iron_block");
    }
    continue;
  }

  const out = outward(x, z);
  const along = out.dz !== 0 ? x : z;

  for (let y = gy; y <= T - 1; y++) {
    if (y === gy) {
      put(x, y, z, "stone_bricks"); // base course
    } else if (y === T - 1) {
      put(x, y, z, "stone_bricks"); // cornice
    } else if (y === lineY) {
      put(x, y, z, "light_gray_concrete"); // storey band
    } else if (y < lineY) {
      // Shopfront storey
      if (along % 3 === 1) put(x, y, z, "glass");
      else put(x, y, z, "smooth_stone");
    } else {
      // Upper storey: window grid with white piers
      if (along % 3 === 1) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "white_concrete");
    }
  }

  // Parapet on the roof edge
  put(x, T, z, "stone_bricks");

  // Warm glow behind some upper windows
  if (along % 3 === 1 && along % 6 === 1) {
    const ix = x - out.dx, iz = z - out.dz;
    if (inF(ix, iz) && !edge(ix, iz)) put(ix, lineY + 2, iz, "glowstone");
  }

  if (out.dz === 1 && gy + 2 < lineY) doorCandidates.push({ x, z, gy, along });
}

// Main entrance: middle of the south face
if (doorCandidates.length) {
  doorCandidates.sort((a, b) => a.along - b.along);
  const d = doorCandidates[Math.floor(doorCandidates.length / 2)];
  put(d.x, d.gy + 1, d.z, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(d.x, d.gy + 2, d.z, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${BASE}/${ID}.nbt`);
