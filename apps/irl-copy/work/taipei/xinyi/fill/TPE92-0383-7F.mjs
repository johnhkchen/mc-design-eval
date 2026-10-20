import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 信義公爵館 (TPE92-0383-7F), built 2003. Seven storeys of 5 blocks to a roof at y=35,
// white tiled and concrete facade with blue glass, a stone base course and a shopfront,
// north-side setback from storey 6 (y=25), and a roof plant box with a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0383-7F";
const W = 27, H = 47, D = 20;
const TOP = 35;          // roof line: 7 storeys x 5 blocks
const SETBACK_Y = 25;    // setback tier starts here
const SETBACK_Z = 3;     // north strip (z < 3) is stepped back below the setback

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const F = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) F.set(`${x},${z}`, gr);
}

const g = new Voxels([W, H, D]);

const has = (x, z) => F.has(`${x},${z}`);
const ground = (x, z) => F.get(`${x},${z}`);

// Cell belongs to the building at height y (setback removes the north strip above SETBACK_Y).
function inTier(x, y, z) {
  if (!has(x, z)) return false;
  return y < SETBACK_Y ? true : z >= SETBACK_Z;
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Facade cell: a footprint neighbour is missing or stepped back at this height.
function edge(x, z, y) {
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inTier(nx, y, nz)) return true;
  }
  return false;
}

// Interior cell directly behind a facade cell (gets warm light behind the glass).
function depth1(x, z, y) {
  if (!inTier(x, y, z) || edge(x, z, y)) return false;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inTier(nx, y, nz) && edge(nx, nz, y)) return true;
  }
  return false;
}

// Roof plant box, mast, and roof-edge parapet
function roofEquip(x, y, z) {
  if (!inTier(x, y, z)) return null;
  const inBox = x >= 9 && x <= 17 && z >= 7 && z <= 12;
  if (inBox && y >= 36 && y <= 38) return "light_gray_concrete";
  if (inBox && y === 39) return "smooth_stone";
  if (x === 13 && z === 5 && y >= 36 && y <= 43) return "iron_bars";
  if (x === 13 && z === 5 && y === 44) return ["lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }];
  if (y === 36 && edge(x, z, TOP)) return "white_concrete";
  return null;
}

// Setback terrace on the north strip
function terrace(x, y, z) {
  if (y === SETBACK_Y) return "smooth_stone";
  if (y === SETBACK_Y + 1 && edge(x, z, y)) return "white_concrete";
  return null;
}

function cellBlock(x, y, z) {
  if (y > TOP) return roofEquip(x, y, z);
  if (!inTier(x, y, z)) return terrace(x, y, z);

  if (y === TOP) {
    return edge(x, z, y) ? "quartz_block" : "light_gray_concrete";
  }

  const gr = ground(x, z);
  const o = y % 5;
  const k = Math.floor(y / 5);
  const e = edge(x, z, y);
  const southFront = e && z === D - 1;

  // Storey lines: floor spandrel bands on the facade, slabs inside
  if (o === 0) {
    if (e) return k === 0 ? "stone_bricks" : "light_gray_concrete";
    return "smooth_stone";
  }

  // Lintel band; entrance canopy projects as a slab over the door
  if (o === 4) {
    if (southFront && k === 0 && x >= 11 && x <= 15) {
      return ["dark_oak_slab", { type: "bottom", waterlogged: "false" }];
    }
    return e ? "white_concrete" : null;
  }

  // Window zone (rows 1..3)
  if (e) {
    // Ground storey: entrance on the south face, shopfront glazing
    if (k === 0) {
      if (x === 13 && z === D - 1) {
        if (y === gr + 1) return ["oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
        if (y === gr + 2) return ["oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
        return "light_blue_stained_glass_pane";
      }
      // Recessed entrance surround in dark stone
      if (southFront && (x === 12 || x === 14) && y <= gr + 2) return "stone_bricks";
      const idxK = (z === 0 || z === D - 1) ? x : z;
      if (idxK % 4 === 0) return "stone_bricks";
      return "light_blue_stained_glass_pane";
    }
    // Office storeys: piers every third cell, glass between, corners solid
    const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
    const idx = (z === 0 || z === D - 1) ? x : z;
    if (corner) return "quartz_pillar";
    if (idx % 3 === 0) return "white_concrete";
    return "light_blue_stained_glass_pane";
  }

  // Interior: air gap, with sparse warm lights just behind the glass
  if (o === 2 && depth1(x, z, y)) {
    if ((x + z + k) % 7 === 0) return "glowstone";
  }
  // Lantern under the entrance canopy, just inside the door
  if (x === 13 && z === D - 2 && y === gr + 3 && k === 0) {
    return ["lantern", { hanging: "true", waterlogged: "false" }];
  }
  return null;
}

// Foundation and superstructure, column by column
for (const [key, gr] of F) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y <= 44; y++) {
    const r = cellBlock(x, y, z);
    if (!r) continue;
    if (Array.isArray(r)) g.set(x, y, z, r[0], r[1]);
    else g.set(x, y, z, r);
  }
}

g.save(`${DIR}/${ID}.nbt`);
