import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 27, D = 15, H = 32;
const STOREY = 3; // one 3-block storey: spandrel band + two glazed rows

const cells = JSON.parse(readFileSync(`${DIR}/DC86586.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const c of cells) {
  const [x, z, gr, roof] = c;
  info.set(key(x, z), { x, z, gr: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => info.has(key(x, z));

// Quantise every cell's massing into clean 3-block storey tiers
for (const v of info.values()) {
  let n = Math.max(2, Math.round((v.roof - v.gr) / STOREY));
  n = Math.min(n, Math.floor((H - 3 - v.gr) / STOREY));
  v.n = Math.max(1, n);
  v.top = v.gr + STOREY * v.n;
}

const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Piers on the faces: every 4th block along the face; corners always piered
function isPier(x, z) {
  const alongX = !has(x, z - 1) || !has(x, z + 1);
  const alongZ = !has(x - 1, z) || !has(x + 1, z);
  if (alongX && alongZ) return true;
  if (alongX) return x % 4 === 0;
  if (alongZ) return z % 4 === 0;
  return false;
}

function facadeBlock(x, z, k, n) {
  if (k === 0) return "polished_granite";                // base course
  if (k === STOREY * n - 1) return "smooth_stone";       // cornice under parapet
  if (k % STOREY === 0) return "smooth_stone";           // storey floor line
  return isPier(x, z) ? "white_concrete" : "light_blue_stained_glass";
}

for (const v of info.values()) {
  const { x, z, gr, top, n } = v;
  const perim = isPerim(x, z);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const rel = top - gr;
  for (let k = 0; k < rel; k++) {
    const y = gr + k;
    if (perim) {
      g.set(x, y, z, facadeBlock(x, z, k, n));
    } else {
      if (k % STOREY === 0) {
        g.set(x, y, z, "smooth_stone");                  // floor slab per storey
      } else if (k === rel - 1) {
        g.set(x, y, z, "light_gray_concrete");           // roof deck
      } else if (k % STOREY === 1 &&
                 (x === 1 || x === W - 2 || z === 1 || z === D - 2) &&
                 (x * 7 + z * 3 + k * 2) % 5 === 0) {
        g.set(x, y, z, "shroomlight");                   // warm light behind glass
      }
    }
  }

  // Parapet on the perimeter
  if (perim) g.set(x, top, z, "stone_bricks");
}

// Rooftop plant: a few grouped penthouse blocks rather than scattered cubes
for (const v of info.values()) {
  const { x, z, top } = v;
  if (isPerim(x, z)) continue;
  const cluster = (x === 8 || x === 9) && (z === 5 || z === 6);
  const cluster2 = (x === 17 || x === 18) && (z === 8);
  if (cluster) {
    g.set(x, top, z, "stone_bricks");
    if (x === 8 && z === 5) g.set(x, top + 1, z, "light_gray_concrete");
  }
  if (cluster2) {
    g.set(x, top, z, "stone_bricks");
  }
}

// Main entrance on the south face (z = 0), centred on x = 13:
// full-height polished granite portico with a lintel band, then the door
if (has(13, 0)) {
  const gr = info.get(key(13, 0)).gr;
  const n = info.get(key(13, 0)).n;
  for (const x of [11, 15]) {
    if (!has(x, 0)) continue;
    const gx = info.get(key(x, 0)).gr;
    for (let k = 0; k < 3; k++) g.set(x, gx + k, 0, "polished_granite");
  }
  for (const x of [12, 13, 14]) {
    if (!has(x, 0)) continue;
    const gx = info.get(key(x, 0)).gr;
    g.set(x, gx + 3, 0, "smooth_stone");                 // lintel band
    g.set(x, gx + 2, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
  const doorBase = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(13, gr, 0, "dark_oak_door", { ...doorBase, half: "lower" });
  g.set(13, gr + 1, 0, "dark_oak_door", { ...doorBase, half: "upper" });
  g.set(13, gr + 2, 0, "glass_pane");
  for (const x of [11, 15]) {
    if (has(x, 0)) {
      const gx = info.get(key(x, 0)).gr;
      g.set(x, gx + 1, 0, "lantern", { hanging: "false" });
    }
  }
}

g.save(`${DIR}/DC86586.nbt`);
