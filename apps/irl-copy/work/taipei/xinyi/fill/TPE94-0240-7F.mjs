import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0240-7F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 29, H = 47, D = 13;
const g = new Voxels([W, H, D]);

// Built 2005: 7 storeys of 5 blocks, roof slab at y 34, parapet at 35.
const ROOF = 34;
const PARAPET = 35;

const key = (x, z) => `${x},${z}`;
const S = new Map();
for (const [x, z, gr] of cells) S.set(key(x, z), gr);
const has = (x, z) => S.has(key(x, z));
const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const zmin = Math.min(...zs), zmax = Math.max(...zs);
const xmid = Math.round((xmin + xmax) / 2);

const isCorner = (x, z) => (x === xmin || x === xmax) && (z === zmin || z === zmax);
const isMullion = (x, z) =>
  ((x === xmin || x === xmax) && z % 3 === 0) ||
  ((z === zmin || z === zmax) && x % 3 === 0);

// Entrance on the zmin face: a 3-wide granite surround with the door in the middle.
const isDoorCol = (x, z) => z === zmin && x === xmid;
const isSurround = (x, z) => z === zmin && Math.abs(x - xmid) === 1;

// Storey lines are two blocks deep (spandrel band) for a stronger horizontal read.
const isSpandrel = (y) => y % 5 === 0 || y % 5 === 4;

// Pass 1: foundation, base, floors and facade for each footprint cell
for (const [x, z, gr] of cells) {
  const ext = exterior(x, z);

  // Foundation: solid from y0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");

  // Base course / ground floor slab
  g.set(x, gr, z, ext ? "polished_granite" : "smooth_stone");

  // Roof slab over the whole footprint
  g.set(x, ROOF, z, "light_gray_concrete");

  // Parapet on the perimeter
  if (ext) g.set(x, PARAPET, z, "white_concrete");

  for (let y = gr + 1; y < ROOF; y++) {
    if (!ext) {
      // Interior: floor slabs per storey, otherwise air behind the glass
      if (y % 5 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Facade
    if (isSpandrel(y)) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Entrance: door in the middle, granite surround on either side and lintel above
    if (isDoorCol(x, z) && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if ((isSurround(x, z) && y <= gr + 3) || (isDoorCol(x, z) && y === gr + 3)) {
      g.set(x, y, z, "polished_granite");
      continue;
    }

    if (isCorner(x, z) || isMullion(x, z)) {
      g.set(x, y, z, "white_concrete");
      continue;
    }
    g.set(x, y, z, "light_blue_stained_glass");
  }

  // Lit lobby behind the entrance glass
  if (has(xmid, zmin + 1) && (x === xmid && z === zmin + 1)) {
    g.set(x, gr + 2, z, "glowstone");
  }
}

// Warm lights behind some window glass on interior cells of the upper storeys
for (const [x, z, gr] of cells) {
  if (exterior(x, z)) continue;
  for (let y = gr + 1; y < ROOF; y++) {
    if (y % 5 === 2 && (x + 2 * z + y) % 19 === 0) g.set(x, y, z, "glowstone");
  }
}

// Lanterns on parapet corners
for (const [x, z] of cells) {
  if (isCorner(x, z)) {
    g.set(x, PARAPET + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof penthouse: mechanical enclosure, centred, stands on the roof slab
const PH_X0 = 8, PH_X1 = 20, PH_Z0 = 3, PH_Z1 = 9;
for (let x = PH_X0; x <= PH_X1; x++) {
  for (let z = PH_Z0; z <= PH_Z1; z++) {
    if (!has(x, z)) continue;
    for (let y = PARAPET; y <= 37; y++) {
      const ring = x === PH_X0 || x === PH_X1 || z === PH_Z0 || z === PH_Z1;
      if (ring && y > PARAPET) {
        g.set(x, y, z, (y % 5 === 0 || y === 37) ? "light_gray_concrete" : "light_blue_stained_glass");
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }
    g.set(x, 38, z, "smooth_stone");
  }
}

// Slim antenna mast on the penthouse
const mx = xmid, mz = Math.round((PH_Z0 + PH_Z1) / 2);
if (has(mx, mz)) {
  for (let y = 39; y <= 45; y++) g.set(mx, y, mz, "iron_bars");
  g.set(mx, 46, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
