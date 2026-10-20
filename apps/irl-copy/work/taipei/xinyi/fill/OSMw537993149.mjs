import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw537993149.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw537993149.nbt";

// Record: lidar roof ~11 blocks above lowest ground; 16 x 14 footprint.
// Read as a two-storey, 1980s-90s Taipei commercial block: reinforced concrete frame,
// painted white render, shopfront glazing at street level, a window band above,
// cornice and parapet, rooftop water tank, and a glass-door entrance on the south front.

const W = 16, H = 23, D = 14;
const cells = JSON.parse(readFileSync(CELLS, "utf8")); // [x, z, ground]

const gmap = new Map();
let base = Infinity;
for (const [x, z, gr] of cells) {
  gmap.set(x + "," + z, gr);
  if (gr < base) base = gr;
}
if (!Number.isFinite(base)) base = 0;

const g = new Voxels([W, H, D]);

const inSet = (x, z) => gmap.has(x + "," + z);
const groundAt = (x, z) => gmap.get(x + "," + z);

// Place a block only on footprint cells, above that cell's ground, inside the volume.
function put(x, y, z, name, props) {
  const gr = groundAt(x, z);
  if (gr === undefined) return;
  if (y < gr || y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

// Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "polished_andesite");
}

const isEdge = (x, z) =>
  !inSet(x - 1, z) || !inSet(x + 1, z) || !inSet(x, z - 1) || !inSet(x, z + 1);

// Wall run direction: true when the wall runs along x.
const runsX = (x, z) => inSet(x - 1, z) || inSet(x + 1, z);

const paneProps = (runX) =>
  runX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Levels relative to datum base: storey 1 = r0..4, storey 2 = r5..9, cornice r10, parapet r11.
// Floor slab between storeys at r5, roof deck at r10.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const edge = isEdge(x, z);
  if (!edge) {
    put(x, base + 5, z, "light_gray_concrete");   // floor slab 2
    put(x, base + 10, z, "gray_concrete");        // roof deck
  }
}

// Front = edge cells on the highest z row; entrance at the median x of that row.
let frontZ = -Infinity;
const frontXs = [];
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (isEdge(x, z) && z > frontZ) frontZ = z;
}
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (isEdge(x, z) && z === frontZ) frontXs.push(x);
}
frontXs.sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : null;

// Edge walls.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isEdge(x, z)) continue;
  const runX = runsX(x, z);
  const idx = runX ? x : z;
  const mullion = idx % 3 === 0;
  const gr = groundAt(x, z);

  // r0 base course
  put(x, base, z, "stone_bricks");

  // r1..r3 shopfront: glass with white mullions, door at entrance
  for (let r = 1; r <= 3; r++) {
    if (mullion) put(x, base + r, z, "white_concrete");
    else put(x, base + r, z, "glass_pane", paneProps(runX));
  }
  // r4 shopfront lintel
  put(x, base + 4, z, "smooth_quartz");

  // r5 storey line
  put(x, base + 5, z, "smooth_quartz");

  // r6 sill/lintel, r7..r8 window band, r9 sill
  put(x, base + 6, z, "smooth_quartz");
  for (let r = 7; r <= 8; r++) {
    if (mullion) put(x, base + r, z, "white_concrete");
    else if (r === 7 && idx % 6 === 4) put(x, base + r, z, "glowstone");
    else put(x, base + r, z, "glass_pane", paneProps(runX));
  }
  put(x, base + 9, z, "smooth_quartz");

  // r10 cornice, r11 parapet
  put(x, base + 10, z, "smooth_quartz");
  put(x, base + 11, z, "white_concrete");

  // suppress air gaps under the cornice when ground is above datum
  if (gr > base) {
    for (let y = gr; y <= base + 11; y++) {
      if (y < H) {
        // already filled by the rules above where relevant
      }
    }
  }
}

// Entrance: glass door centred in the front shopfront, with a lintel above.
if (doorX !== null) {
  const dz = frontZ;
  const dy = Math.max(groundAt(doorX, dz), base + 1);
  if (dy + 1 < H) {
    g.set(doorX, dy, dz, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(doorX, dy + 1, dz, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
  // Canopy-style lintel above the door, kept on the footprint.
  put(doorX, base + 3, dz, "smooth_quartz");
}

// Rooftop water tank: 2 x 2 interior block on the roof deck.
let tank = null;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (isEdge(x, z)) continue;
  if (inSet(x + 1, z) && inSet(x, z + 1) && inSet(x + 1, z + 1) && !isEdge(x + 1, z) && !isEdge(x, z + 1) && !isEdge(x + 1, z + 1)) {
    const d = Math.abs(x - W / 2) + Math.abs(z - D / 2);
    if (!tank || d < tank.d) tank = { x, z, d };
  }
}
if (tank) {
  const { x: tx, z: tz } = tank;
  for (let dx = 0; dx <= 1; dx++) for (let dz2 = 0; dz2 <= 1; dz2++) {
    const cx = tx + dx, cz = tz + dz2;
    put(cx, base + 11, cz, "smooth_quartz");
    put(cx, base + 12, cz, "white_concrete");
    put(cx, base + 13, cz, "white_concrete");
    put(cx, base + 14, cz, "iron_block");
  }
}

// Roof-edge warm light on the parapet for dusk reading.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (isEdge(x, z) && (x + z) % 9 === 0 && base + 12 < H) {
    put(x, base + 12, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(OUT);
