import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 新光曼哈頓金融中心 (Shin Kong Manhattan Financial Center), Xinyi, Taipei.
// Read as a late-1990s / early-2000s Taipei office tower: a 15-storey blue-glass
// curtain wall on a light stone base, white-concrete mullions and light-grey spandrels,
// one setback at the 12th storey, and a central penthouse with a mast.
// Roof at ~78 blocks above the lowest ground, storeys 5 blocks high.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw232093693";
const W = 69, H = 90, D = 38;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const TOP = 78;        // roof surface height (blocks above lowest ground)
const SET = 60;        // setback level (storey 12 line)
const IX0 = 4, IX1 = 64, IZ0 = 4, IZ1 = 33;   // upper tier footprint (inset 4 blocks)

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, g] of cells) G.set(key(x, z), g);

const inF = (x, z) => G.has(key(x, z));
const inI = (x, z) => inF(x, z) && x >= IX0 && x <= IX1 && z >= IZ0 && z <= IZ1;
const edge = (inT, x, z) =>
  !inT(x - 1, z) || !inT(x + 1, z) || !inT(x, z - 1) || !inT(x, z + 1);

// Central service core (concrete ring, air inside)
const inCore = (x, z) => x >= 22 && x <= 46 && z >= 13 && z <= 24;
const coreEdge = (x, z) => inCore(x, z) && (x === 22 || x === 46 || z === 13 || z === 24);

// Penthouse box on the upper tier
const inPH = (x, z) => x >= 28 && x <= 40 && z >= 16 && z <= 21;
const phEdge = (x, z) => inPH(x, z) && (x === 28 || x === 40 || z === 16 || z === 21);

// Entrance bay on the south and north faces: glass doors between stone piers, canopy above
const entranceBay = (x, z) => (z === 0 || z === 37) && x >= 31 && x <= 37;
const entrancePier = (x, z) => (z === 0 || z === 37) && (x === 30 || x === 38);
const canopy = (x, z) => (z === 0 || z === 37) && x >= 29 && x <= 39;

// Facade of one perimeter cell at height y, given the membership test of its tier
function facade(x, z, y, inT) {
  const onZFace = !inT(x, z - 1) || !inT(x, z + 1);
  const onXFace = !inT(x - 1, z) || !inT(x + 1, z);
  const corner = onZFace && onXFace;

  if (y < 5) {
    // Ground floor: stone base, framed glass entrance, canopy above
    if (canopy(x, z) && y === 4) return "smooth_stone";
    if (entranceBay(x, z)) return "glass";
    if (entrancePier(x, z)) return "white_concrete";
    if (corner) return "white_concrete";
    return "smooth_quartz";
  }
  // Storey line / spandrel band
  if (y % 5 === 0) return "light_gray_concrete";

  // Corner fins run the full height of each storey
  if (corner) return "white_concrete";

  // Window bay: mullions on each face every 3 cells
  const mull = (onZFace && x % 3 === 0) || (onXFace && z % 3 === 0);
  if (mull) return "white_concrete";

  // Warm light in clustered bays on a few storeys, not scattered dots
  const bay = Math.floor((onZFace ? x : z) / 3);
  if (((bay + Math.floor(y / 5)) % 5 === 0) && (onZFace ? x % 3 : z % 3) === 1 && y % 5 === 2) {
    return "glowstone";
  }
  return "light_blue_stained_glass";
}

function blockAt(x, z, y) {
  // Penthouse on the upper tier (walls 66..75, roof at 76)
  if (inPH(x, z)) {
    if (y === 76) return "light_gray_concrete";
    if (y >= 66 && y <= 75) {
      if (!phEdge(x, z)) return null;
      if (y % 5 === 0) return "light_gray_concrete";
      return "light_blue_stained_glass";
    }
    if (y === 65) return "smooth_stone"; // slab that carries the penthouse
    if (y === 77) return null;
  }

  if (y < SET) {
    if (coreEdge(x, z)) return "light_gray_concrete";
    if (edge(inF, x, z)) return facade(x, z, y, inF);
    if (y % 5 === 0) return "smooth_stone";   // storey floor slabs
    return null;
  }

  if (y === SET) {
    if (!inI(x, z)) return "smooth_stone";     // roof of the lower tier
    if (coreEdge(x, z)) return "light_gray_concrete";
    if (edge(inI, x, z)) return facade(x, z, y, inI);
    return "smooth_stone";                     // floor slab of the upper tier
  }

  if (y === SET + 1 && !inI(x, z)) {
    // Parapet along the lower tier's roof perimeter
    return edge(inF, x, z) ? "light_gray_concrete" : null;
  }

  if (!inI(x, z)) return null;                 // above the lower tier's roof: empty

  if (coreEdge(x, z)) return "light_gray_concrete";

  if (y === 77) {
    if (edge(inI, x, z)) return "light_gray_concrete";  // cornice
    return "smooth_stone";                              // roof
  }

  if (edge(inI, x, z)) return facade(x, z, y, inI);
  if (y % 5 === 0) return "smooth_stone";     // floor slabs
  return null;
}

const g = new Voxels([W, H, D]);

for (const [x, z, ground] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  // Building from its ground up to the roof
  for (let y = ground; y < TOP; y++) {
    const id = blockAt(x, z, y);
    if (id) g.set(x, y, z, id);
  }
}

// Mast on the penthouse roof, at the centre of the penthouse
for (let y = 77; y <= 83; y++) g.set(34, y, 18, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
