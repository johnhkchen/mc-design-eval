// Way 332237114, Eden Terrace / Newton edge (Auckland): a three-storey brick-and-plaster commercial block of the 1930s,
// the stripped-Classical kind that lines the arterial streets there. Red brick walls on a dark polished base course,
// cream plaster string courses, mullions and a coping; cyan-glazed panes in 2-block openings set one block behind the
// face with an air gap behind each (warm glowstone in about a third of them); a glazed shopfront band across the
// frontage's ground floor with a central door under a dark canopy and two hanging lanterns. The lidar roof, smoothed
// to whole storeys above each cell's own ground, gives 1-3 storey tiers with lower wings. Each column is solid from its
// ground up, so every tier stands on what is below it. Flat roof, cream parapet, and a roof plant box.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237114.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237114.nbt";

const W = 21, D = 21, H = 26, STOREY = 4;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const idx = (x, z) => z * W + x;
const ground = new Int16Array(W * D).fill(-1);      // -1 = outside the footprint
const roof = new Int16Array(W * D);
for (const [x, z, gr, r] of cells) { ground[idx(x, z)] = gr; roof[idx(x, z)] = r; }
const inFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[idx(x, z)] >= 0;
const G = (x, z) => ground[idx(x, z)];
const cols = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFoot(x, z)) cols.push([x, z]);

// 1. Massing: the lidar roof, median-smoothed over a 5x5 window, to a whole number of storeys above each cell's ground.
//    T is the absolute top of the column (its blocks are at y < T); the parapet goes one block above it.
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const storeys = new Int8Array(W * D);
for (const [x, z] of cols) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFoot(x + dx, z + dz)) vals.push(roof[idx(x + dx, z + dz)]);
  storeys[idx(x, z)] = Math.min(3, Math.max(1, Math.round((median(vals) - G(x, z) - 1) / STOREY)));
}
// A second median over the storey counts (5x5) removes the small spikes (a 2x2 tip of the top tier on a wing), so the
// tiers are broad and flat; the core is wide enough to keep its height.
const top = new Int16Array(W * D);
for (const [x, z] of cols) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFoot(x + dx, z + dz)) vals.push(storeys[idx(x + dx, z + dz)]);
  top[idx(x, z)] = G(x, z) + STOREY * median(vals);
}
const T = (x, z) => top[idx(x, z)];
const solid = (x, y, z) => inFoot(x, z) && y >= 0 && y < T(x, z);

// 2. Faces. A face is exposed at height y when the cell beside it is air there (outside, or a lower tier).
const NORMALS = [
  { dx: 1, dz: 0, facing: "east" }, { dx: -1, dz: 0, facing: "west" },
  { dx: 0, dz: 1, facing: "south" }, { dx: 0, dz: -1, facing: "north" },
];
const exposed = (x, y, z) => NORMALS.filter((n) => solid(x, y, z) && !solid(x + n.dx, y, z + n.dz));
const interior = (x, y, z) => solid(x, y, z) && NORMALS.every((n) => solid(x + n.dx, y, z + n.dz));
const alongU = (n, x, z) => (n.dx ? z : x);      // the coordinate that runs along a facade with normal n

// The frontage is the face with the most ground-floor exposure; its door sits nearest the middle of that run.
const count = new Map(NORMALS.map((n) => [n, 0]));
for (const [x, z] of cols) for (const n of exposed(x, G(x, z), z)) count.set(n, count.get(n) + 1);
const front = [...count].sort((a, b) => b[1] - a[1])[0][0];
const candidates = cols.filter(([x, z]) => exposed(x, G(x, z), z).includes(front) && inFoot(x - front.dx, z - front.dz));
const us = candidates.map(([x, z]) => alongU(front, x, z)).sort((a, b) => a - b);
const midU = us[us.length >> 1];
const door = candidates.reduce((best, c) =>
  Math.abs(alongU(front, c[0], c[1]) - midU) < Math.abs(alongU(front, best[0], best[1]) - midU) ? c : best);
const doorU = alongU(front, door[0], door[1]);

// The entrance canopy runs over the door bay and its two neighbours, out through the wall one block (the cell behind).
const key = (x, z) => `${x},${z}`;
const canopy = new Set();
for (const [x, z] of candidates) if (Math.abs(alongU(front, x, z) - doorU) <= 1) {
  canopy.add(key(x, z)); canopy.add(key(x - front.dx, z - front.dz));
}

// 3. Columns. Foundation below each cell's ground, then the body: storeys of 4 from that ground, each a glazed window
//    zone between a string course below and a brick header above. The top block is the roof membrane where nothing
//    is exposed; where a tier is exposed, the face is decorated as the wall it is.
const g = new Voxels([W, H, D]);
const panes = [];
for (const [x, z] of cols) {
  const gr = G(x, z), t = T(x, z);
  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, "stone"); continue; }                   // foundation
    const rel = y - gr, k = Math.floor(rel / STOREY), o = rel % STOREY;
    if (k === 0 && o === 3 && canopy.has(key(x, z))) { g.set(x, y, z, "dark_oak_planks"); continue; }
    const ex = exposed(x, y, z);
    if (!ex.length) { g.set(x, y, z, y === t - 1 ? "stone" : "bricks"); continue; }
    const n = ex.includes(front) ? front : ex[0];
    const u = alongU(n, x, z);
    const frontGround = n === front && k === 0;
    if (o === 0) { g.set(x, y, z, k === 0 ? "polished_andesite" : "smooth_quartz"); continue; }
    if (o === 3) { g.set(x, y, z, "bricks"); continue; }
    if (frontGround && x === door[0] && z === door[1]) {
      g.set(x, y, z, "dark_oak_door", { facing: front.facing, half: o === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (frontGround && o === 2 && Math.abs(u - doorU) === 1) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue;
    }
    if (u % 4 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }      // mullion frame
    if (u % 4 === 3 && !frontGround) { g.set(x, y, z, "bricks"); continue; }   // pier (the shopfront is glass)
    g.set(x, y, z, "cyan_stained_glass_pane");
    panes.push({ x, y, z, n, k, u });
  }
}

// 4. Air behind each pane, with a warm glowstone in some of them. Only where the cell behind is interior, so no pocket
//    opens through the wall.
for (const p of panes) {
  const px = p.x - p.n.dx, pz = p.z - p.n.dz;
  if (!interior(px, p.y, pz)) continue;
  if ((p.u + 2 * p.k + (p.n.dx ? 0 : 1)) % 3 === 0) g.set(px, p.y, pz, "glowstone");
  else g.set(px, p.y, pz, "air");
}

// 5. The parapet: a cream cornice and coping on every column top that has air beside it at its top.
for (const [x, z] of cols) {
  const t = T(x, z);
  if (exposed(x, t - 1, z).length) {
    g.set(x, t, z, "smooth_quartz");
    g.set(x, t + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 6. Roof plant: a 3x3 brick box on the highest flat tier, well inside the parapet.
const tmax = Math.max(...cols.map(([x, z]) => T(x, z)));
const cx = cols.reduce((s, c) => s + c[0], 0) / cols.length, cz = cols.reduce((s, c) => s + c[1], 0) / cols.length;
let plant = null;
for (const [x, z] of cols) {
  let flat = true;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (!inFoot(x + dx, z + dz) || T(x + dx, z + dz) !== tmax) flat = false;
  if (!flat) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (!plant || d < plant.d) plant = { x, z, d };
}
if (plant) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
  g.set(plant.x + dx, tmax, plant.z + dz, "bricks");
  g.set(plant.x + dx, tmax + 1, plant.z + dz, "bricks");
  g.set(plant.x + dx, tmax + 2, plant.z + dz, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// 7. Glass panes take their connections from what is beside them in the wall's plane.
for (const p of panes) {
  const on = (x, y, z) => (g.get(x, y, z) ? "true" : "false");
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (p.n.dx) { st.north = on(p.x, p.y, p.z - 1); st.south = on(p.x, p.y, p.z + 1); }
  else { st.west = on(p.x - 1, p.y, p.z); st.east = on(p.x + 1, p.y, p.z); }
  g.set(p.x, p.y, p.z, "cyan_stained_glass_pane", st);
}

const res = g.save(OUT);
console.log(`front ${front.facing}, door at ${door}, ${panes.length} panes, ${res.blocks} blocks, ${res.palette} palette`);
