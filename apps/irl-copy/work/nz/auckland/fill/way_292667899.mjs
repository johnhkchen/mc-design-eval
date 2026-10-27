// Marina Park Apartments: a 1990s-2000s rendered-concrete apartment block, three storeys of 4 blocks on a stone plinth,
// a taller 14-block core (3 storeys + a cornice band) over lower 10 and 12 block wings, the outer ring of the core set
// back one cell to a planted terrace, a lift overrun and AC plant on the roof, and a dark-framed entrance on the west face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292667899.cells.json`, "utf8"));

const W = 34, D = 100, H = 27;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const footprint = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const inF = (x, z) => footprint.has(key(x, z));
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];

// lidar roof heights are noisy: take the 3x3 mode (ties to the higher), then quantise to three flat tiers
function smoothRoof(x, z) {
  const n = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!inF(x + dx, z + dz)) continue;
    const r = footprint.get(key(x + dx, z + dz)).roof; n.set(r, (n.get(r) || 0) + 1);
  }
  let best = null;
  for (const [r, c] of n) if (!best || c > best[1] || (c === best[1] && r > best[0])) best = [r, c];
  return best[0];
}
const tierOf = (r) => (r >= 13 ? 14 : r >= 11 ? 12 : 10);

const perim = new Map(), T = new Map(), setback = new Set();
for (const { x, z } of footprint.values()) perim.set(key(x, z), DIRS.some(([, dx, dz]) => !inF(x + dx, z + dz)));
for (const c of footprint.values()) {
  const k = key(c.x, c.z);
  let t = tierOf(smoothRoof(c.x, c.z));
  // the outer ring of the 14 block core steps down to 12: a planted terrace with the upstand rising from it
  if (t === 14 && perim.get(k)) { t = 12; setback.add(k); }
  T.set(k, t);
}

// depth in from the outside edge (1 = perimeter), for placing plant and lights away from the faces
const depth = new Map();
let frontier = [...footprint.values()].filter((c) => perim.get(key(c.x, c.z)));
for (const c of frontier) depth.set(key(c.x, c.z), 1);
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [, dx, dz] of DIRS) {
    const k = key(c.x + dx, c.z + dz);
    if (inF(c.x + dx, c.z + dz) && !depth.has(k)) { depth.set(k, d + 1); next.push(footprint.get(k)); }
  }
  frontier = next;
}

// the sides of a cell that show a face at height y: outside the footprint, or next to a lower neighbour
function exposedSides(x, z, y) {
  const t = T.get(key(x, z)), out = [];
  if (y >= t) return out;
  for (const [s, dx, dz] of DIRS) {
    if (!inF(x + dx, z + dz) || T.get(key(x + dx, z + dz)) <= y) out.push(s);
  }
  return out;
}
const glassPane = (axisX) => ({ east: String(!axisX), west: String(!axisX), north: String(axisX), south: String(axisX), waterlogged: "false" });

// 1. the envelope and floors, column by column from y 0 (nothing starts above the ground under it)
for (const c of footprint.values()) {
  const { x, z, ground } = c, t = T.get(key(x, z)), wall = t === 14 ? "white_concrete" : "light_gray_concrete";
  for (let y = 0; y < Math.min(ground, t); y++) g.set(x, y, z, "stone_bricks");
  for (let y = 0; y < t; y++) {
    const sides = exposedSides(x, z, y), face = sides.length > 0;
    const axisX = sides.some((s) => s === "W" || s === "E"), k = axisX ? z : x;
    if (y === 0) g.set(x, y, z, "stone_bricks");                       // plinth and ground slab
    else if (y === t - 1) g.set(x, y, z, face ? "smooth_quartz" : "smooth_stone");    // cornice or roof membrane
    else if (y % 4 === 0) g.set(x, y, z, "smooth_quartz");            // storey line and floor slab
    else if (!face) continue;                                           // interior air behind the glass
    else if (y % 4 === 3) g.set(x, y, z, wall);                        // spandrel under each window band
    else if (k % 4 === 0) g.set(x, y, z, "gray_concrete");             // frame column between bays
    else g.set(x, y, z, "light_blue_stained_glass_pane", glassPane(axisX));
  }
}

// 2. the entrance: a 3-bay opening on the west face, a double-door centre, dark lintel above
const westRow = new Map();   // z -> x of the outermost west-facing cell at ground-floor height
for (const c of footprint.values()) {
  if (exposedSides(c.x, c.z, 1).includes("W") && T.get(key(c.x, c.z)) >= 4 && !westRow.has(c.z)) westRow.set(c.z, c.x);
}
const rows = [...westRow.keys()].sort((a, b) => a - b), mid = rows[Math.floor(rows.length / 2)];
let centre = null;
for (const z of rows) if (westRow.has(z - 1) && westRow.has(z + 1) && (centre === null || Math.abs(z - mid) < Math.abs(centre - mid))) centre = z;
const door = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
for (const z of [centre - 1, centre, centre + 1]) {
  const x = westRow.get(z);
  g.set(x, 3, z, "black_concrete");
  if (z === centre) {
    g.set(x, 1, z, "dark_oak_door", door("lower"));
    g.set(x, 2, z, "dark_oak_door", door("upper"));
    if (inF(x + 1, z)) g.set(x + 1, 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  } else {
    for (const y of [1, 2]) g.set(x, y, z, "light_blue_stained_glass_pane", glassPane(true));
  }
}

// 3. warm light behind some windows: a glowstone on the floor just inside a glazed bay, on a hashed subset
const OPP = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };
for (const c of footprint.values()) {
  const { x, z } = c, t = T.get(key(x, z));
  for (let y = 1; y < t - 1; y += 4) {
    const sides = exposedSides(x, z, y);
    if (!sides.length || y % 4 !== 1) continue;
    const axisX = sides.some((s) => s === "W" || s === "E"), k = axisX ? z : x;
    if (k % 4 === 0 || (x * 31 + z * 17 + y * 7) % 6 !== 0) continue;
    const [ox, oz] = OPP[sides[0]], ix = x + ox, iz = z + oz;
    if (inF(ix, iz) && !perim.get(key(ix, iz)) && T.get(key(ix, iz)) > y) g.set(ix, y, iz, "glowstone");
  }
}

// 4. roof: a 3x3 lift overrun on the core's interior, AC plant on the roof deck, and planting on the terrace
const deep = [...footprint.values()].filter((c) => T.get(key(c.x, c.z)) === 14 && depth.get(key(c.x, c.z)) >= 4);
const cx = deep.reduce((a, c) => a + c.x, 0) / deep.length, cz = deep.reduce((a, c) => a + c.z, 0) / deep.length;
const boxOk = (x, z) => [-1, 0, 1].every((dz) => [-1, 0, 1].every((dx) => inF(x + dx, z + dz) && T.get(key(x + dx, z + dz)) === 14 && depth.get(key(x + dx, z + dz)) >= 3));
let lift = null;
for (const c of deep) if (boxOk(c.x, c.z) && (!lift || Math.hypot(c.x - cx, c.z - cz) < Math.hypot(lift.x - cx, lift.z - cz))) lift = c;
const liftCells = new Set();
if (lift) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
  liftCells.add(key(lift.x + dx, lift.z + dz));
  for (const y of [14, 15]) g.set(lift.x + dx, y, lift.z + dz, "light_gray_concrete");
}
const acSites = [];
for (const c of deep) {
  if (acSites.length >= 4) break;
  if (lift && Math.max(Math.abs(c.x - lift.x), Math.abs(c.z - lift.z)) <= 2) continue;
  if (acSites.some((a) => Math.abs(a.x - c.x) + Math.abs(a.z - c.z) < 6)) continue;
  if ((c.x * 5 + c.z * 3) % 7 !== 0 && acSites.length < 3) continue;
  acSites.push(c); g.set(c.x, 14, c.z, "iron_block");
}
for (const c of footprint.values()) {
  const k = key(c.x, c.z);
  if (setback.has(k) && (c.x + c.z) % 3 === 0 && exposedSides(c.x, c.z, 12).length) g.set(c.x, 12, c.z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
}

const counts = {};
g.forEachCell((i, v) => { const b = g.palette[v].block; counts[b] = (counts[b] || 0) + 1; });
const saved = g.save(`${DIR}/way_292667899.nbt`);
console.log(JSON.stringify({ cells: cells.length, tiers: [...new Set(T.values())].map((t) => [t, [...T.values()].filter((v) => v === t).length]), setback: setback.size, entrance: centre, lift, ac: acSites.length, saved }));
