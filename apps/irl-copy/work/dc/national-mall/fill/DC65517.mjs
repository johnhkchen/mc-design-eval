// 1307 Rhode Island Ave NW: a 1920s brick apartment block (Logan/Thomas Circle), now a <5-unit residential conversion.
// Red brick on a stone base, calcite storey lines, quoined corners, a cornice, and a 3-storey core that steps down
// to 2-storey wings. Storeys are 2 blocks (window row over a storey line); the interior is air behind the glass with
// a floor slab per storey, nothing more.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65517.cells.json`, "utf8"));

// Lidar roof heights smoothed into three flat tiers: a 4x3 core tower at 8, a small setback at 7, and wings at 6.
// The lone 8 at (1,4) and the 7s on the north edge are lidar noise, so they drop to their neighbours' tier.
const CORE = new Set(["6,1", "7,1", "5,2", "6,2", "7,2", "8,2", "5,3", "6,3", "7,3", "8,3", "6,4", "7,4"]);
const SETBACK = new Set(["5,4", "4,5", "5,5", "4,6", "5,6"]);
const roof = new Map(cells.map(([x, z]) => {
  const key = `${x},${z}`;
  return [key, CORE.has(key) ? 8 : SETBACK.has(key) ? 7 : 6];
}));

const H = (x, z) => roof.get(`${x},${z}`) ?? 0;                       // 0 outside the footprint
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the sides of a cell at height y that face open air: outside the footprint, or a neighbour that stops below y
const open = (x, z, y) => NB.filter(([dx, dz]) => H(x + dx, z + dz) <= y);
const key = (x, y, z) => `${x},${y},${z}`;

const plan = new Map();                                                 // "x,y,z" -> { block, state }
const set = (x, y, z, block, state) => plan.set(key(x, y, z), { block, state });

// what the shell or the interior is at (x, z, y): null for air
function skin(x, z, y) {
  const Hc = H(x, z);
  if (y === 0) return { block: "stone_bricks" };                        // base course on the footprint
  const sides = open(x, z, y);
  if (!sides.length) {
    if (y === Hc - 1) return { block: "smooth_stone" };                 // roof deck over the interior
    return y % 2 === 0 ? { block: "oak_planks" } : null;                // storey floor slab / air behind the glass
  }
  if (y === Hc - 1) return { block: "calcite" };                        // cornice
  if (y % 2 === 0 && y !== Hc - 2) return { block: "calcite" };         // storey line (the row under a cornice is a window row, so a tower's exposed top storey has glass)
  // no quoins: the footprint steps one cell at a time, so every outline cell is a "corner" and calcite takes the faces
  const along = sides[0][0] ? z : x;                                    // position along the face
  return [1, 2].includes(along % 4) ? { block: "glass_pane" } : { block: "bricks" }; // 2-bay windows, 2-brick piers

}

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const Hc = H(x, z);
  for (let y = 0; y < Hc; y++) {
    if (x === 5 && z === 8 && y <= 3) {                                 // the street door, south face
      if (y === 1) set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === 2) set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else set(x, y, z, "calcite");                                     // lintel over the door
      continue;
    }
    const s = skin(x, z, y);
    if (s) set(x, y, z, s.block, s.state);
  }
}

// Warm light: lanterns hang from the storey slab above, glowstone sits on the floor, both in the air behind some windows.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  for (let y = 1; y < H(x, z) - 1; y += 2) {
    const p = plan.get(key(x, y, z));
    const sides = open(x, z, y);
    if (!p || p.block !== "glass_pane" || sides.length !== 1) continue;
    const [dx, dz] = sides[0];
    const nx = x - dx, nz = z - dz;                                     // the cell behind this pane
    if (H(nx, nz) <= y || open(nx, nz, y).length) continue;            // must be interior air
    const tag = ((dx ? z : x) + y) % 4;
    if (tag === 1) set(nx, y, nz, "lantern", { hanging: "true", waterlogged: "false" });
    else if (tag === 3) set(nx, y, nz, "glowstone");
  }
}

// Roof plant: a small penthouse on the core, two chimney stacks on the wings.
set(6, 8, 2, "stone_bricks"); set(7, 8, 2, "stone_bricks"); set(7, 8, 3, "stone_bricks");
for (const [x, z] of [[3, 2], [2, 5]]) { set(x, 6, z, "bricks"); set(x, 7, z, "bricks"); }

// Glass panes connect to any wall-like neighbour, as a placed pane does; lanterns and glowstone do not count.
const WALL_LIKE = (p) => p && p.block !== "lantern" && p.block !== "glowstone";
const CONN = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];
for (const [k, p] of plan) {
  if (p.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const state = {};
  for (const [name, dx, dz] of CONN) state[name] = String(WALL_LIKE(plan.get(key(x + dx, y, z + dz))));
  p.state = state;
}

const g = new Voxels([10, 20, 9]);
for (const [k, p] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, p.block, p.state);
}
const out = g.save(`${DIR}/DC65517.nbt`);
console.log(`DC65517: ${out.blocks} blocks, ${out.palette} palette entries`);
