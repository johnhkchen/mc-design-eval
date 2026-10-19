// 150 West 49 Street, 1920: a four-storey brick mixed-use block on a 5 x 26 lot, with a one-storey shop wing at its south end.
// The body (lidar 11-12, roof 12) stands on a granite plinth and granite base; smooth-stone storey lines sit at 3, 6 and 9 and
// on the roof coping at 11, with a stone-brick parapet above. Brick piers rise between glass bays on the long faces; the west
// face is the shopfront (granite bulkhead, dark mullions, glass) and carries the dark-oak entrance off the stoop line at z 13.
// The end walls carry three windows each. Roof: a stone-brick stair house, a brick chimney and an iron ventilator on the body,
// a small stone-brick plant box on the wing. Windows are glass panes with air behind; a few hold glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1022695.cells.json`, "utf8"));

// Massing from the lidar, flattened into two tiers: 8+ is the body (roof 12), lower is the one-storey wing (roof 4).
const TOP = new Map();
for (const [x, z, , lidar] of cells) TOP.set(`${x},${z}`, lidar >= 8 ? 12 : 4);
const top = (x, z) => TOP.get(`${x},${z}`);             // undefined off the footprint
const body = (x, z) => top(x, z) === 12;
const SLABS = { body: [0, 3, 6, 9, 11], wing: [0, 3] };  // floors, storey lines and roof decks, full footprint
const WINDOW_ROWS = [2, 4, 5, 7, 8, 10];

// The faces of this cell that are open at height y: the neighbour is off the footprint or has no block at y.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const open = (x, z, y) => Object.entries(DIRS)
  .filter(([, [dx, dz]]) => { const t = top(x + dx, z + dz); return t === undefined || t <= y; })
  .map(([d]) => d);

// Glass on the long faces sits in the bays between piers; the piers are every third cell (corners always). The end walls
// carry windows at x 1..3, the middle three cells, with the corner piers beside them.
const isWindow = (x, z, faces) => faces.length === 1
  && (faces[0] === "N" || faces[0] === "S" ? x >= 1 && x <= 3 : z % 3 !== 0);
const pane = (d) => (d === "W" || d === "E"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const door = (half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });

// What stands at (x, y, z) inside the building: [block, state?] or null for air.
function blockAt(x, z, y) {
  const R = top(x, z); if (R === undefined || y >= R) return null;
  const B = body(x, z), faces = open(x, z, y), outer = faces.length > 0;
  if (SLABS[B ? "body" : "wing"].includes(y)) {
    if (y === 0) return [outer ? "polished_granite" : "smooth_stone"];                       // plinth, floor
    if (!outer) return [y === 11 || (!B && y === 3) ? "gray_concrete" : "smooth_stone"];   // tar roof decks, floors
    return ["smooth_stone"];                                                                   // storey lines, coping
  }
  if (!outer) return null;                                                                    // interior air
  if (x === 0 && z === 13 && (y === 1 || y === 2)) return ["dark_oak_door", door(y === 1 ? "lower" : "upper")];
  if (y === 1) return ["polished_granite"];                                                   // base course, shop bulkhead
  if (isWindow(x, z, faces)) return ["glass_pane", pane(faces[0])];
  return [y === 2 && faces[0] === "W" ? "polished_andesite" : "bricks"];                     // piers and dark shop mullions
}

const v = new Voxels([5, 16, 26]);
const put = (x, y, z, [block, state]) => v.set(x, y, z, block, state);
const windows = [];                                                                           // [x, y, z] of each glazed cell
for (const [x, z] of TOP.keys().map((k) => k.split(",").map(Number))) {
  for (let y = 0; y < top(x, z); y++) {
    const b = blockAt(x, z, y); if (b) put(x, y, z, b);
    if (b?.[0] === "glass_pane") windows.push([x, y, z]);
  }
  // The body's parapet: a stone-brick wall on the roof edge (open at 11 means the ring of the body).
  if (body(x, z) && open(x, z, 11).length) put(x, 12, z, ["stone_brick_wall"]);
}

// Warm light behind a sparse set of windows: glowstone on the interior cell beside the glass (the air gap).
const inner = (x, y, z) => [x === 0 ? 1 : x === 4 ? 3 : x, y, z === 0 ? 1 : z === 14 ? 13 : z === 25 ? 24 : z];
for (const [x, y, z] of windows) {
  if (!WINDOW_ROWS.includes(y) || (x * 7 + y * 13 + z * 17) % 17 !== 0) continue;
  const [ix, iy, iz] = inner(x, y, z);
  if (v.get(ix, iy, iz) === null) v.set(ix, iy, iz, "glowstone");
}

// Roof equipment: a stair house (solid stone brick, stone-slab cap) on the body, a chimney and a ventilator, and a plant box
// on the wing. Each stands on the deck below it.
for (let x = 1; x <= 3; x++) for (let z = 1; z <= 3; z++) {
  v.set(x, 12, z, "stone_bricks"); v.set(x, 13, z, "stone_bricks"); v.set(x, 14, z, "smooth_stone");
}
v.set(3, 12, 9, "bricks"); v.set(3, 13, 9, "bricks"); v.set(3, 14, 9, "smooth_stone");
v.set(1, 12, 9, "iron_block");
for (const [x, z] of [[1, 18], [2, 18], [1, 19], [2, 19]]) { v.set(x, 4, z, "stone_bricks"); v.set(x, 5, z, "smooth_stone"); }

const stats = v.save(`${dir}/NYC1022695.nbt`);
console.log(`NYC1022695: ${stats.blocks} blocks, ${stats.palette} palette entries`);
