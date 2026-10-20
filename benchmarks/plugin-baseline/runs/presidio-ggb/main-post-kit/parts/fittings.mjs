// Part "Glazing, doors, signs, cannons, flag" (plan.md PARTS 5): the glazier and sign writer's pieces. Sash windows in
// every OPENINGS window cell of the three brick buildings and the Visitor Center, deep-set grilled windows and the
// oculus on the Officers' Club, the doors (double doors on the brick buildings, single doors and the arched entrance
// on the club), the Visitor Center's red fascia with its PRESIDIO banners and VISITOR CENTER sign, two cannons and
// the flagpole. Writes only into air (the shells leave every opening air); a write into a cell an earlier part fills
// is refused by runParts and reported.
import { B, bannerWord, signboard } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { cannon, flagpole, oculus, sashWindow, grilleWindow, doubleDoor } from "../vocab.mjs";

// glass_pane connection states for a pane in a wall running along x (north/south face) or z (east/west face)
function paneState(face) {
  return face === "north" || face === "south"
    ? { north: "false", east: "true", south: "false", west: "true" }
    : { north: "true", east: "false", south: "true", west: "false" };
}

// a sash window with no sill: for the faces whose sill would fall outside the plot (the wing ends and the wing backs)
function glaze(g, x, y, z, face) {
  const st = paneState(face);
  g.set(x, y, z, "glass_pane", st);
  g.set(x, y + 1, z, "glass_pane", st);
}

// a single door: lower and upper halves at (x, 1..2, z), hinged on the left, facing out
function singleDoor(g, x, z, facing, wood) {
  g.set(x, 1, z, ...B.door(wood, facing, "lower", "left"));
  g.set(x, 2, z, ...B.door(wood, facing, "upper", "left"));
}

export function build(g) {
  // ---- glazing: the OPENINGS table, sash windows (1 wide, 2 tall) on every storey row y 2, 5, 8 -----------------------

  // Museum (Building 104): front z 14, back z 7 (y 8 only, the pavilion covers the rest), ends x 0 and x 23
  for (const x of [2, 4, 6, 8, 10, 13, 15, 17, 19, 21]) {
    for (const y of [2, 5, 8]) sashWindow(g, x, y, 14, "south");
    sashWindow(g, x, 8, 7, "north");
  }
  for (const z of [9, 12]) {
    for (const y of [2, 5, 8]) {
      glaze(g, 0, y, z, "west");
      sashWindow(g, 23, y, z, "east");
    }
  }

  // Montgomery Street barracks (plot 1): front z 13, back z 6 between the wings, main-block ends at z 8 and 11
  for (const x of [26, 28, 30, 32, 34, 39, 41, 43, 45, 47]) for (const y of [2, 5, 8]) sashWindow(g, x, y, 13, "south");
  for (const x of [32, 34, 39, 41]) for (const y of [2, 5, 8]) sashWindow(g, x, y, 6, "north");
  for (const z of [8, 11]) for (const y of [2, 5, 8]) {
    sashWindow(g, 24, y, z, "west");
    sashWindow(g, 49, y, z, "east");
  }
  // the rear wings: north faces (z 0) and outer ends (z 2, 4), no sills (a sill would sit off the plot)
  for (const x of [26, 28, 45, 47]) for (const y of [2, 5]) glaze(g, x, y, 0, "north");
  for (const z of [2, 4]) for (const y of [2, 5]) {
    glaze(g, 24, y, z, "west");
    glaze(g, 49, y, z, "east");
  }

  // Officers' Club (plot 2): deep-set grilled windows in the 2-thick front walls, plain sash windows in the 1-thick walls
  for (const x of [53, 55, 71, 73]) grilleWindow(g, x, 2, 17, "north");
  for (const x of [60, 66]) grilleWindow(g, x, 2, 21, "north");
  for (const x of [60, 66]) sashWindow(g, x, 2, 9, "north");
  for (const z of [3, 6]) {
    sashWindow(g, 57, 2, z, "east");
    sashWindow(g, 69, 2, z, "west");
    sashWindow(g, 51, 2, z, "west");
    sashWindow(g, 75, 2, z, "east");
  }

  // Visitor Center (plot 3): front z 6, one window per end, two on the back (z 1)
  for (const x of [80, 82, 89, 91]) sashWindow(g, x, 2, 6, "south");
  sashWindow(g, 79, 2, 3, "west");
  sashWindow(g, 92, 2, 3, "east");
  for (const x of [82, 89]) sashWindow(g, x, 2, 1, "north");

  // ---- doors -------------------------------------------------------------------------------------------------------------
  doubleDoor(g, 11, 14, "south", "spruce"); // museum front
  doubleDoor(g, 36, 13, "south", "spruce"); // barracks front
  doubleDoor(g, 36, 6, "north", "spruce"); // barracks back, between the wings
  doubleDoor(g, 85, 6, "south", "spruce"); // Visitor Center front

  // club: range front doors (outer cell z 17), the arched entrance (door in the inner cell z 20, arch stairs at its
  // springing on the front cell), the courtyard door in the range back wall (z 9)
  singleDoor(g, 56, 17, "south", "dark_oak");
  singleDoor(g, 70, 17, "south", "dark_oak");
  singleDoor(g, 63, 20, "south", "dark_oak");
  // the arch's springing stairs at (62, 3, 21) and (64, 3, 21) are the club shell's: already built, not written again
  singleDoor(g, 63, 9, "north", "dark_oak");

  // club: the round window in the main gable (centre x 63, y 8, in the front cell z 21)
  oculus(g, 63, 8, 21);

  // ---- Visitor Center sign: a red fascia band, PRESIDIO on banners in front of it, VISITOR CENTER on the brick -----------
  // y 3 only: the roof part already holds y 4 (its porch-roof slab), so that row is refused and left as built
  for (let x = 81; x <= 90; x++) g.set(x, 3, 8, "red_concrete");
  bannerWord(g, "PRESIDIO", { center: [85, 4, 9], face: "south", letter: "white", base: "red" });
  signboard(g, "VISITOR CENTER", { at: [84, 4, 7], face: "south", mode: "wall", width: 4, wood: "spruce", board: "smooth_quartz" });

  // ---- cannons on the lawn (muzzles south), flanking the club entrance, and the flagpole ---------------------------------
  cannon(g, 59, 23, { facing: "south" });
  cannon(g, 67, 23, { facing: "south" });
  flagpole(g, 93, 9);
}
