// NYC1034256: 16 West 46th Street, 1913 midtown commercial office block, fourteen storeys over a granite plinth on a
// 12 x 25 lot. The street (north) face is pale-buff-trimmed red brick: white terracotta belts at each storey line, piers
// and a cornice, a two-block attic of brick over the 42-block body along the street, and a shopfront with a double iron
// door and hanging lanterns. Elsewhere the lidar roof steps to 39 and 42 blocks, the stepped faces are plain brick party
// walls, and the flat tar roof carries one mechanical bulkhead. Warm lights sit behind some windows on the street face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 12, D = 25, YS = 48;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034256.cells.json`, "utf8"));

// Lidar roof per footprint cell; null outside the lot.
const raw = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, , r] of cells) raw[z][x] = r;
const at = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : raw[z][x]);
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const TIERS = [39, 42, 44];   // thirteen storeys, fourteen storeys, fourteen storeys with a two-block attic
const tier = (h) => TIERS.reduce((best, t) => (Math.abs(t - h) < Math.abs(best - h) ? t : best));

// 1. A lidar zero with four or more tall neighbours is a drop-out inside the mass: take the neighbours' median.
const filled = raw.map((row, z) => row.map((r, x) => {
  if (r !== 0) return r;
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const v = at(x + dx, z + dz); if (v >= 40) nb.push(v); }
  return nb.length >= 4 ? median(nb) : 0;
}));

// 2. Smooth each roof over its 3 x 3 neighbourhood and snap it to a tier. A zero stays a yard (paving, no building).
const fv = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : filled[z][x]);
const H = Array.from({ length: D }, () => Array(W).fill(null));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const f = filled[z][x];
  if (f === null) continue;
  if (!f) { H[z][x] = 0; continue; }
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const v = fv(x + dx, z + dz); if (v > 0) nb.push(v); }
  H[z][x] = tier(median(nb));
}

// Height of the massing at (x, z): 0 outside the lot and in the yard.
const hgt = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : H[z][x] ?? 0);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ORDER = ["N", "S", "W", "E"];
// Sides of cell (x, z) that show a wall at height y: "out" faces open air (or the sky above a lower neighbour),
// "party" faces a neighbour that is taller here, so the step is a wall from the storey under the neighbour's roof.
function sides(x, z, y, h) {
  const out = [], party = [];
  for (const d of ORDER) {
    const nh = hgt(x + DIRS[d][0], z + DIRS[d][1]);
    if (nh <= y) out.push(d);
    else if (nh < h && y >= nh - 3) party.push(d);
  }
  return { out, party };
}

// Street (north) face: piers at x 0, 2, 5, 6, 9, 11 frame window bays 1, 3, 4, 7, 8, 10; the shopfront has piers
// at 0, 2, 9, 11, a double door at 5 and 6, and hanging lanterns at 4 and 7.
const NS_PIERS = new Set([0, 2, 5, 6, 9, 11]);
const SHOP_PIERS = new Set([0, 2, 9, 11]);
const LANTERNS = new Set([4, 7]);
const LAMP_COLS = new Set([1, 4, 7, 10]);
const LAMP_STOREYS = new Set([2, 6, 10]);

const pane = (face) => (face === "N" || face === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const g = new Voxels([W, YS, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const h = H[z][x];
  if (h === null) continue;
  if (h === 0) { g.set(x, 0, z, "stone_bricks"); continue; }   // yard paving, no building
  const base = 3 * Math.floor(h / 3);   // the storeys; anything above is the attic
  for (let y = 0; y < h; y++) {
    const s = sides(x, z, y, h);
    if (!s.out.length && !s.party.length) {   // interior: floor slab per storey, tar roof on top, air between
      if (y === h - 1) g.set(x, y, z, "gray_concrete");
      else if (y % 3 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === h - 1) { g.set(x, y, z, "white_terracotta"); continue; }   // cornice cap
    if (y >= base) { g.set(x, y, z, y === base ? "white_terracotta" : "bricks"); continue; }   // attic
    if (!s.out.length) { g.set(x, y, z, y % 3 === 0 ? "white_terracotta" : "bricks"); continue; }   // party wall
    const face = s.out[0];
    const k = Math.floor(y / 3), r = y % 3;
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }   // plinth
    if (r === 0) { g.set(x, y, z, "white_terracotta"); continue; }   // storey line
    if (k === 0 && face === "N") {   // shopfront and entrance
      if (x === 5 || x === 6) {
        g.set(x, y, z, "iron_door", { facing: "north", half: r === 1 ? "lower" : "upper", hinge: x === 5 ? "left" : "right", open: "false", powered: "false" });
        continue;
      }
      if (r === 2 && LANTERNS.has(x)) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      g.set(x, y, z, SHOP_PIERS.has(x) ? "polished_granite" : "glass");
      continue;
    }
    const pier = face === "N" || face === "S" ? NS_PIERS.has(x) : z % 3 === 0;
    if (pier) { g.set(x, y, z, "white_terracotta"); continue; }
    if (r === 1) {
      g.set(x, y, z, "glass_pane", pane(face));
      if (face === "N" && LAMP_STOREYS.has(k) && LAMP_COLS.has(x)) g.set(x, y, z + 1, "glowstone");   // warm lamp behind the glass
      continue;
    }
    g.set(x, y, z, "bricks");   // lintel and spandrel
  }
}

// Shopfront lamps behind the glass, and the mechanical bulkhead on the 44-block roof.
g.set(3, 1, 1, "glowstone");
g.set(8, 1, 1, "glowstone");
for (const x of [8, 9]) for (const z of [6, 7]) {
  g.set(x, 44, z, "stone_bricks");
  g.set(x, 45, z, "white_terracotta");
}

const res = g.save(`${DIR}/NYC1034256.nbt`);
console.log(`NYC1034256.nbt: ${res.blocks} blocks, ${res.palette} palette entries`);
