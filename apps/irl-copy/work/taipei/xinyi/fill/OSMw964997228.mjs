import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw964997228";
const W = 33, H = 23, D = 12;

// Low-rise 1970s-80s Taipei commercial block: white tiled concrete frame,
// tinted glass with white piers, shopfront on the ground storey, two storeys
// of offices above, a cornice, a parapet and a small roof plant.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const gy = Math.round(gr);
  ground.set(`${x},${z}`, gy);
  if (gy < minG) minG = gy;
}
if (!Number.isFinite(minG)) minG = 0;

const has = (x, z) => ground.has(`${x},${z}`);
const g = new Voxels([W, H, D]);

// Roof top surface sits 11 blocks above the lowest ground.
const T = minG + 10;          // top course index (parapet / roof deck)
const DOOR_X = 16;

const PANE_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_NS = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Which outward face a boundary cell belongs to (null = interior).
function faceOf(x, z) {
  if (!has(x, z - 1)) return "n";
  if (!has(x, z + 1)) return "s";
  if (!has(x - 1, z)) return "w";
  if (!has(x + 1, z)) return "e";
  return null;
}

// Inward offset from a boundary cell, used for light placement behind glass.
const INWARD = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

function exteriorBlock(x, z, h, face) {
  const alongX = face === "n" || face === "s";
  const i = alongX ? x : z;
  const pane = alongX ? PANE_EW : PANE_NS;
  const pier = i % 3 === 0;

  if (h === 0) return ["stone_bricks", null];

  // Ground storey: shopfront glass, piers, entrance on the north face.
  if (h <= 3) {
    if (pier) return ["white_concrete", null];
    if (face === "n" && x === DOOR_X && h <= 2) {
      const half = h === 1 ? "lower" : "upper";
      return ["dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" }];
    }
    return ["light_blue_stained_glass_pane", pane];
  }

  // Awning band over the entrance, lintel band elsewhere.
  if (h === 4) {
    if (face === "n" && Math.abs(x - DOOR_X) <= 2) return ["red_concrete", null];
    return ["smooth_quartz", null];
  }

  // Upper storey: sill, two glazed rows, lintel.
  if (h === 5) return [pier ? "white_concrete" : "smooth_quartz", null];
  if (h === 6 || h === 7) {
    if (pier) return ["white_concrete", null];
    return ["gray_stained_glass_pane", pane];
  }
  if (h === 8) return [pier ? "white_concrete" : "smooth_quartz", null];

  // Cornice and parapet.
  if (h === 9) return ["quartz_slab", { type: "bottom", waterlogged: "false" }];
  if (h === 10) return ["white_concrete", null];

  return null;
}

// Foundation, walls, floors and roof deck.
for (const [x, z, gr] of cells) {
  const G = Math.round(gr);
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone");

  const face = faceOf(x, z);
  for (let y = G; y <= T; y++) {
    const h = y - minG;
    if (!face) {
      // Interior: floor slabs at ground, first and roof levels; air between.
      if (h === 0 || h === 5) g.set(x, y, z, "smooth_stone");
      else if (h === 10) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    const blk = exteriorBlock(x, z, h, face);
    if (!blk) continue;
    const [id, props] = blk;
    if (props) g.set(x, y, z, id, props);
    else g.set(x, y, z, id);
  }
}

// Warm glowstone behind some upper-storey windows (inside the air gap).
for (const [x, z, gr] of cells) {
  const face = faceOf(x, z);
  if (!face) continue;
  const G = Math.round(gr);
  const alongX = face === "n" || face === "s";
  const i = alongX ? x : z;
  if (i % 3 === 0 || i % 4 !== 1) continue;
  const y = minG + 6;
  if (y < G) continue;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
}

// Roof plant: a mechanical box, an AC pad and a lightning rod on the roof deck.
const roofY = T + 1;
for (let x = 8; x <= 10; x++) {
  for (let z = 3; z <= 8; z++) {
    if (has(x, z)) g.set(x, roofY, z, "light_gray_concrete");
  }
}
for (let x = 9; x <= 10; x++) {
  for (let z = 4; z <= 7; z++) {
    if (has(x, z)) g.set(x, roofY + 1, z, "white_concrete");
  }
}
for (let x = 22; x <= 24; x++) {
  if (has(x, 5)) g.set(x, roofY, 5, "gray_concrete");
}
if (has(30, 2)) {
  g.set(30, roofY, 2, "light_gray_concrete");
  g.set(30, roofY + 1, 2, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
