import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Moore, Clarence, House (Old Canadian Embassy): a turn-of-the-century Beaux-Arts townhouse in sandstone
// (the manifest's wall), three storeys on the lidar's tall part, a two-storey wing where the roof falls to 8.
// Each storey is 3 blocks (floor slab at its foot, windows in the two rows above), a cornice course under the roof slab,
// a stone parapet at the roof edge, a skylight and two brick chimneys. Walls are shells: interiors are air.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC53999.cells.json`, "utf8"));

const W = 13, D = 15, H = 14;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, gr, roof] of cells) cell.set(key(x, z), { gr, roof });
const has = (x, z) => cell.has(key(x, z));

// the lidar roof, median over a 3x3 window so single noisy cells do not make bumps but the low edge survives
function smoothRoof(x, z) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = cell.get(key(x + dx, z + dz)); if (c) v.push(c.roof);
  }
  v.sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
}

// T = the roof slab's height. Tall (3 storeys, roof at 10, parapet to 11) or wing (2 storeys, roof at 6, parapet to 7)
const T = new Map();
for (const [x, z] of cells.map(c => [c[0], c[1]])) T.set(key(x, z), smoothRoof(x, z) >= 9.5 ? 10 : 6);
const top = (x, z) => T.get(key(x, z)) ?? -1;

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };

// a face is outside at height y if nothing stands beside it there: no neighbour, or the neighbour's roof is below y
function exposedFaces(x, z, y) {
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz) || y >= top(nx, nz)) out.push(d);
  }
  return out;
}

// the kind of wall course at height y in a tower of roof height t
function course(y, t) {
  if (y === 0) return "base";
  if (y === t - 1) return "cornice";
  if (y % 3 === 0) return "band";
  return "win";
}

const ENTRANCE_X = 6;                 // the north (z = 0) facade, centred
const glassAt = new Set();

function window(x, y, z, face) {
  // a pane, connected along the facade (the face's axis), not out of it
  const along = face === "n" || face === "s" ? ["w", "e"] : ["n", "s"];
  const st = { north: "false", south: "false", east: "false", west: "false" };
  for (const d of along) {
    const [dx, dz] = DIRS[d];
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz)) st[{ n: "north", s: "south", e: "east", w: "west" }[d]] = "true";
  }
  return { block: "glass_pane", state: st };
}

// Floors and walls, column by column
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const t = top(x, z);

  // a floor slab for each storey and the plinth: solid across the footprint
  g.set(x, 0, z, "stone_bricks");
  for (const fy of [3, 6]) if (fy < t) g.set(x, fy, z, "smooth_stone");

  for (let y = 0; y < t; y++) {
    const faces = exposedFaces(x, z, y);
    if (!faces.length) continue;
    const ns = faces.some(f => f === "n" || f === "s");
    const ew = faces.some(f => f === "e" || f === "w");
    const c = course(y, t);

    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }   // base course, all round
    if (c === "cornice") { g.set(x, y, z, "chiseled_stone_bricks"); continue; }
    if (c === "band") { g.set(x, y, z, "smooth_stone"); continue; }

    // windows rows: corners are quoins; elsewhere the bays alternate pier and window
    if (ns && ew) { g.set(x, y, z, "quartz_pillar"); continue; }
    const face = faces[0];
    const along = face === "n" || face === "s" ? x : z;
    const isWin = along % 2 === 1;
    if (!isWin) { g.set(x, y, z, "smooth_sandstone"); continue; }
    const pane = window(x, y, z, face);
    g.set(x, y, z, pane.block, pane.state);
    glassAt.add(`${x},${y},${z},${face}`);
  }

  // roof slab, then the parapet on the roof edge
  g.set(x, t, z, "stone");
  const edge = Object.entries(DIRS).some(([, [dx, dz]]) => !has(x + dx, z + dz) || top(x + dx, z + dz) < t);
  if (edge) g.set(x, t + 1, z, "smooth_sandstone");   // a solid parapet course, not battlements
}

// warm lights behind some glass on the first and second storeys: an air gap behind the pane, a glowstone in it
for (const k of glassAt) {
  const [x, y, z, face] = k.split(",");
  const X = +x, Y = +y, Z = +z;
  if (Y !== 1 && Y !== 4) continue;
  if (X % 4 !== 1) continue;
  const [dx, dz] = DIRS[face];
  const ix = X - dx, iz = Z - dz;      // the inside is the opposite way to the outward face
  if (!has(ix, iz)) continue;
  if (g.get(ix, Y, iz)) continue;
  g.set(ix, Y, iz, "glowstone");
}

// the entrance on the north face: pilasters, a door and a chiseled hood over
for (const x of [ENTRANCE_X - 1, ENTRANCE_X + 1]) {
  g.set(x, 1, 0, "quartz_pillar");
  g.set(x, 2, 0, "quartz_pillar");
}
g.set(ENTRANCE_X, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ENTRANCE_X, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [ENTRANCE_X - 1, ENTRANCE_X, ENTRANCE_X + 1]) g.set(x, 3, 0, "chiseled_stone_bricks");

// a skylight over the tall tier's middle, and two brick chimneys on its roof
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (top(x, z) !== 10) continue;
  if (x >= 4 && x <= 8 && z >= 5 && z <= 9) g.set(x, 10, z, "glass");
}
for (const [x, z] of [[9, 3], [3, 11]]) {
  if (top(x, z) !== 10) continue;
  g.set(x, 11, z, "bricks");
  g.set(x, 12, z, "bricks");
}

const out = `${DIR}/DC53999.nbt`;
const stats = g.save(out);
const tall = [...T.values()].filter(v => v === 10).length;
console.log(JSON.stringify({ cells: cells.length, tall, wing: cells.length - tall, ...stats, out }));
