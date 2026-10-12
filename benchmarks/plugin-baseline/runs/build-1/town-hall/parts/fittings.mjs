// Part: Fittings and lettering (parts/fittings.mjs). Glass in every window of the OPENINGS table, the flat arches over the
// ground windows, the hoods over the upper ones, the sills under the ground ones, the main door (mainDoor), the rear door
// with its transom, and the TOWN HALL lettering on the portico's entablature. Writes go only into air (the shell's openings).
import { windowBay, flatArch, windowHood, mainDoor, townHallLetters } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// The rear door's transom and the door's two halves. rearDoor is not in the vocabulary (plan ELEMENTS 18): written here.
// The shell opens only x20 at z26 for y4..6, so the door is the one column and the transom is one pane.
function rearDoor(g) {
  g.set(20, 4, 26, ...B.door("dark_oak", "south", "lower", "left"));
  g.set(20, 5, 26, ...B.door("dark_oak", "south", "upper", "left"));
  g.set(20, 6, 26, ...B.pane());
}

export function build(g) {
  // ---- north front: pavilions (plane z9) ----
  for (const at of [6, 32]) {
    windowBay(g, "north", 9, at, 3, 5, 4, { sill: true });
    windowBay(g, "north", 9, at, 3, 11, 4);
    flatArch(g, "north", 9, at, at + 2, 9);
    windowHood(g, { face: "north", x0: at, x1: at + 2, y: 15, plane: 9 });
  }

  // ---- north front: recessed ranges (plane z10). Behind the portico the entablature (z6..9, y15..16) is the hood. ----
  for (const at of [12, 27, 16, 23]) {
    windowBay(g, "north", 10, at, 2, 5, 4, { sill: true });
    windowBay(g, "north", 10, at, 2, 11, 4);
    flatArch(g, "north", 10, at, at + 1, 9);
    if (at === 12 || at === 27) windowHood(g, { face: "north", x0: at, x1: at + 1, y: 15, plane: 10 });
  }

  // ---- north front: main door (x19..21) and the Palladian window over it (under the entablature, no hood) ----
  mainDoor(g, 20, 10, "north", 4);
  windowBay(g, "north", 10, 19, 3, 11, 4);

  // ---- west and east ends (plane x4 / x36), windows at z12..13 and z22..23 ----
  for (const face of ["west", "east"]) {
    const plane = face === "west" ? 4 : 36;
    for (const at of [12, 22]) {
      windowBay(g, face, plane, at, 2, 5, 4, { sill: true });
      windowBay(g, face, plane, at, 2, 11, 4);
      flatArch(g, face, plane, at, at + 1, 9);
      windowHood(g, { face, x0: at, x1: at + 1, y: 15, plane });
    }
  }

  // ---- south rear (plane z26) ----
  for (const at of [6, 11, 16, 23, 28, 33]) {
    windowBay(g, "south", 26, at, 2, 5, 4, { sill: true });
    windowBay(g, "south", 26, at, 2, 11, 4);
    flatArch(g, "south", 26, at, at + 1, 9);
    windowHood(g, { face: "south", x0: at, x1: at + 1, y: 15, plane: 26 });
  }
  windowBay(g, "south", 26, 19, 3, 11, 4); // centre upper window
  windowHood(g, { face: "south", x0: 19, x1: 21, y: 15, plane: 26 });
  rearDoor(g);

  // ---- TOWN HALL lettering on the entablature (sign in front of the north face, z5) ----
  townHallLetters(g, "north", 6, 15, 25, 15, { text: "TOWN HALL", height: 2 });
}
