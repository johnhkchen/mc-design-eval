// DC59139: 810 7th St NW, a 1920s Penn Quarter commercial office. Red brick over a granite base, calcite (limestone) storey
// lines, cornice and quoins, steel-sash windows in light-blue glass, a glass-and-door entry on the 7th Street (west) face
// with a canopy, and a shopfront ground storey on the west and north faces. Lidar roof heights become three flat tiers
// (12, 9, 6 blocks) round a 15-block tower core, stepped down to a 12-block terrace; the rear wing is 6.
// Every block is built on the footprint, and every solid sits on a solid below it, a floor slab, or a wall it is joined to.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59139.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59139.nbt";
const SIZE = [28, 27, 24];

// ---- footprint and massing -------------------------------------------------------------------------------------------
// lidar roof -> flat tier: 14+ is the tower (15), 11-13 the podium (12), 8-10 the east shoulder (9), the rest the wing (6)
const tierOf = (r) => (r >= 14 ? 15 : r >= 11 ? 12 : r >= 8 ? 9 : 6);
const FOOT = new Map();
for (const [x, z, g, r] of cells) FOOT.set(`${x},${z}`, { g, raw: r, R: tierOf(r) });
const cellAt = (x, z) => FOOT.get(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// setback: a tower cell next to a lower cell of the footprint steps down to the 12 terrace (one pass, from the raw tiers)
const stepDown = [];
for (const [k, c] of FOOT) {
  if (c.R !== 15) continue;
  const [x, z] = k.split(",").map(Number);
  if (NB.some(([dx, dz]) => cellAt(x + dx, z + dz) && cellAt(x + dx, z + dz).R < 15)) stepDown.push(c);
}
for (const c of stepDown) c.R = 12;

// Faces of a cell that are open to outside at height y: the footprint's edge, or a lower neighbour's roof
// (only where this cell is taller than that neighbour, so flat neighbours never get a wall between them).
const FACE = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
function faces(x, z, y) {
  const c = cellAt(x, z), out = [];
  if (!c || y < 0 || y > c.R - 1) return out;
  for (const [d, [dx, dz]] of Object.entries(FACE)) {
    const n = cellAt(x + dx, z + dz);
    if (!n) out.push(d);
    else if (c.R > n.R && y >= n.R - 1) out.push(d);
  }
  return out;
}

// ---- the block model -------------------------------------------------------------------------------------------------
const M = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => M.set(key(x, y, z), { block, state });
const has = (x, y, z) => M.has(key(x, y, z));

const FLOORS = [4, 7, 10, 13];       // storey lines: floor slabs (interior) and calcite bands (exterior)
const WINDOW_ROWS = [5, 6, 8, 9, 11, 12];
const GROUND_ROWS = [1, 2];          // shopfront or ground-storey glazing
const SHOP = (f) => f.includes("W") || f.includes("N");

for (const [k, c] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  const R = c.R;
  for (let y = 0; y < R; y++) {
    const f = faces(x, z, y);
    const ext = f.length > 0, corner = f.length > 1;
    const f0 = f[0];
    // the position along the exposed face: a pair of windows then two cells of brick pier, repeating every four cells
    const along = f0 === "W" || f0 === "E" ? z : x;
    const bayWindow = along % 4 === 1 || along % 4 === 2;

    if (y === 0) { put(x, y, z, ext ? "polished_granite" : "smooth_stone"); continue; }
    if (FLOORS.includes(y) && y <= R - 2) { put(x, y, z, ext ? "calcite" : "smooth_stone"); continue; }
    if (y === R - 1) { if (ext) put(x, y, z, corner ? "calcite" : "bricks"); continue; }
    if (!ext) continue;                                   // interior air: the gap behind the glass
    if (corner) { put(x, y, z, "calcite"); continue; }   // limestone quoins at the corners
    if (y === 3) { put(x, y, z, "calcite"); continue; }  // lintel over the ground storey
    if (GROUND_ROWS.includes(y)) {
      // the entry on the 7th Street face: glass either side of a pair of doors, under the canopy
      if (f0 === "W" && x === 0 && z >= 10 && z <= 13) {
        if (z === 11 || z === 12) {
          const hinge = z === 11 ? "left" : "right";
          put(x, y, z, "dark_oak_door", { facing: "east", half: y === 1 ? "lower" : "upper", hinge, open: "false", powered: "false" });
        } else put(x, y, z, "light_blue_stained_glass_pane");
        continue;
      }
      if (SHOP(f)) put(x, y, z, bayWindow ? "light_blue_stained_glass_pane" : "polished_granite");
      else put(x, y, z, bayWindow ? "light_blue_stained_glass_pane" : "bricks");
      continue;
    }
    if (WINDOW_ROWS.includes(y)) put(x, y, z, bayWindow ? "light_blue_stained_glass_pane" : "bricks");
  }
}

// the canopy over the entry and its two posts, all inside the footprint
for (let z = 10; z <= 13; z++) for (const x of [1, 2]) put(x, 3, z, "stone_bricks");
for (const z of [10, 13]) for (const y of [1, 2]) put(2, y, z, "polished_granite");
put(1, 2, 10, "lantern", { hanging: "true", waterlogged: "false" });
put(1, 2, 13, "lantern", { hanging: "true", waterlogged: "false" });

// warm light behind a few upper windows (glowstone or shroomlight on the inner cell, which is air and sits on a floor)
for (const [k, c] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.R; y++) {
    if (!WINDOW_ROWS.includes(y) || !has(x, y, z)) continue;
    const blk = M.get(key(x, y, z));
    if (blk.block !== "light_blue_stained_glass_pane") continue;
    const f = faces(x, z, y)[0];
    if (!f || !((x * 7 + z * 3 + y) % 9 === 0)) continue;
    const [dx, dz] = FACE[f];
    const ix = x - dx, iz = z - dz;
    if (!cellAt(ix, iz) || has(ix, y, iz) || faces(ix, iz, y).length) continue;
    put(ix, y, iz, (x + z + y) % 2 ? "glowstone" : "shroomlight");
  }
}

// roof equipment: a few plant boxes on the tower roof and the podium terrace (interior cells only)
for (const [k, c] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  if (c.R === 15 && x % 5 === 2 && z % 4 === 1 && !faces(x, z, 14).length) put(x, 14, z, "light_gray_concrete");
  if (c.R === 12 && x % 6 === 4 && z % 5 === 2 && NB.every(([dx, dz]) => cellAt(x + dx, z + dz)?.R === 12) && !faces(x, z, 11).length) put(x, 11, z, "light_gray_concrete");
}

// glass panes join the neighbours they touch, as the game would connect them
for (const [k, b] of M) {
  if (b.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const side = (dx, dz) => (has(x + dx, y, z + dz) ? "true" : "false");
  b.state = { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" };
}

// ---- check: every block stands on a block below or is joined to one beside it ----------------------------------------
let unsupported = 0;
for (const [k] of M) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0) continue;
  const below = has(x, y - 1, z);
  const beside = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => has(x + dx, y, z + dz));
  if (!below && !beside) unsupported++;
}
if (unsupported) console.warn(`unsupported blocks: ${unsupported}`);

// ---- write -----------------------------------------------------------------------------------------------------------
const g = new Voxels(SIZE);
for (const [k, b] of M) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const res = g.save(OUT);
console.log(`DC59139: ${res.blocks} blocks, palette ${res.palette}, ${unsupported} unsupported`);
