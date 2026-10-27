// Number 4 Khyber Reservoir, Auckland (Mt Eden / Khyber Pass). A 1930s-era reinforced-concrete service reservoir:
// an earth-covered (grass-topped) concrete tank, so it is solid massing with no interiors, a pilastered wall with
// storey bands, iron-grille vent slits with a lit one in three, a plinth, a crenellated parapet, roof vent stacks,
// and a gatehouse door under a lintel with a hanging lantern. The lidar roof is smoothed into flat tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_46493858.cells.json", "utf8"));
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_46493858.nbt";

const X = 97, Y = 28, Z = 69;
const g = new Voxels([X, Y, Z]);

// footprint lookup: key -> { ground, roof }
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, roof });
const has = (x, z) => cell.has(`${x},${z}`);

// Lidar roof noise -> flat tiers: a 3x3 median over footprint neighbours, then quantised to the tier heights
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const smooth = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = cell.get(`${x + dx},${z + dz}`); if (c) v.push(c.roof); }
  return median(v);
};
const tierOf = (s) => (s < 7 ? 6 : s < 12 ? 9 : s < 15 ? 13 : 16);
const top = new Map();    // key -> top y (the roof surface; solid from 0 up to it)
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  top.set(k, Math.max(tierOf(smooth(x, z)), c.ground + 4));
}
const topAt = (x, z) => top.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the faces of a cell that are open to air at height y (outside the footprint, or the neighbour's roof is below y)
const openFaces = (x, z, y) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz) || topAt(x + dx, z + dz) <= y);

// Materials
const WALL = "light_gray_concrete", TRIM = "white_concrete", BASE = "stone_bricks", GRASS = "grass_block", INNER = "light_gray_concrete";
const BARS = "iron_bars", GLOW = "glowstone", LAMP = "lantern", DOOR = "iron_door", AIR = "air";

// 1. Solid massing from y 0 to each roof, with the plinth, storey bands, pilasters, grass deck, and parapet
const exposed = new Set();
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const t = topAt(x, z);
  for (let y = 0; y < t; y++) {
    const open = openFaces(x, z, y);
    if (!open.length) { g.set(x, y, z, y === t - 1 ? GRASS : INNER); continue; }
    if (y === t - 1) { g.set(x, y, z, WALL); continue; }
    exposed.add(`${x},${y},${z}`);
    if (y >= c.ground && y <= c.ground + 1) g.set(x, y, z, BASE);
    else if ((x + z) % 6 === 0) g.set(x, y, z, TRIM);        // pilasters every six cells
    else if (y % 4 === 0) g.set(x, y, z, TRIM);              // storey bands
    else g.set(x, y, z, WALL);
  }
  // a continuous concrete coping on the top of exposed edge cells (a reservoir, not a keep: no crenels)
  if (openFaces(x, z, t - 1).length) g.set(x, t, z, TRIM);
}

// 2. Vent slits and the gatehouse, carved into the walls: an iron grille on the face, the cell behind it air or lit
const carve = (x, y, z, block, state) => g.set(x, y, z, block, state);
const axisState = (face) => (face[0] !== 0 ? { north: "true", south: "true", east: "false", west: "false" }
  : { north: "false", south: "false", east: "true", west: "true" });
let lit = 0, vents = 0;
for (const k of exposed) {
  const [x, y, z] = k.split(",").map(Number);
  const c = cell.get(`${x},${z}`), t = topAt(x, z);
  if ((x + z) % 6 !== 3 || y % 4 === 0 || y % 4 === 3 || y <= c.ground + 1 || y >= t - 1) continue;
  const face = openFaces(x, z, y)[0];
  if (!face) continue;
  const [fx, fz] = face, ix = x - fx, iz = z - fz;           // inward: the cell behind the face
  if (!has(ix, iz) || topAt(ix, iz) <= y) continue;
  const glow = (x * 7 + z * 3 + y) % 3 === 0;
  carve(x, y, z, BARS, axisState(face));
  carve(ix, y, iz, glow ? GLOW : AIR);
  vents++; if (glow) lit++;
}

// gatehouse on the north-facing wall nearest the middle of the footprint
const doorFace = [];
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x, z - 1) && topAt(x, z) >= c.ground + 5 && (x + z) % 6 !== 0) doorFace.push([x, z]);
}
const mx = doorFace.reduce((s, [x]) => s + x, 0) / doorFace.length;
const [dx0, dz0] = doorFace.sort((a, b) => Math.abs(a[0] - mx) - Math.abs(b[0] - mx))[0];
const gr = cell.get(`${dx0},${dz0}`).ground;
const facing = "north";
// lower and upper door halves, the cell behind it air, jambs in stone and a lintel above
g.set(dx0, gr + 1, dz0, DOOR, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx0, gr + 2, dz0, DOOR, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
for (const y of [gr + 1, gr + 2]) g.set(dx0, y, dz0 + 1, AIR);
for (const dx of [-1, 1]) for (const y of [gr + 1, gr + 2]) g.set(dx0 + dx, y, dz0, BASE);
for (const dx of [-1, 0, 1]) g.set(dx0 + dx, gr + 3, dz0, TRIM);
g.set(dx0, gr + 2, dz0 + 1, LAMP, { hanging: "true", waterlogged: "false" });

// 3. Roof: vent stacks standing on the grass deck of the interior, away from the edges
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  const t = topAt(x, z);
  if (openFaces(x, z, t - 1).length || x % 12 !== 6 || z % 12 !== 6 || t < 9) continue;
  g.set(x, t, z, INNER); g.set(x, t + 1, z, INNER);
}

const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, palette ${palette}, vents ${vents} (lit ${lit}), door at x${dx0} z${dz0}`);
