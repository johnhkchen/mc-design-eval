import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Single-storey commercial block: solid quartz walls with a sill band, darker
// glazed bays between pilasters, a shopfront with entrance on the west (street)
// face, a stone cornice and parapet, and warm light behind some glazing.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw372954656.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw372954656.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 8, H = 19, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const G = new Map();
let g0 = Infinity;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(key(x, z), Math.max(0, Math.min(H - 1, Math.round(gr))));
  g0 = Math.min(g0, gr);
}
if (!G.size) throw new Error("no footprint cells");
g0 = Math.max(0, Math.min(H - 1, Math.round(g0)));

const top = Math.min(H - 1, g0 + 7);
const inFp = (x, z) => G.has(key(x, z));
const DIRS = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
const outFaces = (x, z) => Object.keys(DIRS).filter(f => !inFp(x + DIRS[f][0], z + DIRS[f][1]));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// entrance: west-face cell nearest the middle of the street frontage
let doorZ = null;
{
  const midZ = (minZ + maxZ) / 2;
  let best = Infinity;
  for (const k of G.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!inFp(x - 1, z) && Math.abs(z - midZ) < best) { best = Math.abs(z - midZ); doorZ = z; }
  }
}

const DOOR = "dark_oak_door";
const SHOP_GLASS = "light_blue_stained_glass_pane";
const BAY_GLASS = "gray_stained_glass_pane";
const TRIM = "smooth_quartz";
const SILL = "polished_andesite";

for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gc = G.get(k);

  // foundation
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");
  if (gc >= top) continue;

  const faces = outFaces(x, z);
  const boundary = faces.length > 0;

  // roof deck / parapet on top of the walls
  g.set(x, top, z, boundary ? "stone_brick_wall" : "smooth_stone");
  if (!boundary) continue;

  const face = faces.includes("west") ? "west" : faces[0];
  const alongZ = face === "west" || face === "east";
  const a = alongZ ? z : x;
  const minA = alongZ ? minZ : minX;
  const maxA = alongZ ? maxZ : maxX;
  const corner = a === minA || a === maxA;
  const shop = face === "west";

  for (let y = gc; y < top; y++) {
    const r = y - g0;
    if (y === gc) { g.set(x, y, z, SILL); continue; }             // base course
    if (r === 5) { g.set(x, y, z, "stone_bricks"); continue; }     // cornice band
    if (r === 6) {                                                 // clerestory: solid frieze with glazed slots
      g.set(x, y, z, corner || a % 3 === 0 ? TRIM : BAY_GLASS);
      continue;
    }
    if (shop) {
      if (a === doorZ && (r === 1 || r === 2)) {
        const props = { facing: "west", hinge: "left", open: "false", powered: "false" };
        g.set(x, y, z, DOOR, { ...props, half: r === 1 ? "lower" : "upper" });
        continue;
      }
      if (r === 1) { g.set(x, y, z, corner || a % 4 === 0 ? TRIM : SHOP_GLASS); continue; }
      g.set(x, y, z, corner || a % 4 === 0 ? TRIM : SHOP_GLASS);
      continue;
    }
    // other faces: solid sill at rel 1, glazed bays at rel 2..4, pilasters between
    if (r === 1) { g.set(x, y, z, SILL); continue; }
    if (r >= 2 && r <= 4) {
      g.set(x, y, z, corner || a % 3 === 0 ? TRIM : BAY_GLASS);
      continue;
    }
    g.set(x, y, z, TRIM);
  }

  // warm light one cell inside, behind some glazing (air gap kept)
  const outward = DIRS[face];
  const inner = [x - outward[0], z - outward[1]];
  if (inFp(inner[0], inner[1]) && !corner) {
    const gi = G.get(key(inner[0], inner[1]));
    const rShop = g0 + 2, rBay = g0 + 3;
    if (shop && rShop >= gi && rShop < top && a % 4 === 1) {
      g.set(inner[0], rShop, inner[1], "glowstone");
    }
    if (!shop && rBay >= gi && rBay < top && a % 6 === 4) {
      g.set(inner[0], rBay, inner[1], "glowstone");
    }
  }
}

// rooftop plant: a few small units if there is headroom
if (top + 1 <= H - 1) {
  for (const k of G.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (outFaces(x, z).length === 0 && x % 4 === 1 && z % 6 === 2 && G.get(k) < top) {
      g.set(x, top + 1, z, "light_gray_concrete");
    }
  }
}

g.save(OUT);
