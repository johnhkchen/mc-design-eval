// Way 291058285, Auckland: a 1970s-80s concrete commercial block seen from Maungawhau. Basalt plinth and base course,
// white precast piers on a 3-cell bay, tinted glazing, a flat roof with a parapet. The lidar mass is three storeys
// (14 blocks); its tallest smoothed blob is a four-storey core (18). Built on the footprint cells only.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_291058285.cells.json`, "utf8"));
const W = 80, D = 68, SIZE = [W, 30, D];
const k = (x, z) => `${x},${z}`;
const SIDES = [
  { name: "north", dx: 0, dz: -1, along: "x" },
  { name: "south", dx: 0, dz: 1, along: "x" },
  { name: "west", dx: -1, dz: 0, along: "z" },
  { name: "east", dx: 1, dz: 0, along: "z" },
];

// Massing. The roof values of 16-17 are scattered lidar noise, so the core is the largest 4-connected blob of cells
// where at least 4 of the 9 cells around (and including) it read >= 16.
const fp = new Map(cells.map(([x, z, g, r]) => [k(x, z), { x, z, g, r }]));
const tall = (x, z) => (fp.get(k(x, z))?.r ?? 0) >= 16;
const dense = new Set();
for (const { x, z } of fp.values()) {
  let n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (tall(x + dx, z + dz)) n++;
  if (n >= 4) dense.add(k(x, z));
}
const seen = new Set(); let best = [];
for (const s of dense) {
  if (seen.has(s)) continue;
  const comp = [], stack = [s]; seen.add(s);
  while (stack.length) {
    const c = stack.pop(); comp.push(c);
    const [x, z] = c.split(",").map(Number);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = k(x + dx, z + dz);
      if (dense.has(n) && !seen.has(n)) { seen.add(n); stack.push(n); }
    }
  }
  if (comp.length > best.length) best = comp;
}
const core = new Set(best);

// Per cell: ground G (foundation below it), top T, and the roof deck R (T - R = 2 rows of parapet, or 1 + the cap).
const COL = new Map();
for (const [key, { g, r }] of fp) {
  const base = core.has(key) ? 18 : r < 8 ? 6 : 14;   // four-storey core, three-storey body, one-storey wings
  const T = Math.max(base, g + 6);
  const nS = Math.floor((T - g - 2) / 4);            // storeys of 4 rows; the roof deck sits on the last one
  COL.set(key, { G: g, T, R: g + 4 * nS });
}
const inV = (x, z, y) => { const c = COL.get(k(x, z)); return !!c && y >= c.G && y < c.T; };
const exposed = (x, z, y) => SIDES.filter((s) => !inV(x + s.dx, z + s.dz, y));

// Entrances: the middle of each run of 3+ cells on a street-side wall, a bay cell (not a pier) with one exposed side.
const doors = new Map();
for (const s of SIDES) {
  const A = s.along === "x" ? W : D, B = s.along === "x" ? D : W;
  const at = (a, b) => (s.along === "x" ? [a, b] : [b, a]);
  const alongOf = ([x, z]) => (s.along === "x" ? x : z);
  const bay = ([x, z]) => {
    const c = fp.get(k(x, z));
    return !!c && alongOf([x, z]) % 3 !== 0 && exposed(x, z, c.g + 1).length === 1 && exposed(x, z, c.g + 1)[0] === s;
  };
  for (let b = 0; b < B; b++) {
    let run = [];
    for (let a = 0; a <= A; a++) {
      const p = a < A ? at(a, b) : null;
      if (p && fp.has(k(...p)) && exposed(p[0], p[1], fp.get(k(...p)).g + 1).includes(s)) { run.push(p); continue; }
      if (run.length >= 3) {
        const pick = run.find((c, i) => i >= Math.floor(run.length / 2) && bay(c)) ?? run.find(bay);
        if (pick) doors.set(k(...pick), s.name);
      }
      run = [];
    }
  }
}
const doorNear = (x, z, side) => [-2, -1, 1, 2].some((d) => {
  const [nx, nz] = side.along === "x" ? [x + d, z] : [x, z + d];
  return doors.get(k(nx, nz)) === side.name;
});

// The block at one cell and height, or null for air.
function blockAt(x, z, y) {
  const c = COL.get(k(x, z));
  if (!c) return null;
  if (y < c.G) return ["stone_bricks"];                 // foundation to the ground under the cell
  if (y >= c.T) return null;
  const rel = y - c.G, top = y === c.T - 1, ex = exposed(x, z, y);
  if (ex.length) {                                      // the envelope
    if (top) return ["smooth_stone"];                   // coping
    if (y > c.R) return ["white_concrete"];             // parapet
    if (rel % 4 === 0) return rel === 0 ? ["stone_bricks"] : ["light_gray_concrete"];   // base course, storey lines
    const side = ex[0], along = side.along === "x" ? x : z;
    if (rel === 3 && doorNear(x, z, side)) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];   // canopy
    if (rel < 4 && doors.get(k(x, z)) === side.name) {  // the door, lower and upper half
      return ["iron_door", { facing: side.name, half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    }
    if (rel % 4 === 3) return ["white_concrete"];       // spandrel
    if (ex.length > 1 || along % 3 === 0) return ["white_concrete"];   // pier, corners too
    return rel < 4 ? ["light_blue_stained_glass"] : ["gray_stained_glass"];   // shopfront, then offices
  }
  if (y === c.R) return ["stone"];                      // roof membrane
  if (top) return y === c.R + 1 && x % 6 === 3 && z % 6 === 1 ? ["iron_block"] : null;   // roof plant
  if (rel % 4 === 0) return ["light_gray_concrete"];    // floor deck
  if (y < c.R && x % 4 === 0 && z % 4 === 0) return ["white_concrete"];   // column grid, under every deck
  return null;
}

const g = new Voxels(SIZE);
let blocks = 0;
for (const { x, z } of fp.values()) {
  for (let y = 0; y < SIZE[1]; y++) {
    const b = blockAt(x, z, y);
    if (b) { g.set(x, y, z, b[0], b[1]); blocks++; }
  }
}

// Warm light: one glazed cell in nine on each storey's first row, with a lantern standing on the floor just inside.
let lamps = 0;
for (const { x, z, g: gr } of fp.values()) {
  const ex = exposed(x, z, gr + 1);
  if (ex.length !== 1) continue;
  const side = ex[0];
  for (let y = gr + 1; y < COL.get(k(x, z)).T; y += 4) {
    const b = blockAt(x, z, y);
    if (!b || !b[0].includes("glass") || (x * 7 + z * 13 + y * 5) % 9 !== 0) continue;
    const ix = x - side.dx, iz = z - side.dz;
    if (!fp.has(k(ix, iz)) || blockAt(ix, iz, y)) continue;
    g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" }); lamps++;
  }
}

g.save(`${DIR}/way_291058285.nbt`);
console.log(JSON.stringify({ cells: fp.size, core: core.size, doors: doors.size, blocks, lamps }));
