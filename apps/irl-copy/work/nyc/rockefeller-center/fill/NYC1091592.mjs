// 150 West 48th Street, a 2020 commercial and office building: a stepped block of pale stone piers and blue glass on a
// granite base, eight storeys at its tallest (24 blocks) in the south-east tower with a 27-block mechanical penthouse,
// six storeys (18) across the middle and four and two (12, 6) in the west wings. Each lidar roof is smoothed (5 x 5
// median) and read as a flat tier on a storey line (tiers are multiples of 3 blocks). The 48th Street frontage is the
// low-z face (x 0-20): a shopfront on the ground floor with a recessed lobby door at x 12-13 under a canopy. Glass
// sits on the face with an air gap one block behind and a floor slab per storey (no interiors); cores are solid.
// Warm glowstone sits behind some panes and a lantern lights the lobby.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1091592.cells.json`, "utf8"));
const X = 33, Y = 36, Z = 27;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
const groundOf = (x, z) => cell.get(`${x},${z}`).ground;

// Flat tiers on storey lines, read off the smoothed lidar and drawn as blocks of cells (every tier a multiple of 3).
// Lidar at or below 3 is ground-level court (paving), not roof.
const tierAt = (x, z) => {
  if (z <= 3) return 18;                                                       // NE corner
  if (z <= 16) {
    if (x >= 28) return 18;
    if (x <= 9) return x >= 3 && x <= 5 && z >= 11 && z <= 14 ? 15 : 12;       // west wing, with a 15 block
    if (x >= 12 && x <= 19 && z >= 5 && z <= 12) return 21;                    // central bay
    return 18;                                                                 // the body along 48th Street
  }
  if (x >= 22 && x <= 28 && z >= 18 && z <= 25) return 24;                     // the south-east tower
  if (x >= 21 && x <= 28 && z >= 17 && z <= 25) return 21;                     // its setback ring
  if (x >= 29) return 18;                                                      // south-east corner
  if (x >= 10 && x <= 16 && z >= 18 && z <= 22) return 15;                     // south-middle block
  if (x >= 17 && x <= 20 && z >= 17 && z <= 22) return 18;
  return 6;                                                                    // the south-west wing
};

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const TOP = new Map();                                    // "x,z" -> roof height in blocks; 0 = court (no roof)
for (const [x, z] of cols) TOP.set(`${x},${z}`, lidar(x, z) <= 3 ? 0 : tierAt(x, z));
// Mechanical penthouse on the south-east tower: three blocks of plant above its 24-block roof.
for (let z = 19; z <= 22; z++) for (let x = 24; x <= 27; x++) if (TOP.get(`${x},${z}`) === 24) TOP.set(`${x},${z}`, 27);

const roofAt = (x, z) => TOP.get(`${x},${z}`) ?? 0;
const open = (x, y, z) => roofAt(x, z) <= y;                // outside the footprint, a court, or below this roof
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // N = low z = the 48th Street frontage
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
const outer = (x, z) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !inFoot(x + dx, z + dz));   // the outside of the footprint

const ALONG_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on an N or S face
const ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on an E or W face
const GLASS = "light_blue_stained_glass_pane";
const ENTRY = (x, d) => d === "N" && (x === 12 || x === 13);   // the lobby door in the frontage

// What a face cell is made of: y is the block row, u the place along the face, t the roof of its column.
// Returns null for the doorway (left as air). Panes come back flagged so their air gap is cut behind them.
function faceBlock(x, y, z, d, t) {
  const [dx, dz] = DIRS[d];
  const u = dx === 0 ? x : z;
  if (y === t - 1) return { block: "smooth_quartz" };                                  // cornice
  if (t === 27) return y === 24 ? { block: "smooth_quartz" } : { block: u % 2 ? "gray_concrete" : "light_gray_concrete" };
  if (y === 0) return { block: "polished_granite" };                                   // base course
  if (y % 3 === 0) return { block: "smooth_quartz" };                                 // floor line
  if (y < 3 && ENTRY(x, d)) return null;                                              // lobby doorway
  if (u % 3 === 0) return { block: y < 3 ? "polished_granite" : "smooth_quartz" };     // piers
  return { block: GLASS, state: d === "N" || d === "S" ? ALONG_X : ALONG_Z, glaze: true };
}

const g = new Voxels([X, Y, Z]);
const glazed = [];      // [x, y, z, dx, dz] a pane with its inward neighbour to hollow out
const doors = [];       // [x, y, z, dx, dz] a doorway, cut through one block
for (const [x, z] of cols) {
  const gr = groundOf(x, z), t = roofAt(x, z);
  if (!t) {                                                                          // court: foundation and paving
    for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
    g.set(x, gr, z, "smooth_stone");
    continue;
  }
  for (let y = 0; y < t; y++) {
    const d = faceOf(x, y, z);
    if (y < gr) { g.set(x, y, z, d ? "polished_granite" : "stone_bricks"); continue; }   // foundation to the lidar ground
    if (d) {
      const fb = faceBlock(x, y, z, d, t);
      if (fb === null) { g.set(x, y, z, "air"); doors.push([x, y, z, ...DIRS[d]]); continue; }
      if (fb.glaze) glazed.push([x, y, z, ...DIRS[d]]);
      g.set(x, y, z, fb.block, fb.state);
      continue;
    }
    if (y === t - 1) {                                                               // roof: membrane with green patches
      g.set(x, y, z, t <= 18 && (x * 3 + z * 5) % 13 === 0 ? "moss_block" : "gray_concrete");
      continue;
    }
    g.set(x, y, z, "light_gray_concrete");                                           // solid core
  }
}

// Air gap behind each pane (none where the cell inward is itself a face); some gaps hold warm light.
for (const [x, y, z, dx, dz] of glazed) {
  const ix = x - dx, iz = z - dz;
  if (!inFoot(ix, iz) || roofAt(ix, iz) <= y || faceOf(ix, y, iz)) continue;
  g.set(ix, y, iz, (x * 5 + y * 7 + z * 3) % 11 === 0 ? "glowstone" : "air");
}

// The lobby: a two-block-high recess with a lantern hung in its ceiling, and a canopy over the door.
for (const [x, y, z, dx, dz] of doors) {
  const ix = x - dx, iz = z - dz;
  g.set(ix, y, iz, y === 2 && x === 12 ? "lantern" : "air", y === 2 && x === 12 ? { hanging: "true", waterlogged: "false" } : undefined);
}
for (let x = 11; x <= 14; x++) g.set(x, 3, 3, "smooth_quartz");

// Parapets on the outer ring of the building; setback edges carry their cornice on the face instead.
for (const [x, z] of cols) if (roofAt(x, z) && outer(x, z)) g.set(x, roofAt(x, z), z, "smooth_quartz");

const { blocks, palette } = g.save(`${DIR}/NYC1091592.nbt`);
console.log(`NYC1091592.nbt: ${blocks} blocks, ${palette} palette entries`);
