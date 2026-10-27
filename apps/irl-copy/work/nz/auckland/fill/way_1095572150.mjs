// Way 1095572150: a two-storey brick commercial block with a shopfront, stone plinth, quoined corners, a shroomlight-lit
// sill row and a parapet (Edwardian/interwar Auckland main-street type). 6 x 5 footprint, L-shaped; flat roof at y 9.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572150.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..5, z 0..4

// Lidar roof heights: one flat tier here, so the roof (parapet top) is R and every cell stands on y 0.
const R = Math.max(...cells.map((c) => c[3]));
if (cells.some((c) => c[3] !== R)) throw new Error("expected one flat roof tier");
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);

const g = new Voxels([6, 22, 5]);

// Faces of a cell that have no neighbour in the footprint (the outside). N is z-, the street front.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inFoot(x + dx, z + dz)).map(([k]) => k);
const exterior = (x, z) => faces(x, z).length > 0;
const corner = (x, z) => faces(x, z).length >= 2;

// Entrance on the north front, in a plain (non-corner) cell; a lantern hangs in the shopfront beside it.
const DOOR = [3, 1], LANTERN = [4, 1];

for (const [x, z, ground] of cells) {
  // ground to the floor: foundation fill (none here, the lot is flat) then the floor slab at y 0
  for (let y = 0; y < Math.max(ground, 1); y++) g.set(x, y, z, "stone_bricks");
  const f = faces(x, z), ext = f.length > 0, cor = f.length >= 2;
  const isDoor = x === DOOR[0] && z === DOOR[1], isLantern = x === LANTERN[0] && z === LANTERN[1];
  // window grid on the upper storey: alternate cells along each face, corners stay solid
  const win = !cor && ((x + z) % 2 === 0);
  // a glowing sill every fourth window, the warm light on the street facade
  const warm = win && ((x + 2 * z) % 4 === 0);
  // a pane runs along its wall: east-west on north/south faces, north-south on east/west faces
  const paneState = f.includes("N") || f.includes("S") ? { east: "true", west: "true" } : { north: "true", south: "true" };

  if (ext) {
    // plinth (y 1), the walk-in level
    if (!isDoor) g.set(x, 1, z, "polished_andesite");
    // shopfront: dark oak posts at corners, glass between, the door and a lantern on the front
    if (cor) { g.set(x, 2, z, "dark_oak_log"); g.set(x, 3, z, "dark_oak_log"); }
    else if (isDoor) {
      g.set(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, 3, z, "dark_oak_planks");                              // the canopy over the door
    } else if (isLantern) {
      g.set(x, 2, z, "lantern", { hanging: "true" });
      g.set(x, 3, z, "glass");
    } else { g.set(x, 2, z, "glass"); g.set(x, 3, z, "glass"); }
    // string course over the shopfront
    g.set(x, 4, z, "smooth_quartz");
    // upper storey: brick piers and corners, windows with a sill
    if (win) {
      g.set(x, 5, z, warm ? "shroomlight" : "smooth_quartz");
      g.set(x, 6, z, "glass_pane", paneState);
      g.set(x, 7, z, "glass_pane", paneState);
    } else for (let y = 5; y <= 7; y++) g.set(x, y, z, "bricks");
    // cornice and parapet
    g.set(x, 8, z, "smooth_quartz");
    for (let y = 9; y <= R; y++) g.set(x, y, z, cor ? "smooth_quartz" : "bricks");
  } else {
    // interior: a floor slab at y 4 and the roof at y 8, air between (the glass has air behind it)
    g.set(x, 4, z, "smooth_stone");
    g.set(x, 8, z, "smooth_stone");
  }
}

// rooftop plant: two condenser boxes on the interior roof
g.set(3, 9, 2, "light_gray_concrete");
g.set(4, 9, 2, "light_gray_concrete");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572150.nbt");
