// DC56145: a stepped Federal-era limestone office block (c. 1930s, Federal Triangle manner) on the Mall's flank.
// A granite base course, three to four storeys of calcite walls with glazed bays between smooth-stone storey lines,
// a parapet cornice, a 3-tier massing (14 / 11 / 8 blocks) following the lidar roof, a recessed portal on the north face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC56145.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [25, 26, 17];

// per footprint cell: its ground, and the roof smoothed over the 3x3 of footprint cells around it (lidar noise out)
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const cols = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const o = raw.get(`${x + dx},${z + dz}`); if (o) { sum += o.r; n++; }
  }
  // F0: the top of the foundation, which is also the ground storey's floor (ground 0-1 → 0, ground 2 → 1)
  // T: the top of the column (parapet included); n: storeys above F0, each 3 blocks (floor slab + 2 rows of window)
  const F0 = Math.max(c.g, 1) - 1;
  const S = sum / n;
  const T = F0 === 0
    ? (S >= 11.5 ? 14 : S >= 9.5 ? 11 : S >= 6.5 ? 8 : 5)
    : (S >= 10.5 ? 12 : S >= 7.5 ? 9 : S >= 5 ? 6 : 4);
  cols.set(k, { x, z, F0, T, n: Math.floor((T - F0 - 2) / 3) });
}

const colAt = (x, z) => cols.get(`${x},${z}`);
const inside = (x, z, y) => { const c = colAt(x, z); return !!c && y < c.T; };
const exposed = (x, z, y) => [["e", 1, 0], ["w", -1, 0], ["s", 0, 1], ["n", 0, -1]]
  .filter(([, dx, dz]) => !inside(x + dx, z + dz, y));
const slabRow = (c, y) => y < c.F0 || (y >= c.F0 && (y - c.F0) % 3 === 0 && y - c.F0 <= 3 * c.n);
const parapetRow = (c, y) => y > c.F0 + 3 * c.n;

// the wall rows: the shell's non-slab rows (windows, and the piers, and any wall that must hang down to a slab)
const wall = new Set();
for (const c of cols.values()) {
  if (c.n === 0) continue;   // low annex: solid, no storeys
  let below = false;
  for (let y = c.T - 1; y >= c.F0; y--) {
    const cur = !slabRow(c, y) && !parapetRow(c, y) ? (exposed(c.x, c.z, y).length > 0 || below) : false;
    const par = parapetRow(c, y) && exposed(c.x, c.z, y).length > 0;
    if (cur) wall.add(`${c.x},${y},${c.z}`);
    if (par) wall.add(`${c.x},${y},${c.z}`);
    below = cur;
  }
}

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const isWall = (x, y, z) => wall.has(`${x},${y},${z}`);

for (const c of cols.values()) {
  const { x, z, F0, T, n } = c;
  for (let y = 0; y < T; y++) {
    const outs = exposed(x, z, y);
    const edge = outs.length > 0;
    if (n === 0) { put(x, y, z, "calcite"); continue; }   // the low annex: a solid two-block wing
    if (y < F0) { put(x, y, z, "polished_granite"); continue; }   // the foundation
    if (slabRow(c, y)) {
      const k = (y - F0) / 3;
      if (k === 0) put(x, y, z, edge ? "polished_granite" : "smooth_stone");     // the base course
      else if (k === n) put(x, y, z, edge ? "smooth_stone" : "stone");            // the roof and its cornice band
      else put(x, y, z, "smooth_stone");                                          // a storey line / floor slab
      continue;
    }
    if (parapetRow(c, y)) {
      if (edge) put(x, y, z, y === T - 1 ? "stone_brick_slab" : "calcite", y === T - 1 ? { type: "top", waterlogged: "false" } : undefined);
      else if (!edge && n >= 3 && y === T - 1 && (x * 3 + z * 5) % 7 === 0) put(x, y, z, "light_gray_concrete");   // roof plant
      continue;
    }
    if (!isWall(x, y, z)) continue;   // an interior air gap behind the glass
    // a window row: glass in the bays, calcite piers at the corners and every third cell along each face
    const pier = outs.length !== 1 || (outs[0][0] === "n" || outs[0][0] === "s" ? x : z) % 3 === 0;
    if (edge && !pier) put(x, y, z, "light_blue_stained_glass_pane");
    else put(x, y, z, "calcite");
  }
}

// the portal on the north face: an iron door in calcite jambs, a lantern just inside
for (const y of [1, 2]) {
  put(4, y, 0, "polished_granite");
  put(6, y, 0, "polished_granite");
  put(5, y, 0, "iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
}
put(5, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

// warm light: a shroomlight just inside some lower-row glass bays, on the storey floor
for (const [k, p] of [...plan]) {
  if (p.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const c = colAt(x, z);
  if ((y - c.F0 - 1) % 3 !== 0) continue;   // lower window row only
  const outs = exposed(x, z, y);
  if (outs.length !== 1) continue;
  const [dir] = outs[0];
  const [ix, iz] = dir === "n" ? [x, z + 1] : dir === "s" ? [x, z - 1] : dir === "e" ? [x - 1, z] : [x + 1, z];
  if (plan.has(`${ix},${y},${iz}`) || !inside(ix, iz, y)) continue;
  if ((x + 2 * z + y) % 7 === 3) put(ix, y, iz, "shroomlight");
}

// glass panes connect to whatever solid or pane touches their faces, as in the game
for (const [k, p] of plan) {
  if (p.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const side = (dx, dz) => (plan.has(`${x + dx},${y},${z + dz}`) ? "true" : "false");
  p.state = { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" };
}

// nothing floats: every block is joined to the foundation through a chain of touching blocks (a floor slab rests on its walls)
const seen = new Set(), todo = [...plan.keys()].filter((k) => k.endsWith(",0") || k.split(",")[1] === "0");
todo.forEach((k) => seen.add(k));
while (todo.length) {
  const [x, y, z] = todo.pop().split(",").map(Number);
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const n = `${x + dx},${y + dy},${z + dz}`;
    if (plan.has(n) && !seen.has(n)) { seen.add(n); todo.push(n); }
  }
}
const floating = [...plan.keys()].filter((k) => !seen.has(k));
if (floating.length) throw new Error(`${floating.length} floating blocks, e.g. ${floating.slice(0, 5).join(" ")}`);

const g = new Voxels(SIZE);
for (const [k, p] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, p.block, p.state);
}
g.save(`${DIR}/DC56145.nbt`);
console.log(`DC56145: ${plan.size} blocks`);
