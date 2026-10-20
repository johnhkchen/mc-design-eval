import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538464246";
const W = 12, H = 23, D = 10;

// Record: no metadata. Lidar roof ~11 blocks above lowest ground.
// Read as a two-storey Taipei shophouse-style block (1960s-80s concrete frame,
// pale tiled walls, red roof-tile deck and lintel band), with a shopfront on the street side.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);

const gMax = Math.max(...cells.map((c) => c[2]));
const Y = Math.max(11, gMax + 8);           // flat roof top (exclusive)
if (Y > H) throw new Error(`roof ${Y} exceeds grid height ${H}`);
const SLAB = Y - 6;                          // first-floor slab / storey line
const DECK = Y - 2;                          // roof deck (red tile)
const PARAPET = Y - 1;                       // parapet course

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const NAME = { N: "north", S: "south", E: "east", W: "west" };
const exteriorDirs = (x, z) => Object.keys(DIRS).filter((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));

// Street side = direction with the most exposed cell faces (ties: N, S, E, W).
const faceCount = { N: 0, S: 0, E: 0, W: 0 };
for (const [x, z] of cells) for (const d of exteriorDirs(x, z)) faceCount[d]++;
const frontDir = ["N", "S", "E", "W"].reduce((best, d) => (faceCount[d] > faceCount[best] ? d : best), "N");

// Along-face coordinate ranges, so piers sit on the face ends and every third bay.
const uOf = (x, z, d) => (d === "N" || d === "S" ? x : z);
const uRange = {};
for (const d of Object.keys(DIRS)) uRange[d] = [Infinity, -Infinity];
for (const [x, z] of cells) for (const d of exteriorDirs(x, z)) {
  const u = uOf(x, z, d);
  uRange[d][0] = Math.min(uRange[d][0], u);
  uRange[d][1] = Math.max(uRange[d][1], u);
}

// Door: middle of the street face.
const frontUs = cells
  .filter(([x, z]) => exteriorDirs(x, z).includes(frontDir))
  .map(([x, z]) => uOf(x, z, frontDir))
  .sort((a, b) => a - b);
const doorU = frontUs.length ? frontUs[Math.floor(frontUs.length / 2)] : null;

const g = new Voxels([W, H, D]);
const put = (x, y, z, v) => {
  if (Array.isArray(v)) g.set(x, y, z, v[0], v[1]);
  else g.set(x, y, z, v);
};

// Element for an exterior face at height y (ground/upper floors).
function faceElement(x, z, d, y, gr) {
  const u = uOf(x, z, d);
  const [lo, hi] = uRange[d];
  const pier = u === lo || u === hi || (u - lo) % 3 === 0;

  // Ground floor: shopfront band with door on the street face.
  if (y >= gr + 1 && y <= SLAB - 2) {
    if (d === frontDir && u === doorU && (y === gr + 1 || y === gr + 2)) {
      return ["oak_door", {
        facing: NAME[frontDir],
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      }];
    }
    return pier ? "polished_andesite" : "glass";
  }

  // Upper floor: sill course, then glazed bays between grey piers.
  if (y === SLAB + 1) return pier ? "polished_andesite" : "smooth_quartz";
  if (y >= SLAB + 2 && y <= DECK - 1) return pier ? "polished_andesite" : "glass";

  return "quartz_block";
}

for (const [x, z, gr] of cells) {
  // Face order: street side first so corners read as shopfront.
  const ex = exteriorDirs(x, z).sort((a, b) => (a === frontDir ? -1 : 0) - (b === frontDir ? -1 : 0));
  const isExt = ex.length > 0;

  // Foundation under the cell, then the ground surface.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, isExt ? "polished_granite" : "smooth_stone");

  // Floor slab and roof deck run across every cell (interior too).
  put(x, SLAB, z, "smooth_quartz");
  put(x, DECK, z, "red_terracotta");

  if (!isExt) continue; // interior: air, no interior fit-out

  // Parapet course round the perimeter.
  put(x, PARAPET, z, "smooth_quartz");

  // Ground-floor band and lintel.
  put(x, SLAB - 1, z, "red_terracotta");
  for (let y = gr + 1; y <= SLAB - 2; y++) {
    put(x, y, z, faceElement(x, z, ex[0], y, gr));
  }

  // Upper floor sill, glazing and piers.
  for (let y = SLAB + 1; y <= DECK - 1; y++) {
    put(x, y, z, faceElement(x, z, ex[0], y, gr));
  }
}

// Warm lights just inside some windows (interior cells only).
for (const [x, z, gr] of cells) {
  const ex = exteriorDirs(x, z);
  if (!ex.length) continue;
  for (const d of ex) {
    const u = uOf(x, z, d);
    const [lo] = uRange[d];
    const ix = x - DIRS[d][0], iz = z - DIRS[d][1];
    if (!inFp(ix, iz) || exteriorDirs(ix, iz).length) continue;
    const bay = (u - lo) % 6;
    if (bay === 1) put(ix, SLAB + 1, iz, ["lantern", { hanging: "false", waterlogged: "false" }]);
    if (bay === 4 && gr + 1 <= SLAB - 2) put(ix, gr + 1, iz, ["lantern", { hanging: "false", waterlogged: "false" }]);
  }
}

// Roof plant: a couple of small mechanical units on interior roof cells.
let plant = 0;
for (const [x, z] of cells) {
  if (plant >= 2) break;
  if (exteriorDirs(x, z).length) continue;
  if (x % 4 !== 2 || z % 3 !== 1) continue;
  put(x, DECK + 1, z, "light_gray_concrete");
  plant++;
}

g.save(`${DIR}/${ID}.nbt`);
