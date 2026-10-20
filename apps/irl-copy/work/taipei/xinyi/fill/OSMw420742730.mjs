import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw420742730";
const cells = JSON.parse(readFileSync(BASE + ".cells.json", "utf8"));

// Two-storey 1970s-80s Xinyi shophouse: tiled white facade, terrazzo-like base,
// shopfront with red fascia, upper floor with framed glass grid, parapet and rooftop plant.
const W = 7, H = 23, D = 8;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const gr = new Map();
for (const [x, z, gd] of cells) gr.set(key(x, z), gd);
const inF = (x, z) => gr.has(key(x, z));
const perim = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of gr.keys().map ? [...gr.keys()].map(k => k.split(",").map(Number)) : []) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const pane = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const slabBottom = { type: "bottom", waterlogged: "false" };
const slabTop = { type: "top", waterlogged: "false" };

// Which facade a perimeter cell belongs to, and its index along that facade
function facade(x, z) {
  const xEdge = x === minX || x === maxX;
  const zEdge = z === minZ || z === maxZ;
  if (xEdge && zEdge) return { corner: true };
  if (z === maxZ) return { face: "S", idx: x, corner: false };
  if (z === minZ) return { face: "N", idx: x, corner: false };
  if (x === minX) return { face: "W", idx: z, corner: false };
  return { face: "E", idx: z, corner: false };
}
const inward = { S: [0, -1], N: [0, 1], W: [1, 0], E: [-1, 0] };
const doorFacing = { S: "north", N: "south", W: "east", E: "west" };

// Door sits on the south (street) face, nearest the middle
let doorX = null;
for (const [x, z] of [...gr.keys()].map(k => k.split(",").map(Number))) {
  if (z === maxZ && perim(x, z)) {
    if (doorX === null || Math.abs(x - 3) < Math.abs(doorX - 3)) doorX = x;
  }
}

// 1. Foundations from y 0 up to each cell's ground
for (const [x, z, gd] of cells) {
  for (let y = 0; y < gd; y++) put(x, y, z, "stone");
}

// 2. Body: 11 layers from each cell's ground (b .. b+10), parapet cap at b+11
for (const [x, z, gd] of cells) {
  const b = gd;
  const top = b + 10;
  const isP = perim(x, z);

  if (!isP) {
    put(x, b, z, "smooth_stone");              // interior floor
    put(x, b + 5, z, "smooth_stone");          // floor slab, level 2
    put(x, top, z, "light_gray_concrete");     // roof deck
    continue;
  }

  const f = facade(x, z);
  const { corner, face, idx } = f;

  for (let y = b; y <= top; y++) {
    const rel = y - b;
    if (rel === 0) {
      put(x, y, z, "stone_bricks");                       // base course
    } else if (rel <= 4) {                                // ground floor shopfront
      if (corner) { put(x, y, z, "white_concrete"); continue; }
      if (rel === 4) { put(x, y, z, "red_terracotta"); continue; }   // fascia
      if (face === "S" && x === doorX && rel <= 2) {
        const hinge = "left";
        if (rel === 1) put(x, y, z, "dark_oak_door", { facing: doorFacing[face], half: "lower", hinge, open: "false", powered: "false" });
        else put(x, y, z, "dark_oak_door", { facing: doorFacing[face], half: "upper", hinge, open: "false", powered: "false" });
        continue;
      }
      if (face === "S" && x === doorX && rel === 3) { put(x, y, z, "stone_brick_slab", slabTop); continue; } // canopy lip
      if (idx % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass");
    } else if (rel === 5) {                               // floor string course
      put(x, y, z, "smooth_stone");
    } else if (rel <= 9) {                                // upper floor window grid
      if (corner) { put(x, y, z, "white_concrete"); continue; }
      if (rel === 6 || rel === 9) { put(x, y, z, "white_concrete"); continue; } // head and sill
      if (idx % 3 === 0) put(x, y, z, "white_concrete");   // mullions
      else put(x, y, z, "glass_pane", pane);
    } else {                                              // parapet wall
      put(x, y, z, "white_concrete");
    }
  }

  // Parapet cap
  put(x, top + 1, z, "stone_brick_slab", slabBottom);
}

// 3. Warm light: glowstone behind some lit windows and shopfronts (interior cells only)
for (const [x, z, gd] of cells) {
  if (!perim(x, z)) continue;
  const f = facade(x, z);
  if (f.corner) continue;
  const [dx, dz] = inward[f.face];
  const ix = x + dx, iz = z + dz;
  if (!inF(ix, iz) || perim(ix, iz)) continue;
  if (f.idx % 3 === 0) continue;
  if ((f.idx + (f.face === "S" || f.face === "N" ? 0 : 1)) % 2 === 0) {
    put(ix, gd + 2, iz, "glowstone");   // shopfront glow
  } else {
    put(ix, gd + 7, iz, "glowstone");   // upper floor glow
  }
}

// 4. Rooftop plant: one mechanical block and a low railing-height unit on the roof
for (const [x, z, gd] of cells) {
  if (perim(x, z)) continue;
  if (x === 3 && z === Math.floor((minZ + maxZ) / 2)) {
    put(x, gd + 11, z, "iron_block");
    put(x, gd + 12, z, "stone_brick_slab", slabBottom);
  }
}

g.save(BASE + ".nbt");
