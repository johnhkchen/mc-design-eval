import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986980";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, D = 11, H = 23;
const ROOF = 11;        // roof deck level, about 11 blocks above lowest ground
const PARAPET_TOP = 12; // parapet cap

// Footprint lookup: key "x,z" -> ground height (clamped so storeys stay sensible)
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(8, Math.round(gr))));
}
const inF = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
const zFace = (x, z) => !inF(x, z - 1) || !inF(x, z + 1);
const xFace = (x, z) => !inF(x - 1, z) || !inF(x + 1, z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => (p ? g.set(x, y, z, b, p) : g.set(x, y, z, b));

// Pillar test: vertical mullions on faces facing +/-z, horizontal-direction mullions on faces facing +/-x
const isPillar = (x, z) =>
  (zFace(x, z) && (x % 3 === 0 || x === W - 1)) ||
  (xFace(x, z) && (z % 3 === 0 || z === D - 1));

// Entrance on the z = D-1 (street) face
const doorX = [6, 7, 5, 8].find((x) => inF(x, D - 1)) ?? null;

// 1. Foundations and floor slabs
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gr = G(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (!isEdge(x, z)) {
    put(x, gr, z, "smooth_stone");          // ground-floor slab
    if (gr <= 5) put(x, 5, z, "smooth_stone"); // storey-2 floor slab
    put(x, ROOF, z, "light_gray_concrete");   // roof deck
  }
}

// 2. Edge walls: base course, shopfront, belt course, upper windows, cornice, parapet
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (!isEdge(x, z)) continue;
  const gr = G(x, z);
  const pillar = isPillar(x, z);

  for (let y = gr; y <= 10; y++) {
    if (y === gr) {
      put(x, y, z, "polished_granite");
    } else if (y <= 4) {
      // Ground-floor commercial frontage
      if (z === D - 1 && x === doorX) {
        if (y === gr + 1) {
          put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (y === gr + 2) {
          put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (y === gr + 3) { put(x, y, z, "dark_oak_planks"); continue; }
      }
      put(x, y, z, pillar ? "dark_oak_planks" : "glass");
    } else if (y === 5) {
      put(x, y, z, "smooth_quartz"); // storey line
    } else if (y <= 9) {
      put(x, y, z, pillar ? "white_concrete" : "light_blue_stained_glass");
    } else {
      put(x, y, z, "smooth_quartz"); // cornice
    }
  }

  // Parapet and cap
  put(x, ROOF, z, "white_concrete");
  put(x, PARAPET_TOP, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// 3. Warm light behind some glass (interior, standing on floor slabs; no hanging blocks)
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (!isEdge(x, z)) continue;
  const gr = G(x, z);
  const ix = x + (x === 0 ? 1 : x === W - 1 ? -1 : 0);
  const iz = z + (z === 0 ? 1 : z === D - 1 ? -1 : 0);
  if (!inF(ix, iz) || isEdge(ix, iz)) continue;
  // upper storey lamps on the storey-2 floor
  if ((x + z) % 4 === 1 && gr <= 5) put(ix, 6, iz, "glowstone");
  // ground-floor lamps behind shopfront glass
  if ((x + z) % 5 === 2 && gr + 1 <= 4) put(ix, gr + 1, iz, "shroomlight");
}

// 4. Roof equipment: central core and AC units on the roof deck
for (let x = 5; x <= 8; x++) {
  for (let z = 3; z <= 6; z++) {
    if (!inF(x, z) || isEdge(x, z)) continue;
    put(x, ROOF + 1, z, "smooth_stone");
    put(x, ROOF + 2, z, "smooth_stone");
  }
}
for (const [x, z] of [[2, 2], [2, 8], [11, 2]]) {
  if (inF(x, z) && !isEdge(x, z)) put(x, ROOF + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
