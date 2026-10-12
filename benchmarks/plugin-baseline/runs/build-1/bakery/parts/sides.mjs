// Part 6, Sides, back and wing details: the west and east faces of the main body (upper and ground glazing, shutters on
// x=5 and x=17, Mann braces in the upper daub), the back door and back windows (z=22), the bakehouse wing's north window,
// vent and shutters (z=13), its east side door and windows (x=21), and the lanterns by the back and wing doors.
// Writes only into the cells part 1 left open (plan.md OPENINGS and the brace cells); everything else stays air.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { glazedWindow, shutterPair, doorAt, mannBrace, hangingLantern } from "../vocab.mjs";

// upper-storey posts along the west and east faces (plan.md FACADES); single daub panels at z=9,14,19,21 take a brace
const SIDE_POSTS = [8, 10, 13, 15, 18, 20, 22];
const SIDE_BRACES = [9, 14, 19, 21];

/** The post a single panel braces toward: the nearer one along z, ties go north. */
function toward(z) {
  const lo = Math.max(...SIDE_POSTS.filter((p) => p < z));
  const hi = Math.min(...SIDE_POSTS.filter((p) => p > z));
  return z - lo <= hi - z ? "n" : "s";
}

/** One upside-down spruce_stairs brace per single panel, at the bottom of the panel row (y=8). */
function sideBraces(g, x) {
  for (const z of SIDE_BRACES) mannBrace(g, x, 8, z, toward(z));
}

/** A block placed into a cell that must be air (the caller owns the cell). */
const place = (g, [x, y, z], [block, state, nbt]) => g.set(x, y, z, block, state, nbt);

export function build(g) {
  // ---- west face (x=6): ground windows, shutters on x=5 hinged on the east side so they lie flat on the wall
  glazedWindow(g, "z", 11, 12, 3, 4, 6);
  glazedWindow(g, "z", 17, 18, 3, 4, 6);
  for (const z of [10, 13, 16, 19]) shutterPair(g, 5, 3, 4, z, "east");
  // ---- west face: upper windows and Mann braces
  glazedWindow(g, "z", 11, 12, 8, 9, 6);
  glazedWindow(g, "z", 16, 17, 8, 9, 6);
  sideBraces(g, 6);

  // ---- east face (x=16): ground window (z=10..11) with shutters on x=17 (hinged on the west side), upper windows, braces
  glazedWindow(g, "z", 10, 11, 3, 4, 16);
  for (const z of [9, 12]) shutterPair(g, 17, 3, 4, z, "west");
  glazedWindow(g, "z", 11, 12, 8, 9, 16);
  glazedWindow(g, "z", 16, 17, 8, 9, 16);
  sideBraces(g, 16);

  // ---- back face (z=22): door, ground window, upper windows, attic window
  doorAt(g, 8, 2, 22, "south");
  glazedWindow(g, "x", 13, 14, 3, 4, 22);
  glazedWindow(g, "x", 9, 10, 8, 9, 22);
  glazedWindow(g, "x", 12, 13, 8, 9, 22);
  glazedWindow(g, "x", 11, 11, 15, 16, 22);
  // lantern standing on the yard ground beside the back door (nothing above the door to hang from)
  place(g, [7, 1, 23], B.lantern(false));

  // ---- bakehouse wing, north gable end (z=13): window, flanking shutters on z=12 (hinged on the south side)
  // (the gable vent at (19,7,13) is part 1's white_wool infill, so no vent here)
  glazedWindow(g, "x", 19, 19, 3, 4, 13);
  shutterPair(g, 18, 3, 4, 12, "south");
  shutterPair(g, 20, 3, 4, 12, "south");

  // ---- bakehouse wing, east face (x=21): side door at z=17, windows at z=15 and z=20
  doorAt(g, 21, 2, 17, "east");
  glazedWindow(g, "z", 15, 15, 3, 4, 21);
  glazedWindow(g, "z", 20, 20, 3, 4, 21);
  // lantern standing on the yard path outside the side door (the eave cell at (22,4,17) is the roof's slab)
  place(g, [22, 1, 17], B.lantern(false));
}
