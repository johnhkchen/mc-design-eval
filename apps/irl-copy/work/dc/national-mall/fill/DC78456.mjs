// DC78456: a Beaux-Arts office block of the 1900s on the Mall's edge. Four storeys at the core (roof 8), three in the
// wings (roof 6-7), a polished granite plinth, calcite walls with quartz pilasters, a stone belt course at each floor
// line, and a shell with an air gap behind every window and a floor slab per storey. The lidar's roof heights are
// smoothed to a 3x3 median and then read as tiers, so the core's setback steps in from the wings.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78456.cells.json", "utf8"));
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inF = (x, z) => raw.has(`${x},${z}`);

// roof tier per cell: two passes of a 3x3 median over the lidar roof heights (footprint cells only), so a lone
// one-block bump on a wing reads as the wing and the core's 8 stays one contiguous tier
const median3 = (src) => {
  const out = new Map();
  for (const [x, z] of cells.map(([x, z]) => [x, z])) {
    const vals = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (src.has(`${x + dx},${z + dz}`)) vals.push(src.get(`${x + dx},${z + dz}`));
    vals.sort((a, b) => a - b);
    out.set(`${x},${z}`, vals[Math.floor(vals.length / 2)]);
  }
  return out;
};
const top = median3(median3(new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]))));
const T = (x, z) => top.get(`${x},${z}`);
const G = (x, z) => raw.get(`${x},${z}`).g;

// horizontal directions: [dx, dz, name of the direction]
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
// the sides of cell (x,z) at height y that face air (outside the footprint, or a neighbour whose roof is below y)
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || T(x + dx, z + dz) <= y);

const g = new Voxels([12, 20, 12]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const BASE = "polished_granite", WALL = "calcite", TRIM = "calcite", BELT = "stone_bricks", CAP = "smooth_stone";
const GLASS = "glass", FLOOR = "smooth_stone", DOOR = "dark_oak_door", LINTEL = "dark_oak_slab", WARM = "glowstone";
const BELT_ROWS = [2, 4, 6], WINDOW_ROWS = [1, 3, 5];

// the entrance: the face with the most wall at its first storey, and the cell at the middle of its run
const faceRun = new Map(DIRS.map(d => [d[2], []]));
for (const [x, z] of cells.map(([x, z]) => [x, z])) for (const d of exposed(x, z, 1)) faceRun.get(d[2]).push([x, z, d]);
let face = null;
for (const [name, run] of faceRun) if (run.length && (!face || run.length > face.run.length)) face = { name, run };
const alongOf = (d, x, z) => (d[0] === 0 ? x : z);
const doorRun = face.run.filter(([, , d]) => d[2] === face.name).sort((a, b) => alongOf(a[2], a[0], a[1]) - alongOf(b[2], b[0], b[1]));
const [dxW, dzW, dW] = doorRun[Math.floor(doorRun.length / 2)];
const inward = { east: "west", west: "east", north: "south", south: "north" }[dW[2]];
const doorKey = `${dxW},${dzW}`;

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = T(x, z), gr = G(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);            // foundation up to this cell's ground
  for (let y = gr; y < t; y++) {
    const exp = exposed(x, z, y);
    if (y === 0) { put(x, y, z, BASE); continue; }            // plinth course
    if (y === t - 1) { put(x, y, z, exp.length ? BELT : CAP); continue; }   // cornice on the shell, roof cap inside
    if (!exp.length) {                                         // interior: the floor slab of each storey, air between
      if (BELT_ROWS.includes(y)) put(x, y, z, FLOOR);
      continue;
    }
    if (BELT_ROWS.includes(y)) { put(x, y, z, BELT); continue; }
    // a window row: pilasters at the corners and every third bay, glass with an air gap behind it
    const corner = exp.length > 1;
    const pilaster = corner || exp.some(d => alongOf(d, x, z) % 3 === 0);
    if (pilaster) { put(x, y, z, TRIM); continue; }
    if (y === 1 && doorKey === `${x},${z}`) continue;          // door cell, set below
    put(x, y, z, GLASS);
    const d = exp[0], ix = x - d[0], iz = z - d[1];           // the cell behind the glass
    if (inF(ix, iz) && !exposed(ix, iz, y).length && (x + z + y) % 4 === 0 && y < T(ix, iz) - 1) {
      put(ix, y, iz, WARM);
    }
  }
}

// the door: two cells tall, a dark oak lintel over it at the next storey line, and a warm light in the hall behind it
const facing = inward;
put(dxW, 1, dzW, DOOR, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
put(dxW, 2, dzW, DOOR, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
put(dxW, 3, dzW, LINTEL, { type: "bottom", waterlogged: "false" });
const hx = dxW - dW[0], hz = dzW - dW[1];
if (inF(hx, hz)) put(hx, 1, hz, "lantern", { hanging: "false", waterlogged: "false" });

// roof plant on the core: two brick flues over the interior of the tallest tier
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (T(x, z) < 8 || exposed(x, z, 7).length || (x % 4 !== 1) || (z % 3 !== 2)) continue;
  put(x, 8, z, "bricks"); put(x, 9, z, "bricks");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78456.nbt");
console.log("DC78456 built:", g.count(), "blocks,", g.palette.length - 1, "palette entries; entrance on", face.name, "face");
