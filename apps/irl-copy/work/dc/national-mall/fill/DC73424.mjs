// 1750 N St NW: a 1960s Modernist office block in white stone and blue glass. The lidar roof is quantised into four flat
// tiers (4, 8, 12, 14 blocks): a 14-block tower to the west, a 12-block south block, an 8-block podium and a 4-block wing.
// Shell cells (any side open to the air or to a lower tier) are the facade: a base course, storey spandrels, glass
// bays with stone piers, a cornice. Interior cells are air with a floor slab per storey, so glass has an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC73424.cells.json", "utf8"));
const H = 26;
const g = new Voxels([17, H, 17]);

const tierOf = (r) => (r >= 13 ? 14 : r >= 11 ? 12 : r >= 7 ? 8 : 4);
const tier = new Map();                                    // "x,z" -> flat roof tier (top at y = tier)
for (const [x, z, , roof] of cells) tier.set(`${x},${z}`, tierOf(roof));
const tAt = (x, z) => tier.get(`${x},${z}`) ?? 0;           // outside the footprint is 0
const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FLOORS = [1, 4, 7, 10, 13];                           // storey floor / spandrel lines
const shell = (x, z) => ORTH.some(([dx, dz]) => tAt(x + dx, z + dz) < tAt(x, z));
const corner = (x, z) => ORTH.filter(([dx, dz]) => tAt(x + dx, z + dz) === 0).length >= 2;
const isInterior = (x, z) => tAt(x, z) > 0 && !shell(x, z);

const B = new Map();                                        // "x,y,z" -> { b, s }: the whole model, written at the end
const put = (x, y, z, b, s) => B.set(`${x},${y},${z}`, { b, s });
const at = (x, y, z) => B.get(`${x},${y},${z}`);
const DOOR = { x: 4, z: 0 };                                // entrance on the north face, in the 8-tier shopfront

function wall(x, y, z, t) {
  if (x === DOOR.x && z === DOOR.z && (y === 2 || y === 3)) {
    return put(x, y, z, "dark_oak_door", { facing: "north", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  }
  if (y === 1) return put(x, y, z, "polished_granite");                  // base course
  if (y === t - 1) return put(x, y, z, "smooth_quartz");                 // cornice / parapet
  if (FLOORS.includes(y)) {                                              // storey line
    const awning = z === DOOR.z && Math.abs(x - DOOR.x) <= 1 && y === 4;
    return put(x, y, z, awning ? "black_concrete" : "calcite");
  }
  if (corner(x, z) || (x + z) % 3 === 0) return put(x, y, z, "smooth_quartz");
  put(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
}

for (const [key, t] of tier) {
  const [x, z] = key.split(",").map(Number);
  put(x, 0, z, "stone_bricks");                                          // foundation under the whole footprint
  for (let y = 1; y < t; y++) {
    if (shell(x, z)) wall(x, y, z, t);
    else if (y === t - 1) put(x, y, z, "light_gray_concrete");           // roof membrane
    else if (FLOORS.includes(y)) put(x, y, z, "smooth_quartz");          // interior floor slab
  }
}

// Warm light behind some glass: lanterns on the first floor, glowstone on the upper storeys, in the air cell inside
for (const [key, p] of [...B]) {
  const [x, y, z] = key.split(",").map(Number);
  if (p.b !== "light_blue_stained_glass_pane" || ![2, 5, 8, 11].includes(y) || (x * 5 + z * 3 + y) % 6 !== 0) continue;
  for (const [dx, dz] of ORTH) {
    const nx = x + dx, nz = z + dz;
    if (!isInterior(nx, nz) || tAt(nx, nz) <= y + 1 || at(nx, y, nz)) continue;
    if (y === 2) put(nx, y, nz, "lantern", { hanging: "false", waterlogged: "false" });
    else put(nx, y, nz, "glowstone");
    break;
  }
}

// Roof plant on the tower and the 12-tier, a planted terrace on the podium
for (const [key, t] of tier) {
  const [x, z] = key.split(",").map(Number);
  if (isInterior(x, z) && t === 14 && (x * 3 + z * 5) % 11 === 0) put(x, 14, z, "iron_block");
  if (isInterior(x, z) && t === 12 && (x + 2 * z) % 13 === 0) put(x, 12, z, "iron_block");
  if (isInterior(x, z) && t === 8 && (x + z) % 3 === 0) put(x, 8, z, "moss_carpet");
}

// Glass panes join their neighbours in the wall plane
for (const [key, p] of B) {
  if (p.b !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const joins = (nx, nz) => { const n = at(nx, y, nz); return n && !/lantern|door|moss_carpet|glowstone|iron_block/.test(n.b); };
  p.s = { north: String(!!joins(x, z - 1)), south: String(!!joins(x, z + 1)), east: String(!!joins(x + 1, z)), west: String(!!joins(x - 1, z)), waterlogged: "false" };
}

for (const [key, p] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, p.b, p.s);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC73424.nbt");
console.log(JSON.stringify(out));
