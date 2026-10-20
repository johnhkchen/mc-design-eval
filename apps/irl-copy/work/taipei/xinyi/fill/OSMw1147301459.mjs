import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise commercial/office block, Xinyi district: four storeys of white
// tiled concrete with a glass grid, stone base, parapet and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1147301459";
const W = 14, H = 33, D = 18;
const ROOF_ABOVE = 21;           // roof is ~21 blocks above lowest ground
const STOREY = 5;                // blocks per storey
const STOREYS = 4;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let B = Infinity;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, gr);
  if (gr < B) B = gr;
}
if (!Number.isFinite(B)) B = 0;

const g = new Voxels([W, H, D]);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Floor lines (absolute); the last one is the roof deck.
const FLOORS = [];
for (let i = 1; i <= STOREYS; i++) FLOORS.push(B + i * STOREY);
const ROOF_Y = B + ROOF_ABOVE - 1;  // roof deck level (B+20)

// Storey boundaries for a cell whose ground is gc.
function bounds(gc) {
  return [gc, ...FLOORS.filter((f) => f > gc)];
}

const glassProps = (x, z) =>
  z === 0 || z === D - 1
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Facade block for an edge cell at height y inside a storey segment.
function facade(x, z, y, rel, span, isGround, gc) {
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const entrance = z === 0 && (x === 6 || x === 7) && isGround;

  // Canopy/lintel over the entrance, on the spandrel line.
  if (z === 0 && x >= 5 && x <= 8 && isGround && rel === span - 1) {
    return put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
  if (rel === span - 1) return put(x, y, z, "white_concrete"); // spandrel
  if (corner) return put(x, y, z, "white_concrete");
  if (entrance && rel === 1) {
    return put(x, y, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: x === 6 ? "left" : "right",
      open: "false", powered: "false",
    });
  }
  if (entrance && rel === 2) {
    return put(x, y, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: x === 6 ? "left" : "right",
      open: "false", powered: "false",
    });
  }
  if ((x + z) % 2 === 1) return put(x, y, z, "light_blue_stained_glass_pane", glassProps(x, z));
  return put(x, y, z, "white_concrete"); // mullion
}

// Main massing, column by column.
for (const [x, z, gc] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const isEdge = edge(x, z);

  // Foundation below the cell's own ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone");
  // Ground slab.
  put(x, gc, z, "white_concrete");

  const levels = FLOORS.filter((f) => f > gc);
  for (const f of levels) {
    put(x, f, z, f === ROOF_Y ? "gray_concrete" : "white_concrete");
  }

  const b = bounds(gc);
  for (let k = 0; k < b.length - 1; k++) {
    const lo = b[k], hi = b[k + 1];
    const span = hi - lo;
    const isGround = k === 0;
    for (let y = lo + 1; y < hi; y++) {
      const rel = y - lo;
      if (isEdge) facade(x, z, y, rel, span, isGround, gc);
      // interior air otherwise
    }
  }

  // Parapet on the roof edge.
  if (isEdge && levels.length) {
    put(x, ROOF_Y + 1, z, "white_concrete");
    put(x, ROOF_Y + 2, z, "white_concrete");
  }
}

// Warm lights behind a few windows on the front (z = 0) face.
for (const x of [3, 9]) {
  if (!has(x, 0) || !has(x, 1) || edge(x, 1)) continue;
  const gc = gAt(x, 1);
  const b = bounds(gc);
  for (let k = 0; k < b.length - 1; k++) {
    const lo = b[k], hi = b[k + 1];
    if (hi - lo < 4) continue;
    put(x, lo + 2, 1, "shroomlight");
  }
}

// Rooftop plant room and lightning rod.
for (let x = 5; x <= 8; x++) {
  for (let z = 7; z <= 10; z++) {
    if (!has(x, z)) continue;
    for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) {
      put(x, y, z, "light_gray_concrete");
    }
  }
}
if (has(6, 8)) {
  put(6, ROOF_Y + 4, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
