// Part: room: Vestibule (parts/room-1.mjs). Interior designer and lamplighter for the inner porch behind the main door.
// Inner air x19..21, z11..13, walkable y4..9. The entrance is the front door at x20 z10 and the archway to the hall at
// x19..20 z14; the ladder to the clock room stands at x21 z13 (the shell's), so that cell stays clear.
// Layout: a dark oak bench (two stairs, backs to the west wall) faces a lectern under a notice board on the east wall.
// A red carpet runs from the door to the archway, the lane kept clear. One hanging lantern from the ceiling at y10.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // origin [19, 4, 11]: rows run along +x (x19..21), successive rows along +z (z11..13)
  layers(g, [19, 4, 11], {
    b: B.stairs("dark_oak", "west"), // bench seats, backs on the west wall
    r: "red_carpet", // the runner from the door to the archway
    l: ["lectern", { facing: "west" }], // the notice lectern, read from the west
  }, [
    ["br.", "brl", "rr."], // y4: z11, z12, z13
  ]);

  // the notice board on the east wall, above the lectern
  g.set(21, 6, 12, ...B.sign("dark_oak", ["NOTICES", "Council", "Tue 10-4", ""], { wall: true, facing: "west" }));

  // one hanging lantern from the ceiling block at y10
  g.set(20, 9, 12, ...B.lantern(true));
}
