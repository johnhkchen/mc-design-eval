import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw587177077";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 7 x 13 footprint, 33 high. Reads as a 4-storey 1970s-80s Taipei concrete
// commercial block: white concrete frame, gray spandrel bands, glass shopfront
// with a red sign band and a door, and a rooftop water tank on a parapet.
const W = 7, H = 33, D = 13;
const g = new Voxels([W, H, D]);

const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
if (!Number.isFinite(minG)) minG = 0;

const has = (x, z) => ground.has(`${x},${z}`);
// Roof surface sits 21 blocks above the lowest ground; cap to keep rooftop kit in the volume.
const lim = Math.min(minG + 21, 30);

const GLASS_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Lit windows: [x,z] of perimeter window cells that get a glowstone just inside.
const litCells = [];

for (const [x, z, gr] of cells) {
  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const mN = !has(x, z - 1);
  const mS = !has(x, z + 1);
  const mW = !has(x - 1, z);
  const mE = !has(x + 1, z);
  const perimeter = mN || mS || mW || mE;
  const zFace = mN || mS;
  const xFace = mW || mE;
  const front = mN; // street-side short face at z = 0

  const zWindow = zFace && !xFace && x % 2 === 1 && x >= 1 && x <= 5;
  const xWindow = xFace && !zFace && z % 2 === 1 && z >= 1 && z <= 11;
  const windowCell = zWindow || xWindow;

  for (let y = gr; y < lim; y++) {
    const rel = y - minG;
    const k = Math.floor(rel / 5);
    const r = rel % 5;

    if (rel >= 20) {
      // Top course: parapet on the perimeter, roof deck inside.
      g.set(x, y, z, perimeter ? "gray_concrete" : "smooth_stone");
      continue;
    }

    if (!perimeter) {
      // Interior: only the floor slab per storey; the rest is air behind the glass.
      if (r === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (r === 0) {
      // Base course on ground floor, storey line above.
      g.set(x, y, z, k === 0 ? "stone_bricks" : "light_gray_concrete");
      continue;
    }

    if (r === 4) {
      // Spandrel / belt course; ground floor front carries a red sign band.
      if (k === 0 && front && x >= 1 && x <= 5) g.set(x, y, z, "red_concrete");
      else g.set(x, y, z, "gray_concrete");
      continue;
    }

    // r = 1..3 : window / shopfront zone
    if (k === 0 && front) {
      if (x === 0 || x === 6) {
        g.set(x, y, z, "white_concrete");
      } else if (x === 3) {
        if (r === 1) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else if (r === 2) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
          });
        } else {
          g.set(x, y, z, "white_concrete");
        }
      } else {
        g.set(x, y, z, "glass_pane", GLASS_Z);
      }
      continue;
    }

    if (windowCell) {
      g.set(x, y, z, "glass_pane", zWindow ? GLASS_Z : GLASS_X);
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // Record warm-lit window cells on storeys 2 and 4 (centre window per face, plus every 4th on long faces).
  if (perimeter) {
    if (zWindow && x === 3) litCells.push({ x, z, inZ: mN ? 1 : z - 1, dz: mN ? 1 : -1, kind: "z" });
    if (xWindow && z % 4 === 3) litCells.push({ x, z, inX: mW ? 1 : -1, kind: "x" });
  }
}

// Warm glowstone just inside lit windows on storeys 2 and 4 (rel 2 = 1 above floor).
for (const L of litCells) {
  for (const k of [1, 3]) {
    const y = minG + 5 * k + 2;
    if (y >= lim) continue;
    let ix = L.x, iz = L.z;
    if (L.kind === "z") iz = L.z === 0 ? 1 : L.z - 1;
    else ix = L.x === 0 ? 1 : L.x - 1;
    if (!has(ix, iz)) continue;
    const gr = ground.get(`${ix},${iz}`);
    if (y < gr) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Rooftop water tank on a 2x2 pad of interior roof cells.
for (const [tx, tz] of [[2, 4], [3, 4], [2, 5], [3, 5]]) {
  if (!has(tx, tz)) continue;
  for (let y = lim; y <= lim + 2 && y < H; y++) {
    g.set(tx, y, tz, "iron_block");
  }
}

g.save(`${dir}/${id}.nbt`);
