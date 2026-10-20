import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw453245234.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw453245234.nbt";

const W = 69, H = 76, D = 18;
const ROOF = 60;      // roof cap course
const PARAPET = 61;   // parapet begins
const TOP = 64;       // roof top (exclusive); 64 blocks above lowest ground

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(55, Math.round(gr))));
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

// Floor bands: podium storey line at 5, tower storey lines every 5 from 10 to 60
const SLABS = [5];
for (let y = 10; y <= ROOF; y += 5) SLABS.push(y);

// Outward facing of a perimeter cell, or null for interior cells
function outward(x, z) {
  if (!inFp(x, z - 1)) return { face: "n", dx: 0, dz: -1, along: x };
  if (!inFp(x, z + 1)) return { face: "s", dx: 0, dz: 1, along: x };
  if (!inFp(x - 1, z)) return { face: "w", dx: -1, dz: 0, along: z };
  if (!inFp(x + 1, z)) return { face: "e", dx: 1, dz: 0, along: z };
  return null;
}

const isEntrance = (x, z, o) => o && o.face === "n" && z === 0 && (x === 31 || x === 32);

// Pick block for a perimeter wall cell at height y
function wallBlock(x, y, z, o, gr) {
  if (y === gr) return ["polished_granite", null];                       // base course
  if (y >= 63) return ["smooth_quartz_slab", { type: "bottom", waterlogged: "false" }]; // cornice cap
  if (y >= PARAPET) return ["smooth_quartz", null];                      // parapet

  if (y < 10) {
    if (y === 5) return ["smooth_quartz", null];                         // podium storey line
    if (isEntrance(x, z, o)) {
      if (y === gr + 1 && gr + 2 <= 4)
        return ["oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === gr + 2 && gr + 2 <= 4)
        return ["oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      return ["light_blue_stained_glass_pane", null];
    }
    if (o.along % 4 === 0) return ["white_concrete", null];              // shopfront mullion
    return ["light_blue_stained_glass_pane", null];
  }

  // Tower
  const F = 5 * Math.floor(y / 5);
  const rel = y - F;
  if (rel === 0 || rel === 4) return ["light_gray_concrete", null];      // spandrels
  if (o.along % 4 === 0) return ["white_concrete", null];                // mullions
  return ["light_blue_stained_glass_pane", null];
}

// ---- Pass 1: foundations, interior floor slabs ----
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");
  for (const y of SLABS) {
    if (y < gr) continue;
    const id = y === ROOF ? "light_gray_concrete" : (y === 5 ? "smooth_quartz" : "white_concrete");
    g.set(x, y, z, id);
  }
}

// ---- Pass 2: perimeter walls, parapet, cornice ----
const glowQueue = [];
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const o = outward(x, z);
  if (!o) continue;
  for (let y = gr; y < TOP; y++) {
    // Skip the interior slab rows so wall blocks take precedence on the facade
    const [id, props] = wallBlock(x, y, z, o, gr);
    if (props) g.set(x, y, z, id, props);
    else g.set(x, y, z, id);

    // Warm lights: glowstone in the room one bay behind selected windows
    if (y >= 10 && y < PARAPET) {
      const F = 5 * Math.floor(y / 5);
      const rel = y - F;
      const isGlassRow = rel >= 1 && rel <= 3 && o.along % 4 !== 0;
      if (isGlassRow && rel === 2 && (o.along * 7 + F * 3) % 11 === 0) {
        glowQueue.push([x - o.dx, y, z - o.dz]);
      }
    }
  }
}
for (const [x, y, z] of glowQueue) {
  if (inFp(x, z)) g.set(x, y, z, "glowstone");
}

// ---- Pass 3: entrance canopy over the street-side doorway ----
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (z <= 2 && x >= 29 && x <= 34 && gr + 3 <= 4) {
    g.set(x, gr + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- Pass 4: roof plant (two mechanical blocks on the roof) ----
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z)) continue;
  const inBox1 = x >= 12 && x <= 20 && z >= 5 && z <= 12;
  const inBox2 = x >= 44 && x <= 54 && z >= 5 && z <= 12;
  if (inBox1 || inBox2) {
    g.set(x, 61, z, "gray_concrete");
    g.set(x, 62, z, "gray_concrete");
  }
}

g.save(OUT);
