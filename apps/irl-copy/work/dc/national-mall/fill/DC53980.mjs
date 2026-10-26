// 1900 M St NW: a 1920s-30s Washington office block in pale limestone. A wide 12-high base with a
// 14-high core rising two courses above it, a stone base, belt courses at each storey line, glass-and-pier
// windows, a dark-oak entrance on the south front, copper HVAC on the roofs, and warm glowstone behind
// some panes. The footprint is the lidar cell list; roof heights snap to the two tiers (12 and 14).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC53980.cells.json", "utf8"));

const X = 20, Y = 26, Z = 16;
const key = (x, z) => x * 100 + z;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { ground, top: roof >= 14 ? 14 : 12 });

const inM = (x, z) => cell.has(key(x, z));
const H = (x, z) => (inM(x, z) ? cell.get(key(x, z)).top : 0);
const solid = (x, y, z) => y >= 0 && y < H(x, z);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const shell = (x, y, z) => solid(x, y, z) && exposed(x, y, z).length > 0;

const BELTS = new Set([0, 3, 6, 9, 11]);   // storey lines and the wing roof row
const glass = (alongX) => ["glass_pane", alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];

// The block for each cell of the massing: [name, state] or null for air (interior, behind the glass).
const grid = new Map();
const put = (x, y, z, v) => grid.set(`${x},${y},${z}`, v);

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inM(x, z)) continue;
  const h = H(x, z);
  // foundation to the cell's ground (all zero here: the ground under the footprint is level)
  for (let y = 0; y < cell.get(key(x, z)).ground; y++) put(x, y, z, ["stone_bricks", null]);
  // the parapet on the rim of each roof tier
  if (DIRS.some(([dx, dz]) => !inM(x + dx, z + dz) || H(x + dx, z + dz) < h)) {
    put(x, h, z, ["stone_brick_wall", null]);
  }
  for (let y = 0; y < h; y++) {
    if (!shell(x, y, z)) {
      if (BELTS.has(y) || y === h - 1 || (h === 14 && y === 12)) put(x, y, z, ["smooth_stone", null]);  // floor and roof slabs
      continue;
    }
    const ex = exposed(x, y, z);
    const alongX = ex.some(([, dz]) => dz !== 0);      // the wall runs along x (a north or south front)
    const u = alongX ? x : z;                          // position along that front: piers every third cell
    if (y === 0) put(x, y, z, ["stone_bricks", null]);                                  // base course
    else if (BELTS.has(y) || y === h - 1) put(x, y, z, ["stone_bricks", null]);         // storey lines, cornice
    else if (h === 14 && y >= 12) put(x, y, z, [u % 3 === 0 ? "polished_andesite" : "calcite", null]);  // tower: solid, no glass
    else if (u % 3 === 0) put(x, y, z, ["calcite", null]);                              // pier between windows
    else put(x, y, z, glass(alongX));
  }
}

// main entrance on the south front (z = 0), with pilasters and a dark canopy over the door
const DOOR_X = 8;
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
put(DOOR_X, 1, 0, ["dark_oak_door", doorState("lower")]);
put(DOOR_X, 2, 0, ["dark_oak_door", doorState("upper")]);
for (const x of [DOOR_X - 1, DOOR_X + 1]) for (const y of [1, 2]) put(x, y, 0, ["polished_andesite", null]);
for (const x of [DOOR_X - 1, DOOR_X, DOOR_X + 1]) put(x, 3, 0, ["dark_oak_slab", { type: "bottom", waterlogged: "false" }]);

// warm light behind some panes: glowstone in the air gap one cell inside the glass
for (const [k, v] of [...grid.entries()]) {
  const [x, y, z] = k.split(",").map(Number);
  if (!v || v[0] !== "glass_pane" || (y !== 1 && y !== 4 && y !== 7)) continue;
  const alongX = v[1].east === "true";
  const u = alongX ? x : z;
  if (u % 6 !== 1) continue;
  const ex = exposed(x, y, z);
  if (!ex.length) continue;
  const [dx, dz] = ex[0];
  const ix = x - dx, iz = z - dz;
  if (solid(ix, y, iz) && !grid.has(`${ix},${y},${iz}`)) put(ix, y, iz, ["glowstone", null]);
}

// roof equipment: copper air handlers on the wing roof and on the tower roof
for (const y of [12, 13]) for (const [x, z] of [[15, 13], [16, 13], [15, 14], [16, 14]]) put(x, y, z, ["waxed_cut_copper", null]);
for (const [x, z] of [[6, 5], [7, 5], [6, 6], [7, 6]]) put(x, 14, z, ["waxed_cut_copper", null]);

const g = new Voxels([X, Y, Z]);
for (const [k, v] of grid) {
  if (!v) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v[0], v[1] ?? undefined);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC53980.nbt";
console.log(g.save(out));
