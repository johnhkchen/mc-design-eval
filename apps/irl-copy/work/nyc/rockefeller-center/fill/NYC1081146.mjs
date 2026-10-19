// Colgate-Palmolive Building (300 Park Avenue, 1954): a 1950s International-style slab. The lidar reads one tower of
// about 29 storeys (87 blocks) stepping down through lower wings to open ground, so the massing is the lidar's tiers:
// each cell takes its 3x3 median roof, snapped to a whole three-block storey. Every column stands on the ground, so
// nothing floats and each tier sits on the one below. The facade is a pale stone base (three storeys, storey bands)
// over a glass-and-aluminium curtain wall (white spandrels, iron mullions, light-blue glass with warm lights behind some
// panes). The entrance is on the north (Park Avenue) face at the low z edge: two doors, glass, a black canopy band.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1081146.cells.json", "utf8"));
const STOREY = 3, BASE = 9;                              // three-block storeys; the stone base is the first three
const key = (x, z) => `${x},${z}`;
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));

// Clean tiers from the lidar. Open ground (roof 1-2) stays one block of ground.
const top = new Map();
for (const [x, z, , r] of cells) {
  if (r <= 2) { top.set(key(x, z), 1); continue; }
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const q = roof.get(key(x + dx, z + dz)); if (q > 2) near.push(q); }
  near.sort((a, b) => a - b);
  top.set(key(x, z), Math.max(STOREY, Math.round(near[near.length >> 1] / STOREY) * STOREY));
}
const hAt = (x, z) => top.get(key(x, z)) ?? 0;          // outside the footprint there is no building
const maxT = Math.max(...top.values());
// True when every cell within r is at least as tall as this one: the cell is inside its tier, not on an edge.
const deep = (x, z, r, t) => { for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (hAt(x + dx, z + dz) < t) return false; return true; };

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];        // north (low z, Park Avenue), south, west, east
const vox = new Map();                                   // "x,y,z" -> { x, y, z, block, state }
const put = (x, y, z, block, state) => vox.set(`${x},${y},${z}`, { x, y, z, block, state });
const panes = new Map();                                 // glazing, connected to its neighbours after the walls are placed

const ENTRANCE = (x, y, z) => z === 0 && x >= 27 && x <= 30 && y >= 1 && y <= 3;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = hAt(x, z);
  for (let y = 0; y < t; y++) {
    const faces = DIRS.filter(([dx, dz]) => hAt(x + dx, z + dz) <= y);   // faces that look onto air
    if (!faces.length) {
      // Interior: a floor slab each storey and a roof slab on top, air between (no rooms).
      if (y === 0) put(x, y, z, "stone");
      else if (y === t - 1 || y % STOREY === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }
    const [dx, dz] = faces[0];
    if (y === 0 || y === t - 1) { put(x, y, z, "smooth_stone"); continue; }     // plinth and coping
    if (dz === -1 && z === 0 && x >= 26 && x <= 31 && y === 4) { put(x, y, z, "black_concrete"); continue; }   // canopy band
    if (dz === -1 && ENTRANCE(x, y, z)) {
      if (y <= 2 && (x === 28 || x === 29)) { put(x, y, z, "iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 28 ? "left" : "right", open: "false", powered: "false" }); continue; }
      const e = { x, y, z, pane: true, dz }; panes.set(`${x},${y},${z}`, e); continue;
    }
    if (y < BASE) { put(x, y, z, y % STOREY === 0 ? "smooth_stone" : "calcite"); continue; }   // stone base, storey bands
    if (y % STOREY === 0) { put(x, y, z, "white_concrete"); continue; }                         // spandrel at each storey line
    const along = dz ? x : z;
    if (along % 2 === 0) { put(x, y, z, "iron_block"); continue; }                              // aluminium mullion
    panes.set(`${x},${y},${z}`, { x, y, z, dz: dz || 0, dx: dx || 0 });
  }
}

// Glazing: connect each pane to its neighbours in the same face; warm lights behind some panes.
let lit = 0;
for (const p of panes.values()) {
  const has = (x, y, z) => panes.has(`${x},${y},${z}`);
  const north = !!p.dz && has(p.x, p.y, p.z - 1), south = !!p.dz && has(p.x, p.y, p.z + 1);
  const west = !p.dz && has(p.x - 1, p.y, p.z), east = !p.dz && has(p.x + 1, p.y, p.z);
  put(p.x, p.y, p.z, "light_blue_stained_glass_pane", { north: String(north), south: String(south), east: String(east), west: String(west), waterlogged: "false" });
  if (!p.pane && (p.x * 7 + p.y * 5 + p.z * 3) % 29 === 0) {          // interior cell behind the glass
    const ix = p.x - (p.dx || 0), iz = p.z - (p.dz || 0);
    if (!vox.has(`${ix},${p.y},${iz}`)) { put(ix, p.y, iz, "glowstone"); lit++; }
  }
}
// Lobby lights behind the entrance glass.
for (const [x, y, z] of [[28, 1, 1], [29, 1, 1], [27, 2, 1], [30, 2, 1]]) if (!vox.has(`${x},${y},${z}`)) put(x, y, z, "glowstone");

// Mechanical penthouse on the tallest tier, and roof plant on the lower tiers; each stands on a roof slab.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = hAt(x, z);
  if (t === maxT && deep(x, z, 2, t)) {
    for (let y = t; y < t + 3; y++) put(x, y, z, y === t + 2 ? "light_gray_concrete" : "calcite");
  } else if (t >= BASE && deep(x, z, 1, t) && (x * 5 + z * 11) % 37 === 0) {
    put(x, t, z, "light_gray_concrete");
    put(x, t + 1, z, "iron_block");
  }
}

const g = new Voxels([43, 99, 54]);
for (const e of vox.values()) g.set(e.x, e.y, e.z, e.block, e.state);
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1081146.nbt";
const { blocks, palette } = g.save(out);
console.log(`tower ${maxT} blocks, ${blocks} blocks, ${palette} palette entries, ${panes.size} glazed cells, ${lit} lights behind glass -> ${out}`);
