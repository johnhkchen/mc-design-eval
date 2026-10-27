// Voco / Holiday Inn, Auckland CBD edge: a late-1990s glass-and-concrete hotel tower. A 176-block tower core (about
// 147 m), a 160 shoulder, a 92 east wing and a 32/60/112 west and north-west block, on a stone base. Floors every 4
// blocks, curtain-wall glazing in light-blue tinted panes between white spandrels and grey mullions, a polished-andesite
// podium for the first storeys of the tall tiers, a shopfront ground storey with a dark-oak entrance and lintel.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_839991359.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_839991359.nbt";
const SX = 59, SZ = 37, SY = 188;

const M = {
  base: "polished_andesite", foundation: "stone_bricks", paving: "smooth_stone",
  floor: "smooth_quartz", spandrel: "white_concrete", frame: "gray_concrete",
  glass: "light_blue_stained_glass_pane", roof: "stone", cornice: "smooth_quartz",
  plant: "light_gray_concrete", ac: "iron_block", light: "glowstone",
};
// the four sides, as the step outward from a cell: [dx, dz, name]
const SIDES = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

const cells = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, G, R] of JSON.parse(readFileSync(CELLS, "utf8"))) cells.set(key(x, z), { x, z, G, R, RT: null, yLow: 0, depth: 0 });
const at = (x, z) => cells.get(key(x, z)) ?? null;

// Lidar roof heights smoothed into flat tiers (all multiples of 4, so the storey lines of every tier line up).
function tierOf(c) {
  if (c.R - c.G <= 1) return null;                    // lidar roof on the ground: a paved plaza, no building
  if (c.R < 20) throw new Error(`unexpected low roof at ${c.x},${c.z}`);
  if (c.R >= 168) return 176;                         // tower: lidar 168..175 is one flat top
  if (c.R >= 150) return 160;                         // shoulder on the north edge
  if (c.R >= 100) return 112;
  if (c.R >= 80) return 92;                           // east wing
  if (c.R >= 40) return 60;
  return 32;                                          // west podium
}
for (const c of cells.values()) {
  c.RT = tierOf(c);
  if (c.RT !== null) c.yLow = Math.ceil(c.G / 4) * 4; // first floor slab at or above the ground
}

// Distance from the outside of the footprint (1 on the edge), for the roof plant and the lightning rod.
const queue = [];
for (const c of cells.values()) if (SIDES.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) { c.depth = 1; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of SIDES) { const n = at(c.x + dx, c.z + dz); if (n && !n.depth) { n.depth = c.depth + 1; queue.push(n); } }
}

// Is the massing solid at x, y, z: foundation, base course, roof, a floor slab, or a structural column on a 4-cell grid.
function solid(x, y, z) {
  const c = at(x, z); if (!c) return false;
  if (y < c.G) return true;                           // foundation down to the ground
  if (c.RT === null || y >= c.RT) return false;
  if (y < c.yLow) return true;                        // base course on the ground
  if (y === c.RT - 1 || y % 4 === 0) return true;     // roof, and a floor slab every storey
  return x % 4 === 0 && z % 4 === 0;                  // structure: columns carry the floors
}
// The sides of x, y, z that face open air (outside the footprint, or a cell with no solid there).
const exposures = (x, y, z) => SIDES.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

const g = new Voxels([SX, SY, SZ]);
const panes = [], facade = [];

for (const c of cells.values()) {
  const { x, z, G, RT, yLow } = c;
  for (let y = 0; y < G; y++) g.set(x, y, z, M.foundation);
  if (RT === null) { if (G > 0) g.set(x, G - 1, z, M.paving); continue; }
  for (let y = G; y < RT; y++) {
    if (y < yLow) { g.set(x, y, z, M.base); continue; }
    if (y === RT - 1) { g.set(x, y, z, M.roof); continue; }
    if (y % 4 === 0) { g.set(x, y, z, M.floor); continue; }
    if (x % 4 === 0 && z % 4 === 0) { g.set(x, y, z, M.frame); continue; }
    const ex = exposures(x, y, z);
    if (!ex.length) continue;                         // interior air behind the facade
    if (ex.length >= 2) { g.set(x, y, z, M.frame); continue; }   // corner
    const [dx, dz, side] = ex[0];
    const along = dx ? z : x;                         // position along the wall
    const phase = y % 4;                              // 1, 2: glazing; 3: spandrel
    const shop = y < yLow + 4;                        // ground storey: shopfront
    const podium = RT >= 112 && y < 20;               // stone base of the tall tiers
    facade.push({ x, y, z, dx, dz, side, shop, ex: ex.length, RT });
    if (phase === 3) { g.set(x, y, z, shop || podium ? M.base : M.spandrel); continue; }
    if (!shop && along % 3 === 0) { g.set(x, y, z, podium ? M.base : M.frame); continue; }   // mullion
    // a pane's connections follow its wall: east-west on a north or south face, and the reverse
    const st = dx ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
    g.set(x, y, z, M.glass, st);
    if (!shop) panes.push({ x, y, z, dx, dz });
  }
}

// Warm light behind some windows: a glowstone in the air gap just inside the glass.
for (const p of panes) {
  if ((p.x * 7 + p.y * 13 + p.z * 5) % 7 !== 0) continue;
  const ix = p.x - p.dx, iz = p.z - p.dz;
  if (at(ix, iz) && !solid(ix, p.y, iz) && !exposures(ix, p.y, iz).length) g.set(ix, p.y, iz, M.light);
}

// Entrance: the tower's lowest ground-storey face, one cell out from a mullion; dark-oak door, piers either side, a lintel.
const entry = facade.filter(f => f.shop && f.RT === 176 && f.ex === 1 && f.y % 4 === 1)
  .sort((a, b) => (at(a.x, a.z).G - at(b.x, b.z).G) || (a.x * 100 + a.z) - (b.x * 100 + b.z))[0];
if (entry) {
  const { x, y, z, side, dx, dz } = entry;
  const [ax, az] = dx ? [0, 1] : [1, 0];              // along the wall
  for (const s of [-1, 1]) if (at(x + s * ax, z + s * az)) g.set(x + s * ax, y, z + s * az, M.frame), g.set(x + s * ax, y + 1, z + s * az, M.frame);
  g.set(x, y, z, "dark_oak_door", { facing: side, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, y + 1, z, "dark_oak_door", { facing: side, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const s of [-1, 0, 1]) g.set(x + s * ax, y + 2, z + s * az, M.floor);   // lintel over the door
}

// Cornice on every roof edge, plant rooms on the tower core and the wings, a lightning rod on the highest point.
let core = null;
for (const c of cells.values()) {
  if (c.RT === null) continue;
  const { x, z, RT } = c;
  if (exposures(x, RT, z).length) g.set(x, RT, z, M.cornice);
  if (RT === 176) { if (c.depth === 1 || exposures(x, RT, z).length) g.set(x, RT + 1, z, M.cornice); }
  if (RT === 176 && c.depth >= 6) { g.set(x, RT, z, M.plant); g.set(x, RT + 1, z, M.plant); if (!core || c.depth > core.depth) core = c; }
  else if (c.depth >= 3 && x % 4 === 1 && z % 3 === 1) g.set(x, RT, z, M.ac);
}
if (core) g.set(core.x, core.RT + 2, core.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Check: every block touches another block (no floating blocks).
let blocks = 0, floating = 0, top = 0;
g.forEachCell((i, v) => {
  const x = i % SX, y = Math.floor(i / SX) % SY, z = Math.floor(i / (SX * SY));
  blocks++; if (y > top) top = y;
  if (y === 0) return;
  const touch = g.val(x + 1, y, z) || g.val(x - 1, y, z) || g.val(x, y + 1, z) || g.val(x, y - 1, z) || g.val(x, y, z + 1) || g.val(x, y, z - 1);
  if (!touch) floating++;
});
const res = g.save(OUT);
console.log(JSON.stringify({ blocks, floating, top, palette: res.palette, tower: cells.size, entrance: entry ? [entry.x, entry.y, entry.z] : null }));
