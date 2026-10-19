// 25 West 54th Street, 1939 multi-family elevator building (Midtown, Rockefeller Center's block). Footprint 23 x 22 with
// the street front on the north (low z). The lidar roof is smoothed into four flat setback tiers (blocks above y 0): a
// 30 tier on the north frontage and the low wings, a 36 tier for the broad body, a 42 ring round the core, and a 48 core
// with a copper-capped penthouse. Each cell stands on a granite foundation up to its own ground, so the downhill side
// shows its extra storeys and nothing floats. Storey lines are global (a calcite band every 3 blocks from y 1, each
// storey a band and two window rows), so the uphill and downhill cells line up. Brick piers, light glass with a few
// glowstone lamps behind it, granite base, calcite quoins and parapet, an entrance with pilasters and a lantern over
// the door. The interior is air between one-block walls and a floor slab per storey (no interiors).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034794.cells.json`, "utf8"));
const X = 23, Y = 54, Z = 22;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));

// Lidar roof -> flat tier top (block y). Roofs at or under 4 are open ground: foundation only.
const tier = (roof) => (roof <= 4 ? null : roof <= 32 ? 30 : roof <= 38 ? 36 : roof <= 43 ? 42 : 48);
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const band = (y) => y >= 1 && (y - 1) % 3 === 0;                    // storey lines: calcite band, then two window rows

// Solid at (x, y, z): foundation below the cell's ground, or building between its ground and its tier top.
const solid = (x, z, y) => {
  const c = cell.get(`${x},${z}`); if (!c) return false;
  const h = tier(c.roof);
  return y < c.ground || (h !== null && y < h);
};
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => !solid(x + DIRS[d][0], z + DIRS[d][1], y));

// Penthouse on the core: a 4 x 3 box on the 48 tier, roof at 51.
const PENT = { x0: 9, x1: 12, z0: 13, z1: 15 };
for (let z = PENT.z0; z <= PENT.z1; z++) for (let x = PENT.x0; x <= PENT.x1; x++) {
  const c = cell.get(`${x},${z}`);
  if (!c || tier(c.roof) !== 48) throw new Error(`penthouse cell ${x},${z} is not on the 48 core`);
}

// Water tank on the north parapet, two blocks of the 30 tier.
const TANK = [[5, 0], [6, 0]];

const g = new Voxels([X, Y, Z]);
const glass = [];                                                   // window cells, for the lamps behind them

for (const [x, z, ground, roof] of cells) {
  const h = tier(roof);
  for (let y = 0; y < Y; y++) {
    // foundation: solid from y 0 up to this cell's ground
    if (y < ground) { g.set(x, y, z, "polished_granite"); continue; }
    if (h === null || y >= h) continue;
    // plinth: the lowest course is solid across the footprint
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    const ex = exposed(x, z, y);
    // roof: the top course, a parapet on the outside and a tar roof inside
    if (y === h - 1) { g.set(x, y, z, ex.length ? "calcite" : "smooth_stone"); continue; }
    // interior: a floor slab per storey, air between
    if (!ex.length) { if (band(y)) g.set(x, y, z, "smooth_stone"); continue; }
    const ew = ex.includes("w") || ex.includes("e");
    const ns = ex.includes("n") || ex.includes("s");
    // quoins at the corners
    if (ew && ns) { g.set(x, y, z, "calcite"); continue; }
    const along = ew ? z : x;
    const base = y <= 3;                                            // granite ground storey
    if (band(y)) { g.set(x, y, z, base ? "polished_granite" : "calcite"); continue; }
    if (along % 3 === 0) { g.set(x, y, z, base ? "polished_granite" : "bricks"); continue; }
    g.set(x, y, z, "light_blue_stained_glass");
    glass.push({ x, y, z, ex: ex[0] });
  }
}

// Warm lamps behind some of the glass: one glowstone in the air cell just inside a window.
const IN = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };
for (const { x, y, z, ex } of glass) {
  if ((x * 31 + y * 17 + z * 7) % 6 !== 0) continue;
  const [dx, dz] = IN[ex];
  if (g.get(x + dx, y, z + dz)) continue;
  g.set(x + dx, y, z + dz, "glowstone");
}

// Entrance on the north front (x 10-12): recessed door in the wall line, calcite pilasters, granite lintel, a lantern.
for (const y of [2, 3]) { g.set(10, y, 0, "calcite"); g.set(12, y, 0, "calcite"); }
for (const x of [10, 11, 12]) g.set(x, 4, 0, "polished_granite");
const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(11, 2, 0, "dark_oak_door", { ...door, half: "lower" });
g.set(11, 3, 0, "dark_oak_door", { ...door, half: "upper" });
g.set(11, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Penthouse: calcite course at its foot, glass and brick walls, a calcite cap, a copper roof.
for (let y = 48; y <= 51; y++) for (let z = PENT.z0; z <= PENT.z1; z++) for (let x = PENT.x0; x <= PENT.x1; x++) {
  const perim = x === PENT.x0 || x === PENT.x1 || z === PENT.z0 || z === PENT.z1;
  const corner = (x === PENT.x0 || x === PENT.x1) && (z === PENT.z0 || z === PENT.z1);
  if (y === 51) g.set(x, y, z, "copper_block");
  else if (!perim) continue;
  else if (y === 48 || y === 50 || corner) g.set(x, y, z, "calcite");
  else g.set(x, y, z, "light_blue_stained_glass");
}

// Water tank on the north parapet: spruce staves, a slab lid.
for (const [x, z] of TANK) {
  for (let y = 30; y <= 31; y++) g.set(x, y, z, "spruce_planks");
  g.set(x, 32, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

const out = `${DIR}/NYC1034794.nbt`;
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, ${palette} palette entries`);
