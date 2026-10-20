import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block (c. 1990s Xinyi): white-concrete walls,
// quartz trim, stone-brick plinth, light-blue glazing in a pier-and-bay grid,
// south-facing entrance with door, lanterns and lintel canopy, roof deck with plant boxes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309237292";
const W = 30, H = 23, D = 31;
const TOP = 11;      // parapet top, ~11 blocks above lowest ground
const BAND1 = 5;     // first storey line
const BAND2 = 10;    // cornice / roof deck level

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const gg = Math.max(0, Math.round(gr));
  ground.set(key(x, z), gg);
  minG = Math.min(minG, gg);
}
for (const [k, v] of ground) ground.set(k, v - minG); // y 0 = lowest ground

const has = (x, z) => ground.has(key(x, z));
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // [dx, dz]
const missingDirs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isOuter = (x, z) => missingDirs(x, z).length > 0;
const facingOf = (dx, dz) =>
  dz === -1 ? "north" : dz === 1 ? "south" : dx === -1 ? "west" : "east";

// Entrance: south-facing outline cell nearest the footprint's mid x.
const southX = [];
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x, z + 1)) southX.push(x);
}
const midX = southX.length
  ? Math.round((Math.min(...southX) + Math.max(...southX)) / 2)
  : Math.round(W / 2);
const entranceX = southX.length
  ? southX.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), southX[0])
  : midX;
let entranceZ = -1;
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (x === entranceX && !has(x, z + 1)) entranceZ = Math.max(entranceZ, z);
}

const paneProps = (dz) =>
  dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundations and floor / roof slabs across the whole footprint.
for (const [k, G] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
  put(x, G, z, "light_gray_concrete");
  if (G <= BAND1) put(x, BAND1, z, "light_gray_concrete");
  if (G <= BAND2) put(x, BAND2, z, "gray_concrete");
}

// 2. Outer shell: plinth, storey lines, cornice, parapet, piers, glazing.
for (const [k, G] of ground) {
  const [x, z] = k.split(",").map(Number);
  const dirs = missingDirs(x, z);
  if (dirs.length === 0) continue;

  const corner = dirs.length > 1;
  const [dx, dz] = dirs[0];
  const along = dx !== 0 ? z : x;
  const pier = corner || along % 3 === 0;
  const isEntrance = dz === 1 && x === entranceX && z === entranceZ;
  const nearEntrance = dz === 1 && Math.abs(x - entranceX) <= 1 && z === entranceZ;

  for (let y = G; y <= TOP; y++) {
    if (y === G) { put(x, y, z, "stone_bricks"); continue; }
    if (y === BAND2) {
      // Stepped cornice: outward-facing upper stair gives a projecting profile.
      if (!corner) {
        put(x, y, z, "quartz_stairs", {
          facing: facingOf(dx, dz), half: "top", shape: "straight", waterlogged: "false",
        });
      } else {
        put(x, y, z, "quartz_block");
      }
      continue;
    }
    if (y === TOP) { put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === BAND1) { put(x, y, z, "smooth_quartz"); continue; }

    if (isEntrance && (y === G + 1 || y === G + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: y === G + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (nearEntrance && y === 4) {
      put(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (nearEntrance && y === 3 && Math.abs(x - entranceX) === 1) {
      // Lanterns flanking the door, hanging under the canopy.
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (pier) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }

    if (y === BAND1 + 1) {
      put(x, y, z, "white_concrete"); // spandrel under upper glazing
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(dz));
    }
  }

  // Warm lights behind some windows (inside the air gap, inner neighbour).
  if (!pier && !isEntrance) {
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && !isOuter(ix, iz)) {
      if (along % 6 === 1) put(ix, 8, iz, "glowstone");
      if (along % 9 === 4) put(ix, 2, iz, "glowstone");
    }
  }
}

// 3. Roof plant: a few 2x2 equipment boxes on the interior roof deck.
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (isOuter(x, z)) continue;
  if ((x % 8 === 3 || x % 8 === 4) && (z % 8 === 3 || z % 8 === 4) && x > 4 && z > 4) {
    put(x, BAND2 + 1, z, "light_gray_concrete");
    put(x, BAND2 + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
