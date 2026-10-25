import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499717.cells.json", "utf8"));

const W = 13, H = 35, D = 15;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(x + "," + z, { g: gr, r: roof });
const has = (x, z) => map.has(x + "," + z);

let minZ = Infinity, minX = Infinity, maxX = -Infinity;
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  minZ = Math.min(minZ, z); minX = Math.min(minX, x); maxX = Math.max(maxX, x);
}
const midX = Math.round((minX + maxX) / 2);

// 1850 Normandy commercial: rendered/stone walls, slate roof, stone base and cornice
const RENDER = "smooth_stone";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const SLATE = "deepslate_tiles";
const CORNICE = "stone_brick_slab";
const TRIM = "stone_bricks";
const FOUND = "stone";

for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const gr = c.g, roof = c.r;

  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const perim = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  const corner = (!has(x + 1, z) || !has(x - 1, z)) && (!has(x, z + 1) || !has(x, z - 1));

  for (let y = gr; y < roof - 1; y++) {
    const rel = y - gr;
    if (!perim) {
      if (rel === 0 || rel % 5 === 0) g.set(x, y, z, FLOOR);
      continue;
    }
    // base course
    if (rel === 0) { g.set(x, y, z, BASE); continue; }
    // storey string courses
    if (rel % 5 === 0) { g.set(x, y, z, TRIM); continue; }

    if (rel < 5) {
      // ground floor: shopfront with door centred on the street (min-z) face
      const doorCell = z === minZ && x === midX;
      if (doorCell) {
        if (rel === 1) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (rel === 2) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, RENDER);
      } else if (rel <= 2 && !corner) {
        // shop glazing with a warm lamp in some bays
        g.set(x, y, z, ((x + z) % 4 === 0) ? "glowstone" : "glass_pane");
      } else if (rel === 3 && z === minZ && x !== midX) {
        g.set(x, y, z, RENDER);
      } else {
        g.set(x, y, z, RENDER);
      }
      continue;
    }

    // upper storeys: framed window bays with stone sills
    if (!corner && rel % 5 === 1) {
      g.set(x, y, z, TRIM); // sill / lintel course above window
    } else if (!corner && rel % 5 >= 2 && rel % 5 <= 3) {
      const warm = (x * 3 + z * 5 + rel) % 7 === 0;
      g.set(x, y, z, warm ? "glowstone" : "glass_pane");
    } else {
      g.set(x, y, z, RENDER);
    }
  }

  // slate roof cap, cornice slab ring on the perimeter (no battlements)
  g.set(x, roof - 1, z, SLATE);
  if (perim) g.set(x, roof - 1, z, TRIM);
  if (perim) g.set(x, roof, z, CORNICE, { type: "bottom", waterlogged: "false" });
}

// canopy over the entrance: a dark-oak slab projecting above the door line
if (has(midX, minZ)) {
  const gr = map.get(midX + "," + minZ).g;
  g.set(midX, gr + 3, minZ, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499717.nbt");
