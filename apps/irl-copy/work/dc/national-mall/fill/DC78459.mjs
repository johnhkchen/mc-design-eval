// DC78459: the Old Post Office, 1100 Pennsylvania Avenue NW, read from the lidar record. A Romanesque Revival federal
// building of the 1890s: a stepped block of red sandstone (brownstone-toned) on a granite plinth, a low arcaded wing
// on the north face, and a clock tower that rises from the middle of that face to the lidar's 38-block peak.
//
// Massing follows the lidar's median-smoothed roof, quantised to flat tiers: 7 (wings), 19 (the perimeter block),
// 23 (the inner block), then 32 / 35 / 38 for the tower's three setbacks. Storeys sit on an absolute 4-block rhythm
// (sill band, two glass rows, head band), so every column lines up. Each column fills from y 0 to its ground as
// granite foundation, then its storeys up to a cornice and a roof cap. Exposure is per height: a face is a facade
// where it looks out of the footprint or over a neighbour's lower roof, so setbacks get windows on their flanks.
// Piers every third cell (corners always), a granite base with storefront glass, a dark-oak entrance on the north face
// under the wing, and a clock on each tower face. Glass bays have an air room behind them with a floor slab and
// ceiling, and about one room in six holds a warm lamp.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78459.cells.json`, "utf8"));
const g = new Voxels([30, 50, 40]);

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, G, r]) => [key(x, z), { G, r }]));
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the non-zero heights in the 3x3 neighbourhood (drops single-cell holes), then flat tiers.
const smoothR = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz)); if (c && c.r > 0) v.push(c.r);
  }
  v.sort((a, b) => a - b);
  return v.length ? v[v.length >> 1] : 0;
};
const tierOf = (r) => (r < 10 ? 7 : r < 22 ? 19 : r < 29 ? 23 : r < 33 ? 32 : r < 37 ? 35 : 38);

const cell = new Map();
for (const [x, z, G] of cells) cell.set(key(x, z), { x, z, G, T: tierOf(smoothR(x, z)) });
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

const ENTRY = { x: 13, z: 0 };
const CLOCKS = [                                  // one on each tower face: fixed = the face's plane, c = centre along it
  { plane: "x", fixed: 2, c: 13 }, { plane: "x", fixed: 8, c: 13 },
  { plane: "z", fixed: 10, c: 5 }, { plane: "z", fixed: 16, c: 5 },
];
const CLOCK_Y = 28;

// Faces of cell (x, z) at height y that look outside the footprint or over a neighbour's lower roof.
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => {
  const n = cell.get(key(x + dx, z + dz));
  return !n || n.T <= y;
}).map(([f]) => f);
const isPier = (x, z, fs) => fs.length >= 2 || fs.some((f) => ((f === "N" || f === "S") ? x % 3 === 0 : z % 3 === 0));
const winRow = (y) => y % 4 === 1 || y % 4 === 2;
const bandRow = (y) => y % 4 === 0 || y % 4 === 3;
const isDoor = (x, z, y) => x === ENTRY.x && z === ENTRY.z && y < 2;

// A glass pane in the wall plane: a window bay at a window row, below the cornice, not a pier or the door.
const isGlass = (x, z, y) => {
  const c = cell.get(key(x, z));
  if (!c || !winRow(y) || y < c.G || y >= c.T - 2 || isDoor(x, z, y)) return false;
  const fs = exposed(x, z, y);
  return fs.length > 0 && !isPier(x, z, fs) && !clockAt(x, z, y);
};
// Interior cell one step behind a bay: air at the window rows, between a floor band and a ceiling band.
const isRoom = (x, z, y) => winRow(y) && exposed(x, z, y).length === 0 && DIRS.some(([, dx, dz]) => isGlass(x + dx, z + dz, y));

const clockAt = (x, z, y) => {
  if (Math.abs(y - CLOCK_Y) > 1) return null;
  for (const k of CLOCKS) {
    const onFace = k.plane === "x" ? z === k.fixed : x === k.fixed;
    const along = k.plane === "x" ? x : z;
    if (!onFace || Math.abs(along - k.c) > 1) continue;
    return along === k.c && y === CLOCK_Y ? ["black_concrete"] : ["quartz_block"];
  }
  return null;
};

const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "false", waterlogged: "false" };
const GLASS_EW = { east: "true", west: "true", north: "false", south: "false" };   // panes on a N or S face
const GLASS_NS = { north: "true", south: "true", east: "false", west: "false" };   // panes on an E or W face

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (x, z, y) => {
  const c = cell.get(key(x, z)); if (!c) return null;
  if (y < c.G) return ["granite"];                                            // foundation under the cell's own ground
  if (y >= c.T) return null;
  if (y === c.T - 1) return [c.T === 38 ? "oxidized_copper" : "deepslate_tiles"];   // roof cap
  if (y === c.T - 2) return ["cut_red_sandstone"];                            // cornice course
  if (isDoor(x, z, y)) return ["dark_oak_door", DOOR(y ? "upper" : "lower")];
  const clock = clockAt(x, z, y); if (clock) return clock;

  const fs = exposed(x, z, y);
  const base = y < 4;                                                         // granite plinth and shopfront storey
  if (!fs.length) {
    if (!isRoom(x, z, y)) return ["stone_bricks"];                            // solid interior, floors and ceilings
    if (y % 4 === 1) {                                                        // a lamp standing on the floor slab
      const h = hash(x, y, z) % 19;
      if (h === 0) return ["lantern", LANTERN];
      if (h === 1) return ["shroomlight"];
      if (h === 2) return ["glowstone"];
    }
    return null;                                                              // air behind the glass
  }
  if (winRow(y) && !isPier(x, z, fs)) {
    const ew = fs.includes("N") || fs.includes("S");
    return ["glass_pane", ew ? GLASS_EW : GLASS_NS];
  }
  if (isPier(x, z, fs)) return [base ? "polished_granite" : "chiseled_red_sandstone"];
  if (bandRow(y)) return [base ? "polished_granite" : "cut_red_sandstone"];
  return ["red_sandstone"];
};

for (const c of cell.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c.x, c.z, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
}

// A few plant boxes on the flat interior of the inner 23-block roof, and the copper spire over the tower's crown.
const flatInterior = (c) => DIRS.every(([, dx, dz]) => cell.get(key(c.x + dx, c.z + dz))?.T === c.T);
for (const c of cell.values()) {
  if (c.T === 23 && flatInterior(c) && hash(c.x, c.T, c.z) % 14 === 0) g.set(c.x, c.T, c.z, "iron_block");
}
const crown = cell.get(key(13, 5));
if (crown && crown.T === 38) {
  for (let y = 38; y <= 40; y++) g.set(13, y, 5, "oxidized_copper");
  g.set(13, 41, 5, "lantern", LANTERN);
}

g.save(`${DIR}/DC78459.nbt`);
