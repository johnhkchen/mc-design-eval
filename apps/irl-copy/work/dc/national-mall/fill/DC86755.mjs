// 1301 14th St NW (Thomas Circle): a commercial block of the 1900s-1920s, three storeys of red brick on a stone plinth
// with cream stone quoins, string courses and a cornice; a shopfront ground storey with dark-oak piers; a flat roof with a
// plant box and a brick chimney. The lidar roof is median-smoothed into tiers, and each setback is a deck slab that its
// taller neighbour's walls stand on. No interiors: air behind the glass, a floor course per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86755.cells.json`, "utf8"));
const SIZE = [26, 23, 18];

const key = (x, z) => `${x},${z}`;
const GROUND = new Map(), LIDAR = new Map();
for (const [x, z, g, r] of cells) { GROUND.set(key(x, z), g); LIDAR.set(key(x, z), r); }
const inFp = (x, z) => GROUND.has(key(x, z));

// Roof: the median of each cell's 3x3 neighbourhood (lidar noise), snapped to the tiers 6, 8, 9, 10, 11
const tierOf = (m) => (m >= 11 ? 11 : m >= 10 ? 10 : m >= 9 ? 9 : m >= 8 ? 8 : 6);
const ROOF = new Map();
for (const [x, z] of cells) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) v.push(LIDAR.get(key(x + dx, z + dz)));
  v.sort((a, b) => a - b);
  ROOF.set(key(x, z), tierOf(v[v.length >> 1]));
}
const groundAt = (x, z) => GROUND.get(key(x, z));
const roofAt = (x, z) => ROOF.get(key(x, z));

const SIDES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// storey lines: a floor course every 3 rows down from 4 below the roof, the lowest at least 3 above the ground
const linesOf = (g, R) => { const out = []; for (let l = R - 4; l >= g + 3; l -= 3) out.push(l); return out; };
// the sides of cell (x, y, z) that face outside: off the footprint, or above a lower neighbour's roof
const exposed = (x, y, z) => SIDES.filter(([, dx, dz]) => !inFp(x + dx, z + dz) || roofAt(x + dx, z + dz) <= y).map(([s]) => s);
// a setback: the taller cell gets a deck slab at each lower neighbour's roof level, so its walls above stand on it
const setbackRows = (x, z) => {
  const rows = new Set();
  for (const [, dx, dz] of SIDES) if (inFp(x + dx, z + dz) && roofAt(x + dx, z + dz) < roofAt(x, z)) rows.add(roofAt(x + dx, z + dz) - 1);
  return rows;
};

// the model: "x,y,z" -> { block, state }; only solid cells are stored, the rest is air
const M = new Map();
const put = (x, y, z, block, state) => M.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => M.get(`${x},${y},${z}`);

for (const [x, z] of cells) {
  const g = groundAt(x, z), R = roofAt(x, z), L = linesOf(g, R), slabs = setbackRows(x, z);
  const lowest = L.length ? L[L.length - 1] : R - 1;   // the ground storey runs from the plinth up to the lowest line
  for (let y = 0; y < R; y++) {
    if (y <= g) { put(x, y, z, "stone_bricks"); continue; }   // foundation to the ground, plinth on it
    const out = exposed(x, y, z);
    if (y === R - 1) { put(x, y, z, out.length ? "calcite" : "stone"); continue; }   // cornice on the edge, roof deck inside
    if (L.includes(y) || slabs.has(y)) { put(x, y, z, out.length ? "calcite" : "smooth_stone"); continue; }   // string course / floor
    if (!out.length) continue;   // no interiors: air behind the glass
    const along = out.includes("N") || out.includes("S") ? x : z;
    // a 4-cell bay: a brick pier and a window of two panes, the shopfront below glazed but for its piers
    const ground = y < lowest;
    if (ground && along % 4 === 0) put(x, y, z, "dark_oak_planks");
    else if (ground || along % 4 === 1 || along % 4 === 2) put(x, y, z, "glass_pane");   // connections set below
    else put(x, y, z, "bricks");
  }
}

// the entrance: a dark-oak door in the north front, set in the glass of the ground storey
{
  const [x, z] = [2, 0], y = groundAt(x, z) + 1;
  const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
  put(x, y, z, "dark_oak_door", { ...door, half: "lower" });
  put(x, y + 1, z, "dark_oak_door", { ...door, half: "upper" });
}

// warm light: a glowstone just inside some upper windows, a lantern on the shop floor inside the ground storey
for (const [x, z] of cells) for (let y = groundAt(x, z) + 1; y < roofAt(x, z) - 1; y++) {
  const a = at(x, y, z);
  if (!a || a.block !== "glass_pane") continue;
  const sd = exposed(x, y, z);
  if (sd.length !== 1) continue;
  const [dx, dz] = INWARD[sd[0]], ix = x + dx, iz = z + dz;
  const along = dx ? z : x;
  if (!inFp(ix, iz) || at(ix, y, iz) || exposed(ix, y, iz).length) continue;
  if (y === groundAt(x, z) + 1 && along % 6 === 1) put(ix, y, iz, "lantern", { hanging: "false" });
  else if (y > groundAt(x, z) + 2 && along % 6 === 1 && y % 2 === 0) put(ix, y, iz, "glowstone");
}

// roof: a plant box on the first tallest 2x2 and a brick chimney on the next tallest cell
{
  const tall = (x, z) => inFp(x, z) && roofAt(x, z) === 11;
  const [bx, bz] = cells.map(([x, z]) => [x, z]).find(([x, z]) => tall(x, z) && tall(x + 1, z) && tall(x, z + 1) && tall(x + 1, z + 1));
  for (const [x, z] of [[bx, bz], [bx + 1, bz], [bx, bz + 1], [bx + 1, bz + 1]]) put(x, roofAt(x, z), z, "light_gray_concrete");
  const [cx, cz] = cells.map(([x, z]) => [x, z]).find(([x, z]) => tall(x, z) && (x < bx || x > bx + 1 || z < bz || z > bz + 1));
  const top = roofAt(cx, cz);
  for (let y = top; y <= top + 2; y++) put(cx, y, cz, "bricks");
  put(cx, top + 3, cz, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// pane connections: a pane joins the solid walls and panes beside it in its own plane
for (const [k, c] of M) {
  if (c.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const solid = (dx, dz) => (at(x + dx, y, z + dz) ? "true" : "false");
  const facing = exposed(x, y, z)[0];
  c.state = facing === "N" || facing === "S"
    ? { east: solid(1, 0), west: solid(-1, 0), north: "false", south: "false" }
    : { north: solid(0, -1), south: solid(0, 1), east: "false", west: "false" };
}

const g = new Voxels(SIZE);
for (const [k, { block, state }] of M) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state); }
const counts = {};
for (const { block } of M.values()) counts[block] = (counts[block] ?? 0) + 1;
console.log(counts);
console.log(g.save(`${DIR}/DC86755.nbt`));
