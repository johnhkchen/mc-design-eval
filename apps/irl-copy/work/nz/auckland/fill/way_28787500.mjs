// OSM way 28787500, central Auckland (Eden Terrace side of the CBD ridge): a 1930s reinforced-concrete commercial block,
// four storeys on a basalt base, cream plaster walls, stone piers, steel-framed windows, shopfronts and entrance canopies
// on the ground floor, and lower three- and two-storey wings stepping down to the east and west ends.
// The lidar roof height is snapped to clean tiers (18 = four storeys, 14 = three, 10 = two, 6 = one, low = paved terrace).
// Envelope = footprint cells from their ground up to their tier. Boundary voxels with an open side are the shell (walls,
// windows, piers, band courses, cornice, parapet); the rest is floor slab per storey, roof slab, and air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_28787500.cells.json", "utf8"));
const X = 71, Y = 30, Z = 32;
const g = new Voxels([X, Y, Z]);

// lidar roof (blocks above y 0) -> clean tier; a roof at or under 4 blocks is a paved terrace at its ground
const tier = (roof, ground) => (roof >= 16 ? 18 : roof >= 13 ? 14 : roof >= 9 ? 10 : roof >= 5 ? 6 : ground + 1);
const col = new Map();
for (const [x, z, ground, roof] of cells) col.set(`${x},${z}`, { g: ground, T: tier(roof, ground) });
const at = (x, z) => col.get(`${x},${z}`);
const envelope = (x, y, z) => { const c = at(x, z); return !!c && y < c.T; };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const openDirs = (x, y, z) => DIRS.filter(([dx, dz]) => !envelope(x + dx, y, z + dz));
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// the per-voxel role: "shell" rows (walls, windows, piers, bands) are decided by storey row r and u along the face
const shellBlock = (x, y, z, c, dirs, k, r, doorsZ) => {
  if (y === c.T - 2) return { id: "smooth_stone_slab", state: { type: "top" } };           // cornice course
  if (r === 0) return k === 0 ? { id: "polished_blackstone_bricks" } : { id: "white_concrete" };   // base course / spandrel
  const along = dirs.some(([dx]) => dx !== 0) ? z : x;                                  // u along the face: z on x-faces, x on z-faces
  const dz = dirs[0][1];
  if (k === 0 && r === 1 && dz !== 0 && doorsZ.has(`${dz}:${along}`)) return { id: "dark_oak_door", state: { facing: DIR_NAME[`0,${dz}`], half: "lower", hinge: "left", open: "false", powered: "false" } };
  if (k === 0 && r === 2 && dz !== 0 && doorsZ.has(`${dz}:${along}`)) return { id: "dark_oak_door", state: { facing: DIR_NAME[`0,${dz}`], half: "upper", hinge: "left", open: "false", powered: "false" } };
  if (k === 0 && r === 3 && dz !== 0 && [-1, 0, 1].some((d) => doorsZ.has(`${dz}:${along + d}`)))
    return { id: "stone_brick_stairs", state: { facing: DIR_NAME[`0,${dz}`], half: "top", shape: "straight", waterlogged: "false" } };
  if (r === 3) return { id: "white_concrete" };                                         // head band
  if (along % 3 === 0) return { id: "polished_andesite" };                              // stone piers between the bays
  return { id: "glass_pane" };                                                          // steel-framed glazing
};

// entrances: ground-floor doors on the south and north faces every 16 blocks (keeps the shopfront rhythm)
const doorsZ = new Set();
for (const [key, c] of col) {
  const [x, z] = key.split(",").map(Number);
  for (const [dx, dz] of DIRS) if (dz && dx === 0 && x % 16 === 7 && !envelope(x, c.g + 1, z + dz)) doorsZ.add(`${dz}:${x}`);
}

for (const [key, c] of col) {
  const [x, z] = key.split(",").map(Number);
  const terrace = c.T === c.g + 1;
  for (let y = 0; y < c.T; y++) {
    if (y < c.g) { g.set(x, y, z, "stone_bricks"); continue; }                         // foundation up to the lidar ground
    if (terrace) { g.set(x, y, z, "stone_bricks"); continue; }                          // paved terrace on the low cells
    const k = Math.floor((y - c.g) / 4), r = (y - c.g) % 4;
    const dirs = openDirs(x, y, z), shell = dirs.length > 0;
    if (y === c.T - 1) {                                                                 // roof: parapet on the edge, slab inside
      if (shell) g.set(x, y, z, "smooth_quartz"); else g.set(x, y, z, "gray_concrete");
      continue;
    }
    if (shell) {
      const b = shellBlock(x, y, z, c, dirs, k, r, doorsZ);
      g.set(x, y, z, b.id, b.state);
    } else if (r === 0) {
      g.set(x, y, z, "light_gray_concrete");                                             // floor slab per storey
    }
  }
}

// warm lights: glowstone on the air side of some windows, standing on the storey's floor slab
for (const [key, c] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = c.g; y < c.T - 2; y++) {
    const r = (y - c.g) % 4;
    if (r !== 1) continue;
    const dirs = openDirs(x, y, z);
    if (!dirs.length || dirs.length > 1) continue;
    const along = dirs[0][0] !== 0 ? z : x, k = Math.floor((y - c.g) / 4);
    if (along % 3 === 0) continue;                                                       // glass bays only
    if ((x * 7 + z * 13 + k * 5 + y) % 4 !== 0) continue;
    const ix = x - dirs[0][0], iz = z - dirs[0][1];
    const ic = at(ix, iz);
    if (!ic || y >= ic.T - 1 || y < ic.g) continue;
    if (openDirs(ix, y, iz).length) continue;                                            // only the inside air
    g.set(ix, y, iz, "glowstone");
  }
}

// roof plant on the four-storey roof: two plant boxes, interior cells only
for (const [key, c] of col) {
  const [x, z] = key.split(",").map(Number);
  const inPlant = (x >= 22 && x <= 27 && z >= 8 && z <= 11) || (x >= 48 && x <= 53 && z >= 18 && z <= 21);
  if (!inPlant || c.T !== 18 || openDirs(x, 17, z).length) continue;
  for (let yy = 18; yy <= 19; yy++) g.set(x, yy, z, "light_gray_concrete");
}

const counts = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_28787500.nbt");
console.log(JSON.stringify(counts));
