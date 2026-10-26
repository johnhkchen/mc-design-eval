// DC77620: a 5 x 10 brick commercial block with a limestone plinth, shopfront on the south (street) face, a stone
// string course and cornice, and a one-block setback tower (the lidar's 6-block cells) over the south end.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77620.cells.json", "utf8"));
const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));

// Footprint, and the tower: the lidar's 6-block cells smoothed into the south two rows plus the south-east block.
const inF = (x, z) => roof.has(`${x},${z}`);
const inT = (x, z) => inF(x, z) && ((z >= 6 && x >= 2) || z >= 8);

// which horizontal faces of a cell look out of its set
const exposed = (inSet, x, z) => ({ N: !inSet(x, z - 1), S: !inSet(x, z + 1), W: !inSet(x - 1, z), E: !inSet(x + 1, z) });
const count = (e) => Number(e.N) + Number(e.S) + Number(e.W) + Number(e.E);

const BRICK = "bricks", STONE = "smooth_quartz", BASE = "polished_andesite", ROOF = "smooth_stone";
const GLASS = "glass_pane", GLOW = "glowstone", AWNING = "red_concrete", AC = "iron_block";
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

// The 3-D grid, filled cell by cell; panes are connected after, from their neighbours.
const grid = new Map();
const put = (x, y, z, block, state) => grid.set(`${x},${y},${z}`, { block, state });

// A window face: glass on the south shopfront or upper bays, the middle of the north face, and the stem and
// side bays on the sides; corners and everything else are brick.
function facade(e, x, z, { awning = false, shop = false } = {}) {
  if (count(e) >= 2) return BRICK;
  if (e.S && x === 2 && awning) return AWNING;
  if (e.S && (x === 1 || x === 3)) return GLASS;
  if (e.S && x === 2 && !awning) return GLASS;
  if (e.N && x === 2) return GLASS;
  if ((e.E || e.W) && [1, 3, 6, 8].includes(z) && !shop) return GLASS;
  if ((e.E || e.W) && z === 7 && shop) return GLASS;
  return BRICK;
}

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const e = exposed(inF, x, z), interior = count(e) === 0;

  // y0: plinth, the floor of the ground storey
  put(x, 0, z, BASE);

  // y1: ground storey (shopfront), two blocks high with the door
  if (x === 2 && z === 9) { put(x, 1, z, "dark_oak_door", DOOR("lower")); }
  else if (interior) { if ((x === 1 || x === 3) && z === 8) put(x, 1, z, GLOW); }
  else put(x, 1, z, facade(e, x, z, { shop: true }));

  // y2: string course, and the storey-two floor
  put(x, 2, z, x === 2 && z === 9 ? "dark_oak_door" : STONE, x === 2 && z === 9 ? DOOR("upper") : undefined);

  // y3: upper storey windows, with the door's awning and lamps behind the front bays
  if (!interior) put(x, 3, z, facade(e, x, z, { awning: true }));
  else if ((x === 1 || x === 3) && z === 8) put(x, 3, z, GLOW);

  // y4: parapet on the main block; the tower keeps its windows and carries the floor of its top storey
  if (!inT(x, z) && !interior) put(x, 4, z, STONE);
  else if (inT(x, z) && !interior) put(x, 4, z, facade(e, x, z));
  else put(x, 4, z, ROOF);
}

// y5: the tower's cornice and roof, plus two roof units on the main block's roof
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!inT(x, z)) continue;
  const e = exposed(inT, x, z);
  put(x, 5, z, count(e) ? STONE : ROOF);
}
put(2, 5, 1, AC); put(2, 5, 3, AC);

// Panes join the neighbours that are walls, so the shopfront and the bays read as one run of glazing.
const solid = (k) => grid.has(k) && !["glowstone", "dark_oak_door", "iron_block"].includes(grid.get(k).block);
const g = new Voxels([5, 18, 10]);
for (const [key, { block, state }] of grid) {
  const [x, y, z] = key.split(",").map(Number);
  if (block !== GLASS) { g.set(x, y, z, block, state); continue; }
  const side = (dx, dz) => (solid(`${x + dx},${y},${z + dz}`) ? "true" : "false");
  g.set(x, y, z, GLASS, { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" });
}
console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77620.nbt"));
