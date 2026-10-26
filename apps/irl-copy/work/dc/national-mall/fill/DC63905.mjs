import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 4 x 8 Federal-era commercial block: red brick walls on a stone plinth, white calcite string courses at each
// floor, a shopfront with a door on the street (z = 0) face, and a lower two-storey wing at the back.
// The lidar roof is 6 over the body and 7 on the front (the cornice/parapet tier); the back wing is 6.
// Storeys: ground (y1, plinth y0), 2nd (y3), 3rd (y5, front only). Floors are full-footprint slabs at y2, y4.
// The interior is air behind the glass, with a floor slab per storey and a few warm lights in the windows.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC63905.cells.json`, "utf8"));
const inFootprint = new Set(cells.map(([x, z]) => `${x},${z}`));

const g = new Voxels([4, 19, 8]);

const FRONT_Z = 0, BACK_Z = 7, MAIN_LAST_Z = 5;
const ROOF_MAIN = 7, ROOF_WING = 6;

const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // side-wall panes
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };  // front and back panes
const doorState = (half, facing) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

function block(x, y, z) {
  const perim = x === 0 || x === 3 || z === FRONT_Z || z === BACK_Z;
  const main = z <= MAIN_LAST_Z;
  const roof = main ? ROOF_MAIN : ROOF_WING;
  if (y >= roof) return null;

  // doorways: a street door at the front (x1) and a service door at the back (x2)
  if (x === 1 && z === FRONT_Z && y === 0) return ["dark_oak_door", doorState("lower", "north")];
  if (x === 1 && z === FRONT_Z && y === 1) return ["dark_oak_door", doorState("upper", "north")];
  if (x === 2 && z === BACK_Z && y === 0) return ["dark_oak_door", doorState("lower", "south")];
  if (x === 2 && z === BACK_Z && y === 1) return ["dark_oak_door", doorState("upper", "south")];

  // the top tier: a stone parapet on the outer edge (and the main roof's back edge), a roof deck inside
  if (y === roof - 1) {
    if (perim || (main && z === MAIN_LAST_Z)) return ["calcite"];
    return ["smooth_stone"];
  }
  // plinth and floor lines: stone, full footprint on the outside, slabs inside
  if (y === 0) return ["stone_bricks"];
  if (y === 2 || y === 4) return perim ? ["calcite"] : ["stone"];

  // the window bands (y1, y3, and y5 on the main body)
  if (!perim) return null;                                  // air behind the glass
  if ((x === 0 || x === 3) && (z === 0 || z === 7)) return ["calcite"];  // corner quoins
  if (z === FRONT_Z || z === BACK_Z) return ["glass_pane", paneEW];   // two bays on each end face
  // side walls: a window bay on z 1,2 and 4,5; brick piers at z 3 and 6
  if ([1, 2, 4, 5].includes(z)) return ["glass_pane", paneNS];
  return ["bricks"];
}

// warm lights behind a few windows
const LIGHTS = [
  [1, 1, 1, ["lantern", { hanging: "false", waterlogged: "false" }]],
  [2, 3, 1, ["shroomlight"]],
  [1, 3, 2, ["glowstone"]],
  [2, 1, 5, ["lantern", { hanging: "false", waterlogged: "false" }]],
  [1, 5, 1, ["lantern", { hanging: "false", waterlogged: "false" }]],
];

for (const [x, z] of [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2],
  [0, 3], [1, 3], [2, 3], [3, 3], [0, 4], [1, 4], [2, 4], [3, 4], [0, 5], [1, 5], [2, 5], [3, 5],
  [0, 6], [1, 6], [2, 6], [3, 6], [0, 7], [1, 7], [2, 7], [3, 7]]) {
  if (!inFootprint.has(`${x},${z}`)) continue;
  for (let y = 0; y < 8; y++) {
    const b = block(x, y, z);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}

// interior lights (behind a window), and the rooftop plant box on the main roof
for (const [x, y, z, [name, state]] of LIGHTS) g.set(x, y, z, name, state);
g.set(1, 7, 2, "oxidized_copper");
g.set(2, 7, 2, "oxidized_copper");

g.save(`${DIR}/DC63905.nbt`);
