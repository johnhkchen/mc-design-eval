import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1544574266";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 7;
const ROOF = 11;               // roof springing, blocks above lowest ground
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const minG = Math.min(...cells.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr - minG);
const has = (x, z) => ground.has(key(x, z));

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const zmin = Math.min(...zs), zmax = Math.max(...zs);

const WALL = "red_terracotta";
const BAND = "yellow_concrete";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const ROOFB = "oxidized_cut_copper";
const ROOFS = "oxidized_cut_copper_stairs";
const GLASS = "glass_pane";
const LIGHT = "glowstone";
const TRIM = "gold_block";

const perimeter = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const inward = (x, z) => {
  // direction from a perimeter cell into the footprint
  if (!has(x + 1, z)) return [-1, 0];
  if (!has(x - 1, z)) return [1, 0];
  if (!has(x, z + 1)) return [0, -1];
  if (!has(x, z - 1)) return [0, 1];
  return null;
};
const outwardFacing = (x, z, d) => {
  if (z - zmin === d) return "north";
  if (zmax - z === d) return "south";
  if (x - xmin === d) return "west";
  return "east";
};
const isWindowRow = (rel) => rel === 2 || rel === 7;

// 1. Foundation, base course, walls, bands and windows
for (const [x, z, rawG] of cells) {
  const gy = ground.get(key(x, z));
  for (let y = 0; y < gy; y++) g.set(x, y, z, FOUND);

  if (perimeter(x, z)) {
    g.set(x, gy, z, BASE);
    for (let y = gy + 1; y <= ROOF - 1; y++) {
      const rel = y - gy;
      let blk = WALL;
      if (y === gy + 5 || y === ROOF - 1) blk = BAND;
      else if (isWindowRow(rel) && (x + z) % 2 === 0) blk = GLASS;
      g.set(x, y, z, blk);
    }
  } else {
    // interior: air gap, floor slab per storey, ceiling under the roof
    g.set(x, gy, z, FLOOR);
    g.set(x, gy + 5, z, FLOOR);
    g.set(x, ROOF - 1, z, FLOOR);
  }
}

// 2. Warm lights just inside some windows
for (const [x, z] of cells) {
  if (!perimeter(x, z)) continue;
  if ((x + z) % 4 !== 0) continue;
  const gy = ground.get(key(x, z));
  const dir = inward(x, z);
  if (!dir) continue;
  const [dx, dz] = dir;
  if (!has(x + dx, z + dz)) continue;
  for (const rel of [2, 7]) {
    const y = gy + rel;
    if (y >= ROOF - 1) continue;
    g.set(x + dx, y, z + dz, LIGHT);
  }
}

// 3. Temple entrance on the south (z max) face
const doorX = Math.floor((xmin + xmax) / 2);
const doorZ = zmax;
if (has(doorX, doorZ)) {
  const gy = ground.get(key(doorX, doorZ));
  const doorProps = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(doorX, gy + 1, doorZ, "dark_oak_door", { ...doorProps, half: "lower" });
  g.set(doorX, gy + 2, doorZ, "dark_oak_door", { ...doorProps, half: "upper" });
  for (const dx of [-1, 1]) {
    if (has(doorX + dx, doorZ)) {
      g.set(doorX + dx, gy + 1, doorZ, BAND);
      g.set(doorX + dx, gy + 2, doorZ, BAND);
      g.set(doorX + dx, gy + 3, doorZ, TRIM);
    }
  }
  g.set(doorX, gy + 3, doorZ, TRIM);
}

// 4. Stepped hip roof with outward eave stairs, ridge finials
for (const [x, z] of cells) {
  const gy = ground.get(key(x, z));
  const d = Math.min(x - xmin, xmax - x, z - zmin, zmax - z);
  for (let k = 0; k <= 3; k++) {
    const y = ROOF + k;
    if (k === 3 ? d >= 3 : d > k) {
      g.set(x, y, z, ROOFB);
    } else if (d === k) {
      g.set(x, y, z, ROOFS, {
        facing: outwardFacing(x, z, d),
        half: "bottom",
        shape: "straight",
        waterlogged: "false",
      });
    }
  }
}
const ridgeZ = Math.floor((zmin + zmax) / 2);
for (const rx of [xmin + 3, Math.floor((xmin + xmax) / 2), xmax - 3]) {
  if (has(rx, ridgeZ)) g.set(rx, ROOF + 4, ridgeZ, TRIM);
}

g.save(`${DIR}/${ID}.nbt`);
