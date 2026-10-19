// 29 West 47th Street, a 1930 commercial and office building in Midtown: a 19-storey setback office block in cream
// limestone (smooth sandstone) on a granite base, with quartz piers, grey steel-sash windows and a copper crown. Footprint
// 13 x 27: the street front is the north face (low z, the 47th Street frontage, x across it). The lidar roof is read as
// four clean setback tiers (3, 7, 11 and 15 storeys) with the 19-storey tower on the centre (z 8 to 20), a 2-block copper
// cap on its top edge, and a lidar court (roof 0) at the west and south-west edges. Each face is a bay grid: piers on every
// third block, two-block windows between, a spandrel course at each floor line. Every window has a 1-block air gap behind it
// and a floor slab per storey (no interiors). The north ground floor is a shopfront with an iron entrance door under a
// copper marquee. Warm glowstone and shroomlight sit behind some panes. Storeys sit on 1 + 3k, so every tier stands on
// the one below and the setbacks stand on their own columns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034479.cells.json`, "utf8"));
const X = 13, Y = 72, Z = 27;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
const key = (x, y, z) => `${x},${y},${z}`;

// Clean setback tiers. A 3x3 median of the lidar roof (over built cells) is quantised to four tiers of 4 storeys, so each
// top is 1 + 3n and sits on a floor line. Lidar 0 inside the footprint is a light court: open to the sky, a stone floor.
const median = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = lidar(x + dx, z + dz); if (r > 0) v.push(r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (v) => (v < 16 ? 10 : v < 28 ? 22 : v < 40 ? 34 : v < 52 ? 46 : 58);
const top = (x, z) => (!inFoot(x, z) || lidar(x, z) === 0 ? 0 : tierOf(median(x, z)));
const solid = (x, y, z) => y < top(x, z);

// Outward faces. N = low z = the 47th Street front. [name, dx, dz] points out of the building.
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const exposed = (x, y, z) => FACES.filter(([, dx, dz]) => !solid(x + dx, y, z + dz)).map(([n]) => n);

// Floor lines sit on y = 1 + 3k (row 0); rows 1 and 2 are glass. Row 0 at y = 1 is the granite base, y = 0 the plinth.
const row = (y) => (y - 1) % 3;

// Pane connections follow the wall plane: a glass pane joins the solid blocks beside it in its own face.
const pane = (x, y, z, f) => (f === "N" || f === "S"
  ? { east: solid(x + 1, y, z), west: solid(x - 1, y, z), north: false, south: false, waterlogged: false }
  : { north: solid(x, y, z - 1), south: solid(x, y, z + 1), east: false, west: false, waterlogged: false });

// The facade block for an exposed cell (null inside and above the massing). Corners and every third column are piers.
const plan = (x, y, z) => {
  if (!solid(x, y, z)) return null;
  const faces = exposed(x, y, z);
  if (!faces.length) return null;
  if (y <= 1) return { block: "polished_granite" };
  const f = faces[0], corner = faces.length > 1, along = f === "N" || f === "S" ? x : z;
  if (f === "N" && z === 0 && y === 4 && (x === 7 || x === 8)) return { block: "oxidized_cut_copper_slab", state: { type: "bottom", waterlogged: "false" } };
  if (corner || along % 3 === 0) return { block: "quartz_block" };
  if (row(y) === 0) return { block: "smooth_sandstone" };
  const shop = f === "N" && y <= 3;
  if (shop && x === 7) {
    const half = y === 2 ? "lower" : "upper";
    return { block: "iron_door", state: { facing: "south", half, hinge: "left", open: "false", powered: "false" } };
  }
  return { block: shop ? "light_blue_stained_glass_pane" : "gray_stained_glass_pane", state: pane(x, y, z, f), glass: true, face: f };
};

// Air gap behind each opening (window or door): the cell one step inward, below the top row, lit on some windows.
const gaps = new Map();
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const t = top(x, z);
  for (let y = 2; y < t - 1; y++) {
    const p = plan(x, y, z);
    if (!p || !(p.glass || p.block === "iron_door")) continue;
    const f = exposed(x, y, z)[0], [ix, iz] = INWARD[f];
    if (!solid(x + ix, y, z + iz)) continue;
    const along = f === "N" || f === "S" ? x : z, faceIdx = FACES.findIndex(([n]) => n === f);
    let light = null;
    if (p.block !== "iron_door" && (along * 5 + y * 7 + faceIdx * 3) % 11 === 0) light = "glowstone";
    if (f === "N" && y === 2 && (x === 4 || x === 10)) light = "shroomlight";
    gaps.set(key(x + ix, y, z + iz), light);
  }
}

const g = new Voxels([X, Y, Z]);

// 1. Massing: each cell solid from its ground to its tier top, the facade on the exposed faces, the air gaps, a roof covering.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const t = top(x, z);
  if (!t) { g.set(x, 0, z, "smooth_stone"); continue; }
  for (let y = 0; y < t; y++) {
    const k = key(x, y, z);
    if (gaps.has(k)) { if (gaps.get(k)) g.set(x, y, z, gaps.get(k)); continue; }
    const p = plan(x, y, z);
    if (p) { g.set(x, y, z, p.block, p.state); continue; }
    g.set(x, y, z, y === t - 1 ? "smooth_stone" : "stone");
  }
}

// 2. Parapets on every top edge (a neighbour lower or none), the copper cap on the tower top.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const t = top(x, z);
  if (!t || !FACES.some(([, dx, dz]) => top(x + dx, z + dz) < t)) continue;
  if (t === 58) { g.set(x, 58, z, "smooth_sandstone"); g.set(x, 59, z, "oxidized_copper"); }
  else g.set(x, t, z, "smooth_sandstone");
}

// 3. Roof equipment: a mechanical box on a setback terrace (an interior cell), and a penthouse on the tower.
const box = (T, block, h, pick) => {
  for (let z = 1; z < Z - 1; z++) for (let x = 1; x < X - 1; x++) {
    if (top(x, z) !== T || !pick(x, z)) continue;
    if (FACES.every(([, dx, dz]) => top(x + dx, z + dz) === T)) { for (let i = 0; i < h; i++) g.set(x, T + i, z, block); return true; }
  }
  return false;
};
box(22, "light_gray_concrete", 2, (x) => x >= 3 && x <= 9);
box(34, "light_gray_concrete", 2, (x) => x >= 3 && x <= 9);
for (const [x, z] of [[4, 13], [5, 13], [4, 14], [5, 14]]) if (top(x, z) === 58) { g.set(x, 58, z, "light_gray_concrete"); g.set(x, 59, z, "light_gray_concrete"); }

const { blocks, palette } = g.save(`${DIR}/NYC1034479.nbt`);
console.log(`NYC1034479.nbt: ${blocks} blocks, ${palette} palette entries, size ${X} x ${Y} x ${Z}`);
