// 1251 Avenue of the Americas, the Exxon Building (1966-1971, Harrison & Abramovitz): a 1970s International-style office
// tower, a single slab of bronze-tinted glass in a fine metal grid, on a stepped podium. The lidar gives a 202-block slab
// (about 225 m), a 207-block crown box setback in from its north-east part, and three lower tiers on the west and south
// (28, 34, 39) with a plaza-level strip (roof under 10) along the south. Each cell is a solid column from its ground up
// to its tier roof: the outer ring is the envelope (granite base to y 3, a curtain wall of glass panes between grey
// spandrels and light mullions every third block, a parapet on top) and the inside is air with a solid floor slab at
// every storey line (y divisible by 3), so each tier stands on the one below. A few panes have a glowstone lamp standing
// on the floor just inside them. The entrance is a glass lobby in the north face at x 60..72 with a door at x 64 and a
// lintel course above it. Roof plant: two boxes on the slab and one on the crown.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1022706.cells.json", "utf8"));

// Roof per cell: the lidar noise smoothed into clean tiers. Under 10: open plaza, no body. 14..30: the podium (28).
// 31..37: a middle tier (34). 38..45: the lowest tier (39). 150 and up: the slab (202), and inside x 45..87, z 20..33
// the crown box (207).
const roofFor = (x, z, r, g) => {
  if (r <= 10) return g;
  if (r <= 30) return 28;
  if (r <= 37) return 34;
  if (r <= 45) return 39;
  if (x >= 45 && x <= 87 && z >= 20 && z <= 33) return 207;
  return 202;
};
const key = (x, z) => `${x},${z}`;
const FOOT = new Map();
for (const [x, z, g, r] of cells) FOOT.set(key(x, z), { g, R: roofFor(x, z, r, g) });

const W = 108, H = 219, D = 52;
const v = new Voxels([W, H, D]);

// The four faces of a cell that border air (outside the footprint, or a neighbour whose roof is below this height).
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, y, z) => {
  const out = {};
  for (const [f, [dx, dz]] of Object.entries(DIRS)) {
    const n = FOOT.get(key(x + dx, z + dz));
    out[f] = !n || y >= n.R;
  }
  return out;
};
const isShell = (x, y, z) => { const e = exposed(x, y, z); return e.N || e.S || e.E || e.W; };
const isBody = (x, y, z) => { const c = FOOT.get(key(x, z)); return !!c && y >= c.g && y < c.R; };

// Glass lobby: the north face of the slab at x 60..72, door at x 64.
const LOBBY = (x, z, e) => e.N && z === 10 && x >= 60 && x <= 72;
const DOOR_X = 64;

// Panes with a warm lamp just inside them, on the floor (a lamp at y = storey line + 1 stands on the slab below).
const hash = (x, y, z) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2246822519);
  h ^= h >>> 13; h = Math.imul(h, 1274126177); h ^= h >>> 16;
  return h >>> 0;
};
const LIT = new Set();
for (const [k, c] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.g; y < c.R; y++) {
    if (y % 3 !== 1 || !isBody(x, y, z) || !isShell(x, y, z)) continue;
    const e = exposed(x, y, z);
    if (e.N && e.S || e.E && e.W) continue;
    if (hash(x, y, z) % 13 !== 0) continue;
    const inward = e.N ? [x, z + 1] : e.S ? [x, z - 1] : e.W ? [x + 1, z] : [x - 1, z];
    if (FOOT.has(key(...inward)) && !isShell(inward[0], y, inward[1])) LIT.add(`${inward[0]},${y},${inward[1]}`);
  }
}

// Panes connect across the face they sit in (E-W on a north or south face, N-S on an east or west face).
const pane = (alongX) => ["gray_stained_glass_pane", alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];

for (const [k, c] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  // Foundation under the cell, to its ground: stone under the building, a paved top on the open plaza.
  const open = c.R === c.g;
  for (let y = 0; y < c.g; y++) {
    v.set(x, y, z, open ? (y === c.g - 1 ? "smooth_stone" : "stone") : "stone_bricks");
  }
  for (let y = c.g; y < c.R; y++) {
    if (!isShell(x, y, z)) {
      if (y === c.R - 1) v.set(x, y, z, "gray_concrete");                       // roof surface, tar
      else if (y % 3 === 0) v.set(x, y, z, "smooth_stone");                     // floor slab at each storey line
      else if (LIT.has(`${x},${y},${z}`)) v.set(x, y, z, "glowstone");          // lamp just behind a pane
      continue;
    }
    const e = exposed(x, y, z);
    const alongX = (e.N || e.S) && !(e.E || e.W);      // on a north or south face, the grid runs by x
    const corner = (e.N || e.S) && (e.E || e.W);
    const lobby = LOBBY(x, z, e);
    const c3 = alongX ? x : z;
    if (lobby && x === DOOR_X && y < 3 && y <= c.g + 1) {                        // entrance door, two high
      v.set(x, y, z, "iron_door", { facing: "north", half: y === c.g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    } else if (y === c.R - 1) {                                                   // parapet
      v.set(x, y, z, "light_gray_concrete");
    } else if (lobby && y === 3) {                                               // lintel over the lobby
      v.set(x, y, z, "polished_granite");
    } else if (y < 3 && !lobby) {                                                // granite base course
      v.set(x, y, z, "polished_granite");
    } else if (corner || c3 % 3 === 0) {                                         // mullion
      v.set(x, y, z, "light_gray_concrete");
    } else if (y % 3 === 0) {                                                    // grey spandrel at each storey line
      v.set(x, y, z, "gray_concrete");
    } else {                                                                     // vision glass
      v.set(x, y, z, ...pane(alongX));
    }
  }
}

// Roof plant: two boxes on the slab, one on the crown.
const box = (x0, x1, z0, z1, y0, y1) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
    if (FOOT.has(key(x, z))) v.set(x, y, z, "light_gray_concrete");
  }
};
box(36, 39, 16, 18, 202, 204);
box(92, 95, 26, 28, 202, 204);
box(60, 64, 24, 26, 207, 209);

const stats = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1022706.nbt");
console.log(stats);
