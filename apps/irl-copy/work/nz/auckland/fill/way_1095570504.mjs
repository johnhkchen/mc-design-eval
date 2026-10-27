// Way 1095570504: a two-storey Edwardian brick shop-and-flat block on a flat, lidar-flat site (ground 0, roof 7).
// Plinth, shopfront with a central door, cream-rendered quoins and parapet, a stone string course between the storeys,
// a stone cornice over the upper storey, a brick chimney at the back. Only footprint cells are built; every tier
// stands on the course below; interiors are air behind the glass, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570504.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..9, z 0..7

const g = new Voxels([10, 20, 8]);

const foot = new Map(cells.map(([x, z, gr, ro]) => [`${x},${z}`, { gr, ro }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
// the sides of a cell with no footprint cell beyond them (its outward faces)
const outward = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inFoot(x + dx, z + dz));

const STREET = { x: 6, z: 7 };     // the street front is the z = 7 edge; the entrance sits at x = 6
// a window bay: a perimeter cell that is not a corner, on the even bays of its wall
const isWindow = (x, z) => outward(x, z).length === 1 && (x + z) % 2 === 0;

for (const [x, z, gr, ro] of cells) {
  const out = outward(x, z);
  const perimeter = out.length > 0;
  const corner = out.length >= 2;                      // quoins: the plan's outside corners and steps
  const window = perimeter && !corner && isWindow(x, z);
  const door = x === STREET.x && z === STREET.z;
  const winNear = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => isWindow(x + dx, z + dz));
  const Y = (k) => gr + k;

  // plinth: a solid base course on the ground
  g.set(x, Y(0), z, "stone_bricks");

  // ground storey (shopfront): glass bays, brick piers, quoins, the door, lanterns hung in the room
  if (perimeter) {
    if (door) {
      g.set(x, Y(1), z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, Y(2), z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      const m = corner ? "white_terracotta" : window ? "glass" : "bricks";
      g.set(x, Y(1), z, m); g.set(x, Y(2), z, m);
    }
  } else if ((x * 3 + z) % 5 === 0) {
    g.set(x, Y(2), z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // the string course: the floor slab between storeys, the sill of the upper windows
  g.set(x, Y(3), z, "smooth_stone");

  // upper storey: the same bays, with warm glowstone just inside some of the windows
  if (perimeter) {
    const m = corner ? "white_terracotta" : window ? "glass" : "bricks";
    g.set(x, Y(4), z, m); g.set(x, Y(5), z, m);
  } else if (winNear && (x + 2 * z) % 3 === 0) {
    g.set(x, Y(4), z, "glowstone");
  }

  // cornice and roof deck (one course below the lidar roof), parapet on the perimeter to the lidar height
  g.set(x, Y(ro - 1), z, "stone_bricks");
  if (perimeter) g.set(x, Y(ro), z, "white_terracotta");
}

// the rooftop chimney, on an interior cell at the back of the block
g.set(4, 7, 2, "bricks"); g.set(4, 8, 2, "bricks");
g.set(4, 9, 2, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570504.nbt");
