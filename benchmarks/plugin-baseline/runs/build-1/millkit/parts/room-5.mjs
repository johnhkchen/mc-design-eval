// Room: P2 hall (interior designer's part). Inner air x 27..29, y 3..6, z 10..15 (plan.md FLOORS). Entered from the front
// door x29 z9, the partition door x30 z14 (parlour) and the back door x28 z16. The stove at 27,3,13 is P4 Hearths'
// (RESERVED); this room plans around it and never writes that cell.
// Layout: coat rack by the front door (27,10); a barrel and a potted poppy against the west wall; a small table (birch
// fence legs, oak top slab) at 28,12 with three oak stair chairs; a red bed at x27 z14..15 with its head at the back;
// one standing lantern on the table top lights the room. The three doorway first cells (29,10), (29,14), (28,15) stay clear.
import { layers, bed, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // y 3 (floor level): coat rack post, barrel, chairs, table leg, bed is placed by bed()
  layers(g, [27, 3, 10], {
    "R": "birch_fence",
    "b": ["barrel", { facing: "up" }],
    "c": ["oak_stairs", { facing: "north", half: "bottom" }],
    "w": ["oak_stairs", { facing: "west", half: "bottom" }],
    "s": ["oak_stairs", { facing: "south", half: "bottom" }],
    "T": "birch_fence",
  }, [
    ["R..",   // z10: coat rack by the front door, door cell 29,10 kept clear
     "bc.",   // z11: barrel, chair facing the table
     "wT.",   // z12: chair facing east, table leg
     ".s.",   // z13: chair facing north (stove cell 27,13 is P4's)
     "...",   // z14: bed foot (bed() below), partition door cell 29,14 clear
     "..."],  // z15: bed head
  ]);

  // y 4: potted poppy on the barrel, table top slab (top half, sits on the fence leg)
  layers(g, [27, 4, 10], {
    "P": "potted_poppy",
    "t": ["oak_slab", { type: "top" }],
  }, [
    ["...", "P..", ".t.", "...", "...", "..."],
  ]);

  // y 5: standing lantern on the table top face, the room's light
  layers(g, [27, 5, 10], {
    "l": ["lantern", { hanging: "false" }],
  }, [
    ["...", "...", ".l.", "...", "...", "..."],
  ]);

  // coat rack banner on top of the rack post (standing, faces north)
  g.set(27, 4, 10, ...B.banner("black", [], { wall: false, rotation: 8 }));

  // the family bed: foot 27,3,14, head one step south (27,3,15), pillow end at the back wall
  bed(g, [27, 3, 14], "south", "red");
}
