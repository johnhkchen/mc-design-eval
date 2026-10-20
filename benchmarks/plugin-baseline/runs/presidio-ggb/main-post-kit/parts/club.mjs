// Part "Officers' Club shell" (plan.md PARTS 2): ground courses, stucco walls of the range, gable block and wings,
// the arcade piers and arches, the courtyard paving and back wall with its arched gate, and the oculus. Every window,
// door and entrance cell the plan reserves is left air for the glazing and door parts.
import { groundCourse, stuccoWall, arcadeBay, oculus } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// the cells a window or door takes in a wall: [x, y, z] for each of the given columns, rows and plane
const cells = (xs, ys, zs) => xs.flatMap((x) => ys.flatMap((y) => zs.map((z) => [x, y, z])));

export function build(g) {
  // ground course under each footprint (the lawn and the cannon ground stay air at y 0)
  groundCourse(g, 51, 9, 75, 17); // range
  groundCourse(g, 59, 18, 67, 21); // gable block (its north half is already the range)
  groundCourse(g, 51, 18, 58, 21); // west arcade
  groundCourse(g, 68, 18, 75, 21); // east arcade
  groundCourse(g, 51, 1, 57, 8); // west rear wing
  groundCourse(g, 69, 1, 75, 8); // east rear wing
  groundCourse(g, 58, 1, 68, 8); // courtyard paving

  // main range: 1 thick, the front (z 16..17) 2 thick. Windows x 53, 55, 71, 73 and doors x 56, 70 stay air.
  stuccoWall(g, [51, 1, 9, 75, 6, 17], 1, {
    open: [
      ...cells([53, 55, 71, 73], [2, 3], [16, 17]),
      ...cells([56, 70], [1, 2], [16, 17]),
      ...cells([63], [1, 2], [9]), // courtyard door in the back wall
      ...cells([60, 66], [2, 3], [9]), // courtyard windows
    ],
  });

  // entrance gable block: front (z 20..21) 2 thick; the arched entrance, the door cell, the two tall windows and the
  // oculus ring are left air
  stuccoWall(g, [59, 1, 16, 67, 9, 21], 1, {
    open: [
      ...cells([62, 63, 64], [1, 2, 3], [20, 21]), // arched entrance (door at x 63 is P5's)
      ...cells([60, 66], [2, 3], [20, 21]), // tall windows
      ...cells([62, 63, 64], [7, 8, 9], [21]), // oculus ring
    ],
  });

  // rear wings: 1 thick, windows on the courtyard and outer faces (x 57, 69, 51, 75 at z 3 and 6) left air
  const wingOpen = (xs) => cells(xs, [2, 3], [3, 6]);
  stuccoWall(g, [51, 1, 1, 57, 4, 8], 1, { open: wingOpen([51, 57]) });
  stuccoWall(g, [69, 1, 1, 75, 4, 8], 1, { open: wingOpen([69, 75]) });

  // courtyard back wall (z 1, x 58..68, coping at y 3) with the arched gate (x 62..64, y 1..2) left air
  stuccoWall(g, [58, 1, 1, 68, 3, 1], 1, { open: cells([62, 63, 64], [1, 2], [1]) });

  // arcades on the front: piers at x 51, 54, 57 and 69, 72, 75 (z 20), arches between, and the one-cell gap at x 58
  // and x 68 gets a flat head at y 3 (the gap is open at y 1..2)
  arcadeBay(g, 51, 54, 20);
  arcadeBay(g, 54, 57, 20);
  arcadeBay(g, 69, 72, 20);
  arcadeBay(g, 72, 75, 20);
  for (const x of [58, 68]) for (const y of [3, 4]) g.set(x, y, 20, "white_concrete");

  // entrance arch over x 62..64 (y 3): upside-down stairs spring from the stucco at x 61 and x 65, a flat keystone
  // at x 63 (the door below it is P5's)
  for (const z of [20, 21]) {
    g.set(62, 3, z, ...B.stairs("smooth_quartz", "west", "top"));
    g.set(63, 3, z, "white_concrete");
    g.set(64, 3, z, ...B.stairs("smooth_quartz", "east", "top"));
  }

  // oculus (round window) in the main gable, centred at (63, 8) in the plane z 21
  oculus(g, 63, 8, 21);
}
