// DC55676: a 1930s Neoclassical federal office block in the Federal Triangle manner, pale limestone on an andesite base.
// Massing from the lidar roof (cells file): a 10-block main body (3 storeys over a floor slab, string courses, a frieze
// and a smooth-quartz cornice), a 11-block centre pavilion (the parapet and plant boxes on top), 8- and 7-block lower
// wings to the west and east, and a 6-block annex plus a 1-block corner ledge at the south-east. Lidar noise is
// smoothed into those flat tiers. Storey floors and frieze run across every cell, so nothing hangs; the glazed bays
// sit on the exterior faces with air rooms behind them (lit by lanterns and glowstone in some), and two entrances are
// framed by quartz piers and a lintel, the north door at the centre and an east door on the side wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55676.cells.json`, "utf8"));

// lidar roof -> one flat tier top per band (noise smoothed; the 1-block corner stays a low ledge, the 5 a 6-block annex)
const tierTop = (r) => (r <= 2 ? 1 : r <= 6 ? 6 : r === 7 ? 7 : r === 8 ? 8 : r <= 10 ? 10 : 11);
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, R: tierTop(r) });
const tierAt = (x, z) => foot.get(`${x},${z}`)?.R ?? 0;   // 0 = outside the footprint
const built = (x, z, y) => tierAt(x, z) > y;
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];
// the faces at height y with no building behind them (outside the footprint, or the neighbour is lower)
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !built(x + dx, z + dz, y));

const FLOOR = "stone_bricks", BASE = "polished_andesite", WALL = "calcite", STRING = "smooth_quartz";
const PIER = "smooth_quartz", FRIEZE = "calcite", GLASS = "light_blue_stained_glass_pane";
const DOORS = [{ x: 10, z: 0, facing: "north" }, { x: 13, z: 4, facing: "east" }];

const g = new Voxels([14, 23, 8]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const has = (x, y, z) => g.get(x, y, z) !== null;

// 1. the shell: floor slab, base course, string courses, frieze and cornice run across every cell; the storey
//    rows are glazed on the exterior faces (piers at corners and every other cell along a face), air inside
const glass = [];
for (const [key, { g: ground, R }] of foot) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < R; y++) {
    if (y < ground) { put(x, y, z, FLOOR); continue; }                // foundation up to the lidar ground
    if (y === R - 1) { put(x, y, z, STRING); continue; }             // cornice / roof edge
    if (y === 0) { put(x, y, z, FLOOR); continue; }                   // ground-floor slab
    if (y === R - 2 && R >= 4) { put(x, y, z, FRIEZE); continue; }    // plain frieze under the cornice
    const ex = exposed(x, z, y);
    if (y === 1 && R >= 3) { if (ex.length) put(x, y, z, BASE); continue; }   // andesite base course, air inside
    if (y <= R - 3 && (y - 2) % 3 === 2) { put(x, y, z, STRING); continue; }   // storey line / floor slab
    if (y < 2 || y > R - 3) continue;                                 // not a window row
    if (!ex.length) continue;                                         // room behind the glass: air
    const pier = ex.length > 1 || (ex[0][0] !== 0 ? z % 2 === 0 : x % 2 === 0);
    if (pier) put(x, y, z, PIER);
    else { put(x, y, z, GLASS); glass.push([x, y, z]); }
  }
}

// 2. the parapet on the pavilion's edge, and two plant boxes on its roof
for (const [key, { R }] of foot) {
  if (R !== 11) continue;
  const [x, z] = key.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => tierAt(x + dx, z + dz) < 11)) put(x, 11, z, WALL);
}
put(8, 11, 4, "iron_block"); put(9, 11, 4, "iron_block");

// 3. entrances: the north door in the centre bay and an east door on the side wing; quartz piers flank each, a lintel above
for (const { x, z, facing } of DOORS) {
  const s = { facing, hinge: "left", open: "false", powered: "false" };
  put(x, 1, z, "iron_door", { ...s, half: "lower" });
  put(x, 2, z, "iron_door", { ...s, half: "upper" });
  put(x, 3, z, STRING);
  const [ax, az] = facing === "north" || facing === "south" ? [1, 0] : [0, 1];
  for (const sgn of [-1, 1]) {
    const px = x + sgn * ax, pz = z + sgn * az;
    if (tierAt(px, pz) === 0) continue;
    put(px, 1, pz, BASE);
    put(px, 2, pz, PIER); put(px, 3, pz, PIER);
  }
}

// 4. the warm lights: lanterns on the ground-floor slab, glowstone on the upper floors, in some of the rooms behind the glass
for (const [key, { R }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const room = (y) => !has(x, y, z) && has(x, y - 1, z) && exposed(x, z, y).length === 0;
  if (R >= 3 && room(1) && (x * 3 + z * 5) % 7 === 0) put(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  for (const y of [5, 8]) if (y < R - 2 && room(y) && (x + 2 * z) % 6 === 0) put(x, y, z, "glowstone");
}

// 5. the glazing: each pane connects to the solid or glass neighbour beside it in the same face
for (const [x, y, z] of glass) {
  if (g.get(x, y, z)?.block !== `minecraft:${GLASS}`) continue;   // a door or pier took this cell
  const c = (dx, dz) => (has(x + dx, y, z + dz) ? "true" : "false");
  put(x, y, z, GLASS, { north: c(0, -1), east: c(1, 0), south: c(0, 1), west: c(-1, 0), waterlogged: "false" });
}

const res = g.save(`${DIR}/DC55676.nbt`);
console.log(JSON.stringify(res));
