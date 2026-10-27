// way 332241935: a 1930s reinforced-concrete commercial block (Stripped Classical with a Deco crown), on the flank of
// Mt Eden. Basalt plinth and base (Auckland's volcanic stone), cream render with quartz string courses, glass bays
// between piers, a copper-capped tower core stepping back from a 5-storey body. Solid outer shell, air behind the
// glass, one floor slab per storey, warm lamps in some bays. Only footprint cells are built.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241935.cells.json`, "utf8"));

const M = {
  foundation: ["deepslate_bricks"],        // basalt plinth, the downhill side's wall
  base: ["stone_bricks"],                  // base course, ground storey floor
  string: ["smooth_quartz"],               // string course per storey and floor slabs
  wall: ["white_concrete"],                // render: piers, parapets
  basePier: ["polished_deepslate"],        // shopfront piers on the ground storey
  glass: ["light_blue_stained_glass"],
  cornice: ["smooth_quartz"],              // roof edge on the facade ring
  roof: ["smooth_stone"],                  // roof deck of the body
  copper: ["oxidized_cut_copper"],         // tower crown and the entrance hood
  lamp: ["glowstone"],
  hvac: ["iron_block"],
};
const S = (m, state) => ({ block: m[0], state: m[1] ?? state });

// footprint, and each cell's ground (b), lidar roof (r) and smoothed roof
const cellAt = new Map();
for (const [x, z, g, r] of cells) cellAt.set(`${x},${z}`, { x, z, b: g, r, S: 0, T: 0 });
const has = (x, z) => cellAt.has(`${x},${z}`);
const at = (x, z) => cellAt.get(`${x},${z}`);
const D4 = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const list = [...cellAt.values()];

// 1. smooth the lidar roof with a 3x3 median: lidar noise (single-cell spikes) goes, the massing stays
for (const c of list) {
  const nb = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (has(c.x + dx, c.z + dz)) nb.push(at(c.x + dx, c.z + dz).r);
  c.S = median(nb);
}

// 2. flat tiers on the storey grid: core (>=22) 24 high, body (>=18) 20, low wings (>=12) 16, else 12
const tierOf = (s) => (s >= 22 ? 24 : s >= 18 ? 20 : s >= 12 ? 16 : 12);
for (const c of list) c.T = tierOf(c.S);

// 3. setback: the tower core keeps 24 only two cells in from any lower tier; its edge steps down to the 20 terrace
const dist = new Map(), q = [];
for (const c of list) if (c.T !== 24) { dist.set(`${c.x},${c.z}`, 0); q.push(c); }
for (let i = 0; i < q.length; i++) {
  const c = q[i], d = dist.get(`${c.x},${c.z}`);
  for (const [dx, dz] of D4) {
    const k = `${c.x + dx},${c.z + dz}`;
    if (has(c.x + dx, c.z + dz) && !dist.has(k)) { dist.set(k, d + 1); q.push(at(c.x + dx, c.z + dz)); }
  }
}
for (const c of list) if (c.T === 24 && (dist.get(`${c.x},${c.z}`) ?? 99) < 2) c.T = 20;

// 4. the body always stands at least one storey and a cap above its ground
for (const c of list) c.T = Math.max(c.T, c.b + 5);

// 5. the shell: ring = footprint cells touching the outside (one block thick); everything else is interior
const ring = new Set();
for (const c of list) {
  c.outs = D4.filter(([dx, dz]) => !has(c.x + dx, c.z + dz));
  if (c.outs.length) ring.add(`${c.x},${c.z}`);
  c.ring = c.outs.length > 0;
  c.corner = c.outs.length > 1;
  c.face = c.outs.length === 1 ? c.outs[0][2] : null;
  c.t = c.face === "east" || c.face === "west" ? c.z : c.x;           // along-facade coordinate
  c.pier = c.corner || c.t % 3 === 0;                                  // window grid: a pier every third cell
  c.n = Math.floor((c.T - c.b) / 4);                                    // full storeys from its ground
}

// 6. the entrance: on the east face, the flush (highest-ground) bay on a pier column, nearest the middle
const east = list.filter((c) => c.ring && c.face === "east" && c.t % 3 === 0);
const midZ = east.length ? east.reduce((s, c) => s + c.t, 0) / east.length : 0;
east.sort((p, q2) => q2.b - p.b || Math.abs(p.t - midZ) - Math.abs(q2.t - midZ));
const entry = east[0];
if (entry) {
  entry.door = true;
  for (const c of list) if (c.ring && c.face === "east" && Math.abs(c.t - entry.t) <= 1) c.canopy = true;
}

// layer at height y in cell c: null is air (interior between floor slabs, behind the glass)
function specAt(c, y) {
  if (y < 0 || y >= c.T) return null;
  if (y < c.b) return S(M.foundation);
  if (y === c.T - 1) return c.ring ? S(M.cornice) : S(c.T === 24 ? M.copper : M.roof);
  if (y >= c.b + 4 * c.n) return S(M.wall);                               // parapet over the last storey
  const k = Math.floor((y - c.b) / 4), o = (y - c.b) % 4;
  if (o === 0) return k === 0 ? S(M.base) : S(M.string);                // base course / string course and floor slab
  if (!c.ring) return null;
  if (c.door && (o === 1 || o === 2)) return { block: "dark_oak_door", state: { facing: "east", half: o === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  if (c.canopy && k === 0 && o === 3) return S(M.copper);                 // entrance hood
  if (c.pier) return k === 0 ? S(M.basePier) : S(M.wall);
  return S(M.glass);
}

const H = 37;
const g = new Voxels([40, H, 54]);
for (const c of list) for (let y = 0; y < c.T; y++) {
  const s = specAt(c, y); if (s) g.set(c.x, y, c.z, s.block, s.state);
}

// 7. warm lamps: a glowstone two cells in, behind some glass, standing on the floor slab
const OUT = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] };
let lamps = 0;
for (const c of list) {
  if (!c.ring || c.corner || c.pier || c.door || !c.face) continue;
  const [ox, oz] = OUT[c.face];
  const d2 = at(c.x - 2 * ox, c.z - 2 * oz);
  if (!d2 || ring.has(`${d2.x},${d2.z}`)) continue;
  if (!((c.x * 31 + c.z * 17 + c.T) % 5 === 0)) continue;
  for (let k = 0; k < c.n; k++) {
    const y = c.b + 4 * k + 1;
    const pane = specAt(c, y);                                             // the glass this lamp is behind
    if (!pane || pane.block !== M.glass[0]) continue;
    if (specAt(d2, y) || !specAt(d2, y - 1)) continue;                     // air in front of the lamp, slab under it
    g.set(d2.x, y, d2.z, M.lamp[0]); lamps++;
  }
}

// 8. roof: a lightning rod on the core, HVAC units on the body roof
const core = list.filter((c) => c.T === 24);
if (core.length) {
  const cx = Math.round(core.reduce((s, c) => s + c.x, 0) / core.length), cz = Math.round(core.reduce((s, c) => s + c.z, 0) / core.length);
  const c = at(cx, cz) ?? core[0];
  g.set(c.x, c.T, c.z, "lightning_rod", { facing: "up", powered: "false" });
}
for (const c of list) if (!c.ring && c.T === 20 && c.T !== 24 && c.x % 8 >= 3 && c.x % 8 <= 4 && c.z % 8 >= 3 && c.z % 8 <= 4) g.set(c.x, c.T, c.z, M.hvac[0]);

const info = g.save(`${DIR}/way_332241935.nbt`);
console.log("cells", list.length, "ring", ring.size, "tiers", JSON.stringify(list.reduce((m, c) => ((m[c.T] = (m[c.T] || 0) + 1), m), {})), "entry", entry && [entry.x, entry.z], "lamps", lamps, info);
