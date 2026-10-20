import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3344162";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 28, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> {gr, r}
const cellMap = new Map();
for (const [x, z, gr, r] of cells) cellMap.set(`${x},${z}`, { gr, r });
const has = (x, z) => cellMap.has(`${x},${z}`);

// Median-smoothed roof height over the 3x3 neighbourhood (clean tiers, no lidar noise)
function smoothRoof(x, z) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const c = cellMap.get(`${x + dx},${z + dz}`);
      if (c) vals.push(c.r);
    }
  vals.sort((a, b) => a - b);
  return vals[Math.floor(vals.length / 2)];
}

// Per-cell massing: ground, storey count (2-block storeys), top floor layer
const info = [];
for (const [x, z, gr] of cells) {
  const rs = smoothRoof(x, z);
  let S = Math.floor((rs - 1 - gr) / 2);
  if (!(S >= 0)) S = 0;
  let top = gr + 2 * S;
  if (top > 24) top = 24;
  const zExt = !has(x, z - 1) || !has(x, z + 1);
  const xExt = !has(x - 1, z) || !has(x + 1, z);
  info.push({ x, z, gr, top, zExt, xExt, shell: zExt || xExt });
}
const infoMap = new Map(info.map((c) => [`${c.x},${c.z}`, c]));

const ENTRY_X = 12;
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const c of info) {
  const { x, z, gr, top, zExt, xExt, shell } = c;
  const streetFace = zExt && !xExt;
  const isEntry = streetFace && z === 0 && x === ENTRY_X;

  // Foundation up to each cell's own ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= top; y++) {
    const o = y - gr;

    if (!shell) {
      // Interior: floor slabs per storey, one-block air headroom between
      if (o % 2 === 0) g.set(x, y, z, y === top ? "smooth_stone" : "oak_planks");
      continue;
    }

    // Shell (1 block thick)
    if (isEntry && (o === 1 || o === 2)) {
      g.set(x, y, z, "oak_door", {
        facing: "south",
        half: o === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isEntry && o === 3) { g.set(x, y, z, "smooth_stone"); continue; } // lintel over door

    if (o === 0) { g.set(x, y, z, "stone_bricks"); continue; }          // base course
    if (y === top) { g.set(x, y, z, "smooth_stone"); continue; }        // roof / cornice slab
    if (o % 2 === 0) { g.set(x, y, z, "smooth_stone"); continue; }      // storey string course

    // Window row
    const k = (o - 1) / 2;
    if (streetFace) {
      if (k === 0) {
        // Ground-floor shopfront on the street face
        if (x >= 1 && x <= 9) {
          if (x === 1 || x === 5 || x === 9) g.set(x, y, z, "dark_oak_planks");
          else g.set(x, y, z, "glass");
        } else g.set(x, y, z, "stone_bricks");
      } else if (x >= 1 && x <= 23) {
        if (x % 3 === 0) g.set(x, y, z, "stone_bricks");                 // pier
        else g.set(x, y, z, "glass_pane", paneZ);                       // paired windows
      } else g.set(x, y, z, "bricks");
    } else if (xExt && !zExt) {
      if (z % 3 === 1 && k > 0) g.set(x, y, z, "glass_pane", paneX);
      else g.set(x, y, z, "stone_bricks");
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // Parapet on the shell, with a stone cap
  if (top + 1 < H) g.set(x, top + 1, z, shell ? "bricks" : "bricks");
  if (shell && top + 2 < H) g.set(x, top + 2, z, "smooth_stone");
}

// A few warm lights behind street-face windows, in the interior air cell just inside
for (const c of info) {
  if (!c.shell || !c.zExt || c.xExt) continue;
  const inwardZ = !has(c.x, c.z - 1) ? c.z + 1 : c.z - 1;
  const ci = infoMap.get(`${c.x},${inwardZ}`);
  if (!ci || ci.shell) continue;
  for (let k = 1; k * 2 + 1 <= c.top - c.gr; k++) {
    if (c.x % 3 !== 1 || c.x < 1 || c.x > 23) continue;
    if (c.x % 6 !== 1 || k % 2 !== 1) continue;
    const y = c.gr + 2 * k + 1;
    if (y >= ci.gr && y <= ci.top && (y - ci.gr) % 2 === 1) {
      g.set(c.x, y, inwardZ, "shroomlight");
    }
  }
}

// Roof bulkhead (stair/lift enclosure) on interior roof cells
for (const c of info) {
  if (c.shell) continue;
  if (c.x < 19 || c.x > 21 || c.z < 3 || c.z > 5) continue;
  for (let y = c.top + 1; y <= c.top + 2 && y < H; y++) g.set(c.x, y, c.z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
