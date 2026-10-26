// 1630 19th St NW (Dupont Circle): a c.1900 Renaissance Revival brick flats block, three storeys over a stone plinth,
// a smooth-sandstone cornice and a flat tar roof, with a stair bulkhead on the eastern end where lidar reads one block higher.
// Storeys are two blocks each (a glass row over a stone spandrel), so the 7-block roof reads as three floors and a cornice.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68730.cells.json", "utf8"));
// [x, z, ground, roof] per footprint cell
const FP = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { ground: g, roof: r }]));

const g = new Voxels([9, 19, 3]);

const DOOR_X = 3;                                    // the entrance, centred on the front (z = 0)
const WIN_FRONT = new Set([1, 2, 4, 5, 7]);          // glass on the street face; x = 0 and 6 are piers
const WIN_BACK = new Set([3, 4, 6, 7]);              // glass on the rear face
const LIGHTS = new Map([                             // warm light in the air gap behind the glass
  ["2,1,1", ["lantern", { hanging: "false" }]],
  ["5,3,1", ["lantern", { hanging: "false" }]],
  ["1,3,1", ["glowstone"]],                          // a solid glow block behind the window at x = 1
  ["4,5,1", ["shroomlight"]],
]);
const CHIMNEYS = [[1, 1], [5, 1]];                   // brick flues on the roof deck

const GLASS = ["glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }];
const DOOR = (half) => ["dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" }];
const STEP = ["stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" }];

// What one cell of the footprint holds at height y (null = air). Rows: 0 plinth, 1/3/5 storey glass, 2/4 stone
// spandrel and floor slab, 6 cornice and roof deck, 7 the stair bulkhead on the 8-high cells.
function cellAt(x, y, z) {
  if (y === 0) return z === 0 && x === DOOR_X ? STEP : ["stone_bricks"];
  if (y >= 7) return ["bricks"];
  if (y === 6) return z === 1 ? ["gray_concrete"] : ["smooth_sandstone"];
  if (z === 0 && x === DOOR_X && (y === 1 || y === 2)) return DOOR(y === 1 ? "lower" : "upper");
  if (y === 2 || y === 4) return ["smooth_sandstone"];   // the band runs through the floor slab too, so the ends read as one course
  // storey glass rows: 1 (ground), 3, 5
  const light = z === 1 && LIGHTS.get(`${x},${y},${z}`);
  if (light) return light;
  if (z === 0) {
    if (x === DOOR_X) return y === 3 ? ["smooth_sandstone"] : ["bricks"];   // lintel over the door, pier above it
    return WIN_FRONT.has(x) ? GLASS : ["bricks"];
  }
  if (z === 2) return WIN_BACK.has(x) ? GLASS : ["bricks"];
  // the middle row is the air gap behind the glass where the wall is closed front and back; elsewhere it is brick
  return x >= 2 && x <= 7 ? null : ["bricks"];
}

for (const [x, z, , roof] of cells) {
  for (let y = 0; y < roof; y++) {
    const b = cellAt(x, y, z);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}
// Cells the lidar reads one block higher (x 4..8 on the back, x 7..8 in the middle) get a bulkhead course,
// and the chimneys rise from the roof deck.
for (const [x, z, , roof] of cells) if (roof >= 8) g.set(x, 7, z, "bricks");
for (const [x, z] of CHIMNEYS) {
  g.set(x, 7, z, "bricks");
  g.set(x, 8, z, "smooth_sandstone");
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68730.nbt");
console.log(`DC68730.nbt: ${blocks} blocks, ${palette} palette entries, footprint ${FP.size} cells`);
