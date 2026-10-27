// Queens Park Residences: a 1980s reinforced-concrete apartment tower on a stepped podium, painted white with tinted
// glazing, about 15 storeys of 4 blocks. The lidar roof is smoothed (3x3 median) and snapped to three tiers: the tower
// (58), a 13-storey shoulder (52) and low wings. Storey lines sit on the cell's own ground and every 4 blocks above it,
// so the floors line up across the stepped footprint. Facades go only where a face is outside the building (nothing
// beside it, or the neighbour's roof is below that height); the inside is air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020888.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020888.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([40, 72, 28]);

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const k2 = (x, z) => `${x},${z}`;
const at = new Map();
for (const [x, z, ground, roof] of cells) at.set(k2(x, z), { x, z, g: ground, r: roof });
const cell = (x, z) => at.get(k2(x, z));

// Tiers: roof = median of the 3x3 footprint neighbourhood, snapped to 58 / 52 / low wing (a multiple of 4).
// S = the floor slabs: the ground, then every 4 blocks above it that clears the ground by 3 and stops 5 below the roof.
for (const c of at.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  const m = vals[vals.length >> 1];
  c.T = m >= 56 ? 58 : m >= 40 ? 52 : Math.max(Math.round(m / 4) * 4, c.g + 8);
  c.S = new Set([c.g]);
  for (let y = 4; y <= c.T - 5; y += 4) if (y >= c.g + 3) c.S.add(y);
}

// The faces of a cell at height y that are outside the building.
const exposed = (x, z, y) => DIRS.filter((d) => { const n = cell(x + d.dx, z + d.dz); return !n || y >= n.T; });
// Rows above a cell's latest floor slab: 0 is the slab itself.
const rowOf = (c, y) => { let base = c.g; for (const s of c.S) if (s <= y && s > base) base = s; return y - base; };
// Which lit windows: a deterministic 1 in 11, so the dusk glow is spread across the facade.
const lit = (x, y, z) => ((((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 11) === 0;

// Column by column: foundation, roof, plinth, floor slabs, then the facade rows of each storey.
for (const c of at.values()) {
  const { x, z } = c;
  const shopfront = c.T <= 24;                                  // the east wing is commercial: glass at street level
  for (let y = 0; y < c.T; y++) {
    const ext = exposed(x, z, y);
    if (y < c.g) { g.set(x, y, z, ext.length ? "stone_bricks" : "stone"); continue; }
    if (y === c.T - 1) { g.set(x, y, z, "gray_concrete"); continue; }                // tar roof
    if (ext.length && y < c.g + 2) { g.set(x, y, z, "stone_bricks"); continue; }     // base course
    if (c.S.has(y)) { g.set(x, y, z, "light_gray_concrete"); continue; }            // floor slab / storey line
    if (!ext.length) continue;                                                       // interior: air
    const row = rowOf(c, y);
    if (y === c.T - 2) { g.set(x, y, z, "light_gray_concrete"); continue; }          // course under the roof
    if (row >= 3) { g.set(x, y, z, "white_concrete"); continue; }                    // spandrel
    const face = ext[0];
    const u = face.dz !== 0 ? x : z;                                                 // position along the face
    if (!(shopfront && y < c.g + 3) && u % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // pier
    g.set(x, y, z, "light_blue_stained_glass");
    const inner = cell(x - face.dx, z - face.dz);
    if (inner && inner.T > y && inner.g <= y && lit(x, y, z)) g.set(inner.x, y, inner.z, "glowstone");
  }
}

// Parapet and cornice on the outside edge of each tier.
for (const c of at.values()) {
  if (!exposed(c.x, c.z, c.T).length) continue;
  if (c.T === 58) { g.set(c.x, 58, c.z, "light_gray_concrete"); g.set(c.x, 59, c.z, "white_concrete"); }
  else g.set(c.x, c.T, c.z, "light_gray_concrete");
}

// Roof plant room: an 8 x 5 block on the tower roof, with louvred glass on its sides and a white cap.
const core = (x, z) => { const c = cell(x, z); return !!c && c.T === 58 && DIRS.every((d) => { const n = cell(x + d.dx, z + d.dz); return n && n.T === 58; }); };
const W = 8, D = 5;
let room = null;
for (const c of at.values()) {
  let ok = true;
  for (let dz = 0; dz < D && ok; dz++) for (let dx = 0; dx < W && ok; dx++) if (!core(c.x + dx, c.z + dz)) ok = false;
  if (!ok) continue;
  const score = Math.abs(c.x + W / 2 - 20) + Math.abs(c.z + D / 2 - 13);
  if (!room || score < room.score) room = { x: c.x, z: c.z, score };
}
if (room) {
  for (let dz = 0; dz < D; dz++) for (let dx = 0; dx < W; dx++) {
    const x = room.x + dx, z = room.z + dz, edge = dx === 0 || dz === 0 || dx === W - 1 || dz === D - 1;
    g.set(x, 61, z, "white_concrete");
    if (!edge) continue;
    g.set(x, 58, z, "light_gray_concrete");
    g.set(x, 60, z, "light_gray_concrete");
    g.set(x, 59, z, (dx + dz) % 2 ? "light_blue_stained_glass" : "light_gray_concrete");
  }
}

// Entrance: a single street-facing tower cell at the lowest ground, its neighbours on the same face, a glass
// transom, a dark canopy band over the door and a warm lobby behind it.
let door = null;
for (const c of at.values()) {
  if (c.T !== 58) continue;
  const e = exposed(c.x, c.z, c.g + 1);
  if (e.length !== 1) continue;
  const d = e[0];
  const along = d.dz !== 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
  const nb = along.map(([ax, az]) => cell(c.x + ax, c.z + az));
  if (nb.some((n) => !n || n.T !== 58 || !exposed(n.x, n.z, c.g + 1).includes(d))) continue;
  if (!door || c.g < door.c.g) door = { c, d, along };
}
if (door) {
  const { c, d, along } = door;
  const facing = d.name;
  g.set(c.x, c.g, c.z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, c.g + 1, c.z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const [ax, az] of [[0, 0], ...along]) {
    const n = cell(c.x + ax, c.z + az);
    g.set(n.x, n.g + 2, n.z, "light_blue_stained_glass");
    g.set(n.x, n.g + 3, n.z, "gray_concrete");
  }
  const inner = cell(c.x - d.dx, c.z - d.dz);
  if (inner && inner.T > c.g + 1) g.set(inner.x, c.g + 1, inner.z, "glowstone");
}

const stats = g.save(OUT);
console.log(`way_293020888: ${stats.blocks} blocks, ${stats.palette} palette entries; roof room ${room ? "placed" : "none"}, door ${door ? door.d.name : "none"}`);
