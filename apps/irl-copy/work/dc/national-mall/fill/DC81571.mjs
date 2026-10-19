// DC81571: 150 I Street SE, a 1960s elevator apartment block in red brick with white precast spandrels, on the
// Capitol Hill side of the Navy Yard. Lidar reads three masses on the footprint: a one-storey shop wing along the
// north (I Street) side, a five-storey brick podium across the middle, and a ten-storey tower to the south-west that
// steps in at its edges (24 blocks) from its 30-block core. Storeys are 3 blocks: a white spandrel, then two glass
// rows, with a brick pier every third cell. Each column fills stone from y 0 up to its own ground, so the stepped
// ground under the west side carries the storeys above it. The west face has the entrance under a stone lintel,
// a few rooms behind the glass hold a lamp, and the tower carries a small roof plant room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC81571.cells.json`, "utf8"));
const W = 16, D = 31, H = 42;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const N4 = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 3x3 footprint neighbourhood (kills single-cell noise), then three flat masses.
// Up to 4 blocks is a one-storey wing (the lidar's 1-block roofs cannot hold a room), up to 20 a five-storey podium,
// above that the ten-storey tower at 30.
const massOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const s = v[v.length >> 1];
  return s <= 4 ? 3 : s <= 20 ? 15 : 30;
};

const info = new Map();
for (const [x, z, G] of cells) info.set(key(x, z), { x, z, g: G, T: massOf(x, z) });
const at = (x, z) => info.get(key(x, z));

// Setbacks: the tower's core keeps 30; every tower cell on its edge (off the footprint or beside a lower mass) stops
// at 24, so the tower steps in as it rises and no thin spike is left standing alone.
const isCore = (c) => c.T === 30 && N4.every(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !!n && n.T === 30; });
const stepIn = [...info.values()].filter((c) => c.T === 30 && !isCore(c));
for (const c of stepIn) c.T = 24;

// The envelope is per storey: a side of a cell is exposed where the neighbour is off the footprint, or stands lower
// than this height (a stepped mass shows its extra storeys as walls, not as solid stone).
const exposed = (c, y) => N4.filter(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y >= n.T; }).map(([f]) => f);
const envelope = (c, y) => y >= c.g && exposed(c, y).length > 0;
// Piers every third cell along each face (by x on the north and south faces, by z on the east and west).
const isPier = (c, y) => exposed(c, y).some((f) => ((f === "N" || f === "S") ? c.x : c.z) % 3 === 0);

// The entrance: west face, the podium's ground cell at z 10, under a stone lintel across z 9..11.
const DOOR = { x: 7, z: 10 };
for (const c of info.values()) {
  c.facade = N4.some(([, dx, dz]) => !inside(c.x + dx, c.z + dz));   // on the outer footprint edge at any height
  c.door = c.x === DOOR.x && c.z === DOOR.z;
  c.lintel = c.x === DOOR.x && Math.abs(c.z - DOOR.z) <= 1;
}
// A glazed cell is an envelope cell at a window row (not a spandrel, pier, cap, door or lintel). A room is an interior
// cell one step behind a glazed cell at that height: air behind the glass, with the floor slab below it.
const glazed = (c, y) => y >= c.g && y < c.T - 1 && y % 3 !== 0 && envelope(c, y) && !isPier(c, y) && !c.door && !(c.lintel && y === c.g + 2);
for (const c of info.values()) c.room = (y) => y >= c.g && y < c.T - 1 && !envelope(c, y) && N4.some(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !!n && glazed(n, y); });
// Roof plant: one 2 x 2 plant room, 2 blocks high, on the tower roof (a single block would read as a loose cube).
for (const c of info.values()) c.plant = c.T === 30 && c.x >= 10 && c.x <= 11 && c.z >= 21 && c.z <= 22;

const FOUND = "stone", BASE = "stone_bricks", BRICK = "bricks", SPANDREL = "white_concrete", GLASS = "glass_pane";
const CAP = "smooth_stone", ROOF = "stone_bricks", PLANT = "light_gray_concrete";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR_STATE = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "false", waterlogged: "false" };

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (y < G) return [c.facade ? BASE : FOUND];                          // foundation up to this cell's ground
  if (y >= T) return c.plant && y < T + 2 ? [PLANT] : null;
  if (y === T - 1) return [c.facade ? CAP : ROOF];                       // parapet cap / roof deck
  if (c.door) {
    if (y === G) return ["iron_door", DOOR_STATE("lower")];
    if (y === G + 1) return ["iron_door", DOOR_STATE("upper")];
  }
  if (c.lintel && y === G + 2) return [BASE];                            // stone lintel over the entrance
  const row = y % 3;                                                     // storey rhythm: spandrel, glass, glass
  if (!envelope(c, y)) {
    if (row === 0 || !c.room(y)) return [FOUND];                         // floor slab, solid deeper inside
    if (row === 1) {
      const h = hash(x, y, z) % 9;                                       // a lamp standing on the floor behind some windows
      if (h === 0) return ["lantern", LANTERN];
      if (h === 1) return ["shroomlight"];
      if (h === 2) return ["glowstone"];
    }
    return null;                                                         // air gap behind the glass
  }
  if (y === 0) return [BASE];                                            // base course on the street
  if (row === 0) return [SPANDREL];                                      // precast spandrel under each storey
  if (isPier(c, y)) return [BRICK];
  return [GLASS];
};

const g = new Voxels([W, H, D]);
for (const c of info.values()) {
  for (let y = 0; y < H; y++) {
    const b = blockAt(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
}
const r = g.save(`${DIR}/DC81571.nbt`);
console.log(`DC81571.nbt: ${r.blocks} blocks, ${r.palette} palette entries`);
