// Way 446478800: a three-storey interwar brick flat block, flat roof with a parapet, the top storey stepped back two
// cells from the edge, two-storey wings at the ends. Solid brick mass; windows are glass panes with an air gap behind
// each, a floor slab per storey (storey lines in cream render), a plinth to the highest ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_446478800.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_446478800.nbt";

const W = 26, H = 28, D = 73;
const BASE = 2;      // ground-floor level: the plinth runs from y 0 to here under every cell
const STOREY = 4;    // storey = a floor slab + three rows of wall; tiers top out at BASE + 4k

const DIRS = [
  { dx: 1, dz: 0, face: "east", axis: "x" },
  { dx: -1, dz: 0, face: "west", axis: "x" },
  { dx: 0, dz: 1, face: "south", axis: "z" },
  { dx: 0, dz: -1, face: "north", axis: "z" },
];
const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const at = (x, z) => cellMap.get(key(x, z));
const cols = [...cellMap.values()];
const id = (x, y, z) => `${x},${y},${z}`;

// 1. Massing from the lidar roof: smooth it over a 5 x 5 window, then snap to 1, 2 or 3 storeys.
for (const c of cols) {
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const o = at(c.x + dx, c.z + dz); if (o) { s += o.r; n++; } }
  c.smooth = s / n;
  c.top = c.smooth < 8 ? BASE + STOREY : c.smooth < 12.5 ? BASE + 2 * STOREY : BASE + 3 * STOREY;   // 6, 10, 14
}
// Edge depth (1 = on the outside edge of the footprint), then the top storey steps back two cells from the edge.
const queue = [];
for (const c of cols) if (DIRS.some(d => !at(c.x + d.dx, c.z + d.dz))) { c.depth = 1; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const d of DIRS) { const o = at(c.x + d.dx, c.z + d.dz); if (o && o.depth === undefined) { o.depth = c.depth + 1; queue.push(o); } }
}
for (const c of cols) if (c.top === BASE + 3 * STOREY && c.depth <= 2) c.top = BASE + 2 * STOREY;

// The faces a cell shows to open air at height y: outside the footprint, or over a neighbour's lower roof.
const facesAt = (c, y) => DIRS.filter(d => { const o = at(c.x + d.dx, c.z + d.dz); return !o || o.top <= y; });
// The faces where this cell's roof edge drops (parapet / cornice).
const roofEdge = (c) => DIRS.filter(d => { const o = at(c.x + d.dx, c.z + d.dz); return !o || o.top < c.top; });

// 2. Entrance: a door on the west (long) facade near mid-length, in a bay with a dark hood over it.
const doorCell = cols
  .filter(c => c.depth === 1 && !at(c.x - 1, c.z) && c.z % 4 === 1 && c.top >= BASE + 2 * STOREY && Math.abs(c.z - 36) <= 8)
  .sort((a, b) => Math.abs(a.z - 36) - Math.abs(b.z - 36))[0];
const doorZ = doorCell ? doorCell.z : -99;
const isEntry = (c, d) => doorCell && d.face === "west" && Math.abs(c.z - doorZ) <= 1 && !!facesAt(c, BASE + 1).find(f => f.face === "west");

// 3. Windows: on single-face wall cells in bays 1 and 2 of each 4-cell bay, rows 1 and 2 of each storey; each glass
// pane gets an air gap directly behind it (the cell inward), and some gaps hold a warm light.
const glass = new Set(), gap = new Set(), light = new Map();
for (const c of cols) for (let y = BASE; y < c.top; y++) {
  const rel = (y - BASE) % STOREY; if (rel === 0 || rel === 3) continue;
  const faces = facesAt(c, y); if (faces.length !== 1) continue;
  const d = faces[0];
  const bay = (((d.axis === "x" ? c.z : c.x) % 4) + 4) % 4;
  if (bay !== 1 && bay !== 2) continue;
  if (doorCell && c === doorCell) continue;
  if (isEntry(c, d)) continue;
  const inner = at(c.x - d.dx, c.z - d.dz);
  if (!inner || inner.top <= y || facesAt(inner, y).length) continue;
  glass.add(id(c.x, y, c.z));
  gap.add(id(inner.x, y, inner.z));
  if (rel === 1) {
    const h = (c.x * 7 + c.z * 11 + y * 5) % 13;
    if (h === 0) light.set(id(inner.x, y, inner.z), "glowstone");
    else if (h === 5) light.set(id(inner.x, y, inner.z), "lantern");
  }
}
// The door's own air gap, behind it.
if (doorCell) { const inner = at(doorCell.x + 1, doorCell.z); if (inner) for (const y of [BASE + 1, BASE + 2]) gap.add(id(inner.x, y, inner.z)); }

// 4. Fill: a solid column from y 0 to the roof, with the facade articulated by the faces it shows.
const g = new Voxels([W, H, D]);
const stats = { glass: 0, doors: 0, lights: 0 };
for (const c of cols) {
  for (let y = 0; y < BASE; y++) g.set(c.x, y, c.z, "stone_bricks");
  for (let y = BASE; y < c.top; y++) {
    const k = id(c.x, y, c.z);
    if (gap.has(k)) { const l = light.get(k); if (l) { g.set(c.x, y, c.z, l, l === "lantern" ? { hanging: "false", waterlogged: "false" } : undefined); stats.lights++; } continue; }
    const rel = (y - BASE) % STOREY, faces = facesAt(c, y);
    if (rel === 0) {                                             // floor slab: a storey line on the facade, the base course at ground
      const exposed = faces.length > 0;
      g.set(c.x, y, c.z, y === BASE ? (exposed ? "stone_bricks" : "stone") : (exposed ? "smooth_quartz" : "stone"));
      continue;
    }
    if (!faces.length) { g.set(c.x, y, c.z, "stone"); continue; }
    if (rel === 3) { g.set(c.x, y, c.z, "smooth_quartz"); continue; }                        // spandrel band under the next floor
    const d = faces[0];
    if (doorCell && c === doorCell && faces.length === 1 && d.face === "west") {
      g.set(c.x, y, c.z, "oak_door", { facing: "west", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      stats.doors++; continue;
    }
    if (glass.has(k) && faces.length === 1) {
      const side = d.axis === "x" ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" };
      g.set(c.x, y, c.z, "glass_pane", { ...side, waterlogged: "false" }); stats.glass++; continue;
    }
    g.set(c.x, y, c.z, "bricks");
  }
  // Roof: a cornice on the edges with a parapet, roof deck inside. Lift and plant boxes on the top storey's roof.
  const edge = roofEdge(c).length > 0;
  const outer = DIRS.some(d => !at(c.x + d.dx, c.z + d.dz));   // parapet on the outer edge only; setback edges get the cornice
  g.set(c.x, c.top, c.z, edge ? "smooth_quartz" : "smooth_stone");
  if (outer) g.set(c.x, c.top + 1, c.z, "smooth_quartz");
  else if (c.top === BASE + 3 * STOREY && c.depth >= 4 && c.x % 6 >= 2 && c.x % 6 <= 3 && c.z % 8 >= 4 && c.z % 8 <= 5)
    g.set(c.x, c.top + 1, c.z, "light_gray_concrete");
}
// Entrance canopy: a dark hood over the door bay, on the lintel row.
if (doorCell) for (const c of cols) if (isEntry(c, DIRS[1]))
  g.set(c.x, BASE + 3, c.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// Checks: every block sits on a block (or is a roof/plinth at the foot), and the mass sums up.
let floating = 0;
g.forEachCell((i, v) => {
  const x = i % W, y = Math.floor(i / W) % H, z = Math.floor(i / (W * H));
  if (y > 0 && !g.val(x, y - 1, z)) floating++;
});
const tiers = { 1: 0, 2: 0, 3: 0 };
for (const c of cols) tiers[(c.top - BASE) / STOREY]++;
const res = g.save(OUT);
console.log(JSON.stringify({ footprint: cols.length, tiers, door: doorCell ? [doorCell.x, doorCell.z] : null, ...stats, floating, ...res, out: OUT }));
