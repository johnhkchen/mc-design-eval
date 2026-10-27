// Way 261494142, Mt Eden Road area: a 1920s-30s three-storey brick commercial block with cream plaster trim,
// a timber shopfront on the street (north) face, flat roof behind a cream parapet, and a plant room on the roof.
// Massing: lidar roof heights are 3x3-median smoothed into tiers (all main-body cells read 11; the 10s on the
// edges and the 5-8 specks are noise); foundation fills from y 0 to each cell's ground. Walls are a skin of
// bricks, cream bands and bays over a solid core, with a one-cell air pocket behind each window (no interiors).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494142.cells.json", "utf8"));

const k2 = (x, z) => x * 100 + z;
const ground = new Map(), rawRoof = new Map();
for (const [x, z, g, r] of cells) { ground.set(k2(x, z), g); rawRoof.set(k2(x, z), r); }
const inFp = (x, z) => ground.has(k2(x, z));
const G_of = (x, z) => ground.get(k2(x, z));

// Roof tiers: median of the 3x3 footprint neighbourhood, then snapped to a storey count (11 = three storeys)
const T_map = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) vals.push(rawRoof.get(k2(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  const med = vals[vals.length >> 1];
  T_map.set(k2(x, z), med >= 9 ? 11 : med >= 6 ? 8 : 5);
}
const T_of = (x, z) => T_map.get(k2(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const outward = (x, z) => Object.keys(DIRS).filter((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));
const isD0 = (x, z) => inFp(x, z) && outward(x, z).length > 0;
const isD1 = (x, z) => inFp(x, z) && !isD0(x, z) && Object.values(DIRS).some(([dx, dz]) => isD0(x + dx, z + dz));
const isCorner = (x, z) => { const o = outward(x, z); return (o.includes("N") || o.includes("S")) && (o.includes("E") || o.includes("W")); };

// Along-face coordinate (x on north/south faces, z on east/west) and the pier rhythm: a brick or basalt pier every 3rd cell
const isPier = (x, z) => { const o = outward(x, z); return (o.includes("N") || o.includes("S") ? x : z) % 3 === 0; };

// Storey rows, absolute so the bands run level across the block: 0-3 ground (shop, fascia), 4 and 8 cream string
// courses, 5-6 and 9 windows, 7 brick spandrel, top row cream parapet. A cell's ground is its own base row.
function rowKind(g, T, y) {
  if (y === T - 1) return "parapet";
  if (y === g) return "base";
  if (y === 3) return "fascia";
  if (y < 3) return "shop";
  if (y === 4 || y === 8) return "string";
  if (y === 5 || y === 6 || y === 9) return "win";
  if (y === 7) return "spandrel";
  return "parapet";
}

// Entrance on the north street face: door at x 18 (y 0-1), canopy slabs over it at y 3
const DOOR = { x: 18, z: 1 };
const isDoorCell = (x, z, y) => x === DOOR.x && z === DOOR.z && y <= 1;
const isCanopy = (x, z, y) => x >= DOOR.x - 1 && x <= DOOR.x + 1 && z === DOOR.z && y === 3;

// A window: a glazed, non-pier, non-corner cell of a window or shop row on the outer skin
function isWindow(x, z, y) {
  if (!isD0(x, z) || isCorner(x, z) || isPier(x, z) || isDoorCell(x, z, y)) return false;
  const kind = rowKind(G_of(x, z), T_of(x, z), y);
  return kind === "win" || kind === "shop";
}
// The air pocket behind a window: the inner cell of a skin cell whose outward neighbour is a window at this height
const behindWindow = (x, z, y) => isD1(x, z) && Object.values(DIRS).some(([dx, dz]) => isD0(x + dx, z + dz) && isWindow(x + dx, z + dz, y));
// Warm light in some pockets, resting on the floor under them (bottom row only)
const isLit = (x, z, y) => behindWindow(x, z, y) && (y === 1 || y === 5 || y === 9) && (x * 7 + z * 11 + y * 5) % 4 === 0;

// Geometry-only occupancy (is there a block here?), used for pane connections and for pocket air
function occ(x, z, y) {
  if (!inFp(x, z)) return false;
  const g = G_of(x, z), T = T_of(x, z);
  if (y < 0 || y >= T) return false;
  if (y < g) return true;
  if (isD0(x, z)) return true;
  if (behindWindow(x, z, y)) return isLit(x, z, y);
  return true;
}

const FOUNDATION = { block: "stone_bricks" };
const CORE = { block: "stone" };
const MEMBRANE = { block: "gray_concrete" };
const LIGHT = { block: "glowstone" };
const LANTERN = { block: "lantern", state: { hanging: "false" } };

const PANE_SIDES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
function paneState(x, z, y) {
  const st = { waterlogged: "false" };
  for (const [name, [dx, dz]] of Object.entries(PANE_SIDES)) st[name] = occ(x + dx, z + dz, y) ? "true" : "false";
  return st;
}

// What goes in the cell at x, y, z (null for air)
function plan(x, z, y) {
  if (!occ(x, z, y)) return null;
  const g = G_of(x, z), T = T_of(x, z);
  if (y < g) return FOUNDATION;
  if (!isD0(x, z)) {
    if (isLit(x, z, y)) return rowKind(g, T, y) === "shop" || y === 1 ? LANTERN : LIGHT;
    return y === T - 1 ? MEMBRANE : CORE;
  }
  if (isDoorCell(x, z, y)) return { block: "dark_oak_door", state: { facing: "south", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  if (isCanopy(x, z, y)) return { block: "dark_oak_slab", state: { type: "top", waterlogged: "false" } };
  const kind = rowKind(g, T, y);
  if (kind === "parapet") return { block: "smooth_quartz" };
  if (kind === "base") return { block: "polished_basalt" };
  if (kind === "fascia") return { block: "dark_oak_planks" };
  if (kind === "string") return { block: "smooth_quartz" };
  if (kind === "spandrel") return { block: "bricks" };
  if (isCorner(x, z)) return { block: "smooth_quartz" };             // quoins
  if (isPier(x, z)) return { block: kind === "shop" ? "polished_basalt" : "bricks" };
  if (kind === "shop") return { block: "glass" };
  return { block: "glass_pane", state: paneState(x, z, y) };
}

const SIZE = [30, 24, 47];
const g = new Voxels(SIZE);
let placed = 0;
for (let z = 0; z < SIZE[2]; z++) for (let x = 0; x < SIZE[0]; x++) {
  if (!inFp(x, z)) continue;
  const T = T_of(x, z);
  for (let y = 0; y < T; y++) {
    const p = plan(x, z, y);
    if (p) { g.set(x, y, z, p.block, p.state); placed++; }
  }
}

// Roof plant: a solid plant room on the membrane, and a small lift overrun, both inside the footprint
for (let z = 19; z <= 24; z++) for (let x = 9; x <= 14; x++) {
  g.set(x, 11, z, "light_gray_concrete"); g.set(x, 12, z, "light_gray_concrete");
  g.set(x, 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}
for (let z = 9; z <= 10; z++) for (let x = 20; x <= 21; x++) g.set(x, 11, z, "gray_concrete");

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494142.nbt");
console.log(`placed ${placed} skin/core cells; saved ${out.blocks} blocks, ${out.palette} palette entries`);
