import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-style 2-storey mid-century commercial block: white-tiled facade,
// glass shopfronts at street level, framed upper windows, parapet and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542433632";
const W = 30, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

// Storey levels relative to lowest ground: storey 1 = h1..4, storey 2 = h6..9, parapet at h10.
const TOP = minG + 10;
const SLAB = minG + 5;

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Pass 1: foundations, walls, shopfronts, interior floors and roof deck.
for (const [x, z, gy] of cells) {
  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const perim = nN || nS || nW || nE;
  const face = nN ? "n" : nS ? "s" : nW ? "w" : nE ? "e" : null;
  const idx = (face === "n" || face === "s") ? x : z;

  if (!perim) {
    // Interior: air gap, with floor slabs per storey and roof deck.
    put(x, gy, z, "light_gray_concrete");
    if (SLAB > gy) put(x, SLAB, z, "light_gray_concrete");
    if (TOP >= gy) put(x, TOP, z, "gray_concrete");
    continue;
  }

  for (let y = gy; y <= TOP; y++) {
    const h = y - minG;
    const northSouth = face === "n" || face === "s";

    if (y === gy) { put(x, y, z, "polished_andesite"); continue; }   // base course / plinth
    if (h === 10) { put(x, y, z, "smooth_stone"); continue; }         // parapet cap
    if (h === 9) { put(x, y, z, "white_concrete"); continue; }        // upper lintel band
    if (h === 5) { put(x, y, z, "smooth_stone"); continue; }          // storey line
    if (h === 4) {
      // Canopy/lintel band; black canopy over the entrance.
      if (face === "s" && x >= 12 && x <= 16) put(x, y, z, "black_concrete");
      else put(x, y, z, "white_concrete");
      continue;
    }
    if (h >= 6 && h <= 8) {
      // Upper storey: window bays (2 glass, 2 tile piers), tile wall elsewhere.
      const glass = idx % 4 === 1 || idx % 4 === 2;
      put(x, y, z, glass ? "glass" : "white_terracotta");
      continue;
    }
    if (h >= 1 && h <= 3) {
      // Ground-floor shopfront.
      if (face === "s" && x === 14) {
        if (h === 1) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (h === 2) put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "glass");
        continue;
      }
      if (northSouth) {
        put(x, y, z, idx % 3 === 0 ? "dark_oak_planks" : "glass");
      } else {
        put(x, y, z, idx % 3 === 0 ? "dark_oak_planks" : "glass");
      }
      continue;
    }
  }

  // Roof deck on perimeter stays the parapet; interior roof deck handled above.
}

// Pass 2: warm lights behind some upper-storey windows (interior cell behind glass).
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  if (!(nN || nS || nW || nE)) continue;
  const face = nN ? "n" : nS ? "s" : nW ? "w" : nE ? "e" : null;
  const idx = (face === "n" || face === "s") ? x : z;
  if (idx % 4 !== 1 || idx % 12 !== 1) continue;
  let bx = x, bz = z;
  if (face === "n") bz = z + 1;
  else if (face === "s") bz = z - 1;
  else if (face === "w") bx = x + 1;
  else bx = x - 1;
  if (!has(bx, bz)) continue;
  const yLight = minG + 7;
  put(bx, yLight, bz, "glowstone");
}

// Pass 3: rooftop plant on the deck (interior roof cells only).
const plant = [
  [4, 5], [5, 5], [6, 5], [4, 6], [5, 6], [6, 6],
  [22, 6], [23, 6], [24, 6],
];
for (const [x, z] of plant) {
  if (!has(x, z)) continue;
  const interior = has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
  if (!interior) continue;
  put(x, TOP + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
