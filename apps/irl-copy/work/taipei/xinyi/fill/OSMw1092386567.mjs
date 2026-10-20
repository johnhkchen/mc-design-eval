import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building No. 1 (OSMw1092386567): a 1980s Taipei low-rise commercial block.
// White tiled concrete facade, stone-brick plinth, red terracotta sign band,
// a glazed shopfront on the ground floor and two upper storeys of windows in
// concrete frames. Roof deck sits about 11 blocks above the lowest ground.
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1092386567.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1092386567.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 57, H = 23, D = 69;
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground y (rounded).
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(x + "," + z, Math.round(gr));
}
const has = (x, z) => G.has(x + "," + z);
const minG = Math.min(...G.values());
const T = minG + 10;            // roof deck index: ~11 blocks above lowest ground

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which outward face each perimeter cell sits on.
const faceOf = new Map();
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  let f = null;
  if (!has(x, z + 1)) f = "S";
  else if (!has(x, z - 1)) f = "N";
  else if (!has(x + 1, z)) f = "E";
  else if (!has(x - 1, z)) f = "W";
  if (f) faceOf.set(k, f);
}

// Along-face coordinate t (x for N/S faces, z for E/W faces), normalised per face.
const tOf = (x, z, f) => (f === "N" || f === "S" ? x : z);
const faceMin = {};
for (const [k, f] of faceOf) {
  const [x, z] = k.split(",").map(Number);
  const t = tOf(x, z, f);
  faceMin[f] = Math.min(faceMin[f] ?? Infinity, t);
}

// Main entrance: on the south face if present, else north, east, west.
let doorFace = ["S", "N", "E", "W"].find(f => Object.values(Object.fromEntries(faceOf)).includes(f));
let doorKey = null;
if (doorFace) {
  const ts = [];
  for (const [k, f] of faceOf) if (f === doorFace) {
    const [x, z] = k.split(",").map(Number); ts.push(tOf(x, z, f));
  }
  ts.sort((a, b) => a - b);
  const mid = ts[Math.floor(ts.length / 2)];
  let best = Infinity;
  for (const [k, f] of faceOf) if (f === doorFace) {
    const [x, z] = k.split(",").map(Number);
    const d = Math.abs(tOf(x, z, f) - mid);
    if (d < best) { best = d; doorKey = k; }
  }
}

const FACING = { N: "north", S: "south", E: "east", W: "west" };
const INWARD = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

// Facade bands by height above the cell's ground (rel).
function edgeBlock(rel, f, tt, isDoor) {
  if (isDoor && rel === 0) return ["oak_door", { facing: FACING[f], half: "lower", hinge: "left", open: "false", powered: "false" }];
  if (isDoor && rel === 1) return ["oak_door", { facing: FACING[f], half: "upper", hinge: "left", open: "false", powered: "false" }];
  if (rel === 0) return ["stone_bricks"];                       // plinth
  if (rel === 1 || rel === 2) {                                 // shopfront
    if (tt % 4 === 0) return ["white_concrete"];
    return ["glass"];
  }
  if (rel === 3) return ["red_terracotta"];                     // sign band
  if (rel === 4) return ["white_concrete"];
  if (rel === 5) return ["smooth_stone"];                       // storey line
  if (rel === 6) return ["white_concrete"];                     // window head
  if (rel === 7 || rel === 8) {                                 // upper windows
    if (tt % 3 === 0) return ["white_concrete"];                // piers
    return ["glass_pane"];
  }
  if (rel === 9) return ["white_concrete"];                     // sill
  if (rel === 10) return ["light_gray_concrete"];               // cornice
  return null;
}

for (const [k, ground] of G) {
  const [x, z] = k.split(",").map(Number);
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const rT = Math.max(T, ground);
  const f = faceOf.get(k);

  if (!f) {
    // Interior: ground slab, storey floors, roof deck. Air between (behind the glass).
    put(x, ground, z, "smooth_stone");
    for (const r of [5, 10]) if (ground + r < rT) put(x, ground + r, z, "smooth_stone");
    put(x, rT, z, "light_gray_concrete");
    // Roof plant: small concrete boxes on a loose grid.
    if (x % 8 === 3 && z % 8 === 3) {
      put(x, rT + 1, z, "gray_concrete");
      put(x, rT + 2, z, "light_gray_concrete");
    }
  } else {
    const tt = tOf(x, z, f) - faceMin[f];
    const isDoor = k === doorKey;
    for (let rel = 0; rel <= rT - ground; rel++) {
      const b = edgeBlock(rel, f, tt, isDoor);
      if (!b) continue;
      put(x, ground + rel, z, b[0], b[1]);
    }
    // Parapet above the cornice on the facade.
    put(x, rT + 1, z, "white_concrete");

    // Warm light: glowstone just inside some upper windows.
    const h = (tt * 7 + x * 3 + z * 5) % 11;
    if (h === 0 && tt % 3 !== 0) {
      const [dx, dz] = INWARD[f];
      const ix = x + dx, iz = z + dz;
      const ik = ix + "," + iz;
      const gi = G.get(ik);
      const ly = ground + 7;
      if (gi !== undefined && !faceOf.has(ik) && ly > gi && ly !== gi + 5 && ly !== gi + 10 && ly < H) {
        put(ix, ly, iz, "glowstone");
      }
    }
  }
}

g.save(OUT);
