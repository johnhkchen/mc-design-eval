import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMr16066285";
const W = 118, H = 23, D = 72;
const ROOF = 11;                       // lidar: roof about 11 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const cellMap = new Map();
for (const [x, z, gr] of cells) {
  cellMap.set(`${x},${z}`, Math.min(15, Math.max(0, Math.round(gr))));
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const gAt = (x, z) => cellMap.get(`${x},${z}`);

// Outward faces of a cell: zp = +z (south), zn = -z (north), xp = +x (east), xn = -x (west)
const FACES = [["zp", 0, 1], ["zn", 0, -1], ["xp", 1, 0], ["xn", -1, 0]];
function facesOf(x, z) {
  const out = [];
  for (const [f, dx, dz] of FACES) if (!has(x + dx, z + dz)) out.push(f);
  return out;
}
// Position along the wall: x for z-facing walls, z for x-facing walls
const uOf = (f, x, z) => (f[0] === "z" ? x : z);

// Pre-pass: find the span of the south (zp) wall to centre the entrance on it
let zpMin = Infinity, zpMax = -Infinity;
for (const k of cellMap.keys()) {
  const [x, z] = k.split(",").map(Number);
  const fs = facesOf(x, z);
  if (fs[0] === "zp") {
    const u = uOf("zp", x, z);
    zpMin = Math.min(zpMin, u);
    zpMax = Math.max(zpMax, u);
  }
}
const ENTRANCE_C = (zpMin + zpMax) / 2;

// Window pane connection props so grids join up along the wall
function paneProps(f) {
  const alongX = f[0] === "z";
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
}
function barProps(f) {
  return paneProps(f);
}

// Is this cell at least 2 cells from any edge (roof area for equipment)?
function interiorDepth2(x, z) {
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      if (!has(x + dx, z + dz)) return false;
  return true;
}

// ---- build ------------------------------------------------------------------
const edgeTops = [];   // remember edge cells for the parapet pass

for (const k of cellMap.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = gAt(x, z);
  const top = Math.max(ROOF, gr + 5);  // roof level for this column

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone");

  const fs = facesOf(x, z);

  if (fs.length === 0) {
    // Interior core: solid mass up to the roof, roof slab on top
    for (let y = gr + 1; y < top; y++) g.set(x, y, z, "white_concrete");
    g.set(x, top, z, "smooth_stone");

    // Roof plant on a grid, only well inside the footprint
    if (interiorDepth2(x, z) && (x - 10) % 18 >= 0 && (x - 10) % 18 < 7 &&
        (z - 8) % 16 >= 0 && (z - 8) % 16 < 8) {
      g.set(x, top + 1, z, "light_gray_concrete");
      if ((x + z) % 3 === 0) g.set(x, top + 2, z, "iron_bars", paneProps("zp"));
      else g.set(x, top + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Edge cell: facade
  const f = fs[0];
  const u = uOf(f, x, z);
  const entrance = f === "zp" && Math.abs(u - ENTRANCE_C) <= 4;
  edgeTops.push([x, z, top]);

  for (let y = gr + 1; y <= top; y++) {
    const lvl = y - gr;
    let block = null, props = undefined;

    if (y === top) {
      block = "stone_bricks";                   // cornice / parapet course
    } else if (lvl === 1) {
      block = "stone_bricks";                   // plinth
    } else if (lvl === 5 || lvl === 10) {
      block = "light_gray_concrete";            // storey lines
    } else if (lvl >= 2 && lvl <= 4) {
      // Ground storey: louvred service openings between concrete piers
      const pier = u % 5 === 0;
      if (entrance) {
        block = lvl <= 3 ? "glass" : "stone_bricks";   // glazed entrance, lintel above
      } else if (pier) {
        block = "white_concrete";
      } else {
        block = "iron_bars";
        props = barProps(f);
      }
    } else if (lvl >= 6 && lvl <= 9) {
      // Upper storey: framed window grid
      const pier = u % 5 === 0;
      if (pier) {
        block = "white_concrete";
      } else if (lvl === 6 || lvl === 9) {
        block = "white_concrete";               // sill and head frames
      } else {
        // glass panes, some with warm light behind
        if (((u * 7 + y * 3 + x + z) % 11) === 0) {
          block = "glowstone";
        } else {
          block = "light_blue_stained_glass_pane";
          props = paneProps(f);
        }
      }
    } else {
      block = "white_concrete";
    }

    if (block) g.set(x, y, z, block, props);
  }
}

// Parapet caps on the roof edge
for (const [x, z, top] of edgeTops) {
  if (top + 1 < H) {
    g.set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
