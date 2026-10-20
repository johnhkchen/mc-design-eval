import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial mid-rise, c. 1980s-90s Taipei: white tiled piers, light-blue
// spandrel glass, stone base and shopfronts, flat parapet, rooftop plant box.
const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098858";
const W = 20, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));

const ground = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  const gg = Math.max(0, Math.round(gr));
  ground.set(`${x},${z}`, gg);
  maxG = Math.max(maxG, gg);
}

// Flat roof about 11 blocks above the lowest ground; keep room for plant above.
const ROOF = Math.min(15, Math.max(11, maxG + 6));

const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => inFp(x, z) && (!inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1));

// Pick the exposed face (north first, the entrance side) and its bay index.
function faceOf(x, z) {
  if (!inFp(x, z - 1)) return { dir: "north", idx: x, inward: [0, 1] };
  if (!inFp(x, z + 1)) return { dir: "south", idx: x, inward: [0, -1] };
  if (!inFp(x - 1, z)) return { dir: "west", idx: z, inward: [1, 0] };
  return { dir: "east", idx: z, inward: [-1, 0] };
}

// Facade block id for a perimeter cell at height y, relative storey offset o = y - g.
function facadeBlock(x, z, gg, y) {
  if (y === ROOF) return "smooth_stone";                 // parapet cap
  const o = y - gg;
  const f = faceOf(x, z);
  const pier = f.idx % 3 === 0;
  const entrance = f.dir === "north" && (x === 9 || x === 10);
  if (o === 0) return "stone_bricks";                     // base course
  if (o <= 3) {                                           // shopfront
    if (entrance) return "glass_pane";
    if (pier) return "polished_andesite";
    return "glass_pane";
  }
  if (o === 4) return "smooth_stone";                     // shopfront lintel
  if (o === 5) return "light_gray_concrete";              // floor-line band
  if (o <= 9) return pier ? "white_concrete" : "light_blue_stained_glass_pane";
  if (o === 10) return "light_gray_concrete";             // cornice
  return "white_concrete";
}

const g = new Voxels([W, H, D]);

// 1. Foundations, perimeter walls, interior slabs and roof deck.
for (const [key, gg] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gg; y++) g.set(x, y, z, "stone");   // foundation up to ground

  if (isPerim(x, z)) {
    for (let y = gg; y <= ROOF; y++) g.set(x, y, z, facadeBlock(x, z, gg, y));
  } else {
    g.set(x, gg, z, "smooth_stone");                       // ground floor slab
    if (gg + 5 < ROOF) g.set(x, gg + 5, z, "smooth_stone"); // second floor slab
    g.set(x, ROOF, z, "light_gray_concrete");              // roof deck
  }
}

// 2. Warm light behind some shopfront and upper windows (interior cell inward of the glass).
for (const [key, gg] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const f = faceOf(x, z);
  if (f.idx % 3 === 0) continue;
  if (f.dir === "north" && (x === 9 || x === 10)) continue;
  for (const o of [2, 7]) {
    const y = gg + o;
    if (y >= ROOF) continue;
    if (((x + z + o) % 4) !== 0) continue;
    const ix = x + f.inward[0], iz = z + f.inward[1];
    if (!inFp(ix, iz) || isPerim(ix, iz) || gAt(ix, iz) !== gg) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// 3. Rooftop plant box on interior cells, with a short mast.
for (let x = 6; x <= 13; x++) {
  for (let z = 7; z <= 13; z++) {
    if (!inFp(x, z) || isPerim(x, z)) continue;
    const ring = x === 6 || x === 13 || z === 7 || z === 13;
    for (let y = ROOF + 1; y <= ROOF + 2; y++) {
      if (!ring) g.set(x, y, z, "light_gray_concrete");
      else g.set(x, y, z, x % 3 === 0 ? "white_concrete" : "light_blue_stained_glass_pane");
    }
    g.set(x, ROOF + 3, z, "smooth_stone");
  }
}
if (isPerim(10, 10) === false && inFp(10, 10)) {
  for (let y = ROOF + 4; y <= ROOF + 7; y++) g.set(10, y, 10, "iron_bars");
}

g.save(`${BASE}/${ID}.nbt`);
