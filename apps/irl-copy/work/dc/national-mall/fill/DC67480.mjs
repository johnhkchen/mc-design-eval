// DC67480: 525 New Jersey Avenue NW, read from the lidar record. A nine-storey hotel on a 39 x 15 footprint: a 20-block
// tower mass on the west half, an 18-block shoulder around it, and one-storey and two-storey wings to the east and
// on the west edge. Late-1960s brick and precast: a dark stone-brick base course, red brick walls, smooth-stone
// spandrels and white concrete piers that run up the facade as the frame, glass panes in every window row.
//
// Storeys are two blocks: an even row is a spandrel (or a floor slab inside), an odd row is the window row. Rows sit on
// absolute heights, so neighbouring columns line up even where the ground steps (ground 0 or 1). Each column fills
// from y 0 up to its lidar tier with a smooth-stone cap; the downhill cells carry their foundation down to y 0.
// Exposed faces are the outside faces and the faces that stand above a lower neighbour, so the tower's sides read as
// walls where the shoulder steps in. Interior cells one step behind a glass row are air at the window row, with a
// floor slab per storey and a warm light in some of them; deeper cells are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC67480.cells.json`, "utf8"));
const W = 39, D = 15, H = 24;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 3x3 footprint neighbourhood (kills single-cell noise), then four flat tiers.
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const s = v[v.length >> 1];
  return s >= 19 ? 20 : s >= 14 ? 18 : s >= 5 ? 6 : 4;
};
const info = new Map();
for (const [x, z, g] of cells) info.set(key(x, z), { x, z, g, T: tierOf(x, z) });
const at = (x, z) => info.get(key(x, z));

// Faces of this cell that show at height y: outside the footprint, or above a lower neighbour's roof.
const exposed = (x, z, y) => {
  const c = at(x, z);
  if (y >= c.T) return [];
  return DIRS.filter(([, dx, dz]) => {
    const n = at(x + dx, z + dz);
    return !n || n.T <= y;
  }).map(([f]) => f);
};
// Piers: corners, and every third cell along each face (by x on the north and south faces, by z on the east and west).
const isPier = (x, z, fs) => fs.length > 1 || (fs[0] === "N" || fs[0] === "S" ? x : z) % 3 === 0;
// The entrance: a recessed glass vestibule on the north face of the low east wing, a door in its middle.
const DOOR_X = 28;
const onVestibule = (x, z, y) => z === 0 && x >= 26 && x <= 30 && (y === 1 || y === 2);
const isBay = (x, z, y) => {
  const fs = exposed(x, z, y);
  return fs.length > 0 && y % 2 === 1 && !isPier(x, z, fs) && !(x === DOOR_X && z === 0);
};
const isRoom = (x, z, y) => y % 2 === 1 && DIRS.some(([, dx, dz]) => isBay(x + dx, z + dz, y));

const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
// A pane connects along the wall it stands in: east-west on the north and south faces, north-south on the east and west.
const PANE = (fs) => (fs[0] === "N" || fs[0] === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (x, y, z) => {
  const c = at(x, z);
  if (y >= c.T) {
    // Roof plant: a two-block penthouse on the tower's roof, and small boxes scattered over the low wings.
    if (c.T === 20 && x >= 10 && x <= 13 && z >= 5 && z <= 7 && y <= 21) return ["light_gray_concrete"];
    if (c.T === 20 && x >= 11 && x <= 12 && z === 6 && y === 22) return ["smooth_stone"];
    if (c.T === 6 && y === 6 && (x * 7 + z * 3) % 11 === 0) return ["light_gray_concrete"];
    return null;
  }
  if (y < c.g) return ["stone"];                                       // foundation down to y 0
  if (y === c.T - 1) return ["smooth_stone"];                          // cornice and roof deck
  const fs = exposed(x, z, y);
  if (fs.length) {
    if (y === 0) return ["stone_bricks"];                              // base course
    if (y === 3 && z === 0 && x >= 26 && x <= 30) return ["stone_bricks"]; // entrance hood over the vestibule
    if (onVestibule(x, z, y)) {
      if (x === DOOR_X) return ["dark_oak_door", DOOR(y === 1 ? "lower" : "upper")];
      return ["glass_pane", PANE(fs)];
    }
    const pier = isPier(x, z, fs);
    if (y % 2 === 0) return [pier ? "white_concrete" : "bricks"];        // brick spandrel or precast pier
    return pier ? ["white_concrete"] : ["glass_pane", PANE(fs)];       // window row
  }
  if (isRoom(x, z, y)) {                                               // behind a glass row: air, or a warm light
    const h = hash(x, y, z);
    if (h % 9 === 0) return ["glowstone"];
    if (h % 17 === 0) return ["shroomlight"];
    return null;
  }
  return ["bricks"];                                                   // interior: solid brick, floor slabs at even rows
};

const g = new Voxels([W, H, D]);
for (const [x, z] of cells) {
  for (let y = 0; y < H; y++) {
    const b = blockAt(x, y, z);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}
const out = `${DIR}/DC67480.nbt`;
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
