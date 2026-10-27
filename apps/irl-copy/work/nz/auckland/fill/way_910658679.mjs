// Mt Eden / Auckland CBD fringe, footprint 9 x 10: a three-storey red-brick Edwardian commercial block (c.1905-1925).
// Plinth of stone, a timber-mullioned shopfront on the ground storey, string courses at each floor line, sills and
// glazed bays above, a cornice and brick parapet. The massing follows the lidar roof: one 14-block main tier, a
// corner shoulder at 11, a lean-to wing at 7 and a low wing at 4. Interior is a shell with floor slabs and air behind glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658679.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658679.nbt";

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const SLABS = [4, 8];                  // floor lines (solid rows); storeys sit between them
const DOOR = [1, 5];                   // west entrance, dark timber door between shopfront mullions

// Lidar roof heights cluster at 14 (main block), 11, 7 and 3-5 (wings): each cluster becomes one flat tier.
const tierOf = (r) => (r >= 12 ? 14 : r >= 8 ? 11 : r >= 6 ? 7 : 4);

const rows = JSON.parse(readFileSync(CELLS, "utf8"));
const cell = new Map(rows.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, gr: ground, T: tierOf(roof) }]));
const has = (x, z) => cell.has(`${x},${z}`);
const exposedSides = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// The block a perimeter cell shows at height y (its own wall column, from above its ground to its top).
function facade(c, y) {
  const deck = c.T - 2, top = c.T - 1;
  if (y === top) return { block: "bricks" };                                          // parapet
  if (y === deck) return { block: "smooth_stone" };                                  // cornice
  if (c.x === DOOR[0] && c.z === DOOR[1] && (y === 2 || y === 3)) {                  // entrance door, 2 high
    return { block: "dark_oak_door", state: { facing: "west", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (SLABS.includes(y)) return { block: "smooth_stone" };                           // string course at each floor line
  if (y <= 3) {                                                                      // ground storey: plinth + shopfront
    if (y === c.gr + 1 && c.gr <= 1) return { block: "stone_bricks" };
    return (c.x + c.z) % 3 === 0 ? { block: "dark_oak_planks" } : { block: "glass_pane" };
  }
  const slab = y >= 5 && y <= 7 ? 4 : y >= 9 && y <= 11 ? 8 : null;                  // upper storeys: sill, glazed bay, bays alternate
  if (slab !== null) {
    const bay = (c.x + c.z) % 2 === 0;
    if (y === slab + 1) return { block: bay ? "smooth_stone" : "bricks" };
    return { block: bay ? "glass_pane" : "bricks" };
  }
  return { block: "bricks" };
}

const g = new Voxels([9, 27, 10]);
const perimeter = new Set();

// Pass 1: foundation, floor slabs and roof deck over every footprint cell; walls on the perimeter.
for (const c of cell.values()) {
  const { x, z, gr, T } = c;
  const deck = T - 2;
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");                       // foundation: solid from y 0 to the ground
  for (const y of [...SLABS, deck]) if (y > gr && y <= deck) g.set(x, y, z, "stone");  // floor slabs + roof deck
  const open = exposedSides(x, z);
  if (open.length === 0) continue;
  perimeter.add(`${x},${z}`);
  for (let y = gr + 1; y <= T - 1; y++) {
    const f = facade(c, y);
    g.set(x, y, z, f.block, f.state);
  }
}

// Pass 2: rooftop plant on the main tier's interior, and warm lights standing inside some of the bays.
for (const c of cell.values()) if (c.T === 14 && !perimeter.has(`${c.x},${c.z}`) && c.x >= 4 && c.x <= 5 && c.z >= 4 && c.z <= 5) {
  g.set(c.x, 13, c.z, "iron_block");
}
for (const c of cell.values()) {
  if (c.T !== 14 || !perimeter.has(`${c.x},${c.z}`) || (c.x + c.z) % 2 !== 0) continue;
  if ((c.x * 3 + c.z * 5) % 7 !== 0) continue;                                              // a sparse scatter of lit bays
  const inner = DIRS.map(([dx, dz]) => cell.get(`${c.x + dx},${c.z + dz}`)).find((n) => n && n.T === 14 && !perimeter.has(`${n.x},${n.z}`));
  if (!inner) continue;
  if ((c.x + c.z) % 4 === 0) g.set(inner.x, 5, inner.z, "lantern", { hanging: "false" });    // lantern on the storey-2 floor
  else g.set(inner.x, 11, inner.z, "glowstone");                                             // glowstone hung from the storey-3 ceiling
}

const { blocks, palette } = g.save(OUT);
console.log(`wrote ${OUT}: ${blocks} blocks, palette ${palette}`);
