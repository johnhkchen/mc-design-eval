import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343772";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 8 x 32 footprint, roof about 11 blocks above the lowest ground.
// Two storeys of ~5 blocks: ground shopfront storey (y 0..4), upper storey (y 6..8),
// quartz storey line at y 5, cornice at y 9, parapet/roof cap at y 10.
const W = 8, H = 23, D = 32;
const ROOF = 10;
const BAND = 5;
const DOOR_Z = 15;

const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(k(x, z), gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => ground.has(k(x, z));

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

function faceOf(x, z) {
  if (x === maxX) return "east";
  if (x === minX) return "west";
  if (z === minZ) return "north";
  if (z === maxZ) return "south";
  return null;
}

// Pier columns: every 4 blocks on the long (east/west) faces, two piers on the short ends.
function isPier(face, x, z) {
  if (face === "east" || face === "west") return z % 4 === 0;
  return x === 1 || x === 6;
}

function exteriorBlock(face, x, y, z, Gc) {
  if (y === Gc) return "polished_andesite";              // base course
  if (y === BAND || y === 9 || y === ROOF) return "smooth_quartz"; // storey line, cornice, parapet
  const pier = isPier(face, x, z);
  if (y < BAND) {
    if (y === Gc + 3) return "smooth_quartz";            // shopfront lintel
    if (y >= Gc + 1 && y <= Gc + 2) {
      if (pier) return "white_terracotta";
      return face === "east" ? "glass" : "light_blue_stained_glass";
    }
    return "white_terracotta";
  }
  // upper storey, y 6..8
  if (pier) return "white_terracotta";
  return "light_blue_stained_glass";
}

for (const [x, z, gr] of cells) {
  const Gc = gr - minG;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < Gc; y++) g.set(x, y, z, "stone_bricks");

  const ext = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  if (!ext) {
    // Interior: floor slabs per storey, roof ceiling, air gap between.
    g.set(x, Gc, z, "smooth_stone");
    if (BAND > Gc) g.set(x, BAND, z, "smooth_stone");
    g.set(x, ROOF, z, "gray_concrete");
    continue;
  }

  const face = faceOf(x, z);
  for (let y = Gc; y <= ROOF; y++) {
    // Entrance on the east street frontage.
    if (face === "east" && z === DOOR_Z && (y === Gc + 1 || y === Gc + 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "east",
        half: y === Gc + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    g.set(x, y, z, exteriorBlock(face, x, y, z, Gc));
  }
}

// Warm light behind some windows (glowstone in the air gap, behind the glass).
for (let z = minZ; z <= maxZ; z++) {
  if (z % 8 === 2 && has(maxX - 1, z) && !isPier("east", maxX, z)) {
    g.set(maxX - 1, 7, z, "glowstone");
  }
  if (z % 8 === 6 && has(minX + 1, z) && !isPier("west", minX, z)) {
    g.set(minX + 1, 7, z, "shroomlight");
  }
}

// Roof plant: a small water tank on the roof slab, set on the cap at y 10.
for (let x = 2; x <= 4; x++) {
  for (let z = 10; z <= 12; z++) {
    if (!has(x, z)) continue;
    g.set(x, 11, z, "stone_bricks");
    g.set(x, 12, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
