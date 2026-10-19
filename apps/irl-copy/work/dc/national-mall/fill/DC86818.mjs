// DC86818: Auditor's Building Complex, 201 14th St SW, Washington DC, as a 1.21.1 module.
// A stripped-classical federal office block of the 1930s (the Federal Triangle idiom): a light limestone-look facade
// (calcite) on a granite plinth, stone bands on every floor line, two-wide dark glass windows between piers, a stone
// cornice and parapet on each tier, and a recessed entrance with a lantern. The lidar roof is smoothed (3x3 median
// over the footprint) and snapped to tiers of 9, 12 and 15 blocks (a 3-block storey), with the remainder up to the
// lidar height as a parapet on the outer edge. The east end steps up to a 5-storey tower on the 4-storey body.
// Every column is solid from y 0 up to its tier; floors and the roof deck span wall to wall, so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86818.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86818.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const cell = (x, z) => F.get(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                    // E, W, S (+z), N (-z)

// Palette
const BASE = "polished_granite";      // plinth at y 0, entrance surrounds
const BAND = "smooth_stone";          // floor-line bands
const WALL = "calcite";               // piers and spandrel walls
const GLASS = "gray_stained_glass_pane";
const CORNICE = "stone_bricks";       // the top course on the outer edge of each tier
const PARAPET = "stone_brick_wall";
const ROOF = "smooth_stone";          // roof deck
const DOOR = "dark_oak_door";
const LINTEL = "stone_bricks";
const LAMP = "lantern";
const LIGHT = "glowstone";            // warm light behind some windows
const UNIT = "iron_block";            // rooftop plant

// Roof: median of the 3x3 footprint cells around each cell (lidar noise and 0-1 gaps drop out); tier = 3 x floor(roof / 3).
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = cell(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  c.h = vals[vals.length >> 1];                                        // roof top: blocks 0 .. h-1 at most
  c.t = 3 * Math.floor(c.h / 3);                                       // body and roof deck (layer t)
}
for (const c of F.values()) c.p = DIRS.some(([dx, dz]) => !cell(c.x + dx, c.z + dz));   // on the outer edge

// Outside air touches a voxel at height y across a horizontal face when the neighbour is off the footprint, or is an
// open column above its neighbour's deck (a setback), and the neighbour has no parapet there. Only those faces get
// walls; faces between rooms of the same building stay open. This is the outer surface, so the envelope has no holes.
const open = (n, y) => !n || (y > n.t && !(n.p && y < n.h));
const exposed = (c, y) => DIRS.filter(([dx, dz]) => open(cell(c.x + dx, c.z + dz), y));

// Entrances: two on the north face (z 0), on the ground-level cells nearest x 3 and x 8.
const northGround = [...F.values()].filter((c) => c.z === 0 && c.g === 0 && c.t >= 9);
const doors = [];
for (const want of [3, 8]) {
  const pick = northGround.filter((c) => !doors.includes(c)).sort((a, b) => Math.abs(a.x - want) - Math.abs(b.x - want))[0];
  if (pick) doors.push(pick);
}

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => plan.has(`${x},${y},${z}`);
const lamps = [];

for (const c of F.values()) {
  for (let y = 0; y < c.t; y++) {
    const ex = exposed(c, y);
    if (!ex.length) {                                                  // a room: floor slab per storey, air otherwise
      if (y % 3 === 0) put(c.x, y, c.z, ROOF);
      continue;
    }
    const along = ex.some(([dx]) => dx) ? c.z : c.x;                   // E/W faces run along z, N/S faces along x
    if (y === 0) put(c.x, y, c.z, BASE);
    else if (y % 3 === 0) put(c.x, y, c.z, BAND);
    else if (along % 4 === 1 || along % 4 === 2) {                    // two-wide windows between one-wide piers
      put(c.x, y, c.z, GLASS, { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
      // Warm light on the first floor and in some upper windows, behind the glass, on the floor slab below.
      const [dx, dz] = ex[0];
      const inner = cell(c.x - dx, c.z - dz);
      if (y % 3 === 1 && (along + y) % 7 === 4 && inner && y < inner.t && !exposed(inner, y).length) lamps.push([inner.x, y, inner.z]);
    } else put(c.x, y, c.z, WALL);
  }
  put(c.x, c.t, c.z, c.p ? CORNICE : ROOF);                           // the tier's roof deck (cornice on the edge)
  if (c.p) for (let y = c.t + 1; y < c.h; y++) put(c.x, y, c.z, PARAPET);
}

// Lamps behind windows.
for (const [x, y, z] of lamps) put(x, y, z, LIGHT);

// Rooftop plant: 2x2x2 boxes on the interior of the 12-block tier, one per 6x6 cell grid.
for (const c of F.values()) {
  if (c.p || c.t < 12 || c.x % 6 !== 2 || c.z % 6 !== 2) continue;
  const quad = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => cell(c.x + dx, c.z + dz));
  if (quad.some((n) => !n || n.p || n.t !== c.t)) continue;
  for (const n of quad) for (let y = c.t + 1; y <= c.t + 2; y++) put(n.x, y, n.z, UNIT);
}

// Entrances: door on the ground, granite surround and stone lintel, a hanging lantern under the lintel.
for (const d of doors) {
  put(d.x, 0, d.z, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(d.x, 1, d.z, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) for (let y = 0; y <= 2; y++) put(d.x + dx, y, d.z, BASE);
  for (const dx of [-1, 0, 1]) put(d.x + dx, 3, d.z, LINTEL);
  put(d.x, 2, d.z, LAMP, { hanging: "true", waterlogged: "false" });
}

// Glass panes connect to any neighbour in the plane of the facade.
const g = new Voxels([39, 29, 28]);
const tf = (b) => (b ? "true" : "false");
for (const [k, e] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  let state = e.state;
  if (e.block === GLASS) {
    state = { east: tf(has(x + 1, y, z)), north: tf(has(x, y, z - 1)), south: tf(has(x, y, z + 1)), west: tf(has(x - 1, y, z)), waterlogged: "false" };
  }
  g.set(x, y, z, e.block, state);
}
const stats = g.save(OUT);
const tiers = {};
for (const c of F.values()) tiers[c.t] = (tiers[c.t] || 0) + 1;
console.log(`DC86818: ${stats.blocks} blocks, palette ${stats.palette}; cells per tier ${JSON.stringify(tiers)}; doors ${doors.length}; lamps ${lamps.length}`);
