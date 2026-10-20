import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE99-0450-7F: 2010 mid-rise office/residential block, Xinyi district.
// Seven storeys of 5 blocks (roof at y 35), pale precast-look white concrete frame,
// blue-tinted glazing, light-grey transoms, granite base course, glazed ground-floor
// entrance bay with a dark door surround. Roof plant box and lightning rod on top.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE99-0450-7F";
const W = 20, H = 47, D = 15;
const ROOF_Y = 35;
const PARAPET_TOP = 37;

const PANE = "light_blue_stained_glass_pane";
const FRAME = "white_concrete";
const TRANSOM = "light_gray_concrete";
const SLAB = "light_gray_concrete";
const BASE = "polished_granite";
const FOUNDATION = "stone_bricks";
const ROOF = "smooth_quartz";
const ENTRY_DARK = "dark_oak_planks";
const PIER = "polished_andesite";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Exposed face of a footprint cell (null for interior cells). Priority: south, north, east, west.
function faceOf(x, z) {
  if (!inside(x, z + 1)) return "south";
  if (!inside(x, z - 1)) return "north";
  if (!inside(x + 1, z)) return "east";
  if (!inside(x - 1, z)) return "west";
  return null;
}
function exposedCount(x, z) {
  return [!inside(x, z + 1), !inside(x, z - 1), !inside(x + 1, z), !inside(x - 1, z)]
    .filter(Boolean).length;
}

const plan = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, id, props = null, extra = {}) =>
  plan.set(key(x, y, z), { id, props, ...extra });
const at = (x, y, z) => plan.get(key(x, y, z));

// ---- Shell, storeys, frame ----
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUNDATION);

  const face = faceOf(x, z);
  const corner = exposedCount(x, z) > 1;
  const idx = face === "south" || face === "north" ? x : z;

  for (let y = gr; y <= ROOF_Y; y++) {
    if (y === ROOF_Y) {
      put(x, y, z, ROOF);
      continue;
    }
    if (!face) {
      // Interior: storey slabs only, the rest is air.
      if (y % 5 === 0) put(x, y, z, SLAB);
      continue;
    }
    // Facade cells
    const wall = { wall: true };
    if (y === gr) {
      put(x, y, z, BASE, null, wall); // base course
    } else if (y % 5 === 0) {
      put(x, y, z, FRAME, null, wall); // floor line / spandrel
    } else if (y % 5 === 4) {
      put(x, y, z, TRANSOM, null, wall); // head transom
    } else if (corner || idx % 3 === 0) {
      put(x, y, z, FRAME, null, wall); // mullion fin
    } else {
      put(x, y, z, PANE, null, { wall: true, pane: true, axis: face === "south" || face === "north" ? "ew" : "ns" });
    }
  }

  // Parapet on the perimeter.
  if (face) {
    for (let y = ROOF_Y + 1; y <= PARAPET_TOP; y++) put(x, y, z, FRAME, null, { wall: true });
  }
}

// ---- Entrance bay on the south face (z = D-1), x 8..11 ----
// Polished-andesite piers at x 8 and 11, dark surround and lintel, two-block dark oak door at x 9..10.
for (const x of [8, 11]) {
  const gr = gAt(x, D - 1);
  if (gr === undefined) continue;
  for (let y = gr; y <= gr + 2; y++) put(x, y, D - 1, PIER, null, { wall: true });
}
for (const x of [9, 10]) {
  const gr = gAt(x, D - 1);
  if (gr === undefined) continue;
  const doorProps = (half) => ({ facing: "south", half, hinge: x === 9 ? "left" : "right", open: "false", powered: "false" });
  put(x, gr, D - 1, "dark_oak_door", doorProps("lower"));
  put(x, gr + 1, D - 1, "dark_oak_door", doorProps("upper"));
  put(x, gr + 2, D - 1, ENTRY_DARK, null, { wall: true }); // dark lintel over door
}
// Warm lantern inside the entrance lobby.
if (inside(9, D - 2) && gAt(9, D - 2) <= 3) {
  put(9, 3, D - 2, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- Roof plant box and lightning rod ----
for (let x = 4; x <= 7; x++) {
  for (let z = 4; z <= 7; z++) {
    if (!inside(x, z)) continue;
    const ring = x === 4 || x === 7 || z === 4 || z === 7;
    if (ring) {
      for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) put(x, y, z, TRANSOM);
    }
    put(x, ROOF_Y + 4, z, ROOF); // penthouse roof slab
  }
}
for (let y = ROOF_Y + 1; y <= ROOF_Y + 5; y++) {
  put(10, y, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// ---- Pane connections (glass joins neighbouring facade pieces along its own face) ----
for (const [k, v] of plan) {
  if (!v.pane) continue;
  const [x, y, z] = k.split(",").map(Number);
  const isWall = (nx, nz) => {
    const e = at(nx, y, nz);
    return !!(e && e.wall);
  };
  if (v.axis === "ew") {
    v.props = {
      north: "false", south: "false",
      east: String(isWall(x + 1, z)), west: String(isWall(x - 1, z)),
      waterlogged: "false",
    };
  } else {
    v.props = {
      east: "false", west: "false",
      north: String(isWall(x, z - 1)), south: String(isWall(x, z + 1)),
      waterlogged: "false",
    };
  }
}

// ---- Warm lights behind some windows (interior cell just inside the pane) ----
let glowCount = 0;
for (const [k, v] of [...plan]) {
  if (!v.pane) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y % 5 !== 2) continue;
  const face = faceOf(x, z);
  const idx = face === "south" || face === "north" ? x : z;
  if (idx % 6 !== 2) continue;
  let dx = 0, dz = 0;
  if (face === "south") dz = -1;
  else if (face === "north") dz = 1;
  else if (face === "east") dx = -1;
  else if (face === "west") dx = 1;
  const ix = x + dx, iz = z + dz;
  if (!inside(ix, iz) || faceOf(ix, iz) || gAt(ix, iz) > y || y >= ROOF_Y) continue;
  put(ix, y, iz, glowCount % 2 === 0 ? "glowstone" : "shroomlight");
  glowCount++;
}

// ---- Write ----
const g = new Voxels([W, H, D]);
for (const [k, v] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) continue;
  if (v.props) g.set(x, y, z, v.id, v.props);
  else g.set(x, y, z, v.id);
}
g.save(`${DIR}/${ID}.nbt`);
