import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738202";
const W = 18, H = 33, D = 24;
const STOREY = 5;
const STOREYS = 4;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.round(gy));
const has = (x, z) => ground.has(`${x},${z}`);
const gyOf = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Facade faces per footprint cell
function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ dir: "north", u: x });
  if (!has(x, z + 1)) f.push({ dir: "south", u: x });
  if (!has(x - 1, z)) f.push({ dir: "west", u: z });
  if (!has(x + 1, z)) f.push({ dir: "east", u: z });
  return f;
}

// Main entrance on the south face, centred on that face's span
let southMin = Infinity, southMax = -Infinity;
for (const [x, z] of cells) {
  if (!has(x, z + 1)) { southMin = Math.min(southMin, x); southMax = Math.max(southMax, x); }
}
const doorU = Number.isFinite(southMin) ? Math.round((southMin + southMax) / 2) : -1;

const isLit = (u, k, gy) => ((u * 5 + k * 3 + gy) % 7) === 2;

for (const [x, z, rawGy] of cells) {
  const gy = Math.round(rawGy);
  const perimeter = facesOf(x, z).length > 0;
  const faces = facesOf(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Floor slabs / storey lines, k = 0..4 (roof deck at gy + 20)
  for (let k = 0; k <= STOREYS; k++) {
    const base = gy + k * STOREY;
    let block = "white_concrete";
    if (k === 0) block = perimeter ? "polished_granite" : "smooth_stone";
    put(x, base, z, block);
  }

  // Storeys: window grids, spandrels, shopfronts, entrance
  for (let k = 0; k < STOREYS; k++) {
    const base = gy + k * STOREY;

    // Spandrel / transom band at offset 4
    if (perimeter) {
      put(x, base + 4, z, k === 0 ? "black_concrete" : "white_concrete");
    }

    if (!perimeter) continue;

    for (const face of faces) {
      for (let off = 1; off <= 3; off++) {
        const y = base + off;
        const isDoor = k === 0 && face.dir === "south" && face.u === doorU;
        if (isDoor) {
          if (off === 1) { put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
          if (off === 2) { put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
          put(x, y, z, "lantern", { hanging: "true" });
          continue;
        }
        if (face.u % 3 === 0) {
          put(x, y, z, "white_concrete");
        } else if (off === 2 && isLit(face.u, k, gy)) {
          put(x, y, z, "glowstone");
        } else {
          put(x, y, z, "light_blue_stained_glass");
        }
      }
    }
  }

  // Parapet and cornice on the perimeter
  if (perimeter) {
    put(x, gy + STOREYS * STOREY + 1, z, "white_concrete");
  }
}

// Roof plant: a central core, a mast and a tip
for (let x = 5; x <= 12; x++) {
  for (let z = 7; z <= 16; z++) {
    if (!has(x, z)) continue;
    if (facesOf(x, z).length > 0) continue;
    const gy = gyOf(x, z);
    const top = gy + STOREYS * STOREY;
    for (let y = top + 1; y <= top + 3; y++) put(x, y, z, "light_gray_concrete");
  }
}

if (has(9, 12)) {
  const gy = gyOf(9, 12);
  const top = gy + STOREYS * STOREY;
  for (let y = top + 4; y <= top + 7; y++) put(9, y, 12, "iron_bars");
  put(9, top + 8, 12, "lightning_rod", { facing: "up" });
}

g.save(`${DIR}/${ID}.nbt`);
