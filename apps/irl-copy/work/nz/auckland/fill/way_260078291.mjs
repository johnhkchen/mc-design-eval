import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// VR Auckland City: a 1970s-80s concrete office block. Precast white piers, dark spandrels, tinted blue glass in
// storey bands, a stone plinth on the uphill side and a plant-room core on the roof. 10 storeys (4 blocks each) over a
// 1-block base; the lidar roof (42-45 above y 0) snaps to three tiers: body 43, lower wings 42, core 45; edge noise
// under 20 is a one-storey lean-to at 4.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260078291.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..40, z 0..47

const cell = new Map();
for (const [x, z, g, r] of cells) {
  // top: the highest solid row; roof: the roof slab row (the storey band stops under it)
  let t;
  if (r < 20) t = { top: 4, roof: 4, core: false };            // one-storey lean-to, flat roof at 5
  else if (r >= 44) t = { top: 44, roof: 40, core: true };      // plant-room core (rows 41-44)
  else if (r === 43) t = { top: 42, roof: 40, core: false };    // body: cornice row 41, parapet row 42
  else t = { top: 41, roof: 40, core: false };                  // lower wings: parapet row 41
  cell.set(x + "," + z, { x, z, g, ...t });
}

const at = (x, z) => cell.get(x + "," + z) ?? null;
const env = (c, y) => c !== null && y >= 0 && y <= c.top;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the outward directions where the neighbour is air at row y
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !env(at(x + dx, z + dz), y));
const exposed = (x, z, y) => exposedDirs(x, z, y).length > 0;

// a parapet column is solid only if it shows at the edge (a wing or a step beside it), so the rim never hangs
function parapetColumn(c) {
  for (let y = c.roof + 1; y <= c.top; y++) if (exposed(c.x, c.z, y)) return true;
  return false;
}

// the storey band: spandrel under, two rows of glass, piers every third cell on each face (corners always piers)
function bandKind(c, y, dirs) {
  const corner = dirs.some(([dx]) => dx) && dirs.some(([, dz]) => dz);
  const along = dirs.some(([, dz]) => dz) ? c.x : c.z;             // N/S faces run along x, E/W along z
  if (corner || along % 3 === 0) return "white_concrete";          // precast piers
  if (y < 4) return y === 1 ? "stone_bricks" : "light_blue_stained_glass";  // shopfront: riser, then glass
  if (y % 4 === 1) return "gray_concrete";                         // spandrel
  return "light_blue_stained_glass";
}

// the plant room: solid, louvred on its faces, a stone cap
function coreKind(c, y) {
  if (y === c.top) return "stone_bricks";
  const outs = DIRS.filter(([dx, dz]) => {
    const n = at(c.x + dx, c.z + dz);
    return !(n && n.core) && !(n && kind(n, y));
  });
  if (outs.length === 0) return "gray_concrete";
  const along = outs.some(([, dz]) => dz) ? c.x : c.z;
  return y === 42 || y === 43 ? (along % 2 === 0 ? "iron_bars" : "light_gray_concrete") : "light_gray_concrete";
}

// what block (or null for air) sits at cell c, row y
function kind(c, y) {
  if (!env(c, y)) return null;
  if (y < c.g || y === 0) return "stone_bricks";                  // foundation: solid from y 0 up to this cell's ground
  if (y === c.roof) return exposed(c.x, c.z, y) ? "white_concrete" : "gray_concrete";
  if (y < c.roof) {
    if (y % 4 === 0) return "light_gray_concrete";                // floor slab, a string course on the faces
    const dirs = exposedDirs(c.x, c.z, y);
    return dirs.length ? bandKind(c, y, dirs) : null;             // interior air behind the glass
  }
  if (c.core) return coreKind(c, y);
  if (!parapetColumn(c)) return null;
  return y === c.top ? "stone_bricks" : "white_concrete";         // cornice under the parapet cap
}

const g = new Voxels([41, 58, 48]);
for (const c of cell.values()) {
  for (let y = 0; y <= c.top; y++) {
    const k = kind(c, y);
    if (k) g.set(c.x, y, c.z, k);
  }
}

// roof plant: a few metal boxes on the body's roof, clear of the parapet
for (const c of cell.values()) {
  if (c.top !== 42 || c.core || c.x % 6 !== 3 || c.z % 8 !== 4) continue;
  if (kind(c, 41) === null) g.set(c.x, 41, c.z, "iron_block");
}

// the entrance on the south face (the street side): a door with a canopy over it, in the bay beside a pier
for (const y of [1, 2]) g.set(19, y, 47, "oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [19, 20]) g.set(x, 3, 47, "dark_oak_planks");

// warm light behind some windows: a glowstone or a hanging lantern in the air gap, under the next floor slab
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
let lit = 0;
for (const c of cell.values()) {
  for (let y = 0; y < c.roof; y++) {
    if (y % 4 !== 3 || kind(c, y) !== "light_blue_stained_glass") continue;
    const dirs = exposedDirs(c.x, c.z, y);
    if (dirs.length !== 1) continue;
    const [dx, dz] = dirs[0];
    const n = at(c.x - dx, c.z - dz);
    if (!n || !env(n, y) || kind(n, y) !== null) continue;
    const h = hash(c.x, y, c.z) % 11;
    if (h === 0) { g.set(n.x, y, n.z, "glowstone"); lit++; }
    else if (h === 5) { g.set(n.x, y, n.z, "lantern", { hanging: "true", waterlogged: "false" }); lit++; }
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260078291.nbt";
const r = g.save(out);
console.log(`way_260078291: ${cells.length} cells, ${r.blocks} blocks, ${r.palette} palette, ${lit} lit windows -> ${out}`);
