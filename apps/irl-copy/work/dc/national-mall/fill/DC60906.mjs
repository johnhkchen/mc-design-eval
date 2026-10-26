// 1000 Massachusetts Ave NW: a 1960s-70s Modern office block in pale stone and glass, on a stone plinth.
// The lidar roof tiers (11 low, 13 wing, 15 tower) are smoothed into three clean massings. Every column is solid from
// y 0 up to its roof; the shell is the outer face where a side is off the footprint or stands above the neighbour's
// roof, and the interior is air with a floor slab per storey, so each storey stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC60906.cells.json", "utf8"));

// lidar noise → three tiers: 11 (low), 13 (wing), 15 (tower)
const fp = new Map();
for (const [x, z, g, r0] of cells) fp.set(`${x},${z}`, { g, r: r0 <= 11 ? 11 : r0 <= 13 ? 13 : 15 });
const at = (x, z) => fp.get(`${x},${z}`);
const DX = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// storey lines: spandrel bands at 3, 6, 9, 12 (interior floor slabs); glass between; cap at each column's roof - 1
const FLOOR = [3, 6, 9, 12];
const GLASS = "light_blue_stained_glass";
const ENTRY = [4, 5], ENTRY_BAY = [3, 4, 5, 6];

// which horizontal sides of (x, y, z) face air: off the footprint, or above the neighbouring column's roof
function sides(x, y, z) {
  return DX.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || y >= n.r; });
}

// the envelope and floors: { block, state } or null for air
function envelope(x, y, z) {
  const c = at(x, z); if (!c) return null;
  if (y < c.g || y === 0) return { block: "stone_bricks" };             // foundation and plinth course
  if (y >= c.r) return null;
  const out = sides(x, y, z);
  if (y === c.r - 1) return { block: out.length ? "smooth_quartz" : "light_gray_concrete" };   // cornice / roof deck
  if (out.length === 0) return FLOOR.includes(y) ? { block: "smooth_stone" } : null;          // interior: slab or air
  // the front bay: entrance doors between quartz frames, a dark canopy over them at the spandrel
  if (z === 19 && ENTRY_BAY.includes(x)) {
    if (y === 3) return { block: "gray_concrete" };
    if (y <= 2 && ENTRY.includes(x)) return { block: "dark_oak_door", state: door(x, y) };
    return { block: "quartz_block" };
  }
  // piers on the corners and every other bay; windows and spandrels between
  const pier = out.length === 2 || (out.every(([, dz]) => dz !== 0) ? x % 2 === 0 : z % 2 === 0);
  if (FLOOR.includes(y)) return { block: pier ? "quartz_block" : "white_concrete" };
  return { block: pier ? "quartz_block" : GLASS };
}

function door(x, y) {
  return { facing: "south", half: y === 1 ? "lower" : "upper", hinge: x === ENTRY[0] ? "left" : "right", open: "false", powered: "false" };
}

const isWindow = (x, y, z) => envelope(x, y, z)?.block === GLASS;
const solid = (x, y, z) => envelope(x, y, z) !== null;

// warm light: lanterns hang under a slab, glowstone and shroomlight stand on one, all behind a window
function light(x, y, z) {
  if (envelope(x, y, z) || at(x, z)?.r - 1 <= y) return null;
  if (!DX.some(([dx, dz]) => isWindow(x + dx, y, z + dz))) return null;
  if ([2, 5, 8, 11].includes(y) && solid(x, y + 1, z) && (x * 5 + z * 3 + y) % 7 === 0) return { block: "lantern", state: { hanging: "true" } };
  if ([1, 4, 7, 10].includes(y) && solid(x, y - 1, z)) {
    const h = (x * 7 + y * 13 + z * 11) % 10;
    if (h === 0) return { block: "glowstone" };
    if (h === 5) return { block: "shroomlight" };
  }
  return null;
}

const g = new Voxels([11, 27, 20]);
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number), { r } = fp.get(k);
  for (let y = 0; y < r; y++) {
    const e = envelope(x, y, z) ?? light(x, y, z);
    if (e) g.set(x, y, z, e.block, e.state);
  }
}

// the penthouse on the tower roof: a cooling-plant box with a stack, standing on the roof deck
for (let x = 4; x <= 6; x++) for (let z = 9; z <= 11; z++) g.set(x, 15, z, "light_gray_concrete");
g.set(5, 16, 10, "light_gray_concrete");
g.set(5, 17, 10, "iron_bars");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC60906.nbt";
console.log(g.save(out));
