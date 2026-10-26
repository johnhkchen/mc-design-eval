// FR245157265: a 10 x 3 limestone block on the Île de la Cité, four storeys and an attic cap, stepped down
// to the lidar roof (snapped to storey lines). Windows on every exposed face, a door on the north, a lit niche.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${HERE}/FR245157265.cells.json`, "utf8"));

// lidar roof -> storey lines (5 blocks a storey; 22 = four storeys and an attic cap); a zero reading is a one-storey lean-to
const TIERS = [5, 10, 15, 20, 22];
const tier = (r) => (r < 1 ? 5 : TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) ? t : best)));

const col = new Map();                                  // "x,z" -> { ground, top }
for (const [x, z, ground, roof] of cells) col.set(`${x},${z}`, { ground, top: tier(roof) });
const at = (x, z) => col.get(`${x},${z}`);
const exposedZ = (x, y, z) => [z - 1, z + 1].some((nz) => { const c = at(x, nz); return !c || y >= c.top; });

const PANE = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const LIT = new Set(["3,8,1", "5,12,1", "9,8,1"]);     // glowstone behind a pane: warm windows on the south and north faces

function block(x, y, z, top) {
  if (x === 7 && z === 1 && y >= 1 && y <= 3) return y === 1 ? ["glowstone"] : null;   // enclosed air niche behind two windows, a lamp on its floor
  if (y === 0) return ["stone_bricks"];                                               // plinth
  if (y === top - 1) return ["smooth_sandstone"];                                     // cornice / parapet cap
  if (LIT.has(`${x},${y},${z}`)) return ["glowstone"];
  if (y % 5 === 0) return ["smooth_sandstone"];                                       // string course at each storey line
  if (y % 5 === 4) return ["calcite"];                                                // lintel
  if (x === 4 && z === 0 && (y === 1 || y === 2)) {                                   // entrance on the north face
    return ["oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (x % 2 === 1 && exposedZ(x, y, z)) return ["glass_pane", PANE];                  // window bays on every exposed face
  return ["calcite"];                                                                 // piers between bays
}

const g = new Voxels([10, 38, 3]);
for (const [key, { ground, top }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < top; y++) {
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }                     // foundation up to this cell's ground
    const b = block(x, y, z, top);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}

// two brick flues on the roof, standing on the cornice
for (const x of [2, 7]) {
  for (let y = 22; y <= 23; y++) g.set(x, y, 0, "bricks");
  g.set(x, 24, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${HERE}/FR245157265.nbt`);
