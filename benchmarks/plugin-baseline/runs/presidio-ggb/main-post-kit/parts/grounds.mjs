// Part "Grounds and light" (plan.md PARTS 6): the museum shrubs and lawn edge, the courtyard tree, and every lantern.
// Porch and arcade lanterns hang from the deck, roof or beam above them (hangLantern checks the block above, so they
// land only once the porches and the arcade are merged in). Interior lanterns stand on the ground course (y 0) of each
// ground floor, one lantern every ~6 cells, so no floor cell falls below light 8. Upper storeys have no floors in the
// plan yet, so they are not lit here (see the part's left list).
import { shrub, courtyardTree, hangLantern } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// a standing lantern at (x, y, z) on a block below it; only into air, never over a built cell
function standLantern(g, x, y, z) {
  if (!g.isAir(x, y, z) || g.isAir(x, y - 1, z)) return 0;
  g.set(x, y, z, ...B.lantern(false));
  return 1;
}

export function build(g) {
  // ---- museum shrubs at the lawn edge (z 18..19), clear of the ramp (x 9..14) ----
  for (const x of [0, 3, 6, 15, 18, 22]) shrub(g, x, 18);

  // ---- courtyard tree in the club's garden centre ----
  courtyardTree(g, 63, 5);

  // ---- porch lanterns: lower under the gallery deck (y 3), upper under the porch roof (y 6) ----
  // museum: posts x 1,5,9,14,18,22 at z 17; deck z 15..16, roof z 15..16
  for (const x of [3, 7, 11, 16, 20]) {
    hangLantern(g, x, 3, 16);
    hangLantern(g, x, 6, 16);
  }
  // barracks: posts x 25,30,34,39,43,48 at z 16; deck z 14..15, roof z 14..15
  for (const x of [27, 32, 36, 41, 45]) {
    hangLantern(g, x, 3, 15);
    hangLantern(g, x, 6, 15);
  }

  // ---- arcade of the club: standing lanterns on the arcade paving in each bay, off the door columns x 56 and x 70 ----
  for (const x of [52, 55, 71, 74]) standLantern(g, x, 1, 19);

  // ---- Visitor Center: lanterns by the front door (on the porch deck), and inside the ground floor ----
  standLantern(g, 84, 1, 7);
  standLantern(g, 88, 1, 7);
  standLantern(g, 83, 1, 3);
  standLantern(g, 89, 1, 3);

  // ---- ground-floor interiors: one lantern per ~6 cells ----
  // museum main block x 1..22, z 8..13
  for (const x of [3, 9, 15, 21]) standLantern(g, x, 1, 10);
  // museum glass pavilion x 3..20, z 2..5
  for (const x of [7, 16]) standLantern(g, x, 1, 4);
  // barracks main block x 25..48, z 7..12
  for (const x of [27, 33, 39, 45]) standLantern(g, x, 1, 9);
  // barracks wings x 25..29 and x 44..48, z 1..5
  standLantern(g, 27, 1, 3);
  standLantern(g, 46, 1, 3);
  // club range x 52..74, z 10..15
  for (const x of [55, 61, 67, 72]) standLantern(g, x, 1, 12);
  // club gable hall x 60..66, z 18..19
  standLantern(g, 61, 1, 18);
  standLantern(g, 65, 1, 18);
  // club wings x 52..56 and x 70..74, z 2..8
  standLantern(g, 54, 1, 5);
  standLantern(g, 72, 1, 5);
}
