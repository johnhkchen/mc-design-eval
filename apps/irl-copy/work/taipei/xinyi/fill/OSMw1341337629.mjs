import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1341337629";
const cells = JSON.parse(readFileSync(BASE + ".cells.json", "utf8"));

// 10 x 19 x 14 box. Roof top (highest block index) is y=6, about 7 blocks above lowest ground.
const W = 10, H = 19, D = 14;
const g = new Voxels([W, H, D]);

const TOP = 6;        // coping slab sits on y=6
const STOREY = 5;     // storey line / floor slab level
const LINTEL = 4;     // lintel course above the glazing

// Ground per footprint cell, clamped so the building never rises above TOP.
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(x + "," + z, Math.max(0, Math.min(STOREY, gr)));
}
const has = (x, z) => G.has(x + "," + z);
const gAt = (x, z) => G.get(x + "," + z);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Determine which side of each perimeter cell faces outward.
const outward = (x, z) => {
  const out = [];
  if (!has(x, z - 1)) out.push([0, -1]); // north face
  if (!has(x, z + 1)) out.push([0, 1]);  // south face
  if (!has(x - 1, z)) out.push([-1, 0]); // west face
  if (!has(x + 1, z)) out.push([1, 0]);  // east face
  return out;
};

// Choose the entrance: north-facing cell nearest the middle of the footprint.
let doorCell = null;
{
  let best = Infinity;
  for (const [key] of G) {
    const [x, z] = key.split(",").map(Number);
    if (!has(x, z - 1) && gAt(x, z) <= 3) {
      const d = Math.abs(x - (W - 1) / 2);
      if (d < best) { best = d; doorCell = [x, z]; }
    }
  }
}

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Storey floor slab (ground-floor ceiling / upper floor) across the footprint.
  put(x, STOREY, z, "smooth_stone");
  // Roof slab over the whole footprint, carrying the parapet and roof equipment.
  put(x, TOP, z, "light_gray_concrete");

  const faces = outward(x, z);
  if (faces.length === 0) {
    // Interior cell: air gap above the foundation, up to the floor slab.
    continue;
  }

  // Perimeter walls.
  for (let y = gr; y <= TOP; y++) {
    if (y === TOP) {
      put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === LINTEL) { put(x, y, z, "smooth_stone"); continue; }
    if (y === STOREY) { put(x, y, z, "white_concrete"); continue; }
    // Glazed band between ground and lintel.
    for (const [dx, dz] of faces) {
      const onNS = dz !== 0;                // north/south face
      const t = onNS ? x : z;               // position along the face
      const isDoor = doorCell && x === doorCell[0] && z === doorCell[1] && dz === -1 && gr <= 3;
      if (isDoor && (y === gr || y === gr + 1)) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (t % 3 === 0) {
        put(x, y, z, "white_concrete");     // mullion
      } else {
        put(x, y, z, "glass_pane", {
          north: onNS ? "false" : "true",
          south: onNS ? "false" : "true",
          east: onNS ? "true" : "false",
          west: onNS ? "true" : "false",
          waterlogged: "false",
        });
      }
    }
  }

  // Warm light behind selected facade glass (interior side of the window).
  if (gr <= 3) {
    for (const [dx, dz] of faces) {
      const t = dz !== 0 ? x : z;
      const ix = x - dx, iz = z - dz;      // inward neighbour
      if (t % 3 === 2 && has(ix, iz) && ((x + z) % 2 === 0)) {
        put(ix, gr + 1, iz, "glowstone");
      }
    }
  }
}

// Rooftop plant: a small equipment box on the roof slab, near the back.
{
  let rx = -1, rz = -1;
  for (const [key] of G) {
    const [x, z] = key.split(",").map(Number);
    if (x >= 3 && x <= 6 && z >= 7 && z <= 9 && has(x + 1, z) && has(x, z + 1)) {
      rx = x; rz = z; break;
    }
  }
  if (rx >= 0) {
    for (let y = TOP + 1; y <= TOP + 2; y++) {
      for (let dx = 0; dx < 2; dx++) {
        for (let dz = 0; dz < 2; dz++) {
          if (has(rx + dx, rz + dz)) put(rx + dx, y, rz + dz, "iron_block");
        }
      }
    }
  }
}

g.save(BASE + ".nbt");
