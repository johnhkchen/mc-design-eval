// Way 260094417: a narrow 1980s concrete-and-glass office tower on a two-storey podium, Eden Terrace side of the CBD.
// The lidar gives a 3 x 4 block tower of 11 storeys (roof ~45) with a stepped SW corner (33) and a 2-storey east wing (8)
// and a 3-storey stair turret (14); the z=4 row is ground (apron, entrance). Tiers come from the roof column, not the noise.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260094417.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..4, z 0..4

// the palette: light concrete body and spandrels, smooth stone storey lines and cornices, grey mullions, blue-grey glass
const BODY = "light_gray_concrete", LINE = "smooth_stone", MULLION = "polished_andesite", GLASS = "light_blue_stained_glass";

// roof column -> the top course (the cap's y) of a clean tier: tower 44 (roof 45), setback 32 (33), turret 13 (14), wing 7 (8)
const capFor = (roof) => (roof >= 40 ? 44 : roof >= 30 ? 32 : roof >= 12 ? 13 : roof >= 6 ? 7 : null);
// the tower's inside is the 1 x 2 air column at x 1, z 1..2 (floors per storey, lights behind the glass)
const inside = (x, z) => x === 1 && (z === 1 || z === 2);
// glazed cells in the outer ring; the rest of the window band is mullion (grey concrete)
const GLAZED = new Set(["1,0", "0,1", "0,2", "2,1", "2,2", "1,3", "3,1", "3,0"]);

const g = new Voxels([5, 58, 5]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const cap = new Map();
for (const [x, z, ground, roof] of cells) {
  const top = capFor(roof);
  if (top === null) continue;                                   // lidar says no building here (roof 0-5)
  cap.set(`${x},${z}`, top);
  for (let y = 0; y < ground; y++) put(x, y, z, LINE);          // foundation (none here: ground is 0)
  for (let y = ground; y <= top; y++) {
    if (inside(x, z)) {
      if (y === top || (y > 0 && y % 4 === 0)) put(x, y, z, BODY);   // roof slab and a floor per storey
      continue;                                                  // air otherwise: no interiors
    }
    let b;
    if (y === top) b = LINE;                                     // cornice / parapet cap
    else if (y % 4 === 0) b = LINE;                              // base course and storey lines
    else if (y % 4 === 3) b = BODY;                              // spandrel under each window band
    else b = GLAZED.has(`${x},${z}`) ? GLASS : MULLION;          // window band
    put(x, y, z, b);
  }
}

// the lobby: iron door in the south face, glass transom over, a canopy on two posts over the apron
put(1, 0, 3, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(1, 1, 3, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 0; x <= 2; x++) put(x, 3, 4, LINE);                 // canopy, bearing on the wall's spandrel
for (const x of [0, 2]) for (const y of [1, 2]) put(x, y, 4, "gray_concrete");   // posts on the apron
put(1, 2, 4, "lantern", { hanging: "true", waterlogged: "false" });       // warm light under the canopy

// the apron: the ground row south of the tower, footprint cells with no building
for (let x = 0; x <= 4; x++) put(x, 0, 4, LINE);

// warm lights behind the tower glass: glowstone and shroomlight in the inside air column
for (const k of [1, 3, 5, 7, 9]) put(1, 4 * k + 1, 1, "glowstone");
for (const k of [2, 4, 6, 8, 10]) put(1, 4 * k + 2, 2, "shroomlight");

// roof: a lift overrun on the tower roof with a lightning rod, and an air-handling unit on the wing roof
put(1, 45, 1, BODY); put(1, 45, 2, BODY); put(1, 46, 1, BODY); put(1, 46, 2, BODY);
put(1, 47, 1, "lightning_rod", { facing: "up", powered: "false" });
put(3, 8, 2, "iron_block");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260094417.nbt");
