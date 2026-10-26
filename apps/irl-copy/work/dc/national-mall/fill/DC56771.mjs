// 901 New York Ave NW (Commercial-Office-Large), a 1960s-70s office block: a granite-look plinth, a light stone
// facade with glazed bays between piers, storey lines, a stepped roof from the lidar (tiers 3/15/18/20) and a
// small penthouse band on the core. Interiors are hollow: each storey is a floor slab, glass gets air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56771.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56771.nbt";

const M = {
  plinth: "polished_andesite",   // granite-look base course and piers
  floorLine: "quartz_bricks",    // storey lines
  wall: "smooth_quartz",         // the stone band at the top of each block
  glass: "light_blue_stained_glass_pane",
  inner: "smooth_stone",         // slabs and roof deck seen from inside or above
  cornice: "polished_andesite",
  door: "dark_oak_door",
  canopy: "polished_andesite",
  lamp: "glowstone",
  plant: "light_gray_concrete",
  vent: "iron_bars",
};

// The lidar roof, cleaned: a 3x3 median over footprint cells, then three flat tiers (plus the low pavilions as they are).
const key = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const median = (vals) => { const s = [...vals].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const tier = (r) => (r <= 5 ? r : r <= 16 ? 15 : r <= 18 ? 18 : 20);
for (const c of fp.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = fp.get(key(c.x + dx, c.z + dz)); if (n) near.push(n.r); }
  c.T = tier(median(near));
  c.B = c.g;                                        // the cell's own ground: its first block
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];  // +x, -x, +z, -z
// A neighbour is open at height y if it is off the footprint, below its ground, or above its roof.
const open = (x, y, z) => { const n = fp.get(key(x, z)); return !n || y < n.B || y >= n.T; };
const exposed = (c, y) => DIRS.filter(([dx, dz]) => open(c.x + dx, y, c.z + dz));

const V = new Voxels([51, 32, 30]);
const FLOORS = [0, 4, 7, 10, 13, 16];               // storey slabs, counted from the cell's ground
const glassAt = [];                                  // pane positions, for the connection and lamp pass

for (const c of fp.values()) {
  const { x, z, B, T } = c;
  if (B === 1) V.set(x, 0, z, M.plinth);             // foundation under a cell whose ground is 1
  for (let y = B; y < T; y++) {
    const rel = y - B;
    const out = exposed(c, y);
    const ext = out.length > 0;
    if (y === T - 1) { V.set(x, y, z, ext ? M.cornice : M.inner); continue; }          // roof deck, or a cornice on the edge
    if (y === T - 2) { V.set(x, y, z, ext ? M.wall : M.inner); continue; }             // ceiling band under the roof
    if (!ext) { if (FLOORS.includes(rel)) V.set(x, y, z, M.inner); continue; }        // hollow inside: floor slabs only
    if (rel === 0) { V.set(x, y, z, M.plinth); continue; }                           // base course
    if (FLOORS.includes(rel)) { V.set(x, y, z, M.floorLine); continue; }             // storey line
    // Entrance: a recessed lobby at the front, with a pair of doors and a lintel over them.
    if (z === 2 && x >= 20 && x <= 22 && rel <= 3) {
      if (rel === 3) { V.set(x, y, z, M.plinth); continue; }
      if (x === 21) { V.set(x, y, z, M.door, { facing: "north", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    }
    const corner = out.length >= 2;
    const [dx, dz] = out[0];
    const alongX = dz !== 0;                         // a face on +-z runs along x
    const idx = alongX ? x : z;
    if (corner || idx % 3 === 0) { V.set(x, y, z, M.wall); continue; }                 // light stone piers between bays
    V.set(x, y, z, M.glass);
    glassAt.push({ x, y, z, rel, out: out[0] });
  }
}

// Panes join their neighbours in the plane of the wall (not out or in), so a bay reads as one run of glass.
const isBlock = (x, y, z) => V.val(x, y, z) !== 0;
const paneState = (x, y, z, alongX) => ({
  north: String(!alongX && isBlock(x, y, z - 1)),
  south: String(!alongX && isBlock(x, y, z + 1)),
  east: String(alongX && isBlock(x + 1, y, z)),
  west: String(alongX && isBlock(x - 1, y, z)),
  waterlogged: "false",
});
for (const p of glassAt) {
  const alongX = p.out[1] !== 0;
  V.set(p.x, p.y, p.z, M.glass, paneState(p.x, p.y, p.z, alongX));
}

// Warm light: a glowstone just inside some lower-row bays, on the floor slab, behind the glass.
for (const p of glassAt) {
  if (p.rel !== 1 || (p.x * 7 + p.z * 5) % 4 !== 0) continue;
  const ix = p.x - p.out[0], iz = p.z - p.out[1];
  const n = fp.get(key(ix, iz));
  if (n && !open(ix, p.y, iz) && V.val(ix, p.y, iz) === 0) V.set(ix, p.y, iz, M.lamp);
}

// The entrance canopy: a flat hood off the lintel, one block out from the lobby wall (it stands on the lintel).
for (let x = 19; x <= 23; x++) V.set(x, 4, 1, M.canopy);

// Roof plant: a plant room on the core's penthouse band and two small boxes on the wing decks, standing on the deck.
for (const c of fp.values()) {
  if (c.T === 20 && c.x >= 17 && c.x <= 24 && c.z >= 9 && c.z <= 14 && !exposed(c, 19).length) {
    V.set(c.x, 20, c.z, M.plant); V.set(c.x, 21, c.z, M.vent);
  }
  if (c.T === 18 && c.x >= 6 && c.x <= 9 && c.z === 12 && !exposed(c, 17).length) V.set(c.x, 18, c.z, M.plant);
}

const info = V.save(OUT);
console.log(`saved ${OUT}: ${info.blocks} blocks, ${info.palette} palette entries`);
