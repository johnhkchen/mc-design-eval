import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 10 x 6 Federal-style office block in pale limestone (smooth quartz), four storeys of two blocks (roof 8) with a
// three-storey wing (lidar 7, rounded to the 6 tier: a clean two-storey step down), a stone base course, quartz
// string courses, a cornice and a plain parapet. Every storey stands on the floor slab below it.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC80876.cells.json`, "utf8"));

const TOP = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, top: roof >= 8 ? 8 : 6 }]));
const inF = (x, z) => TOP.has(`${x},${z}`);
const topOf = (x, z) => TOP.get(`${x},${z}`)?.top ?? 0;
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
// a neighbour walls off height y only if it is a footprint cell still below its own terrace row
const enclosed = (x, z, y) => inF(x, z) && y < topOf(x, z) - 1;
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !enclosed(x + dx, z + dz, y));

const PIER = { block: "quartz_pillar", state: { axis: "y" } };
const WALL = { block: "smooth_quartz" };
const WIN = { block: "glass_pane" };
// warm lights in the air gap just inside a few windows
const LIGHTS = new Set(["1,1,1", "7,3,1", "4,5,1", "1,3,3", "4,3,4"]);
// roof plant on the main roof, standing on the cover
const PLANT = new Set(["2,2", "3,2", "2,3", "3,3"]);

// The facade bay for an exposed wall cell. Outward faces set the pattern (corners get a pier); inward walls
// that face a lower wing take a window every other cell.
function facade(x, y, z, outward) {
  if (outward.length > 1) return PIER;
  if (!outward.length) return (x + y + z) % 2 === 0 ? WIN : WALL;
  switch (outward[0][0]) {
    case "N": return x === 0 || x === 3 || x === 6 || x === 9 ? PIER : WIN;
    case "S": return x === 3 || x === 6 ? PIER : WIN;
    default: return z % 2 === 1 ? WIN : PIER;     // west and east flanks: windows on the odd bays
  }
}

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });

for (const [x, z, ground] of cells) {
  const T = topOf(x, z);
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");        // foundation up to the lowest ground (none here)
  for (let y = ground; y < T; y++) {
    const perim = exposed(x, z, y).length > 0;
    const outward = exposed(x, z, y).filter(([, dx, dz]) => !inF(x + dx, z + dz));
    // front entrance: a pair of dark oak doors under a quartz hood
    if (z === 0 && (x === 4 || x === 5) && y <= 1) {
      put(x, y, z, "dark_oak_door", { facing: "north", half: y === 0 ? "lower" : "upper", hinge: x === 4 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (z === 0 && y === 2 && x >= 3 && x <= 6) { put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === 0) put(x, y, z, perim ? "stone_bricks" : "smooth_quartz");                  // base course, floor slab
    else if (y === T - 1) {                                                              // parapet, roof cover inside
      if (perim) put(x, y, z, WALL.block);
      else put(x, y, z, "smooth_stone");
    }
    else if (y === T - 2) put(x, y, z, perim ? "quartz_bricks" : "smooth_quartz");       // cornice / top floor ceiling
    else if (y % 2 === 0) put(x, y, z, perim ? "quartz_bricks" : "smooth_quartz");       // string course / storey slab
    else if (perim) {                                                                    // window rows
      const f = facade(x, y, z, outward);
      put(x, y, z, f.block, f.state);
    } else if (LIGHTS.has(`${x},${y},${z}`)) put(x, y, z, "glowstone");                  // interior air gap, lit
  }
  if (T === 8 && PLANT.has(`${x},${z}`)) put(x, 8, z, "stone_bricks");
}

// glass panes join the walls and panes beside them, not lights or doors
const SOLO = new Set(["glowstone", "dark_oak_door", "quartz_slab"]);
const joins = (x, y, z) => { const p = plan.get(`${x},${y},${z}`); return !!p && !SOLO.has(p.block.replace("minecraft:", "")); };
for (const [key, p] of plan) {
  if (p.block !== WIN.block) continue;
  const [x, y, z] = key.split(",").map(Number);
  p.state = { north: String(joins(x, y, z - 1)), south: String(joins(x, y, z + 1)), east: String(joins(x + 1, y, z)), west: String(joins(x - 1, y, z)), waterlogged: "false" };
}

const g = new Voxels([10, 20, 6]);
for (const [key, { block, state }] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
console.log(g.save(`${DIR}/DC80876.nbt`));
