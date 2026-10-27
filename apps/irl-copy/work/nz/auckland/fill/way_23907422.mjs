// Way 23907422, Mt Eden side of the CBD fringe: a 1960s-70s concrete-frame office block. Seven storeys over the middle
// of the footprint, six at the edges (the lidar roof splits 28 / 30 / 31), a plant screen over the core. Cream precast
// panels and mullions, smoked blue glass, a lit shopfront with a door on the south face. Storeys are 4 blocks: a floor
// slab row at 1 + 4s, then spandrel, glass, glass. Walls only where the air meets the outside or a lower roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907422.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907422.nbt";
const X = 25, Y = 44, Z = 30;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, ground, raw: roof, roof });
const near = (c) => {
  const out = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell.get(key(c.x + dx, c.z + dz)); if (n) out.push(n); }
  return out;
};
// lidar noise: edge returns under 20 take their neighbours' median; then a 3x3 median flattens the tiers
for (const c of cell.values()) if (c.raw < 20) { const ok = near(c).filter((n) => n !== c && n.raw >= 20).map((n) => n.raw); if (ok.length) c.roof = median(ok); }
for (const c of cell.values()) c.R = median(near(c).map((n) => n.roof));

for (const c of cell.values()) {
  c.cls = c.R <= 28 ? "wing" : c.R <= 30 ? "main" : "core";
  c.Hint = { wing: 26, main: 30, core: 31 }[c.cls];                      // roof surface of the interior
  c.edge = DIRS.some(([dx, dz]) => !cell.has(key(c.x + dx, c.z + dz)));
  c.Htop = c.cls === "wing" && c.edge ? 28 : c.Hint;                     // edge of the wings carries a 2-block parapet
}

// the neighbours a wall at height y is open to: outside the footprint, or a roof below y
const exposing = (c, y) => DIRS.filter(([dx, dz]) => { const n = cell.get(key(c.x + dx, c.z + dz)); return !n || n.Hint <= y; });

function material(c, y) {
  if (y === 0) return "stone";                                           // foundation under every cell
  if (y >= c.Htop) return null;
  if (y === c.Htop - 1) return c.edge ? "smooth_quartz" : c.cls === "core" ? "stone_bricks" : "light_gray_concrete";
  if (y >= c.Hint) return c.edge ? "smooth_quartz" : null;               // parapet, edge only
  const dirs = exposing(c, y), exposed = dirs.length > 0;
  if ((y - 1) % 4 === 0) {                                               // floor slab row: storey line outside, plain slab inside
    if (y === 1) return exposed ? "polished_andesite" : "light_gray_concrete";   // base course
    return exposed ? "smooth_quartz" : "light_gray_concrete";
  }
  if (!exposed) return null;                                             // interior air behind the wall
  const s = Math.floor((y - 1) / 4), r = (y - 1) % 4;                    // r 1 spandrel, r 2-3 glass
  if (c.edge && y === c.Hint - 2) return "smooth_quartz";                // cornice over the top storey
  const along = dirs[0][0] !== 0 ? c.z : c.x;
  if (along % 3 === 0) return "smooth_quartz";                           // mullions every third block
  if (r === 1) return s === 0 ? "polished_andesite" : "white_concrete";  // shopfront bulkhead / precast spandrel
  const h = (c.x * 31 + c.z * 17 + y * 13) % 11;
  if (r === 2 && h === 0 && (s === 0 || (c.x + c.z) % 3 === 0)) return "glowstone";  // a few panes lit warm, not a spray
  return "light_blue_stained_glass";
}

const g = new Voxels([X, Y, Z]);
for (const c of cell.values()) {
  for (let y = 0; y < c.Htop; y++) {
    if (c.x === 8 && c.z === 29 && (y === 2 || y === 3)) {               // entrance, south face
      g.set(c.x, y, c.z, "iron_door", { facing: "south", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const m = material(c, y);
    if (m) g.set(c.x, y, c.z, m);
  }
}
// lobby light just inside the door
g.set(8, 2, 28, "glowstone");

// rooftop plant: 2x2 units on the wing and main roofs, set on the interior roof
const same = (a, b, cls) => { const n = cell.get(key(a, b)); return n && n.cls === cls && !n.edge; };
for (const c of cell.values()) {
  if (c.x % 7 !== 4 || c.z % 7 !== 4) continue;
  const quad = [[c.x, c.z], [c.x + 1, c.z], [c.x, c.z + 1], [c.x + 1, c.z + 1]];
  if (!quad.every(([a, b]) => same(a, b, c.cls))) continue;
  const roofY = c.cls === "wing" ? 26 : c.cls === "main" ? 30 : null;
  if (roofY !== null) for (const [a, b] of quad) g.set(a, roofY, b, "iron_block");
}

// checks: every solid block must reach the ground through solid face-neighbours (floor slabs span interior air but
// hang from the perimeter, so a block-below test would miscount them); the shell's block census
const seen = new Uint8Array(X * Y * Z), stack = []; const counts = {}; let total = 0;
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  const v = g.val(x, y, z); if (!v) continue;
  const name = g.palette[v].block; counts[name] = (counts[name] || 0) + 1; total++;
  if (y === 0) { const i = g.at(x, y, z); seen[i] = 1; stack.push([x, y, z]); }
}
while (stack.length) {
  const [x, y, z] = stack.pop();
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const a = x + dx, b = y + dy, c = z + dz;
    if (!g.val(a, b, c) || !g.inBounds(a, b, c) || seen[g.at(a, b, c)]) continue;
    seen[g.at(a, b, c)] = 1; stack.push([a, b, c]);
  }
}
let floating = 0;
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) if (g.val(x, y, z) && !seen[g.at(x, y, z)]) floating++;
const tiers = { wing: 0, main: 0, core: 0 }; for (const c of cell.values()) tiers[c.cls]++;
const stats = g.save(OUT);
console.log(JSON.stringify({ cells: cell.size, tiers, floating, blocks: stats.blocks, palette: stats.palette, counts }, null, 1));
