// h2 vocabulary (plan.md VOCABULARY): awning, produce_row, window_bay, string_course, du_course, ramp, parapet, producer_board.
// Every helper takes the grid first and its position as arguments. It writes only inside the footprint it returns, only
// into air (replace: true overwrites), and never below its footprint: the ground and floors belong to earlier parts.
// Blocks are [id, state] pairs from the build library's B helpers (1.21.1 states).
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// plan.md ROOMS, the rooms the furniture helpers may fit in. lane = the walked aisle, which furniture never enters.
const ROOMS = [
  { name: "Street stall arcade, north", box: [[34, 21, 161], [39, 24, 188]], lane: [34, 36] },
  { name: "Street stall arcade, main", box: [[34, 23, 189], [39, 26, 279]], lane: [34, 36] },
  { name: "North Arcade hall (B1)", box: [[30, 21, 133], [39, 26, 160]], lane: null },
];

const inside = ([[x0, y0, z0], [x1, y1, z1]], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const contains = (outer, inner) => inside(outer, inner[0]) && inside(outer, inner[1]);
const volume = ([[x0, y0, z0], [x1, y1, z1]]) => (x1 - x0 + 1) * (y1 - y0 + 1) * (z1 - z0 + 1);
const bounds = (cells) => {
  const at = (i) => cells.map(([p]) => p[i]);
  return [[Math.min(...at(0)), Math.min(...at(1)), Math.min(...at(2))], [Math.max(...at(0)), Math.max(...at(1)), Math.max(...at(2))]];
};

// One write: refused outside the footprint, refused over a non-air block unless replace is set. Returns true when placed.
function put(g, box, [x, y, z], [block, state = {}], replace, skipped) {
  if (!inside(box, [x, y, z]) || !g.inBounds(x, y, z)) throw new Error(`write outside footprint: ${x},${y},${z}`);
  if (!replace && !g.isAir(x, y, z)) { skipped.push([x, y, z, block]); return false; }
  g.set(x, y, z, block, block.endsWith("_leaves") ? { ...state, persistent: "true" } : state);
  return true;
}

function paint(g, box, cells, replace = false) {
  const skipped = [];
  let placed = 0;
  for (const [pos, blk] of cells) if (put(g, box, pos, blk, replace, skipped)) placed++;
  return { box, placed, skipped };
}

// A cell on a wall face: plane = the wall's x (east/west faces) or z (north/south), a = the coordinate along the wall,
// d = steps outward (+1 proud of the wall, -1 inside it).
function wallCell(face, plane, a, y, d) {
  const o = DIRS[face];
  return o[0] !== 0 ? [plane + d * o[0], y, a] : [a, y, plane + d * o[2]];
}
const planeOf = (o) => o.x ?? o.z;
const alongPane = (face) => (DIRS[face][0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false" }
  : { east: "true", west: "true", north: "false", south: "false" });

// A valance of wool on one plane (x), along z from z0 to z1: red and white alternate per cell. scallop: a closed
// trapdoor hangs under every second (white) cell, leaving the rest open.
export function awning(g, { x, y, z0, z1, scallop = false, face = "east", replace = false }) {
  if (z1 < z0) throw new Error("awning: z1 < z0");
  const cells = [];
  for (let z = z0; z <= z1; z++) {
    const i = z - z0;
    cells.push([[x, y, z], [i % 2 === 0 ? "red_wool" : "white_wool", {}]]);
    if (scallop && i % 2 === 1) cells.push([[x, y - 1, z], B.trapdoor("dark_oak", face, "top", false)]);
  }
  return paint(g, bounds(cells), cells, replace);
}

// Goods on a counter run along z at column x and height y (the goods layer), z0..z1. Every 4th cell is a barrel crate
// (facing up) with a closed trapdoor lid on it at y+1; the rest cycle through block (an id or a list of ids).
// Fits the smallest ROOMS box that holds it with 2 clear cells above, and never enters that room's lane.
export function produce_row(g, { x, y, z0, z1, block = ["melon", "pumpkin", "hay_block", "red_wool", "green_wool"], replace = false }) {
  if (z1 < z0) throw new Error("produce_row: z1 < z0");
  const want = [[x, y, z0], [x, y + 2, z1]];
  const room = ROOMS.filter((r) => contains(r.box, want)).sort((a, b) => volume(a.box) - volume(b.box))[0];
  if (!room) throw new Error(`produce_row: ${x},${y},${z0}..${z1} is not inside a ROOMS box with 2 clear cells above`);
  if (room.lane && x >= room.lane[0] && x <= room.lane[1]) throw new Error(`produce_row: x ${x} is in the ${room.name} lane`);
  const blocks = Array.isArray(block) ? block : [block];
  const cells = [];
  for (let z = z0; z <= z1; z++) {
    const i = z - z0;
    if (i % 4 === 3) {
      cells.push([[x, y, z], ["barrel", { facing: "up" }]]);
      cells.push([[x, y + 1, z], B.trapdoor("dark_oak", "north", "bottom", false)]);
    } else cells.push([[x, y, z], [blocks[i % blocks.length], {}]]);
  }
  return paint(g, bounds(cells), cells, replace);
}

// A 4 x 3 (w x h) window on a wall face: glass panes with a dark oak trapdoor muntin (open, in the middle column), a
// quartz slab sill 1 proud below, a quartz stair lintel 1 proud above (lip out, back into the wall), and an
// ochre_froglight one cell inside the glass behind every pane column. start = the first along-wall cell; the wall
// plane is x (east/west face) or z (north/south face).
export function window_bay(g, { face, x, z, start, y, w = 4, h = 3, glow = true, replace = false }) {
  const plane = planeOf({ x, z });
  const m = Math.floor((w - 1) / 2), conn = alongPane(face), cells = [];
  for (let i = 0; i < w; i++) {
    const a = start + i;
    for (let r = 0; r < h; r++) {
      const pos = wallCell(face, plane, a, y + r, 0);
      cells.push(i === m ? [pos, B.trapdoor("dark_oak", face, "bottom", true)] : [pos, ["glass_pane", conn]]);
    }
    if (glow && i !== m) cells.push([wallCell(face, plane, a, y + Math.floor(h / 2), -1), ["ochre_froglight", {}]]);
    cells.push([wallCell(face, plane, a, y - 1, 1), B.slab("smooth_quartz", "top")]);
    cells.push([wallCell(face, plane, a, y + h, 1), B.stairs("smooth_quartz", OPPOSITE[face], "top")]);
  }
  return paint(g, bounds(cells), cells, replace);
}

// A one-block-proud course along a wall face at height y, from..to along the wall (plane x or z): a bottom slab.
export function string_course(g, { face, x, z, from, to, y, replace = false }) {
  if (to < from) throw new Error("string_course: to < from");
  const plane = planeOf({ x, z }), cells = [];
  for (let a = from; a <= to; a++) cells.push([wallCell(face, plane, a, y, 1), B.slab("smooth_quartz", "bottom")]);
  return paint(g, bounds(cells), cells, replace);
}

// The Down Under course: upside-down stone brick stairs (lip out, back into the wall), 1 proud, along the face at y.
export function du_course(g, { face, x, z, from, to, y, replace = false }) {
  if (to < from) throw new Error("du_course: to < from");
  const plane = planeOf({ x, z }), cells = [];
  for (let a = from; a <= to; a++) cells.push([wallCell(face, plane, a, y, 1), B.stairs("stone_brick", OPPOSITE[face], "top")]);
  return paint(g, bounds(cells), cells, replace);
}

// A half-step slab ramp in the aisle: from the floor block at y = from up to the floor block at from + rise, climbing
// along z from z (the lower end) in direction dir (+1 or -1), across x0..x1 (at least 3 wide). Each half step is a
// polished_andesite_slab on odd levels, with full polished_andesite below it; runs of 3 half steps, then a level
// landing of 2 cells. The upper floor's own cell is not written.
export function ramp(g, { x0, x1, z, from, rise = 1, dir = 1, replace = false }) {
  if (x1 - x0 + 1 < 3) throw new Error("ramp: at least 3 wide");
  if (!Number.isInteger(rise) || rise < 1) throw new Error("ramp: rise must be a whole number of blocks, 1 or more");
  if (dir !== 1 && dir !== -1) throw new Error("ramp: dir is +1 or -1 along z");
  const H = 2 * rise, levels = [];
  for (let L = 0; L < H;) {
    const run = Math.min(3, H - L);
    for (let k = 1; k <= run; k++) levels.push(L + k);
    L += run;
    if (L < H) levels.push(L, L);
  }
  const cells = [];
  levels.forEach((L, c) => {
    if (L >= H) return;
    const zc = z + dir * c;
    for (let x = x0; x <= x1; x++) {
      for (let y = from + 1; y <= from + Math.floor(L / 2); y++) cells.push([[x, y, zc], B.block("polished_andesite")]);
      if (L % 2 === 1) cells.push([[x, from + (L + 1) / 2, zc], B.slab("polished_andesite", "bottom")]);
    }
  });
  return paint(g, bounds(cells), cells, replace);
}

// The roof parapet: a smooth_quartz wall on the rectangle's edge at y, a smooth_quartz_slab coping (top) at y+1.
// skip: boxes [[x0,y0,z0],[x1,y1,z1]] whose cells are left out (the MEET THE PRODUCER board).
export function parapet(g, { x0, z0, x1, z1, y = 43, skip = [], replace = false }) {
  const cells = [], free = (pos) => !skip.some((b) => inside(b, pos));
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x !== x0 && x !== x1 && z !== z0 && z !== z1) continue;
    if (free([x, y, z])) cells.push([[x, y, z], B.block("smooth_quartz")]);
    if (free([x, y + 1, z])) cells.push([[x, y + 1, z], B.slab("smooth_quartz", "top")]);
  }
  return paint(g, bounds(cells), cells, replace);
}

// The MEET THE PRODUCER board: a dark oak planks panel on the plane x (facing east), z0..z1 by y0..y1, with a
// dark oak stair lip on top (lip out, back into the board). The lettering is not placed: plaque's banner-style letters
// hang on the wall in front of the board, at x 42, which is off-plot, so they are reported in notes instead.
export function producer_board(g, { x = 41, y0 = 42, y1 = 45, z0 = 281, z1 = 299, replace = false }) {
  const cells = [];
  for (let z = z0; z <= z1; z++) {
    for (let y = y0; y <= y1; y++) cells.push([[x, y, z], B.block("dark_oak_planks")]);
    cells.push([[x, y1 + 1, z], B.stairs("dark_oak", OPPOSITE.east, "top")]);
  }
  const r = paint(g, bounds(cells), cells, replace);
  return { ...r, notes: ["MEET THE PRODUCER letters not placed: banner letters hang at x 42 (off-plot)"] };
}
