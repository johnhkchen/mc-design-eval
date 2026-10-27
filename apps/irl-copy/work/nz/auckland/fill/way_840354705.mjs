// Auckland, way 840354705: a 1920s Edwardian brick shop-top block, three storeys on a stone plinth, in the Eden Terrace
// / Newton street grain. The lidar roof is flat at 12 on every cell, so there are no setbacks: the massing is one flat-
// topped box with a 1-block parapet (13 with the coping). The ground storey is a timber-fascia shopfront with a recessed
// door on the south face, the street side that faces the viewer on Maungawhau. Upper storeys are brick piers on quoins
// with quartz sills and 2-high sash glass in every other bay; each floor line is a smooth-stone string course. Walls are
// one block thick with an air gap behind the glass; a floor slab sits at each storey line; a few windows are lit from
// inside, standing on the floor so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_840354705.cells.json", "utf8"));

const ROOF = 12;                                  // the lidar roof height above y 0 (every cell reads 12)
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
// the sides of a cell with no neighbour in the footprint: N is -z, S is +z, W is -x, E is +x
const exposed = (x, z) => [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]]
  .filter(([, dx, dz]) => !inFoot(x + dx, z + dz)).map(([side]) => side);
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Storey lines (absolute): floor slabs at 4 and 8, the cornice at 11, the parapet at 12. Ground storey 1..3, second 5..7
// (sill at 5), third 9..10 (no sill: the slab at 8 is its sill). Glass rows are the window rows; piers are brick.
const SLABS = [4, 8];
const GLASS_ROWS = [2, 3, 6, 7, 9, 10];
const SILL_ROWS = [1, 5];
const GLOW_ROWS = [1, 5, 9];                      // a lit window stands on the floor of its storey

const GLASS = "glass_pane";
const pane = (side) => (side === "N" || side === "S")
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const g = new Voxels([7, 25, 8]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// The south face (the street, +z) carries the shopfront: a recessed door at x 3, glazing at x 4, timber fascia over the door.
const DOOR_X = 3, SHOP_X = 4;

for (const [key, { ground }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const sides = exposed(x, z);

  // the foundation: solid from y 0 up to the cell's ground (y 0 is the lowest ground under the footprint)
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  if (sides.length === 0) {                       // interior: floor slabs and the roof deck, air between
    put(x, 0, z, "smooth_stone");
    for (const y of SLABS) put(x, y, z, "smooth_stone");
    put(x, ROOF - 1, z, "stone");
    continue;
  }

  // the perimeter: a base course, string courses, cornice and parapet
  put(x, 0, z, "stone_bricks");
  for (const y of SLABS) put(x, y, z, "quartz_block");
  put(x, ROOF - 1, z, "quartz_block");
  put(x, ROOF, z, "bricks");

  const corner = sides.length > 1;                // quoins: the stone corners on every storey
  const side = sides[0];
  const along = side === "N" || side === "S" ? x : z;   // position along the face, for the bay pattern
  const pier = corner || along % 2 === 0;

  for (const y of [...GLASS_ROWS, ...SILL_ROWS]) {
    if (corner) { put(x, y, z, "quartz_block"); continue; }
    const front = side === "S" && z === 7 && y <= 3;     // the ground storey of the street face
    if (front && x === DOOR_X) {
      if (y === 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "dark_oak_planks");                  // timber fascia over the door
      continue;
    }
    if (front && x === SHOP_X) { put(x, y, z, GLASS, pane(side)); continue; }   // shop glazing runs the full ground storey
    if (pier) { put(x, y, z, "bricks"); continue; }
    if (SILL_ROWS.includes(y)) put(x, y, z, "quartz_block");
    else put(x, y, z, GLASS, pane(side));
  }
}

// Warm light: a glowstone on the floor of the room behind some windows (every third bay, in a pattern, so none floats)
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  const sides = exposed(x, z);
  const side = sides[0];
  if (sides.length !== 1 || (side === "S" && z === 7)) continue;   // the front is lit by its own shop light below
  const along = side === "N" || side === "S" ? x : z;
  if (along % 2 === 0) continue;                                    // a pier, not a window
  const [dx, dz] = inward[side];
  const ix = x + dx, iz = z + dz;
  if (!inFoot(ix, iz) || exposed(ix, iz).length) continue;         // only into an interior room
  GLOW_ROWS.forEach((ly, k) => { if ((x + z + k) % 3 === 0) put(ix, ly, iz, "glowstone"); });
}
put(SHOP_X, 1, 6, "glowstone");                    // the shop's own light behind its glass

// rooftop plant on the roof deck, and two lanterns on the front corner parapets
put(3, ROOF, 2, "light_gray_concrete");
put(4, ROOF, 2, "light_gray_concrete");
put(2, ROOF + 1, 7, "lantern", { hanging: "false", waterlogged: "false" });
put(5, ROOF + 1, 7, "lantern", { hanging: "false", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_840354705.nbt");
