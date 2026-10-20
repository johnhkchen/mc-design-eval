import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711380";
const W = 26, H = 33, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint and per-cell ground
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const v = Math.max(0, Math.min(H - 1, Math.round(gr)));
  ground.set(key(x, z), v);
  minG = Math.min(minG, v);
}
if (!Number.isFinite(minG)) minG = 0;

// 4 storeys of 5 blocks, roof deck, parapet, penthouse
const base = Math.min(minG, 9);
const DECK = base + 20;   // roof deck row (interior), cornice row (edges)
const PARA = base + 21;   // parapet row on edges, penthouse floor
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

const has = (x, z) => ground.has(key(x, z));
const outsOf = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);

const groundOf = (x, z) => ground.get(key(x, z));

// Wall material for an exterior cell at height y
function wallBlock(x, y, z, o, corner) {
  const gc = groundOf(x, z);
  const rel = y - base;
  const k = Math.floor(rel / 5);
  const r = rel % 5;

  if (y === DECK) return "smooth_quartz";            // cornice line
  const alongZ = o.includes("east") || o.includes("west");
  const idx = alongZ ? z : x;
  const pier = corner || idx % 3 === 0;

  if (k === 0) {
    if (r === 0) return "polished_granite";          // base course
    if (r === 4) return "smooth_quartz";             // lintel
    if (pier) return "polished_granite";
    return "gray_stained_glass";                     // shopfront
  }
  if (r === 0 || r === 4) return "white_concrete";   // storey lines
  if (pier) return "smooth_quartz";
  return "light_blue_stained_glass";                 // upper windows
}

for (const [k, gc] of ground) {
  const [x, z] = k.split(",").map(Number);
  const o = outsOf(x, z);
  const edge = o.length > 0;
  const corner = o.length >= 2;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: ground slab, storey floor slabs, roof deck; air otherwise (no interiors)
    for (let y = gc; y < DECK; y++) {
      if (y === gc || (y > base && (y - base) % 5 === 0)) {
        g.set(x, y, z, "smooth_stone");
      }
    }
    g.set(x, DECK, z, "light_gray_concrete");
  } else {
    // Exterior shell
    for (let y = gc; y <= DECK; y++) {
      // Main entrance: double doors on north face, ground storey
      const isDoor = o.includes("north") && (x === 12 || x === 13) && gc === base && (y === gc || y === gc + 1);
      if (isDoor) {
        const facing = "north";
        const half = y === gc ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", { facing, half, hinge: x === 12 ? "left" : "right", open: "false", powered: "false" });
        continue;
      }
      g.set(x, y, z, wallBlock(x, y, z, o, corner));
    }
    // Parapet on edges
    g.set(x, PARA, z, "white_concrete");
  }
}

// Warm lights behind some upper and ground windows (glowstone in interior cell behind glass)
for (const [k, gc] of ground) {
  const [x, z] = k.split(",").map(Number);
  const o = outsOf(x, z);
  if (o.length !== 1) continue;
  const o0 = o[0];
  const [dx, dz] = DIRS[o0];
  for (let y = gc; y < DECK; y++) {
    const rel = y - base;
    const r = rel % 5;
    if (r < 1 || r > 3) continue;
    if (((x + 2 * z + y) % 4) !== 0) continue;
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz)) continue;
    if (outsOf(ix, iz).length > 0) continue;
    if (groundOf(ix, iz) > y) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Rooftop penthouse with light ring on the roof
for (let x = 7; x <= 17; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!has(x, z) || outsOf(x, z).length > 0) continue;
    g.set(x, PARA, z, "light_gray_concrete");
    const ring = x === 7 || x === 17 || z === 5 || z === 11;
    if (ring) {
      const glassy = (x + z) % 2 === 0;
      g.set(x, PARA + 1, z, glassy ? "light_blue_stained_glass" : "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
