// A two-storey Edwardian brick shop-house, Mt Eden Road style (c. 1905-1925): red brick walls on a stone plinth, a
// smooth-stone storey line, a flat roof behind a smooth-stone cornice, a central shopfront and door on the street
// (north) face, sash windows with white heads, and a lower single-storey wing and a ground-level annex at the
// lidar's low cells. The massing is clean tiers taken from the lidar roof, not its noise: roof <=2 -> annex (top 3),
// roof 6-7 -> one-storey wing (top 7), roof 8-9 -> two-storey body (top 9), roof 10 -> raised parapet core (top 10).
// The shell is hollow: perimeter cells are solid walls, interior cells carry only floor slabs and a roof cap, and the
// cell behind each window is carved to air (with a glowstone on the floor of some), so the glass has an air gap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_433812527.cells.json`, "utf8"));

const tierOf = (roof) => (roof <= 2 ? 3 : roof <= 7 ? 7 : roof <= 9 ? 9 : 10);
const F = new Map();                       // "x,z" -> { ground, top } (top = layers filled, i.e. the roof surface y)
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, top: tierOf(roof) });

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // north, south, west, east
const at = (x, z) => F.get(`${x},${z}`);
const outward = (x, z) => DIRS.filter(([dx, dz]) => !at(x + dx, z + dz));   // faces onto open air
const perimeter = (x, z) => DIRS.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top !== at(x, z).top; });

const DOOR = "6,0";                        // the street (north) face, the ground-floor entrance
const CHIMNEY = "4,6";

// Windows: on the outer faces, every other cell (a pier between each), in the ground-floor band (y 1-2) and, on the
// two-storey tiers, the first-floor band (y 5-6). Glass with a white head (y 3 and 7) over it.
const isWindow = (x, z, y) => {
  const c = at(x, z), key = `${x},${z}`;
  if (!c || key === DOOR || !perimeter(x, z) || !outward(x, z).length || (x + z) % 2) return false;
  if (c.top < 7) return false;
  return y === 1 || y === 2 || (c.top >= 9 && (y === 5 || y === 6));
};

// Behind each window and the door: the inward cell is carved to air for the window rows, so the glass has an air gap.
const carve = new Map();                   // "x,z" -> Set of y rows to clear
const addCarve = (x, z, rows) => {
  const k = `${x},${z}`; if (!carve.has(k)) carve.set(k, new Set()); for (const y of rows) carve.get(k).add(y);
};
for (let x = 0; x < 8; x++) for (let z = 0; z < 14; z++) {
  if (!at(x, z)) continue;
  const o = outward(x, z); if (!o.length) continue;
  const [dx, dz] = o[0], inX = x - dx, inZ = z - dz;
  if (`${x},${z}` === DOOR) { if (at(inX, inZ)) addCarve(inX, inZ, [1, 2]); continue; }
  const rows = [1, 2, 5, 6].filter((y) => isWindow(x, z, y));
  if (rows.length && at(inX, inZ)) addCarve(inX, inZ, rows);
}

const paneState = ([dx]) => (dx ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// The block at one cell (null = air). Order: door, glass, frames, carved air, cornice and floors, walls.
function blockAt(x, y, z) {
  const c = at(x, z); const key = `${x},${z}`;
  if (key === CHIMNEY && y >= c.top && y <= c.top + 2) return { block: y === c.top + 2 ? "smooth_stone" : "bricks" };
  if (!c) return null;
  if (y < c.ground) return { block: "stone_bricks" };                 // foundation under the ground (all 0 here)
  if (key === DOOR && (y === 1 || y === 2)) {
    return { block: "dark_oak_door", state: { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (isWindow(x, z, y)) return { block: "glass_pane", state: paneState(outward(x, z)[0]) };
  if (perimeter(x, z) && outward(x, z).length && key !== DOOR && (x + z) % 2 === 0 && (y === 3 || (c.top >= 9 && y === 7) || (c.top === 7 && y === 3))) {
    return { block: "white_concrete" };                                  // window heads
  }
  if (carve.get(key)?.has(y)) {
    // a warm light on the floor of some carved cells behind the glass (floor slab at y 0 or y 4 underneath)
    if ((y === 1 || y === 5) && (x + z) % 4 === 0) return { block: "glowstone" };
    return null;
  }
  if (y >= c.top) return null;
  if (y === 0) return { block: "stone_bricks" };                        // plinth / ground floor slab
  if (y === c.top - 1) return { block: "smooth_stone" };               // cornice / flat roof cap (one stone course, no grey speckle)
  if (y === 4) return { block: "smooth_stone" };                        // storey line / first floor slab
  if (!perimeter(x, z)) return null;                                    // hollow interior
  return { block: "bricks" };
}

const g = new Voxels([8, 23, 14]);
for (let x = 0; x < 8; x++) for (let y = 0; y < 23; y++) for (let z = 0; z < 14; z++) {
  const b = blockAt(x, y, z);
  if (b) g.set(x, y, z, b.block, b.state);
}
const out = `${DIR}/way_433812527.nbt`;
const stats = g.save(out);
console.log(`way_433812527: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${out}`);
