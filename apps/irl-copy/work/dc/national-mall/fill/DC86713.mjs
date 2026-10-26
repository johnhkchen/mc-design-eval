// National City Christian Church, 5 Thomas Circle NW: a Gothic Revival stone church. Pale limestone walls, dark stone-brick
// plinth, pilasters and string courses; a slate roof; a tall stair-stepped tower on the south-east corner with a spire.
// The lidar roof is smoothed (3x3 median) and snapped to five flat tiers, so the massing reads as clean stepped volumes.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86713.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..30, z 0..28

const WALL = "calcite", TRIM = "stone_bricks", ROOF = "deepslate_tiles", EAVE = "deepslate_tile_stairs", PIER = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane", LIT = "yellow_stained_glass_pane", FLOOR = "dark_oak_planks";
const TIERS = [6, 8, 10, 15, 22];                                        // the flat roof tiers the lidar is snapped to
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];   // stair "facing" = the low side

const g = new Voxels([31, 34, 29]);
const at = new Map();                                                   // "x,z" -> { gr, roof, R }
for (const [x, z, gr, roof] of cells) at.set(`${x},${z}`, { x, z, gr, roof, R: 0 });
const cell = (x, z) => at.get(`${x},${z}`);
const snap = (v) => TIERS.reduce((b, t) => (Math.abs(t - v) < Math.abs(b - v) ? t : b));

// Smooth the lidar roof (3x3 median over footprint cells) and snap it to a tier
for (const c of at.values()) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell(c.x + dx, c.z + dz); if (n) v.push(n.roof); }
  v.sort((a, b) => a - b);
  c.R = snap(v[Math.floor(v.length / 2)]);
}

// Exposed faces at height y: outside the footprint, or the neighbour's roof is below y (a setback's upper wall)
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || y >= n.R; });
// Interior piers on a 4-block grid, only where all eight neighbours are footprint cells (so no pier sits behind a window)
const isPier = (x, z) => x % 4 === 2 && z % 4 === 2 && [-1, 0, 1].every((dz) => [-1, 0, 1].every((dx) => cell(x + dx, z + dz)));
const glowAt = [];

// Glass pane whose plane is perpendicular to the wall's normal: a wall facing east/west runs north-south
const pane = (block, axisX) => ({ north: axisX ? "true" : "false", south: axisX ? "true" : "false", east: axisX ? "false" : "true", west: axisX ? "false" : "true", waterlogged: "false" });

for (const c of at.values()) {
  const { x, z, gr, R } = c;
  for (let y = 0; y < gr; y++) g.set(x, y, z, TRIM);                      // foundation: solid from y 0 up to the ground
  for (let y = gr; y < R - 1; y++) {
    const ex = exposed(x, z, y);
    if (ex.length) {
      const [dx] = ex[0]; const axisX = dx !== 0;
      const u = axisX ? z : x;                                            // position along the wall
      let block = WALL, state;
      if (y < gr + 1 || y % 4 === 0 || ex.length >= 2 || u % 4 === 0) block = TRIM;   // plinth, string courses, quoins, pilasters
      else if (y % 4 !== 0 && (u % 4 === 1 || u % 4 === 2)) {             // lancet windows: two panes wide, three tall
        const lit = (((u >> 1) + (y >> 2)) % 3 === 0);
        block = lit ? LIT : GLASS; state = pane(block, axisX);
        if (lit && y % 4 === 2) { const [ex0, ez0] = ex[0]; glowAt.push([x - ex0, y, z - ez0]); }
      }
      g.set(x, y, z, block, state);
    } else if (isPier(x, z)) g.set(x, y, z, PIER);
    else if (y % 4 === 0 && y >= gr + 1) g.set(x, y, z, FLOOR);           // one floor slab per storey, inside
  }
  // Roof cap at the top of each column: slate, with stair eaves where the roof steps down or ends
  const low = DIRS.filter(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || n.R < R; });
  if (low.length) g.set(x, R - 1, z, EAVE, { facing: low[0][2], half: "bottom", shape: "straight", waterlogged: "false" });
  else g.set(x, R - 1, z, ROOF);
}

// Warm light behind some windows
for (const [x, y, z] of glowAt) if (cell(x, z) && !g.get(x, y, z)) g.set(x, y, z, "glowstone");

// Tower: pinnacles on the top tier's corners, a spire on its centre
const top = [...at.values()].filter((c) => c.R === 22);
for (const c of top) {
  const outs = DIRS.filter(([dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return !n || n.R < 22; });
  if (outs.length >= 2) g.set(c.x, 22, c.z, "stone_brick_wall", { north: "none", east: "none", south: "none", west: "none", up: "true", waterlogged: "false" });
}
const mx = top.reduce((s, c) => s + c.x, 0) / top.length, mz = top.reduce((s, c) => s + c.z, 0) / top.length;
const centre = top.filter((c) => DIRS.every(([dx, dz]) => cell(c.x + dx, c.z + dz)?.R === 22))
  .sort((a, b) => Math.hypot(a.x - mx, a.z - mz) - Math.hypot(b.x - mx, b.z - mz))[0];
if (centre) {
  const wallUp = { north: "none", east: "none", south: "none", west: "none", up: "true", waterlogged: "false" };
  g.set(centre.x, 22, centre.z, "deepslate_tile_wall", wallUp);
  g.set(centre.x, 23, centre.z, "deepslate_tile_wall", wallUp);
  g.set(centre.x, 24, centre.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Main entrance on the north front: a dark oak door in the ground storey
const door = cell(21, 1);
if (door) {
  const d = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(21, door.gr, 1, "dark_oak_door", { ...d, half: "lower" });
  g.set(21, door.gr + 1, 1, "dark_oak_door", { ...d, half: "upper" });
}

const counts = { blocks: g.count(), palette: g.palette.length - 1 };
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86713.nbt");
console.log("DC86713", counts, out);
