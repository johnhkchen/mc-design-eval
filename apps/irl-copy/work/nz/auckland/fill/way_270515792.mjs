// Way 270515792, Auckland: a 1930s brick-and-render commercial block, three storeys over a shopfront ground floor.
// The lidar's roof heights are smoothed into three flat tiers (one, two and three storeys, the top at 11 with a parapet
// on the rim). Each footprint column is solid from y 0 up, so every tier stands on the one below. Windows are glass set
// into the outer skin with an air pocket behind each (lit by a glowstone or lantern on some), and each storey has a
// solid floor. Entrance: a recessed door on the south frontage. Roof: a lift overrun and two plant units.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270515792.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..55, z 0..52

const W = 56, D = 53, Y = 24;
const at = (x, z) => z * W + x;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];                 // N, S, W, E (outward normals)

// lidar roof -> clean flat tiers: one storey (4), two (8), three with a parapet at 11
const tier = (r) => (r >= 9 ? 11 : r >= 5 ? 8 : 4);
const Hs = new Int16Array(W * D).fill(-1);                      // column top: body fills rows 0..top-1; -1 = not footprint
const Gs = new Int16Array(W * D);                               // the cell's own ground
for (const [x, z, g, r] of cells) { Gs[at(x, z)] = g; Hs[at(x, z)] = Math.max(tier(r), g + 4); }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && Hs[at(x, z)] >= 0;
const topOf = (x, z) => Hs[at(x, z)];
// the faces of a cell exposed at row y: a missing neighbour, or a lower neighbour whose top is below this row
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || topOf(x + dx, z + dz) <= y);

const PLINTH = "polished_andesite", STRING = "smooth_quartz", PARAPET = "smooth_quartz", PIER = "white_concrete";
const WALL = "bricks", FRAME = "gray_concrete", GLASS = "glass_pane", FASCIA = "dark_oak_planks";

// one skin block on a face: u runs along the face (x on a north/south face, z on an east/west one).
// Bays of 6: white piers at 0 and 5, a 4-wide opening (gray frame, two panes, frame) in the window rows, brick between.
function skin(u, y, g, shop) {
  if (y === g) return PLINTH;
  if (y === 4 || y === 8) return STRING;
  const c = ((u % 6) + 6) % 6;
  if (c === 0 || c === 5) return PIER;
  if (y < 4) { if (!shop) return WALL; if (y === 3) return FASCIA; }
  const win = y < 4 || (y >= 5 && y <= 6) || y >= 9;             // storey 2 windows 5-6 (brick head at 7); storey 3 at 9-10
  if (!win) return WALL;
  if (c === 1 || c === 4) return FRAME;
  return GLASS;
}

// the cell's "interior" test for the lift and plant placed on the roof deck (no exposed face at its top row)
const deckFree = (x, z) => inF(x, z) && topOf(x, z) === 11 && faces(x, z, 10).length === 0;

const v = new Voxels([W, Y, D]);
const pockets = [];
const footprint = cells.map(([x, z]) => [x, z]);

for (const [x, z] of footprint) {
  const c = at(x, z), g = Gs[c], h = topOf(x, z);
  for (let y = 0; y < h; y++) {
    if (y < g) { v.set(x, y, z, "stone_bricks"); continue; }
    const ex = faces(x, z, y);
    if (!ex.length) { v.set(x, y, z, y === h - 1 ? "smooth_stone" : "stone"); continue; }
    // a face that runs on along its wall (the next cell on that wall is exposed the same way) carries the bay pattern;
    // a cell exposed only at a notch of the ragged outline is a quoin
    const runs = ex.filter(([dx, dz]) => [1, -1].some((s) => {
      const nx = x + dz * s, nz = z + dx * s;
      return inF(nx, nz) && faces(nx, nz, y).some(([a, b]) => a === dx && b === dz);
    }));
    if (!runs.length) { v.set(x, y, z, PIER); continue; }
    const [dx, dz] = runs[0];
    const b = skin(dx !== 0 ? z : x, y, g, g <= 1);
    v.set(x, y, z, b);
    if (b === GLASS) pockets.push({ x, y, z, dx, dz, g, shop: g <= 1 });
  }
  if (DIRS.some(([dx, dz]) => !inF(x + dx, z + dz))) v.set(x, h, z, PARAPET);
}

// an air pocket behind each window (inward cell, interior only), lit on some at the pocket's floor row
for (const p of pockets) {
  const qx = p.x - p.dx, qz = p.z - p.dz;
  if (!inF(qx, qz)) continue;
  const qc = at(qx, qz);
  if (p.y < Gs[qc] + 1 || p.y >= topOf(qx, qz) - 1 || faces(qx, qz, p.y).length) continue;
  v.set(qx, p.y, qz, "air");
  const low = p.y < 4 ? p.g + 1 : p.y < 8 ? 5 : 9;               // floor row of this storey's pocket
  if (p.y === low && (p.x * 7 + p.z * 3 + p.y) % 4 === 0) {
    if (p.y < 4) v.set(qx, p.y, qz, "lantern", { hanging: "false" });
    else v.set(qx, p.y, qz, "glowstone");
  }
}

// entrance: the middle of the low south frontage, a recessed door with a pocket and a lantern
const south = footprint.filter(([x, z]) => Gs[at(x, z)] <= 1 && !inF(x, z + 1)).sort((a, b) => a[0] - b[0]);
const [ex0, ez0] = south[Math.floor(south.length / 2)];
const eg = Gs[at(ex0, ez0)];
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
for (let y = eg + 1; y <= eg + 2; y++) {
  v.set(ex0, y, ez0, "air");
  v.set(ex0, y, ez0 - 1, "air");                                 // porch pocket behind the door (inward)
}
v.set(ex0, eg + 1, ez0, "dark_oak_door", doorState("lower"));
v.set(ex0, eg + 2, ez0, "dark_oak_door", doorState("upper"));
v.set(ex0, eg + 1, ez0 - 1, "lantern", { hanging: "false" });

// roof: a lift overrun (6 x 5, white render with a glazed band) and two plant units, on the deck at 11
const roofCells = footprint.filter(([x, z]) => topOf(x, z) === 11);
const mx = roofCells.reduce((s, [x]) => s + x, 0) / roofCells.length;
const mz = roofCells.reduce((s, [, z]) => s + z, 0) / roofCells.length;
let best = null;
for (let x0 = 0; x0 + 6 <= W; x0++) for (let z0 = 0; z0 + 5 <= D; z0++) {
  let ok = true;
  for (let x = x0; x < x0 + 6 && ok; x++) for (let z = z0; z < z0 + 5 && ok; z++) ok = deckFree(x, z);
  if (!ok) continue;
  const d = Math.hypot(x0 + 3 - mx, z0 + 2.5 - mz);
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) {
  const { x0, z0 } = best;
  for (let x = x0; x < x0 + 6; x++) for (let z = z0; z < z0 + 5; z++) {
    const edge = x === x0 || x === x0 + 5 || z === z0 || z === z0 + 4;
    for (let y = 11; y <= 13; y++) {
      const glazed = edge && y === 12 && !((x === x0 || x === x0 + 5) && (z === z0 || z === z0 + 4));
      v.set(x, y, z, glazed ? GLASS : PIER);
    }
    v.set(x, 14, z, STRING);
  }
}
let vents = 0;
for (let x = 0; x + 2 <= W && vents < 2; x += 2) for (let z = 0; z + 2 <= D && vents < 2; z += 2) {
  if (best && x + 2 > best.x0 - 1 && x < best.x0 + 7 && z + 2 > best.z0 - 1 && z < best.z0 + 6) continue;
  if (![[0, 0], [1, 0], [0, 1], [1, 1]].every(([i, j]) => deckFree(x + i, z + j))) continue;
  for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) v.set(x + i, 11, z + j, "iron_block");
  vents++;
}

const out = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270515792.nbt");
console.log(`way_270515792: ${footprint.length} columns, ${pockets.length} window cells, ${out.blocks} blocks, ${out.palette} palette entries, overrun ${best ? "placed" : "none"}, plant units ${vents}`);
