// FR245184469: a Haussmann-era block on the Ile de la Cite's quai, the Notre-Dame square side (cream Paris limestone,
// zinc-grey slate roofs). The lidar tops are 8-block two-storey facades (the 9-10 ring, the 3-4 east wing snapped to
// a one-storey 4-block tier, and the 7s and 8s to 8). Each storey is four blocks: a ground shop storey (glazed bays
// between stone pillars, a door on the north face), a storey line, a window storey with sills and panes, and on the
// 10-block tiers a second window row under a cornice. The footprint is a one-cell ring of walls round air with a
// floor slab per storey, so each window has air behind it and a few warm glowstones stand in that air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184469.cells.json", "utf8"));

const BODY = "calcite";            // Paris limestone, cream-white
const BAND = "smooth_sandstone";   // storey lines, sills and cornice
const PLINTH = "stone_bricks";     // foundation
const FLOOR = "smooth_stone";      // storey slabs
const ROOF = "deepslate_tiles";    // zinc-grey slate
const SHOP = "glass";              // shopfront glazing
const PANE = "glass_pane";         // upper windows
const CHIM = "bricks";             // chimney stack
const LIGHT = "glowstone";         // warm light behind some panes

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, r });
const inFp = (x, z) => byXZ.has(`${x},${z}`);
const ring = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Lidar tops -> three clean tiers: 4 (the one-storey east wing), 8 (two storeys), 10 (two storeys and a window row under the cornice)
const snap = (r) => (r <= 4 ? 4 : r <= 8 ? 8 : 10);
const parapetNext = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
  const n = byXZ.get(`${x + dx},${z + dz}`);
  return n && ring(x + dx, z + dz) && snap(n.r) === 10;
});

const g = new Voxels([10, 26, 11]);
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // runs along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // runs along z

for (const [x, z, gr, r] of cells) {
  const T = snap(r), B = gr;                      // B: the cell's own ground; storeys are absolute heights
  const edge = ring(x, z);
  const north = !inFp(x, z - 1), south = !inFp(x, z + 1), west = !inFp(x - 1, z), east = !inFp(x + 1, z);
  const face = north || south || west || east;
  const alongX = north || south;                  // the face runs along x, so its bays are placed by x
  const along = alongX ? x : z;
  const windowCol = face && along % 3 === 1;      // one window bay every three cells, as a Haussmann bay
  const pillar = face && along % 3 === 0;
  const door = north && x === 4 && z === 0;       // the hotel-style entrance on the street face

  for (let y = 0; y < B; y++) g.set(x, y, z, PLINTH);   // foundation up to this cell's ground

  for (let y = B; y < T; y++) {
    if (edge) {
      if (y === T - 1) { g.set(x, y, z, BAND); continue; }                 // cornice cap on the walls
      if (y < 4) {                                                          // ground shop storey
        if (door && y <= B + 1) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === B ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (door && y === B + 2) { g.set(x, y, z, BODY); continue; }        // lintel over the door
        if (face && !pillar) { g.set(x, y, z, SHOP); continue; }
        g.set(x, y, z, BODY); continue;
      }
      if (y === 4) { g.set(x, y, z, BAND); continue; }                      // storey line
      if (y === 5) { g.set(x, y, z, BODY); continue; }                      // sill row under the windows
      if (y === 6 || (T === 10 && y === 8)) { g.set(x, y, z, windowCol ? PANE : BODY, windowCol ? (alongX ? PANE_NS : PANE_EW) : undefined); continue; }
      if (T === 10 && y === 7) { g.set(x, y, z, BAND); continue; }          // band between the two window rows
      g.set(x, y, z, BODY); continue;
    }
    // interior: air behind the glass, one floor slab per storey, the roof slab on top
    if (y === T - 1) { g.set(x, y, z, ROOF); continue; }
    if ((y === 4 && T > 4) || (y === 8 && T === 10)) { g.set(x, y, z, FLOOR); continue; }
  }
  // a roof beside a 10-block parapet steps up one block, so the parapet is a lip, not a well
  if (!edge && T === 8 && parapetNext(x, z)) g.set(x, 8, z, ROOF);
}

// warm light: a glowstone in the air just inside a window bay, on the floor slab, every third bay
let n = 0;
for (const [x, z, gr, r] of cells) {
  if (!ring(x, z)) continue;
  const T = snap(r);
  const north = !inFp(x, z - 1), south = !inFp(x, z + 1), west = !inFp(x - 1, z), east = !inFp(x + 1, z);
  if (!(north || south || west || east) || T < 8) continue;
  const alongX = north || south;
  const along = alongX ? x : z;
  if (along % 3 !== 1) continue;
  // the cell inward from this window
  const ix = x + (west ? 1 : east ? -1 : 0), iz = z + (north ? 1 : south ? -1 : 0);
  if (!inFp(ix, iz) || ring(ix, iz)) continue;
  if (++n % 3 !== 0) continue;
  g.set(ix, 5, iz, LIGHT);
}

// one brick stack on the highest interior roof nearest the middle
let best = null;
for (const [x, z, gr, r] of cells) {
  if (ring(x, z) || snap(r) < 8) continue;
  const d = Math.hypot(x - 4.5, z - 5);
  if (!best || d < best.d) best = { x, z, d, T: snap(r) };
}
if (best) {
  for (let y = best.T; y < best.T + 3; y++) g.set(best.x, y, best.z, CHIM);
  g.set(best.x, best.T + 3, best.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184469.nbt";
const res = g.save(out);
console.log(JSON.stringify({ ...res, cells: cells.length }));
