import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499688.cells.json`, "utf8"));

const W = 14, H = 28, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, gr, r] of cells) info.set(key(x, z), { g: gr, r });
const has = (x, z) => info.has(key(x, z));

// Global levels: one base line for storeys, one ridge for the whole gable.
const grounds = cells.map((c) => c[2]);
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const B = Math.min(...grounds);            // base line for storey rows
const maxG = Math.max(...grounds);
const medR = roofs[Math.floor(roofs.length / 2)];
const RIDGE = Math.min(H - 1, Math.max(Math.round(medR), maxG + 12, B + 14));

// Pitch: ridge runs north-south along the long axis (x centred at 6/7).
const kOf = (x) => (x <= 6 ? 6 - x : x - 7);
const wallTopOf = (x) => RIDGE - kOf(x) - 1;

// Pass 1: foundation, solid walls, and stepped slate roof.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "granite");
  for (let y = gr; y <= wallTopOf(x); y++) g.set(x, y, z, "stone_bricks");
  g.set(x, RIDGE - kOf(x), z, "deepslate_tile_stairs", {
    facing: x <= 6 ? "west" : "east",
    half: "bottom",
    shape: "straight",
    waterlogged: "false",
  });
}

// Facade helpers.
const facadeFaces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
// Window rows relative to base line B: storey 1 rows 1-3 (fascia 4), storey 2 rows 6-8.
const winRow = (rel) => (rel >= 1 && rel <= 3) || (rel >= 6 && rel <= 8);
const isWin = (u, rel) => winRow(rel) && u % 3 !== 0;

// Pass 2: facade articulation on a common grid.
for (const [x, z, gr] of cells) {
  const wallTop = wallTopOf(x);
  for (const face of facadeFaces(x, z)) {
    const isZFace = face === "N" || face === "S";
    const u = isZFace ? x : z;
    let inDx = 0, inDz = 0;
    if (face === "N") inDz = 1;
    if (face === "S") inDz = -1;
    if (face === "W") inDx = 1;
    if (face === "E") inDx = -1;
    const ix = x + inDx, iz = z + inDz;

    for (let y = gr; y <= wallTop; y++) {
      const rel = y - B;
      if (y === gr || rel === 0) {
        g.set(x, y, z, "polished_granite");           // base course
      } else if (rel === 5 || rel === 10) {
        g.set(x, y, z, "smooth_stone");               // storey lines
      } else if (rel === 4) {
        g.set(x, y, z, "dark_oak_planks");            // shop fascia band
      } else if (winRow(rel) && isWin(u, rel)) {
        const left = isWin(u - 1, rel), right = isWin(u + 1, rel);
        const props = isZFace
          ? { north: "false", south: "false", east: right ? "true" : "false", west: left ? "true" : "false", waterlogged: "false" }
          : { north: right ? "true" : "false", south: left ? "true" : "false", east: "false", west: "false", waterlogged: "false" };
        g.set(x, y, z, "glass_pane", props);
        if (has(ix, iz)) {
          const lit = (u + rel) % 4 === 0 && (rel === 2 || rel === 7);
          g.set(ix, y, iz, lit ? "glowstone" : "air");   // air gap behind glass
        }
      } else {
        g.set(x, y, z, "stone_bricks");               // piers and spandrels
      }
    }
  }
}

// Pass 3: entrance on the south (street-side) face near the centre.
let doorCell = null;
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (has(x, z) && !has(x, z + 1)) {
    if (!doorCell || Math.abs(x - 6.5) < Math.abs(doorCell[0] - 6.5)) doorCell = [x, z];
  }
}
if (doorCell) {
  const [dx, dz] = doorCell;
  const gr = info.get(key(dx, dz)).g;
  g.set(dx, gr, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, gr + 1, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(dx, gr + 2, dz, "dark_oak_planks");           // lintel band over door
  if (has(dx, dz - 1)) {
    g.set(dx, gr, dz - 1, "air");
    g.set(dx, gr + 1, dz - 1, "air");
  }
}

g.save(`${DIR}/FR301499688.nbt`);
