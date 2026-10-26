import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87180.cells.json`, "utf8"));

// 1435 G St NW: Commercial-Office-Large, mid-century Stripped Classical office block.
// Light limestone-clad facade on a stone base, rhythmic window bays, chiseled cornice,
// flat roof following a smoothed lidar envelope, one mechanical penthouse.
const W = 28, H = 31, D = 19;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Footprint lookup
const map = new Map();
for (const c of cells) map.set(`${c[0]},${c[1]}`, { ground: c[2], roof: c[3] });
const has = (x, z) => map.has(`${x},${z}`);

// Smooth the lidar roof: 3x3 median per cell, then quantize to 3-block storey tiers
const medianRoof = (x, z) => {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const v = map.get(`${x + dx},${z + dz}`);
      if (v) vals.push(v.roof);
    }
  vals.sort((a, b) => a - b);
  return vals[Math.floor(vals.length / 2)];
};

let maxR = 0;
for (const [key, v] of map) {
  const [x, z] = key.split(",").map(Number);
  let r = Math.round(medianRoof(x, z) / 3) * 3;
  r = Math.min(H - 4, Math.max(v.ground + 3, r));
  v.R = r;
  maxR = Math.max(maxR, r);
}

const doorX = 14; // entrance on the z=0 face, centred on the 28-wide front

for (const [key, v] of map) {
  const [x, z] = key.split(",").map(Number);
  const gy = v.ground;
  const R = v.R;

  // Foundation: solid from y0 up to the cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const onNS = !has(x, z - 1) || !has(x, z + 1); // north/south face: bays run along x

  for (let y = gy; y < R; y++) {
    const rel = y - gy;
    const k = Math.floor(rel / 3);
    const s = rel % 3;
    const top = y === R - 1;

    if (perim) {
      // Entrance: centred door on the z=0 face, glazed flanks, calcite lintel
      if (z === 0 && x >= doorX - 1 && x <= doorX + 1 && rel <= 2) {
        if (x === doorX && rel === 0) {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (x === doorX && rel === 1) {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (rel === 2) { put(x, y, z, "calcite"); continue; }
        if (rel === 1) { put(x, y, z, "light_blue_stained_glass_pane"); continue; }
        if (rel === 0) { put(x, y, z, "glass"); continue; }
      }

      if (top) {
        put(x, y, z, "chiseled_stone_bricks"); // cornice cap
      } else if (rel === 0) {
        put(x, y, z, "stone_bricks"); // base course
      } else if (s === 0) {
        put(x, y, z, "calcite"); // spandrel / storey line
      } else {
        const idx = onNS ? x : z;
        if (idx % 3 === 0) {
          put(x, y, z, "calcite"); // mullion
        } else if (k % 2 === 1 && idx % 6 === 2 && s === 1) {
          put(x, y, z, "glowstone"); // warm lit office behind glass
        } else {
          put(x, y, z, "light_blue_stained_glass_pane");
        }
      }
    } else {
      // Interior: floor slab per storey (supports everything above), air between
      if (top) {
        put(x, y, z, "light_gray_concrete"); // roof deck
      } else if (rel === 0 || s === 0) {
        put(x, y, z, "smooth_stone");
      }
    }
  }

  // Interior roof decks need a slab beneath them so nothing floats
  if (!perim) {
    put(x, R - 2, z, "smooth_stone");
  }
}

// One mechanical penthouse on the roof, centred over the top tier
for (const [key, v] of map) {
  const [x, z] = key.split(",").map(Number);
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (!perim && v.R === maxR && x >= 10 && x <= 13 && z >= 7 && z <= 11) {
    for (let y = v.R; y < v.R + 2; y++) put(x, y, z, "stone_bricks");
  }
}

g.save(`${DIR}/DC87180.nbt`);
