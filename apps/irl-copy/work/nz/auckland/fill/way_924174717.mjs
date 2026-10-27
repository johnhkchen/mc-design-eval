// Ten Twelve Federal, Auckland CBD: an 1980s-style concrete office block on a basalt plinth. A low wing and a mid podium
// step up to a tower one storey higher, with a cyan-tinted glass grid between white concrete mullions and spandrels,
// a double-height shopfront and an iron entrance door on the north face. Solid shell (1 block thick), air behind the
// glass, a floor plate per storey, and a roof plant room on the tower. Lit windows show warm glowstone behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_924174717.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_924174717.nbt";
const SIZE = [25, 46, 26];

const BASE = "polished_andesite";    // Auckland basalt: foundation, plinth, ground deck
const CONCRETE = "white_concrete";   // frame, mullions, spandrels, parapet
const SLAB = "light_gray_concrete";  // floor plates
const ROOF = "gray_concrete";        // roof membrane
const GLASS = "cyan_stained_glass_pane";
const FLOORS = [0, 8, 12, 16, 20, 24, 28, 32]; // floor lines: 8-high ground floor (shopfront), 4-high storeys above

// Lidar roof (median-smoothed) -> one of four flat tiers, by the top surface height: wing 13, podium 17, mid 29, tower 33.
const tierTop = (r) => (r <= 14 ? 13 : r <= 22 ? 17 : r <= 30 ? 29 : 33);
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const F = new Map();
for (const [x, z, g, r] of cells) F.set(`${x},${z}`, { x, z, g, r });
const at = (x, z) => F.get(`${x},${z}`);

for (const c of F.values()) {
  const rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) rs.push(n.r); }
  c.T = tierTop(median(rs)) - 1;               // index of the cell's top (roof) block
}

// Exposed faces: outside the footprint (all rows), or against a lower tier (only the rows above that tier's roof).
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
for (const c of F.values()) {
  c.exp = [];
  for (const [name, dx, dz] of DIRS) {
    const n = at(c.x + dx, c.z + dz);
    if (!n) c.exp.push({ name, dx, dz, level: -1 });
    else if (n.T < c.T) c.exp.push({ name, dx, dz, level: n.T });
  }
  c.shell = c.exp.length > 0;
}

const B = new Map();
const put = (x, y, z, block, state) => { if (x < 0 || y < 0 || z < 0 || x >= SIZE[0] || y >= SIZE[1] || z >= SIZE[2]) return; B.set(`${x},${y},${z}`, { x, y, z, block, state }); };
const has = (x, y, z) => B.has(`${x},${y},${z}`);

// What a shell row is: plinth, glazing, spandrel or floor line. Ground floor: plinth 0-1, glass 2-5, concrete 6-7.
function rowKind(y) {
  if (y <= 1) return "base";
  if (y < 8) return y <= 5 ? "glass" : "spandrel";
  if (FLOORS.includes(y)) return "slab";
  const below = Math.max(...FLOORS.filter((f) => f < y));
  return y - below === 3 ? "spandrel" : "glass";
}
const KIND_BLOCK = { base: BASE, glass: CONCRETE, spandrel: CONCRETE, slab: CONCRETE };

for (const c of F.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) put(x, y, z, BASE);            // foundation: nothing floats on the downhill side
  if (c.shell) {
    for (let y = Math.max(g, 0); y <= T; y++) put(x, y, z, KIND_BLOCK[rowKind(y)]);
    put(x, T + 1, z, CONCRETE);                              // parapet on every shell edge
    for (const e of c.exp) {
      for (let y = Math.max(g, e.level + 1, 0); y <= T; y++) {
        const kind = rowKind(y);
        if (kind === "base" && e.level === -1) { put(x, y, z, BASE); continue; }
        if (kind !== "glass") continue;
        const along = e.dx !== 0 ? z : x;                   // mullion every third bay along the face
        if (along % 3 === 0) { put(x, y, z, CONCRETE); continue; }
        put(x, y, z, GLASS);
        // warm light behind some glass: on the floor plate, one bay in three, upper storeys only
        const floor = Math.max(...FLOORS.filter((f) => f < y));
        const ix = x - e.dx, iz = z - e.dz, inner = at(ix, iz);
        if (e.level === -1 && y - floor === 1 && floor >= 8 && inner && !inner.shell && (x + z + floor) % 3 === 0) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  } else {
    for (const s of FLOORS) if (s <= T) put(x, s, z, s === 0 ? BASE : s === T ? ROOF : SLAB);
  }
}

// Entrance: iron doors on the north face at x=8 (ground floor), a hanging lantern under a concrete lintel.
put(8, 2, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(8, 3, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(8, 4, 0, "lantern", { hanging: "true", waterlogged: "false" });
put(8, 5, 0, CONCRETE);

// Roof plant room on the tower: a 4x4 box of smooth stone walls and a cap, on a 4x4 block of tower roof nearest the centre.
let best = null;
for (let x0 = 0; x0 <= 21; x0++) for (let z0 = 0; z0 <= 22; z0++) {
  let ok = true;
  for (let dz = 0; dz < 4 && ok; dz++) for (let dx = 0; dx < 4 && ok; dx++) { const c = at(x0 + dx, z0 + dz); ok = !!c && c.T === 32 && !c.shell; }
  if (ok) { const d = Math.hypot(x0 + 1.5 - 12, z0 + 1.5 - 12); if (!best || d < best.d) best = { x0, z0, d }; }
}
if (best) {
  const { x0, z0 } = best;
  for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) {
    const edge = dx === 0 || dx === 3 || dz === 0 || dz === 3;
    if (edge) { put(x0 + dx, 33, z0 + dz, "smooth_stone"); put(x0 + dx, 34, z0 + dz, "smooth_stone"); }
    put(x0 + dx, 35, z0 + dz, SLAB);
  }
  put(x0 + 1, 33, z0 + 3, "iron_bars", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  put(x0 + 2, 33, z0 + 3, "iron_bars", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
}

// Glass panes connect to whatever is beside them, as vanilla does.
const g = new Voxels(SIZE);
for (const p of B.values()) {
  let state = p.state;
  if (p.block === GLASS) {
    const t = (b) => (has(p.x + b[0], p.y, p.z + b[1]) ? "true" : "false");
    state = { north: t([0, -1]), south: t([0, 1]), east: t([1, 0]), west: t([-1, 0]), waterlogged: "false" };
  }
  g.set(p.x, p.y, p.z, p.block, state);
}
const stats = g.save(OUT);
console.log(`blocks ${stats.blocks}, palette ${stats.palette}, plant room at ${best ? `${best.x0},${best.z0}` : "none"}`);
