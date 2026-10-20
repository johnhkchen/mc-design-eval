import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s Xinyi office block: 5 storeys of 5 blocks, white tiled
// piers, tinted cyan glazing in ribbon bands, light-grey spandrels, a
// stone base with a glazed shopfront and a central entrance, a parapet
// with coping, and a roof plant box with a short mast.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw535167415.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw535167415.nbt";

const W = 10, H = 38, D = 20;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(key(x, z));
const cx = (minX + maxX) >> 1;

// Depth from the outer edge: 0 = facade, 1 = air-gap ring, 2+ = solid core.
const depth = new Map();
const queue = [];
for (const [x, z] of cells) {
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (edge) { depth.set(key(x, z), 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !depth.has(key(nx, nz))) {
      depth.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}

const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const doorA = Math.floor((maxX - minX) / 2);

for (const [x, z, gr] of cells) {
  const gi = Math.min(24, Math.max(0, Math.round(gr)));
  const d = depth.get(key(x, z)) ?? 2;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gi; y++) g.set(x, y, z, "stone");

  // Solid core: floor slabs and structure, all the way to the top slab.
  if (d >= 2) {
    for (let y = gi; y <= 25; y++) g.set(x, y, z, "white_concrete");
    // Roof plant box and mast, only on the core.
    if (d >= 3 && x >= minX + 3 && x <= maxX - 3 && z >= minZ + 5 && z <= minZ + 8) {
      for (let y = 26; y <= 28; y++) g.set(x, y, z, "gray_concrete");
    }
    if (d >= 3 && x === cx && z === minZ + 6) {
      for (let y = 29; y <= 34; y++) g.set(x, y, z, "iron_block");
      g.set(x, 35, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
    continue;
  }

  // Air-gap ring behind the facade: floor slabs only, air elsewhere.
  if (d === 1) {
    for (let y = gi; y <= 25; y++) {
      if (y % 5 === 0) g.set(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade ring (d === 0).
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const corner = (mN || mS) && (mW || mE);
  let face = null;
  if (!corner) face = mN ? "N" : mS ? "S" : mW ? "W" : "E";
  const along = face === "N" || face === "S" || corner ? x - minX : z - minZ;
  const mull = corner || along % 2 === 0;
  const isDoor = face === "S" && along === doorA && (x === minX + doorA);

  for (let y = gi; y <= 27; y++) {
    if (isDoor && y === gi) {
      g.set(x, y, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoor && y === gi + 1) {
      g.set(x, y, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    let id;
    if (y === gi) id = corner ? "white_concrete" : "stone_bricks";
    else if (y === 26) id = "white_concrete";
    else if (y === 27) id = "light_gray_concrete";
    else if (y % 5 === 0 || y % 5 === 4) id = "light_gray_concrete";
    else id = mull ? "white_concrete" : "cyan_stained_glass";
    g.set(x, y, z, id);

    // Warm light in the air gap behind some glazed bays.
    if (face && !mull && y % 5 === 2 && y >= gi && y <= 25) {
      const k = Math.floor(y / 5);
      const [dx, dz] = inward[face];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz)) {
        if ((along + k * 3) % 7 === 0) g.set(ix, y, iz, "glowstone");
        else if ((along + k) % 11 === 5) g.set(ix, y, iz, "shroomlight");
      }
    }
  }
}

// Air gaps between floors in the facade ring stay empty; the core and slabs
// carry all the loads, so nothing floats.
g.save(OUT);
