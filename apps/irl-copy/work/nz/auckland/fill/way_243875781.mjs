// CityZone, Auckland (way 243875781): a 1990s glass office tower, 17 storeys (68 blocks, lidar crown) over stone
// podiums. Lidar roof heights are median-smoothed, snapped to the storey grid (16, 24, 32, 44, 56, 68) and majority-
// filtered across the 3x3 so each setback is one flat tier. Each column is solid from y 0 to its ground, then walls,
// with a floor slab per storey on the absolute 4-block grid. The podium (tiers up to 32) is stone-framed with clear
// shopfronts and a planted terrace roof; the tower is white precast piers and floor lines, grey spandrels, dark
// tinted glass, a grey roof with parapet, sea lanterns on the crown corners, and a lift core and plant box on the roof.
// Warm light: glowstone behind some upper panes, lanterns inside the shopfronts. Interiors are air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875781.cells.json", "utf8"));
const W = 45, D = 43, TOP = 82;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median of the 3x3 roof, snapped to the storey tiers (a tie takes the lower tier), then the majority tier of the 3x3
const TIERS = [16, 24, 32, 44, 56, 68];
const snap = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) ? t : best));
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T0 = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) T0[x][z] = snap(median(x, z));
const majority = (x, z) => {
  const own = T0[x][z], n = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) {
    const t = T0[x + dx][z + dz]; n.set(t, (n.get(t) || 0) + 1);
  }
  let best = own, bc = n.get(own) || 0;
  for (const [t, c] of n) if (c > bc) { best = t; bc = c; }
  return best;
};

// roof height: the tier, and at least two storeys above the ground under the cell
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  H[x][z] = Math.max(majority(x, z), 4 * Math.ceil((G[x][z] + 8) / 4));
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
// a cell's top is open (roof edge) when a neighbour is outside or lower
const roofEdge = (x, z) => exposed(x, z, H[x][z]).length > 0;

// the entrance: the north edge's middle run of low cells, three wide, the door on the middle cell
const northEdge = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 2 && H[x][z] >= 16) northEdge.push([x, z]);
const mid = northEdge.length ? northEdge[northEdge.length >> 1] : null;
const entrance = new Set();
if (mid) for (const [x, z] of northEdge) if (Math.abs(x - mid[0]) <= 1 && z === mid[1]) entrance.add(`${x},${z}`);

// the two materials: the tower (white precast, tinted glass) and the stone podium (clear shopfronts, planted roofs)
const TOWER = { floor: "white_concrete", pier: "white_concrete", spandrel: "light_gray_concrete", glass: "gray_stained_glass_pane", roof: "gray_concrete", coping: "white_concrete" };
const PODIUM = { floor: "polished_andesite", pier: "stone_bricks", spandrel: "stone_bricks", glass: "glass_pane", roof: "moss_block", coping: "stone_brick_slab" };
const kit = (top) => (top <= 32 ? PODIUM : TOWER);
const PANE = (dirs) => (dirs.includes("N") || dirs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const g = new Voxels([W, TOP, D]);
const glowAt = [], lanternAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], m = kit(top);
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // the roof slab on the top of the column; a coping on the open edges
  g.set(x, top, z, m.roof);
  if (roofEdge(x, z)) {
    const ex = exposed(x, z, top);
    const crownCorner = top === 68 && ex.length === 2 && (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    if (crownCorner) g.set(x, top + 1, z, "sea_lantern");
    else g.set(x, top + 1, z, m.coping);
  }

  const shopTop = 4 * Math.ceil((gr + 1) / 4);     // the ground storey runs from the base course to the first floor line
  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === gr) { g.set(x, y, z, "polished_andesite"); continue; }        // base course
    if (entrance.has(`${x},${z}`) && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (mid && z === mid[1] && Math.abs(x - mid[0]) <= 1 && y === gr + 2) { g.set(x, y, z, "polished_andesite"); continue; }   // entrance lintel
    if (y % 4 === 0) { g.set(x, y, z, m.floor); continue; }                  // floor line
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const u = face === "N" || face === "S" ? x : z;
    if (y % 4 === 3) { g.set(x, y, z, m.spandrel); continue; }               // spandrel
    if (corner || u % 3 === 0) { g.set(x, y, z, m.pier); continue; }          // pier
    const shop = y < shopTop;
    g.set(x, y, z, shop ? "glass_pane" : m.glass, PANE(ex));
    const [dx, dz] = DIRS[face], ix = x - dx, iz = z - dz;                   // the cell just inside the glass
    if (!shop && (x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([ix, y, iz]);
    if (shop && (x * 5 + z * 3 + y) % 4 === 0) lanternAt.push([ix, y, iz]);
  }
}

// warm light just inside the glass, only on air cells off the floor slabs
const inner = ([x, y, z]) => inside(x, z) && y % 4 !== 0 && exposed(x, z, y).length === 0 && g.val(x, y, z) === 0;
for (const p of glowAt) if (inner(p)) g.set(p[0], p[1], p[2], "glowstone");
for (const p of lanternAt) if (inner(p)) g.set(p[0], p[1], p[2], "lantern", { hanging: "false" });

// roof plant: a lift core on the crown's deepest interior spot, and a plant box on the 56 tier's roof
let lift = null, plant = null;
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (H[x + dx][z + dz] !== 68 || dist[x + dx][z + dz] < 4) ok = false;
  if (ok && (!lift || dist[x][z] > dist[lift[0]][lift[1]])) lift = [x, z];
}
for (let x = 2; x < W - 2 && !plant; x++) for (let z = 2; z < D - 2 && !plant; z++) {
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (H[x + dx][z + dz] !== 56 || dist[x + dx][z + dz] < 3) ok = false;
  if (ok) plant = [x, z];
}
if (lift) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 69; y <= 71; y++) g.set(lift[0] + dx, y, lift[1] + dz, y === 71 ? "white_concrete" : "light_gray_concrete");
if (plant) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 57; y <= 58; y++) g.set(plant[0] + dx, y, plant[1] + dz, "light_gray_concrete");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875781.nbt");
console.log(JSON.stringify({ tiers: tierCount, entrance: [...entrance], lift, plant, glow: glowAt.length, lanterns: lanternAt.length, ...stats }));
