// 38 West 48th Street, 1926 commercial and office building: a 12-storey brick office block with a two-storey street base
// on the 48th Street front (the south face, z 27), a setback shaft and a copper-clad mechanical penthouse on the roof.
// The footprint is an L (x 0-7 for z 0-17, x 0-8 for z 18-27). Tiers are read off the lidar and smoothed: a 28-block
// shoulder at the north end, a 36-block bay over z 2-4, the 37-block shaft (east side stepped down to 34 for z 5-17), a
// 35 step at z 23, a 27-block terrace at z 24-25 and the 6-block street base at z 26-27. Lidar gaps inside the footprint
// are filled to their neighbours' tier. Brick walls with calcite storey lines, a granite base course and coping; windows
// are recessed one block with a brick reveal and the glass one block in, with solid core behind (no interiors), and a
// warm glowstone sits behind some lower panes. Shopfronts sit on the ground floor of the street face, with a recessed
// entrance at x 4.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034496.cells.json`, "utf8"));
const X = 9, Y = 49, Z = 28;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const FOOT = [...cell.keys()].map((k) => k.split(",").map(Number));

// Roof tiers (block tops above y 0), smoothed from the lidar. 0 = outside the footprint.
const topOf = (x, z) => {
  if (z <= 1) return 28;
  if (z <= 4) return 36;
  if (z <= 17) return x <= 4 ? 37 : 34;
  if (z <= 22) return 37;
  if (z === 23) return 35;
  if (z <= 25) return 27;
  return 6;
};
const top = (x, z) => (inFoot(x, z) ? topOf(x, z) : 0);
const solid = (x, y, z) => top(x, z) > y;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// An exposed face: a solid cell at y whose neighbour in direction d is open at y (outside the footprint or lower).
const exposed = (x, y, z, d) => { const [dx, dz] = DIRS[d]; return solid(x, y, z) && !solid(x + dx, y, z + dz); };

const CORE = "bricks", DECK = "smooth_stone", BASE = "polished_granite", LINE = "calcite", GLASS = "glass_pane";
const PANE_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane in a wall along x
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane in a wall along z
const paneFor = (dx) => (dx === 0 ? PANE_X : PANE_Z);
const warm = (u, y, dx) => (u * 5 + y * 7 + (dx === 0 ? 0 : 3)) % 4 === 0;                            // about one pane in four, deterministic

const g = new Voxels([X, Y, Z]);

// 1. Solid mass: foundation from y 0 up to each cell's ground (all zero here), the core to its tier, a roof deck on top.
for (const [x, z] of FOOT) {
  const { ground } = cell.get(`${x},${z}`), t = topOf(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  for (let y = ground; y < t; y++) g.set(x, y, z, y === t - 1 ? DECK : CORE);
}

// 2. Faces: pier and recess. Piers (corners, every third column, and any column whose inner cells are lower than its
// own tier) stay brick proud of the wall, with a calcite floor line every third block and a coping at the roof edge.
// Every other column is recessed one block: its outer cells are air from the base up to the roof, and the calcite
// spandrels, glass panes (glowstone behind some lower rows) and the cap sit one block in. Nothing in the outer
// layer is ever above air, so the spandrels stand on the piers' brick and on the recessed layer beneath them.
// A column on face d is a pier unless it sits clear of corners, off the every-third-block grid, and has two solid cells behind.
const isPier = (x, z, y, d) => {
  const [dx, dz] = DIRS[d], [ax, az] = dx === 0 ? [1, 0] : [0, 1];
  const t = topOf(x, z), u = dx === 0 ? x : z;
  const corner = !exposed(x + ax, y, z + az, d) || !exposed(x - ax, y, z - az, d);
  return corner || u % 3 === 0 || top(x - dx, z - dz) < t || top(x - 2 * dx, z - 2 * dz) < t;
};
// Planning: a recessed column claims the two cells behind it (for every row). Two recesses can't share a cell (they meet at
// the corners), so a column that claims a cell already taken becomes a pier.
const DEEP = (x, z, d) => { const [dx, dz] = DIRS[d]; return [[x - dx, z - dz], [x - 2 * dx, z - 2 * dz]]; };
// A column is recessed only if no row of it is a pier, so a recess never sits under a pier (a step changes the corner test).
const recessed = new Set(), taken = new Set();
for (const [x, z] of FOOT) for (const d of Object.keys(DIRS)) {
  const t = topOf(x, z);
  let wins = false, pier = false;
  for (let y = 1; y < t; y++) if (exposed(x, y, z, d)) { wins = true; if (isPier(x, z, y, d)) pier = true; }
  if (!wins || pier) continue;
  const cells = DEEP(x, z, d).map(([a, b]) => `${a},${b}`);
  if (cells.some((c) => taken.has(c))) continue;
  cells.forEach((c) => taken.add(c));
  recessed.add(`${x},${z},${d}`);
}
for (const [x, z] of FOOT) {
  const t = topOf(x, z);
  for (const d of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;
    const inA = [x - dx, z - dz], inB = [x - 2 * dx, z - 2 * dz];
    const win = recessed.has(`${x},${z},${d}`);
    for (let y = 0; y < t; y++) {
      if (!exposed(x, y, z, d)) continue;
      if (y === 0) { g.set(x, y, z, BASE); continue; }                       // base course, all round
      if (!win) { g.set(x, y, z, y % 3 === 0 && y < t - 1 ? LINE : CORE); continue; }
      g.set(x, y, z, "air");
      const cap = y % 3 === 0 || y === t - 1;                                 // spandrel or cap, one in
      if (cap) { g.set(inA[0], y, inA[1], LINE); continue; }
      g.set(inA[0], y, inA[1], GLASS, paneFor(dx));
      if (y % 3 === 1 && warm(u, y, dx)) g.set(inB[0], y, inB[1], "glowstone");   // a lamp behind some panes, core above and below
    }
    // Coping: a calcite cap one block above each roof edge (on the pier, or on the recessed cap of a window column).
    if (exposed(x, t - 1, z, d)) {
      if (!recessed.has(`${x},${z},${d}`) || isPier(x, z, t - 1, d)) g.set(x, t, z, LINE);
      else if (top(...inA) === t) g.set(inA[0], t, inA[1], LINE);
    }
  }
}

// 3. Street entrance on the 48th Street front (z 27): a recess at x 4-5 with a granite threshold, a dark oak door one
// block in, a glass transom above it and a sidelight beside it, with a standing lantern by the step and a calcite
// marquee over the bay on the recessed layer.
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(4, 0, 26, "dark_oak_door", { ...DOOR, half: "lower" });
g.set(4, 1, 26, "dark_oak_door", { ...DOOR, half: "upper" });
g.set(4, 2, 26, GLASS, PANE_X);
g.set(5, 1, 27, "lantern", { hanging: "false", waterlogged: "false" });

// 5. Mechanical penthouse on the 37-block shaft (x 1-3, z 9-13): a copper-clad box with a cut-copper cap.
for (let x = 1; x <= 3; x++) for (let z = 9; z <= 13; z++) {
  for (const y of [37, 38]) g.set(x, y, z, "waxed_oxidized_copper");
  g.set(x, 39, z, "waxed_oxidized_cut_copper");
}

// Check: nothing floats. Every block above y 0 needs a block under it, except a hanging lantern.
let floating = 0;
for (let z = 0; z < Z; z++) for (let y = 1; y < Y; y++) for (let x = 0; x < X; x++) {
  const b = g.get(x, y, z);
  if (!b || (b.block === "minecraft:lantern" && b.state?.hanging === "true")) continue;
  if (!g.get(x, y - 1, z)) floating++;
}
if (floating) console.warn(`${floating} blocks have nothing under them`);

const saved = g.save(`${DIR}/NYC1034496.nbt`);
console.log(`NYC1034496.nbt: ${saved.blocks} blocks, ${saved.palette} palette entries`);
