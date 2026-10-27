// Waikohanga House: an 8-storey 1970s concrete-frame office block with a shopfront ground floor, on the Mt Eden
// slope (ground 0..9 across the footprint, roof at 31 with a 34 lift core). Storeys are 4 blocks on a grid that starts
// at y 3 (basement), 7 (ground floor), 11, 15 ... Each storey: sill, two glass rows, head. Piers every 3 blocks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_153706608.cells.json`, "utf8"));
const X = 48, Y = 47, Z = 49;

const key = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const at = (x, z) => fp.get(key(x, z));

// 1. Smooth the lidar roof with a 3x3 median over footprint cells, then quantise to clean flat tiers.
//    Storey tops sit on the 4-block grid (3 + 4k); 31 is the main roof, 34 the lift core, 11..27 the lower wings.
const TIERS = [11, 15, 19, 23, 27, 31];
const median = (v) => { v = [...v].sort((a, b) => a - b); return v[v.length >> 1]; };
for (const c of fp.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  c.rs = median(vals);
}
function tierTop(rs, g) {
  if (rs >= 33) return 34;
  let best = TIERS[0];
  for (const t of TIERS) if (Math.abs(t - rs) <= Math.abs(best - rs)) best = t;   // ties go up
  while (best < g + 4) best = TIERS[TIERS.indexOf(best) + 1] ?? 34;              // at least one storey above its own ground
  return best;
}
for (const c of fp.values()) c.T = tierTop(c.rs, c.g);

// 2. Exposed faces: a side is outside the building if the neighbour is off the footprint or stands lower.
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
for (const c of fp.values()) {
  c.exp = Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; const n = at(c.x + dx, c.z + dz); return !n || n.T < c.T; });
  c.shell = c.exp.length > 0;
  // piers: corners always, and every third block along a facade
  c.pier = c.exp.length >= 2 || (c.exp.length === 1 && (c.exp[0] === "N" || c.exp[0] === "S" ? c.x : c.z) % 3 === 0);
}

// 3. Fill every cell. Solid below its ground and in the 3-block foundation; walls and storey bands on the shell; slabs
//    per storey and a roof slab across the interior; air between.
const M = new Map();
const put = (x, y, z, name, state, pane = false) => M.set(`${x},${y},${z}`, { name, state, pane });
for (const c of fp.values()) {
  for (let y = 0; y < c.T; y++) {
    if (y < c.g || y < 3) { put(c.x, y, c.z, "stone_bricks"); continue; }
    const sb = 3 + 4 * Math.floor((y - 3) / 4), rel = y - sb, k = (sb - 3) / 4 - 1;
    if (!c.shell) { if (y === c.T - 1 || rel === 0) put(c.x, y, c.z, "light_gray_concrete"); continue; }
    if (y === c.T - 1) { put(c.x, y, c.z, "smooth_stone"); continue; }                   // cornice / parapet
    if (rel === 0) { put(c.x, y, c.z, k === 0 ? "smooth_stone" : "white_concrete"); continue; }   // sill, base course
    if (rel === 3) { put(c.x, y, c.z, "white_concrete"); continue; }                     // head
    if (c.pier) { put(c.x, y, c.z, "light_gray_concrete"); continue; }
    put(c.x, y, c.z, k === -1 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane", { waterlogged: "false" }, true);
  }
}

// 3b. Interior columns on a 6-block grid carry the floor slabs down to the foundation (structure, not rooms).
for (const c of fp.values()) {
  if (c.shell || c.x % 6 !== 3 || c.z % 6 !== 3) continue;
  for (let y = Math.max(c.g, 3); y < c.T; y++) put(c.x, y, c.z, "light_gray_concrete");
}

// 4. Entrance: first pair of north-facing ground cells (ground 7) on the street front; double iron doors, a lintel canopy
//    over the bay (two cells deep) and a hanging lantern under it.
let door = null;
for (const c of [...fp.values()].sort((a, b) => a.z - b.z || a.x - b.x)) {
  const n = at(c.x + 1, c.z);
  if (c.exp.includes("N") && c.g === 7 && n && n.exp.includes("N") && n.g === 7) { door = [c.x, c.z]; break; }
}
if (door) {
  const [dx0, dz0] = door;
  const hinge = (i) => (i === 0 ? "left" : "right");
  for (let i = 0; i < 2; i++) {
    const x = dx0 + i;
    put(x, 7, dz0, "iron_door", { facing: "north", half: "lower", hinge: hinge(i), open: "false", powered: "false" });
    put(x, 8, dz0, "iron_door", { facing: "north", half: "upper", hinge: hinge(i), open: "false", powered: "false" });
    put(x, 9, dz0, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }, true);
    for (const z of [dz0, dz0 + 1]) if (at(x, z)) put(x, 10, z, "smooth_stone");
  }
  for (const x of [dx0 - 1, dx0 + 2]) if (at(x, dz0)) put(x, 10, dz0, "smooth_stone");
  put(dx0, 9, dz0 + 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// 5. Warm light behind some lower-window glass: glowstone in the interior cell just inside the pane.
for (const c of fp.values()) {
  if (!c.shell) continue;
  for (let y = 0; y < c.T; y++) {
    const sb = 3 + 4 * Math.floor((y - 3) / 4), rel = y - sb;
    const m = M.get(`${c.x},${y},${c.z}`);
    if (!m || !m.pane || rel !== 1) continue;
    if ((c.x * 7 + c.z * 13 + y * 5) % 9 !== 0) continue;
    const [dx, dz] = DIRS[c.exp[0]]; const ix = c.x - dx, iz = c.z - dz; const inner = at(ix, iz);
    if (inner && !inner.shell && y < inner.T && !M.has(`${ix},${y},${iz}`)) put(ix, y, iz, "glowstone");
  }
}

// 6. Roof plant: two 4x3 boxes on the main roof slab, on interior cells only.
const plantOK = (ax, az) => {
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 4; dx++) {
    const c = at(ax + dx, az + dz); if (!c || c.shell || c.T !== 31) return false;
  }
  return true;
};
const anchors = [...fp.values()].map((c) => [c.x, c.z]).filter(([x, z]) => plantOK(x, z))
  .sort((a, b) => Math.hypot(a[0] - 26, a[1] - 22) - Math.hypot(b[0] - 26, b[1] - 22));
const placed = [];
for (const [ax, az] of anchors) {
  if (placed.length === 2) break;
  if (placed.some(([px, pz]) => Math.abs(px - ax) < 8 && Math.abs(pz - az) < 8)) continue;
  placed.push([ax, az]);
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 4; dx++) for (const y of [31, 32]) put(ax + dx, y, az + dz, "light_gray_concrete");
}

// 7. Write the blocks; panes connect to neighbours that are panes or solid.
const SOLID = new Set(["light_gray_concrete", "white_concrete", "smooth_stone", "stone_bricks"]);
const v = new Voxels([X, Y, Z]);
for (const [k, b] of M) {
  const [x, y, z] = k.split(",").map(Number);
  if (b.pane) {
    const nb = (dx, dz) => M.get(`${x + dx},${y},${z + dz}`);
    const conn = (dx, dz) => { const n = nb(dx, dz); return String(!!n && (n.pane || SOLID.has(n.name))); };
    b.state = { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" };
  }
  v.set(x, y, z, b.name, b.state);
}
const out = `${DIR}/way_153706608.nbt`;
const info = v.save(out);
console.log(`door ${door ? door.join(",") : "none"}; plant ${placed.map((p) => p.join(",")).join(" ")}; blocks ${info.blocks}, palette ${info.palette}`);
