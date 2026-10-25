import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499618";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 20, D = 8;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(key(x, z), { x, z, gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => map.has(key(x, z));

const DIRS = [
  { dx: 1, dz: 0, facing: "east" },
  { dx: -1, dz: 0, facing: "west" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: 0, dz: -1, facing: "north" },
];
const exposedDirs = (c) => DIRS.filter((d) => !has(c.x + d.dx, c.z + d.dz));

// Horizontal distance across the width (x) from the outside edge: drives the gable slope
const xd = new Map();
for (const c of map.values()) {
  if (!has(c.x - 1, c.z) || !has(c.x + 1, c.z)) xd.set(key(c.x, c.z), 1);
}
for (let k = 2; k <= 10; k++) {
  for (const c of map.values()) {
    const kk = key(c.x, c.z);
    if (xd.has(kk)) continue;
    if (xd.get(key(c.x - 1, c.z)) === k - 1 || xd.get(key(c.x + 1, c.z)) === k - 1) xd.set(kk, k);
  }
}
const xOf = (c) => xd.get(key(c.x, c.z)) ?? 1;
const maxX = Math.max(...[...map.values()].map(xOf));

// Eave and ridge per cell, smoothed to clean tiers
for (const c of map.values()) {
  c.rf = Math.max(c.rf, c.gr + 6);
  c.eave = Math.max(c.gr + 3, c.rf - 3);
}

// ---- foundation and walls -----------------------------------------------
let doorCell = null;
for (const c of map.values()) {
  const ex = exposedDirs(c);
  if (ex.some((d) => d.dz === 1) && (!doorCell || Math.abs(c.x - 2) < Math.abs(doorCell.x - 2))) {
    doorCell = c;
  }
}

for (const c of map.values()) {
  const ex = exposedDirs(c);
  for (let y = 0; y < c.gr; y++) g.set(c.x, y, c.z, "stone_bricks");

  for (let y = c.gr; y <= c.eave; y++) {
    const rel = y - c.gr;
    let block = "stone_bricks";
    if (rel === 0) block = "andesite";                 // base course
    else if (y === c.eave) block = "stone_brick_slab"; // cornice band
    if (ex.length && rel >= 1 && rel <= 2 && y < c.eave) {
      const t = ex[0].dx !== 0 ? c.z : c.x;
      if (t % 2 === 1) block = "glass_pane";           // window grid
    }
    g.set(c.x, y, c.z, block,
      block === "stone_brick_slab" ? { type: "bottom", waterlogged: "false" } : undefined);
  }
}

// Door on the street face, set in the wall (no canopy outside the footprint)
if (doorCell) {
  const c = doorCell;
  g.set(c.x, c.gr, c.z, "spruce_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(c.x, c.gr + 1, c.z, "spruce_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// ---- gable roof of deepslate tiles, ridge along z ----------------------
// Layer k keeps cells with xd >= k: xd == k are outward stairs, deeper cells are full tiles.
// Gable-end cells (open to z) are infilled with stone so the triangle is solid.
for (const c of map.values()) {
  const xc = xOf(c);
  const zEnd = exposedDirs(c).some((d) => d.dz !== 0);
  for (let k = 1; k <= xc; k++) {
    const y = c.eave + k;
    if (zEnd && k < xc) {
      g.set(c.x, y, c.z, "stone_bricks");
    } else if (xc === k) {
      const low = DIRS.find((d) => d.dz === 0 && !has(c.x + d.dx, c.z + d.dz)) ||
                  DIRS.find((d) => d.dz === 0 && (xd.get(key(c.x + d.dx, c.z + d.dz)) ?? 0) < k);
      const facing = low ? low.facing : "south";
      g.set(c.x, y, c.z, "deepslate_tile_stairs", {
        facing, half: "bottom", shape: "straight", waterlogged: "false",
      });
    } else {
      g.set(c.x, y, c.z, "deepslate_tiles");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
