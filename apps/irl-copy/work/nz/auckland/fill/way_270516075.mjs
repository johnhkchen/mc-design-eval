import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Eden Green: a four-storey 1930s commercial block in brick, with white concrete sills, lintels and cornice,
// blue-tinted glass in brick-piered bays, a stone plinth and shopfront, stepping down to two and three storeys
// on the lower wings. The footprint is the OSM outline; each column is solid from y 0 up to its ground, then
// the building up to a tier height snapped from the lidar roof.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270516075.cells.json", "utf8"));
const g = new Voxels([85, 32, 87]);

const PLINTH = "stone_bricks", BRICK = "bricks", TRIM = "white_concrete", GLASS = "light_blue_stained_glass_pane", FLOOR = "smooth_stone";

// lidar roof heights as clean tiers: two, three and four storeys, the top one with a cornice band
const tierOf = (r) => (r <= 9 ? 8 : r <= 15 ? 12 : r <= 17 ? 16 : 19);
const col = new Map(cells.map(([x, z, gr, r]) => [`${x},${z}`, { gr, T: Math.max(tierOf(r), gr + 4) }]));
const colAt = (x, z) => col.get(`${x},${z}`);
const inM = (x, y, z) => { const c = colAt(x, z); return !!c && y >= 0 && y < c.T; };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // horizontal (dx, dz)
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !inM(x + dx, y, z + dz));

const windows = [];   // glass panes, so some can be lit from inside
// Storey pattern on a street face: u is the position along the face. Piers every third bay, glass on the two
// rows between sill and lintel; interior is air except a floor slab on each storey line.
function facade(x, y, z, ex, T) {
  const [dx, dz] = ex[0];
  const u = dx ? z : x;
  if (y === 0) return g.set(x, y, z, PLINTH);
  if (y === T - 1) return g.set(x, y, z, TRIM);                      // cornice
  if (u % 3 === 0) return g.set(x, y, z, y < 4 ? PLINTH : BRICK);   // piers
  if (y % 4 === 0 || y % 4 === 3) return g.set(x, y, z, TRIM);      // sills and lintels
  const pane = dx ? { north: "true", south: "true" } : { east: "true", west: "true" };
  g.set(x, y, z, GLASS, pane);
  windows.push({ x, y, z, dx, dz });
}

for (const [key, { gr, T }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    if (y < gr) { g.set(x, y, z, PLINTH); continue; }                 // foundation up to the ground
    const ex = exposed(x, y, z);
    if (ex.length) facade(x, y, z, ex, T);
    else if (y === 0 || y === gr || y % 4 === 0 || y === T - 1) g.set(x, y, z, FLOOR);   // storey slab, roof deck
  }
  if (exposed(x, T - 1, z).length) g.set(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // parapet
}

// entrance: a window bay on the ground floor of the south (+z) face where there is one, the door, lintel above
const cands = [];
for (const [key, { gr }] of col) {
  if (gr > 1) continue;
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, 1, z);
  if (!ex.length) continue;
  if ((ex[0][0] ? z : x) % 3 === 0) continue;
  cands.push({ x, z, ex });
}
let front = cands.filter((c) => c.ex.some(([, dz]) => dz === 1));
if (!front.length) front = cands;
front.sort((a, b) => a.x - b.x);
const door = front[Math.floor(front.length / 2)];
if (door) {
  const [dx, dz] = door.ex.find(([, b]) => b === 1) ?? door.ex[0];
  const facing = FACING[`${dx},${dz}`];
  g.set(door.x, 1, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, 2, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// warm light behind about one lower pane in five: glowstone in the air gap, standing on the storey slab
let lit = 0;
for (const w of windows) {
  if (w.y % 4 !== 1 || (w.x * 7 + w.z * 3 + w.y) % 5) continue;
  const ix = w.x - w.dx, iz = w.z - w.dz;
  if (!inM(ix, w.y, iz) || g.get(ix, w.y, iz)) continue;
  g.set(ix, w.y, iz, "glowstone");
  lit++;
}

// roof plant room: a 5 x 5 block on the flat roof of the top tier, nearest its middle, clear of the parapet
const topCells = new Set([...col].filter(([, c]) => c.T === 19).map(([k]) => k));
const top = [...topCells].map((k) => k.split(",").map(Number));
const cx = top.reduce((s, [x]) => s + x, 0) / top.length, cz = top.reduce((s, [, z]) => s + z, 0) / top.length;
let best = null;
for (const [x, z] of top) {
  let inside = true;
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (!topCells.has(`${x + dx},${z + dz}`)) inside = false;
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (inside && (!best || d < best.d)) best = { x, z, d };
}
if (best) {
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    for (let y = 19; y <= 21; y++) g.set(best.x + dx, y, best.z + dz, BRICK);
    g.set(best.x + dx, 22, best.z + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270516075.nbt");
console.log(JSON.stringify({ ...out, windows: windows.length, lit, door: door ? [door.x, door.z] : null, plant: best ? [best.x, best.z] : null }));
