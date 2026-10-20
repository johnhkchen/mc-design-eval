import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw589862418: 15 x 18 footprint, roof about 29 blocks above lowest ground.
// Read as a mid-1990s Xinyi office block: white concrete frame, blue-grey glazing in
// horizontal bands, polished andesite base course, shopfront ground floor, stone cornice,
// and a small mechanical penthouse. Five storeys of 5 blocks each.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw589862418.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw589862418.nbt";

const W = 15, H = 41, D = 18;
const STOREY = 5;
const ROOF_SLAB = 26;   // structural roof / cornice level
const PARAPET_TOP = 28; // top of parapet
const PH_CAP = 30;      // penthouse cap course

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const lowest = Math.min(...cells.map(c => Math.round(c[2])));
const B = lowest + 1; // ground floor body base

const FACES = {
  north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0],
};
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };
const openFaces = (x, z) =>
  Object.entries(FACES).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([n]) => n);

// Collect all voxel decisions first, then write once (later decisions override earlier).
const plan = new Map();
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  plan.set(`${x},${y},${z}`, [id, props]);
};
const glassPane = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Facade block for a perimeter cell at height y on a given outward face.
function facadeAt(x, z, y, face) {
  const k = Math.floor((y - B) / STOREY);
  const o = (y - B) % STOREY;
  const u = (face === "north" || face === "south") ? x : z; // position along the face
  if (k === 0 && o === 0) return ["polished_andesite"];           // base course
  if (o === 0 || o === 4) {
    if (k === 0 && o === 4) return ["smooth_stone"];               // ground-floor storey line
    return ["white_concrete"];                                    // storey lines / spandrels
  }
  if (k === 0) {                                                  // shopfront
    return u % 3 === 0 ? ["polished_andesite"] : ["glass"];
  }
  return u % 3 === 0 ? ["white_concrete"] : ["light_blue_stained_glass_pane", glassPane];
}

// 1. Foundations and building body
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const gr = groundAt(x, z);
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const open = openFaces(x, z);
  const perimeter = open.length > 0;

  for (let y = gr + 1; y <= ROOF_SLAB; y++) {
    if (y === ROOF_SLAB) {
      put(x, y, z, perimeter ? "smooth_stone" : "light_gray_concrete"); // cornice / roof slab
      continue;
    }
    if (perimeter) {
      const [id, props] = facadeAt(x, z, y, open[0]);
      put(x, y, z, id, props);
    } else if ((y - B) % STOREY === 0) {
      put(x, y, z, "light_gray_concrete"); // interior floor slab, air between
    }
  }

  // Parapet on perimeter
  if (perimeter) {
    for (let y = ROOF_SLAB + 1; y <= PARAPET_TOP; y++) put(x, y, z, "white_concrete");
  }
}

// 2. Mechanical penthouse, inset from the edges
const PH = { x0: 4, x1: 10, z0: 5, z1: 12 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!has(x, z)) continue;
    const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    put(x, ROOF_SLAB + 1, z, "light_gray_concrete"); // penthouse floor
    for (let y = ROOF_SLAB + 2; y <= PH_CAP - 1; y++) {
      if (edge) {
        if ((x + z + y) % 2 === 0) put(x, y, z, "light_blue_stained_glass_pane", glassPane);
        else put(x, y, z, "light_gray_concrete");
      }
    }
    put(x, PH_CAP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 3. Entrance on the south face, nearest the middle column
let entrance = null;
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  if (!openFaces(x, z).includes("south")) continue;
  if (!entrance || Math.abs(x - 7) < Math.abs(entrance[0] - 7)) entrance = [x, z];
}
if (entrance) {
  const [ex, ez] = entrance;
  const gr = groundAt(ex, ez);
  const y0 = gr + 1;
  put(ex, y0, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, y0 + 1, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy over the door, on the entrance cell and the cell inward of it
  const canopyY = B + 4;
  const slab = { type: "bottom", waterlogged: "false" };
  put(ex, canopyY, ez, "stone_brick_slab", slab);
  if (has(ex, ez - 1)) put(ex, canopyY, ez - 1, "stone_brick_slab", slab);
}

// 4. Warm lights behind glass on upper storeys, in interior cells only
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const open = openFaces(x, z);
  if (open.length === 0) continue;
  const face = open[0];
  const u = (face === "north" || face === "south") ? x : z;
  const [ix, iz] = INWARD[face];
  const tx = x + ix, tz = z + iz;
  if (!has(tx, tz) || openFaces(tx, tz).length > 0) continue;
  if (u % 6 !== 1) continue;
  for (let k = 1; k < 5; k++) {
    const y = B + STOREY * k + 2;
    if (y <= groundAt(tx, tz)) continue;
    put(tx, y, tz, "glowstone");
  }
}

// 5. Write the voxels
for (const [key, [id, props]] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

g.save(OUT);
