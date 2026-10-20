// Pike First Ave: the eight plan.md VOCABULARY helpers in this file (plinth, doorPair, pilaster, stuccoBay,
// courtyardWall, bladeSign, waterTank, umbrella). Each takes its position as arguments (plot-local, as in plan.md)
// and writes only into air inside its own footprint, never ground under it. Each returns the cells it placed, [x, y, z].
// Inputs without ringOf/groundColumn (those live in vocab.mjs, which this file does not import):
//   plot  = { ring0: [[x, z, G], ...] }     ring-0 columns with their ground value G
//   tread = { cells: [[x, z], ...], face }  ring-1 wall cells in run order; face = outward (north|south|east|west)
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Step along a wall whose outward face is f: north and south walls run along x, east and west along z.
const ALONG = { north: [1, 0], south: [1, 0], east: [0, 1], west: [0, 1] };

// Place one block only into air inside the grid. spec is a block id or a [block, state, nbt] from B.*.
function put(g, out, x, y, z, spec) {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return;
  const [block, state, nbt] = Array.isArray(spec) ? spec : [spec];
  g.set(x, y, z, block, state, nbt);
  out.push([x, y, z]);
}

// Pane or bar states for cell i of a run of n: connected to its neighbours along the wall only.
function runState(face, i, n) {
  const [a, b] = ALONG[face][0] === 1 ? ["west", "east"] : ["north", "south"];
  return {
    north: "false", south: "false", east: "false", west: "false",
    [a]: i > 0 ? "true" : "false",
    [b]: i < n - 1 ? "true" : "false",
  };
}

// The spans of 2-wide windows on a run of n wall cells, per the rhythm rule (8: pier1 win2 pier2 win2 pier1;
// 6: pier2 win2 pier2; 10-14: 2-wide windows every 3, centred, piers at the ends; 4 or less: solid).
function windowSpans(n) {
  if (n === 8) return [[1, 2], [5, 6]];
  if (n === 6) return [[2, 3]];
  if (n <= 4) return [];
  const w = Math.floor((n - 1) / 3), start = Math.floor((n - (3 * w - 1)) / 2);
  return Array.from({ length: w }, (_, j) => [start + 3 * j, start + 3 * j + 1]);
}

/** plinth: ring-0 columns from G up to `top` in `block`, with an optional `cap` block at top + 1. Nothing below G. */
export function plinth(g, plot, { top, block = "smooth_stone", cap = null } = {}) {
  const out = [];
  for (const [x, z, G] of plot.ring0) {
    for (let y = G; y <= top; y++) put(g, out, x, y, z, block);
    if (cap) put(g, out, x, top + 1, z, cap);
  }
  return out;
}

/**
 * doorPair: a 2-wide, 2-high door in the wall plane. (x, z) is the first ring-1 cell of the opening; face is the
 * way the door faces (outward, the street side). Both columns get a lower and an upper half with the same facing
 * and hinge. ground = the walking level outside (the first air cell at ring 0). If it is 1 or 2 below the floor y,
 * three bottom slabs run out in front of each column (on smooth_stone where the ground is lower). Never stairs.
 */
export function doorPair(g, { x, z, y, face: f, doorBlock = "dark_oak_door", ground = y } = {}) {
  const out = [];
  const [ax, az] = ALONG[f], [ox, , oz] = DIRS[f];
  const rise = y - ground;
  if (rise > 2) throw new RangeError(`doorPair: ground ${ground} is ${rise} below floor ${y}; the slab approach takes 1 or 2`);
  const mat = doorBlock.replace(/_door$/, "");
  for (let k = 0; k < 2; k++) {
    for (const [dy, half] of [[0, "lower"], [1, "upper"]]) put(g, out, x + k * ax, y + dy, z + k * az, B.door(mat, f, half, "left"));
  }
  for (let d = 1; d <= 3 && rise > 0; d++) {
    for (let k = 0; k < 2; k++) {
      const rx = x + k * ax + d * ox, rz = z + k * az + d * oz;
      for (let fy = ground; fy <= y - 2; fy++) put(g, out, rx, fy, rz, "smooth_stone");
      put(g, out, rx, y - 1, rz, B.slab("smooth_stone", "bottom"));
    }
  }
  return out;
}

/** pilaster: a 1-wide column of `block` on each ring-0 cell of a riser (riser = [[x, z], ...]), from y0 to y1. */
export function pilaster(g, riser, { y0, y1, block = "bricks" } = {}) {
  const out = [];
  for (const [x, z] of riser) for (let y = y0; y <= y1; y++) put(g, out, x, y, z, block);
  return out;
}

/**
 * stuccoBay: the middle 4 cells of an 8-long tread, projected at ring 0 from y15 to y27. Glass in front, smooth_sandstone
 * panels at y19 and y24, an upside-down stair corbel at y14 (lip out), a slab roof at y28.
 */
export function stuccoBay(g, tread) {
  const out = [];
  const [ox, , oz] = DIRS[tread.face], inward = OPPOSITE[tread.face];
  tread.cells.slice(2, 6).forEach(([x, z], i) => {
    const px = x + ox, pz = z + oz;
    for (let y = 15; y <= 27; y++) {
      if (y === 19 || y === 24) put(g, out, px, y, pz, "smooth_sandstone");
      else put(g, out, px, y, pz, ["glass_pane", runState(tread.face, i, 4)]);
    }
    put(g, out, px, 14, pz, B.stairs("smooth_sandstone", inward, "top"));
    put(g, out, px, 28, pz, B.slab("smooth_sandstone", "bottom"));
  });
  return out;
}

/**
 * courtyardWall: the street bay rhythm on a courtyard face. faceCells = { cells, face } with face pointing into the void.
 * Each window is glass_pane on ring 1 from floor+1 to floor+3, with iron_bars balconies at ring 0 on floor+1. When lit,
 * a warm light (ochre_froglight, every 5th shroomlight) sits behind it on floor+2, and 2 of every 3 windows are lit,
 * staggered by storey.
 */
export function courtyardWall(g, faceCells, { floors = [14, 19, 24], lit = true } = {}) {
  const out = [];
  const { cells, face: f } = faceCells;
  const [ox, , oz] = DIRS[f], [ix, , iz] = [-ox, 0, -oz];
  let n = 0;
  floors.forEach((fl, s) => {
    windowSpans(cells.length).forEach(([a, b]) => {
      const span = b - a + 1;
      for (let i = a; i <= b; i++) {
        const [x, z] = cells[i];
        for (let y = fl + 1; y <= fl + 3; y++) put(g, out, x, y, z, ["glass_pane", runState(f, i - a, span)]);
        put(g, out, x + ox, fl + 1, z + oz, ["iron_bars", runState(f, i - a, span)]);
      }
      if (lit && (n + s) % 3 !== 0) {
        const [x, z] = cells[a];
        put(g, out, x + ix, fl + 2, z + iz, n % 5 === 4 ? "shroomlight" : "ochre_froglight");
      }
      n++;
    });
  });
  return out;
}

/**
 * bladeSign: a 3-wide blade at ring 0 in the plane z, from y0 to y1 (x0 is the left edge when facing `face`).
 * Board in `board`, glowstone in the outer columns every 2 rows, and one white banner per 2-row slot in the middle
 * column, reading down from the top (word[0] at y1-2). Air only.
 */
export function bladeSign(g, { x0, z, y0, y1, face: f = "north", board = "red_concrete", lamp = "glowstone", word = "" } = {}) {
  const out = [];
  const letterRows = [...word.replace(/\s/g, "")].map((_, i) => y1 - 2 - 2 * i).filter((y) => y >= y0);
  letterRows.forEach((y) => put(g, out, x0 + 1, y, z, B.banner("white", [], { wall: true, facing: f })));
  for (let y = y0; y <= y1; y++) {
    const edge = (y - y0) % 2 === 0 ? lamp : board;
    put(g, out, x0, y, z, edge);
    put(g, out, x0 + 2, y, z, edge);
    if (!letterRows.includes(y)) put(g, out, x0 + 1, y, z, board);
  }
  return out;
}

/**
 * waterTank: a spruce_planks tank on a disc of radius r around (cx, cz), standing on dark_oak_fence legs at the four
 * diagonal cells at y0 (under the floor). Floor at y0+1, rim walls to y0+5 with iron_bars hoops at y0+2 and y0+4,
 * spruce_slab cap at y0+6. The legs sit on the disc's diagonals, not at the box corners, which lie outside the disc.
 */
export function waterTank(g, { cx, cz, r = 2, y0 = 37 } = {}) {
  const out = [];
  const inDisc = (x, z) => (x - cx) ** 2 + (z - cz) ** 2 <= r * r;
  const cells = [];
  for (let x = cx - r; x <= cx + r; x++) for (let z = cz - r; z <= cz + r; z++) if (inDisc(x, z)) cells.push([x, z]);
  const rim = new Set(cells.filter(([x, z]) => !inDisc(x - 1, z) || !inDisc(x + 1, z) || !inDisc(x, z - 1) || !inDisc(x, z + 1)).map(String));
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put(g, out, cx + dx, y0, cz + dz, B.fence("dark_oak"));
  for (const [x, z] of cells) {
    put(g, out, x, y0 + 1, z, "spruce_planks");
    put(g, out, x, y0 + 6, z, B.slab("spruce", "bottom"));
    if (!rim.has(String([x, z]))) continue;
    const bars = { north: rim.has(String([x, z - 1])), south: rim.has(String([x, z + 1])), east: rim.has(String([x + 1, z])), west: rim.has(String([x - 1, z])) };
    const state = Object.fromEntries(Object.entries(bars).map(([k, v]) => [k, String(v)]));
    for (let y = y0 + 2; y <= y0 + 5; y++) {
      if (y === y0 + 2 || y === y0 + 4) put(g, out, x, y, z, ["iron_bars", state]);
      else put(g, out, x, y, z, "spruce_planks");
    }
  }
  return out;
}

/** umbrella: a dark_oak_fence pole on y and y+1, a 3x3 white_wool canopy on y+2 (plan.md ROOFS). Carpets on the corners
 *  floated: a carpet needs a block under it, and the pole holds only the centre. */
export function umbrella(g, [x, y, z]) {
  const out = [];
  put(g, out, x, y, z, B.fence("dark_oak"));
  put(g, out, x, y + 1, z, B.fence("dark_oak"));
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) put(g, out, x + dx, y + 2, z + dz, "white_wool");
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) put(g, out, x + dx, y + 2, z + dz, "white_wool");
  return out;
}
