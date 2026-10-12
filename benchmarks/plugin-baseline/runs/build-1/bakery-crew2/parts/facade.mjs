// Part 4, Front facade dressing: the street face of the bakery (z=8/9, north). Front door and transom, the step, the two
// shop windows with their counters and shutters, the upper and attic glazing, the flower boxes, the jetty brackets, the
// Mann braces, the flour-loft hoist with its shutters, the Bäckerei sign arm and the lanterns under the jetty. It writes
// only into air: the shell (part 1) left every opening unset, so each window, door and bracket fills its own cells.
import {
  doorAt, glazedWindow, frontStep, shopWindow, shutterPair, flowerBox, jettyBracket, mannBrace,
  hoistAssembly, signArm, hangingLantern,
} from "../vocab.mjs";

export function build(g) {
  // ---- ground storey: door, transom, step
  doorAt(g, 11, 2, 9, "north");
  glazedWindow(g, "x", 11, 11, 4, 4, 9);
  frontStep(g, 11, 1, 8, "south");

  // ---- shop windows: breast, glass, counter slab on the street side; shutters flat on z=8 beside each window
  shopWindow(g, 7, 9, 2, 9);
  shopWindow(g, 13, 15, 2, 9);
  shutterPair(g, 6, 3, 4, 8, "south");
  shutterPair(g, 16, 3, 4, 8, "south");

  // ---- jettied upper storey: brackets under the sill (one per post), Mann braces in the two plain panels
  for (const x of [6, 8, 11, 14, 16]) jettyBracket(g, x, 5, 8, "south");
  mannBrace(g, 7, 8, 8, "w");
  mannBrace(g, 15, 8, 8, "e");
  glazedWindow(g, "x", 9, 10, 8, 9, 8);
  glazedWindow(g, "x", 12, 13, 8, 9, 8);

  // ---- flower boxes under the upper windows
  flowerBox(g, 9, 10, 7);
  flowerBox(g, 12, 13, 7);

  // ---- front gable: attic windows, then the flour-loft hoist (beam, chain, barrel, shutters open at x=10 and 12)
  glazedWindow(g, "x", 9, 10, 12, 13, 8);
  glazedWindow(g, "x", 12, 13, 12, 13, 8);
  hoistAssembly(g, 11, 19, 8);

  // ---- sign arm over the street by the jetty corner, and the lanterns hung from the sill beam under the jetty
  signArm(g, 16, 7, 7, { text: "Bäckerei", rotation: 4 });
  hangingLantern(g, 9, 5, 8);
  hangingLantern(g, 13, 5, 8);
}
