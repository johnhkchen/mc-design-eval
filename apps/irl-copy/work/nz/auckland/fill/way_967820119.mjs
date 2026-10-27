// Way 967820119: a 1980s CBD office tower on a stepped podium. Pale precast frame, blue-tinted glass, a stone
// plinth and a shopfront lobby on the south face. The lidar roof becomes flat tiers: a 5-storey wing, 9- and 10-storey
// masses, and a 25-storey tower stepping back in three setbacks (52, 72, 100) on the north edge.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_967820119.cells.json`, "utf8"));
const W = 28, D = 46, H = 114;

// lidar roof (blocks above y 0) -> flat tier top; one storey = 4 blocks
function tierTop(r) {
  if (r >= 90) return 100;
  if (r >= 65) return 72;
  if (r >= 45) return 52;
  if (r >= 36) return 40;
  if (r >= 27) return 36;
  return 20;
}

const cell = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g, r] of cells) cell[z][x] = { g, T: tierTop(r) };
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && cell[z][x] !== null;
const topAt = (x, z) => (inFp(x, z) ? cell[z][x].T : 0);
const NEIGH = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// faces of cell (x, z) open to the air at height y: outside the footprint, or above the neighbour's top
const openFaces = (x, z, y) => NEIGH.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);
// position along the wall a face lies on (north/south faces run along x, east/west along z)
const alongOf = (x, z, [dx, dz]) => (dz !== 0 ? x : z);

const B = (block, state) => ({ block, state });
const GLASS = "light_blue_stained_glass", FRAME = "white_concrete", SPANDREL = "light_gray_concrete";

// warm lights: the air cell just inside a window, on about one window in eleven
const lit = new Set();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z)) continue;
  const { g, T } = cell[z][x];
  for (let y = g + 4; y < T - 1; y++) {
    const faces = openFaces(x, z, y);
    if (!faces.length || y % 4 === 0 || y % 4 === 3) continue;
    const face = faces[0];
    if (alongOf(x, z, face) % 3 === 0 || (x * 7 + z * 3 + y) % 11 !== 0) continue;
    const ix = x - face[0], iz = z - face[1];
    if (inFp(ix, iz) && openFaces(ix, iz, y).length === 0 && y >= cell[iz][ix].g && y < cell[iz][ix].T - 1 && y % 4 !== 0)
      lit.add(`${ix},${iz},${y}`);
  }
}

// the block at a footprint cell's height y (null = air)
function blockAt(x, z, y) {
  const { g, T } = cell[z][x];
  // lobby door, transom lantern and fascia on the south entrance
  if (z === 45 && x === 14) {
    if (y === g) return B("iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    if (y === g + 1) return B("iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (y === g + 2) return B("lantern", { hanging: "true" });
    if (y === g + 3) return B("stone_bricks");
  }
  if (y < g) return B("stone_bricks");                  // foundation: solid from y 0 up to the ground
  if (y >= T) return null;
  if (y === T - 1) return B("light_gray_concrete");     // roof membrane
  const faces = openFaces(x, z, y);
  if (faces.length) {
    const along = alongOf(x, z, faces[0]);
    if (y < g + 4) {                                    // ground storey: plinth course, shopfront, fascia
      if (y === g) return B("polished_andesite");
      if (y === g + 3) return B("stone_bricks");
      return along % 2 === 0 ? B("polished_andesite") : B("glass");
    }
    const r = y % 4;                                    // storey: slab edge, two glass rows, spandrel
    if (r === 0) return B(FRAME);
    if (r === 3) return B(SPANDREL);
    return along % 3 === 0 ? B(FRAME) : B(GLASS);       // mullion every third bay
  }
  if (y === g || y % 4 === 0) return B(SPANDREL);       // interior floor slab, one per storey
  if (lit.has(`${x},${z},${y}`)) return B("glowstone");
  return null;
}

const v = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z)) continue;
  const { T } = cell[z][x];
  for (let y = 0; y < T; y++) {
    const b = blockAt(x, z, y);
    if (b) v.set(x, y, z, b.block, b.state);
  }
  // parapet one course above a roof edge: open to the air or next to a lower roof
  if (NEIGH.some(([dx, dz]) => topAt(x + dx, z + dz) < T)) v.set(x, T, z, FRAME);
}

// roof plant on the 10-storey mass (inside the roof, standing on its slab)
for (let z = 10; z <= 11; z++) for (let x = 12; x <= 14; x++) {
  if (!inFp(x, z) || cell[z][x].T !== 40) continue;
  for (let y = 40; y < 43; y++) v.set(x, y, z, y === 42 ? "gray_concrete" : SPANDREL);
}

// the tower's mechanical penthouse: a tower-top cell with tower-top neighbours on at least two sides
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z) || cell[z][x].T !== 100) continue;
  const same = NEIGH.filter(([dx, dz]) => topAt(x + dx, z + dz) === 100).length;
  if (same < 2) continue;
  for (let y = 100; y < 102; y++) v.set(x, y, z, SPANDREL);
  v.set(x, 102, z, FRAME);
}

const out = `${DIR}/way_967820119.nbt`;
const res = v.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, ${res.palette} palette entries`);
