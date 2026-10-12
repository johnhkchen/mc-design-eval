// Part 6, Sides, back and wing details (plan.md FACADES: west, east and back faces; wing north, east faces; lanterns).
// Fills only the openings and braces that part 1 (shell) left unset. Every write goes through the vocabulary helpers,
// which write into air only, so a refused cell is a cell part 1 already filled and is reported by runParts.
import { glazedWindow, shutterPair, doorAt, mannBrace, hangingLantern } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // West face (x=6): ground windows with open shutters on x=5 (flat against the wall, facing east); upper windows.
  glazedWindow(g, "z", 11, 12, 3, 4, 6);
  glazedWindow(g, "z", 17, 18, 3, 4, 6);
  shutterPair(g, 5, 3, 4, 10, "east");
  shutterPair(g, 5, 3, 4, 13, "east");
  shutterPair(g, 5, 3, 4, 16, "east");
  shutterPair(g, 5, 3, 4, 19, "east");
  glazedWindow(g, "z", 11, 12, 8, 9, 6);
  glazedWindow(g, "z", 16, 17, 8, 9, 6);
  // Single upper panels (z=9, 14, 19, 21) get one upside-down brace, toward the nearest post.
  mannBrace(g, 6, 8, 9, "n");
  mannBrace(g, 6, 8, 14, "n");
  mannBrace(g, 6, 8, 19, "n");
  mannBrace(g, 6, 8, 21, "s");

  // East face (x=16): the ground window shows only z=9..12; upper windows and the same braces.
  glazedWindow(g, "z", 10, 11, 3, 4, 16);
  glazedWindow(g, "z", 11, 12, 8, 9, 16);
  glazedWindow(g, "z", 16, 17, 8, 9, 16);
  mannBrace(g, 16, 8, 9, "n");
  mannBrace(g, 16, 8, 14, "n");
  mannBrace(g, 16, 8, 19, "n");
  mannBrace(g, 16, 8, 21, "s");

  // Back face (z=22): back door facing out (south), ground window, upper windows, attic window.
  doorAt(g, 8, 2, 22, "south");
  glazedWindow(g, "x", 13, 14, 3, 4, 22);
  glazedWindow(g, "x", 9, 10, 8, 9, 22);
  glazedWindow(g, "x", 12, 13, 8, 9, 22);
  glazedWindow(g, "x", 11, 11, 15, 16, 22);
  // Lantern by the back door: no solid block above it on the yard side, so it stands on the ground block.
  g.set(7, 1, 23, ...B.lantern(false));

  // Bakehouse wing, north gable end (z=13): window, shutters on z=12 flat against the wall. The vent flap at (19,7,13)
  // is part 1's white_wool gable cell, so it is not placed here (earlier parts are locked).
  glazedWindow(g, "x", 19, 19, 3, 4, 13);
  shutterPair(g, 18, 3, 4, 12, "south", { second: 20 });

  // Bakehouse wing, east face (x=21): side door facing out, two windows.
  doorAt(g, 21, 2, 17, "east");
  glazedWindow(g, "z", 15, 15, 3, 4, 21);
  glazedWindow(g, "z", 20, 20, 3, 4, 21);
  // Lantern by the wing door, hanging from the wing's eave course at (22,6,17).
  hangingLantern(g, 22, 5, 17);
}
