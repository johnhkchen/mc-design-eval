// 23 Logan Circle NW: a Victorian red-brick rowhouse, two storeys of sash windows over a stone plinth and a
// sandstone cornice, flat roof behind it. Front is the z=0 face (the long 9-block side); z=1 is a brick core with
// air pockets only behind the glass, and a floor slab at each storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77098.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..8, z 0..2

// lidar smoothed to one flat tier: the median ground and roof (the east end's 5 is one column of noise against 6)
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const GROUND = median(cells.map((c) => c[2]));   // 0
const TOP = median(cells.map((c) => c[3])) - 1;  // the top layer of walls: y 5 under a roof at 6
const on = new Set(cells.map(([x, z]) => x * 10 + z));

const GLASS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const WINDOW_X = [2, 4, 6];   // sash bays on both storeys; piers between
const PIER_CAP_X = [0, 3, 5, 7, 8];   // chiseled corbels in the cornice above the piers
const GROUND_WINDOW_Y = [1, 2], UPPER_WINDOW_Y = [4];
const WARM = { "4,1,1": "glowstone", "6,4,1": "glowstone" };   // lamps standing in the air gap behind two panes

// what a footprint cell holds at x, y, z: { block, state } or null for air (the glass's air gap, the door's void)
function plan(x, y, z) {
  if (!on.has(x * 10 + z) || y < GROUND || y > TOP) return null;
  const front = z === 0, mid = z === 1;
  if (y === 0) {
    if (front && x === 1) return { block: "stone_brick_stairs", state: { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" } };
    return { block: "stone_bricks" };
  }
  if (y === 1 || y === 2) {                                          // ground floor
    if (front && x === 1) return { block: "dark_oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
    if (front && GROUND_WINDOW_Y.includes(y) && WINDOW_X.includes(x)) return { block: "glass_pane", state: GLASS };
    if (mid && (x === 1 || GROUND_WINDOW_Y.includes(y) && WINDOW_X.includes(x))) return WARM[`${x},${y},${z}`] ? { block: WARM[`${x},${y},${z}`] } : null;
    return { block: "bricks" };
  }
  if (y === 3) {                                                     // the floor slab: a sandstone string course round the outside, stone inside
    if (front && x === 1) return { block: "lantern", state: { hanging: "true", waterlogged: "false" } };
    if (!mid || x === 0 || x === 8) return { block: "smooth_sandstone" };
    return { block: "smooth_stone" };
  }
  if (y === 4) {                                                     // upper floor
    if (front && WINDOW_X.includes(x)) return { block: "glass_pane", state: GLASS };
    if (mid && WINDOW_X.includes(x)) return WARM[`${x},${y},${z}`] ? { block: WARM[`${x},${y},${z}`] } : null;
    return { block: "bricks" };
  }
  // y 5: the cornice out front, the flat roof behind it
  if (front) return { block: PIER_CAP_X.includes(x) ? "chiseled_sandstone" : "smooth_sandstone" };
  return { block: "blackstone" };
}

const g = new Voxels([9, 18, 3]);
for (const [x, z] of cells) for (let y = GROUND; y <= TOP; y++) {
  const p = plan(x, y, z); if (p) g.set(x, y, z, p.block, p.state);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77098.nbt");
