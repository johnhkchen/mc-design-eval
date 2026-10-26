// 1610 New Hampshire Ave NW (Dupont Circle): a three-storey red-brick chancery with a calcite (limestone-look)
// plinth, belt courses and cornice, on a stepped massing read from the lidar roof heights (8 / 7 / 6 / 2 blocks).
// Hollow shell: exterior walls one block thick, air behind every window, a floor slab per storey, a flat roof cap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77463.cells.json`, "utf8"));   // [x, z, ground, roof]

const FP = new Map();
for (const [x, z, ground, roof] of cells) FP.set(`${x},${z}`, { ground, roof });
const inFP = (x, z) => FP.has(`${x},${z}`);
const roofOf = (x, z) => FP.get(`${x},${z}`)?.roof ?? 0;      // 0 outside the footprint: air at every height
const groundOf = (x, z) => FP.get(`${x},${z}`)?.ground ?? 0;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                // +x, -x, +z, -z
// A face is exposed where the neighbour is outside the building at this height (no footprint, or below the roof).
const exposedFaces = (x, z, y) => DIRS.filter(([dx, dz]) => roofOf(x + dx, z + dz) <= y);

// Rows: y 0 plinth, storey 1 glass 1-2 (belt 3), storey 2 glass 4-5 (cornice belt 6), roof cap at each cell's top.
const GLASS_ROWS = new Set([1, 2, 4, 5]);
const BELTS = new Set([3, 6]);

// Is (x, z) an air cell behind the wall at height y: inside, under its own roof, not on a floor slab.
const isVoid = (x, z, y) => inFP(x, z) && y > 0 && !BELTS.has(y) && y < roofOf(x, z) - 1 && exposedFaces(x, z, y).length === 0;

function spec(x, z, y) {
  if (!inFP(x, z)) return null;
  const roof = roofOf(x, z), top = roof - 1;
  if (y >= roof) return null;
  if (y < groundOf(x, z)) return ["calcite"];                   // foundation under a sloped cell
  if (y === 0 || y === top) return ["calcite"];                 // plinth course and the roof cap
  const outside = exposedFaces(x, z, y);
  if (!outside.length) return BELTS.has(y) ? ["calcite"] : null;   // interior floor slab, or air
  if (BELTS.has(y)) return ["calcite"];                          // belt courses wrap the shell
  // the entrance: a dark-oak double-leaf door on the street face (z 0), with calcite jambs and hanging lanterns
  if (z === 0 && x === 5 && (y === 1 || y === 2)) {
    return ["dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (z === 0 && (x === 4 || x === 6)) {
    if (y === 2) return ["lantern", { hanging: "true", waterlogged: "false" }];
    return ["calcite"];
  }
  // quoins: a corner cell (exposed on two axes) is limestone at every wall height
  if (new Set(outside.map(([dx, dz]) => (dx ? "x" : "z"))).size > 1) return ["calcite"];
  // window: a glass pane where there is air behind it; alternating bays, brick piers between
  if (GLASS_ROWS.has(y)) {
    const u = outside[0][0] ? z : x;                            // position along the facade
    const windowed = outside.some(([dx, dz]) => isVoid(x - dx, z - dz, y));
    if (windowed && u % 2 === 0) return ["glass"];
  }
  return ["bricks"];
}

const g = new Voxels([11, 20, 5]);
for (let z = 0; z < 5; z++) for (let x = 0; x < 11; x++) {
  const top = roofOf(x, z);
  for (let y = 0; y < top; y++) {
    const s = spec(x, z, y);
    if (s) g.set(x, y, z, s[0], s[1]);
  }
}

// roof penthouse on the 2x2 core (cells 3..4 x 1..2), standing on the roof cap at y 7
for (let z = 1; z <= 2; z++) for (let x = 3; x <= 4; x++) {
  g.set(x, 8, z, "bricks");
  g.set(x, 9, z, "calcite");
}

// warm lights hung in the air of each storey, under the slab above, in every fourth bay
for (let z = 0; z < 5; z++) for (let x = 0; x < 11; x++) {
  for (const y of [2, 5]) {
    if (isVoid(x, z, y) && (x + z) % 4 === 0) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

const r = g.save(`${DIR}/DC77463.nbt`);
console.log(`DC77463.nbt: ${r.blocks} blocks, ${r.palette} palette entries`);
