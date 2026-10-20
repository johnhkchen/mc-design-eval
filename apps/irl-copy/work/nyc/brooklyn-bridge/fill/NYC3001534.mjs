import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001534.cells.json`, "utf8"));

// 5 x 6 footprint, 1847 Brooklyn Heights brick row house: brown-terracotta
// basement, brick shell, smooth sandstone belt courses, stone cornice,
// 4 storeys of 2 blocks under one flat roof, centre entrance on the street front.
const W = 5, H = 21, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
let minX = Infinity, minZ = Infinity, lowGround = Infinity;
for (const [x, z, gr] of cells) {
  map.set(key(x, z), { g: gr });
  minX = Math.min(minX, x);
  minZ = Math.min(minZ, z);
  lowGround = Math.min(lowGround, gr);
}
// Flat tiered roof: lidar says about 9 blocks above the lowest ground.
const ROOF = lowGround + 9;

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Pass 1: foundation, shell, windows, belts, door, cornice, roof
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0, H - 8));
  const T = Math.min(Math.max(ROOF, gr + 7), H - 1);
  const ext = {
    n: !map.has(key(x, z - 1)),
    s: !map.has(key(x, z + 1)),
    w: !map.has(key(x - 1, z)),
    e: !map.has(key(x + 1, z)),
  };
  const isExt = ext.n || ext.s || ext.w || ext.e;

  // brownstone basement from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "brown_terracotta");

  // facade index along the wall this cell faces (street front = low z)
  let u, isFront = false;
  if (ext.n) { u = x - minX; isFront = true; }
  else if (ext.s) { u = x - minX; }
  else { u = z - minZ; }

  const span = T - gr;
  for (let o = 0; o < span; o++) {
    const y = gr + o;
    if (!isExt) {
      // interior: air, with a floor slab per storey and the roof deck
      if (o % 2 === 1 || o === span - 1) put(x, y, z, "smooth_stone");
      continue;
    }
    if (o === span - 1) { put(x, y, z, "stone_bricks"); continue; }            // parapet cap
    if (o === span - 2) { put(x, y, z, "smooth_sandstone"); continue; }        // cornice course
    if (o === span - 3) { put(x, y, z, "stone_bricks"); continue; }            // frieze
    if (o === 0) { put(x, y, z, "smooth_sandstone"); continue; }               // plinth

    // centre entrance on the street front
    if (isFront && u === 2 && (o === 1 || o === 2)) {
      const half = o === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    // window bays on odd facade indices, glass on even storey rows
    const isWin = (u % 2 === 1) && (o % 2 === 0) && (o <= span - 4);
    if (isWin) put(x, y, z, "glass_pane");
    else if (o % 2 === 1) put(x, y, z, "smooth_sandstone");                    // storey belt
    else put(x, y, z, "brick");
  }
}

// Pass 2: warm light behind a few street-front windows
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (map.has(key(x, z - 1))) continue; // only street-front cells
  const inward = map.get(key(x, z + 1));
  if (!inward) continue;
  const u = x - minX;
  const gr2 = Math.max(0, Math.min(inward.g, H - 8));
  const T2 = Math.min(Math.max(ROOF, gr2 + 7), H - 1);
  const span2 = T2 - gr2;
  const glowRows = [];
  if (u === 1) glowRows.push(2);
  if (u === 3) glowRows.push(4);
  for (const o of glowRows) {
    if (o <= span2 - 4) put(x, gr2 + o, z + 1, "glowstone");
  }
}

g.save(`${DIR}/NYC3001534.nbt`);
