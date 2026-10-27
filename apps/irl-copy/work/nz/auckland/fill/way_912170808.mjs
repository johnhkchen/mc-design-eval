import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// An Edwardian two-storey brick commercial block over a timber shopfront (Mt Eden village era, c.1910-1930).
// Walls are brick with stone plinth, string course and cornice; upper storey has sash-style glass bays on the
// bay parity, timber piers and fascia on the shopfront, and a stone-coped parapet. The eastern wing stands one
// block higher (lidar roof 11 vs 10) as a taller attic band. Interiors are not furnished: each storey has a floor
// slab, glass sits on a one-cell air gap, and lights stand two cells in.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_912170808.cells.json`, "utf8"));   // [x, z, ground, roof]

const g = new Voxels([10, 24, 9]);
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const exposed = (x, z) => DIRS.filter(([, dx, dz]) => !inFp(x + dx, z + dz));

const plan = new Map();                        // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const DOOR = [3, 0];                           // the entrance, on the north face

// the wall face at height h above the cell's ground (T = top course's h)
function face(h, T, { corner, bay, door }) {
  if (h === T) return ["smooth_stone"];                                  // coping: the roof edge
  if (h === T - 1 && h >= 7) return ["stone_bricks"];                    // cornice under the coping
  if (h === 0) return ["stone_bricks"];                                  // plinth course
  if (h === 4) return ["stone_bricks"];                                  // string course over the shopfront
  if (h <= 3) {
    if (door) {
      if (h === 3) return ["glass_pane"];                                // transom light
      const half = h === 1 ? "lower" : "upper";
      return ["spruce_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" }];
    }
    if (h === 3) return ["spruce_planks"];                               // timber fascia over the shop
    if (corner) return ["stone_bricks"];                                  // stone pilasters at the corners
    return ["glass_pane"];                                                 // shopfront glass
  }
  if (h <= 6 && bay && !corner) return ["glass_pane"];                   // upper sash bays
  return ["bricks"];                                                     // brick walls, lintels, parapet
}

// the interior at h: floor slabs at 0, 4 and a ceiling at 8, air between (behind the glass), attic solid to the roof
function core(h, T) {
  if (h === T) return ["smooth_stone"];                                  // roof membrane
  if (h === 0 || h === 4 || h === 8) return ["spruce_planks"];          // floor slabs
  if (h > 8 && h < T) return ["stone_bricks"];                           // attic under the roof
  return null;                                                           // air between the floors
}

for (const [x, z, ground, roof] of cells) {
  const exp = exposed(x, z);
  const ctx = { corner: exp.length >= 2, bay: (x + z) % 2 === 0, door: x === DOOR[0] && z === DOOR[1] };
  const wall = exp.length > 0;
  const T = roof - 1 - ground;                                           // top course, relative to this cell's ground
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");        // foundation: nothing floats on the slope
  for (let h = 0; h <= T; h++) {
    const y = ground + h;
    const b = wall ? face(h, T, ctx) : core(h, T);
    if (b) put(x, y, z, b[0], b[1]);
  }
}

// roof plant: two units on the main roof, one on the eastern wing
const interior = cells.filter(([x, z]) => exposed(x, z).length === 0);
const main = interior.filter(([, , , roof]) => roof === 10), wing = interior.filter(([, , , roof]) => roof === 11);
const plant = [main[Math.floor(main.length / 3)], main[Math.floor((2 * main.length) / 3)], wing[Math.floor(wing.length / 2)]];
for (const [x, z, , roof] of plant) put(x, roof, z, "iron_block");

// warm lights: a lantern on the ground floor and a glowstone upstairs, two cells in behind the glass
for (const [x, z, ground, roof] of cells) {
  const exp = exposed(x, z);
  if (exp.length !== 1 || (x === DOOR[0] && z === DOOR[1])) continue;
  const [, dx, dz] = exp[0];
  const x1 = x - dx, z1 = z - dz, x2 = x - 2 * dx, z2 = z - 2 * dz;
  if (!inFp(x2, z2) || exposed(x2, z2).length || !inFp(x1, z1) || exposed(x1, z1).length) continue;
  if ((x + z) % 2 !== 0) continue;                                       // bay cells only
  if ((x + z) % 4 === 0) put(x2, ground + 1, z2, "lantern", { hanging: "false" });
  else put(x2, ground + 5, z2, "glowstone");
}

// glass panes join their neighbours in the same plane: glass, brick, stone, timber
const SOLID = new Set(["glass_pane", "bricks", "stone_bricks", "spruce_planks", "smooth_stone"]);
for (const [k, v] of plan) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const s = {};
  for (const [name, dx, dz] of DIRS) {
    const n = plan.get(`${x + dx},${y},${z + dz}`);
    s[name] = n && SOLID.has(n.block) ? "true" : "false";
  }
  v.state = { ...s, waterlogged: "false" };
}

for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/way_912170808.nbt`);
console.log(JSON.stringify(out));
