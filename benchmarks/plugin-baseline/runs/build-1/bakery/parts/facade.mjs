// Part 4, Front facade dressing: front door and transom, step, shop windows with counters and shutters, upper and attic
// glazing, flower boxes, jetty brackets, Mann braces, the flour-loft hoist, the Bäckerei sign arm and the lanterns under the jetty.
// Only fills the cells part 1 left open (openings, brace cells); every write goes through the vocabulary helpers.
import {
  doorAt, frontStep, shopWindow, glazedWindow, shutterPair, flowerBox, jettyBracket, mannBrace,
  signArm, hangingLantern, HOIST, BARREL,
} from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// the front of the main body: the wall plane z=9, the jetty and its gable face z=8
const WALL_Z = 9;
const JETTY_Z = 8;

export function build(g) {
  // front door, transom and step
  doorAt(g, 11, 2, WALL_Z, "north");
  glazedWindow(g, "x", 11, 11, 4, 4, WALL_Z);
  frontStep(g);

  // shop windows (glass, deepslate breast, spruce counter) and their open shutters on the corner piers.
  // An open trapdoor's panel sits on the edge opposite its facing, so "north" lays it flat against the z=9 wall.
  shopWindow(g, 7, 9);
  shopWindow(g, 13, 15);
  shutterPair(g, 6, 3, 4, JETTY_Z, "north");
  shutterPair(g, 16, 3, 4, JETTY_Z, "north");

  // upper storey glazing (front face, z=8) and attic windows in the gable
  glazedWindow(g, "x", 9, 10, 8, 9, JETTY_Z);
  glazedWindow(g, "x", 12, 13, 8, 9, JETTY_Z);
  glazedWindow(g, "x", 9, 10, 12, 13, JETTY_Z);
  glazedWindow(g, "x", 12, 13, 12, 13, JETTY_Z);

  // flower boxes on the sills of the upper windows
  flowerBox(g, 9, 10, 7);
  flowerBox(g, 12, 13, 7);

  // jetty brackets under the sill beam, and the Mann braces in the outer panels (back toward the nearest corner post)
  for (const x of [6, 8, 11, 14, 16]) jettyBracket(g, x, 5, JETTY_Z, "south");
  mannBrace(g, 7, 8, JETTY_Z, "w");
  mannBrace(g, 15, 8, JETTY_Z, "e");

  // flour-loft hoist: beam along z out past the verge, two chain links, the barrel load, and the loft shutters folded on the gable
  for (let z = HOIST.z0; z <= HOIST.z1; z++) g.set(HOIST.x, HOIST.y, z, ...B.log("stripped_spruce", "z"));
  for (const y of HOIST.chainY) g.set(HOIST.x, y, HOIST.z0, ...B.chain("y"));
  g.set(HOIST.x, HOIST.barrelY, HOIST.z0, BARREL, { facing: "up", open: "false" });
  shutterPair(g, HOIST.x - 1, 15, 16, 7, "north");
  shutterPair(g, HOIST.x + 1, 15, 16, 7, "north");

  // Bäckerei sign arm and the lanterns hung from the sill beam under the jetty
  signArm(g);
  hangingLantern(g, 9, 5, JETTY_Z);
  hangingLantern(g, 13, 5, JETTY_Z);
}
