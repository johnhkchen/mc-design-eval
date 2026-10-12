// Part: Grounds (parts/grounds.mjs). The street and sidewalk, the forecourt and front steps, the lamp posts and flagpoles,
// the rear steps, gravel path and back gate, the two garden oaks, and the door lanterns on the porch. The grass top is
// already laid by build.mjs, so the ground course is overwritten here (it is not locked: it predates every part).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  ANDESITE, GRAVEL, SMOOTH_STONE, STONE_BRICKS, COARSE_DIRT, DARK_OAK_FENCE_GATE, frontSteps, flagpole, lampPost, oakTree,
} from "../vocab.mjs";

export function build(g) {
  // ---- street and sidewalk, laid in the ground course (y 0) ------------------------------------------------------
  g.fill([0, 0, 0], [40, 0, 1], ANDESITE); // road surface, z 0..1
  g.fill([0, 0, 2], [40, 0, 2], GRAVEL); // kerb, z 2
  g.fill([0, 0, 3], [40, 0, 3], SMOOTH_STONE); // sidewalk, z 3

  // ---- forecourt paving and front steps (x 15..25, z 4..5) ------------------------------------------------------
  g.fill([15, 0, 4], [25, 0, 5], STONE_BRICKS);
  frontSteps(g, 16, 24, 4, 1, "south"); // treads at z4 y1 and z5 y2, facing south
  g.fill([16, 1, 5], [24, 1, 5], STONE_BRICKS); // the z5 tread's support under it

  // Coarse-dirt patches on the lawns by the flagpoles and under the garden oaks (ground in patches, not one block).
  g.fill([5, 0, 4], [6, 0, 5], COARSE_DIRT);
  g.fill([34, 0, 4], [35, 0, 5], COARSE_DIRT);

  // ---- lamp posts and flagpoles ----------------------------------------------------------------------------------
  lampPost(g, { x: 14, z: 4, y: 1 });
  lampPost(g, { x: 26, z: 4, y: 1 });
  lampPost(g, { x: 2, z: 3, y: 1 });
  lampPost(g, { x: 38, z: 3, y: 1 });
  // the side lawns and the rear garden are otherwise dark (light 0 where the lamps do not reach): posts down each side
  // and across the garden, the garden's two at z35 clear of the oak crowns
  for (const z of [13, 23]) for (const x of [2, 38]) lampPost(g, { x, z, y: 1 });
  for (const x of [3, 13, 25, 37]) lampPost(g, { x, z: 31, y: 1 });
  for (const x of [13, 25]) lampPost(g, { x, z: 35, y: 1 });
  flagpole(g, 7, 6, { base: 1, top: 10 });
  flagpole(g, 33, 6, { base: 1, top: 10 });

  // ---- door lanterns: standing on dark oak fence posts either side of the porch door, x 18 and x 22, z 9 ---------
  for (const x of [18, 22]) {
    for (let y = 4; y <= 6; y++) g.set(x, y, 9, ...B.fence("dark_oak"));
    g.set(x, 7, 9, ...B.lantern(false));
  }

  // ---- rear steps: landing z27 (solid to y3), treads z28 y2 and z29 y1, both facing north (down toward the garden) ----
  g.fill([19, 1, 27], [21, 3, 27], STONE_BRICKS); // landing
  g.fill([19, 1, 28], [21, 1, 28], STONE_BRICKS); // the z28 tread's support
  for (const x of [19, 20, 21]) {
    g.set(x, 2, 28, ...B.stairs("stone_brick", "north", "bottom"));
    g.set(x, 1, 29, ...B.stairs("stone_brick", "north", "bottom"));
  }

  // ---- rear garden: gravel path x 19..21, z 30..36, to a back gate at z 36 with posts either side ---------------------
  g.fill([19, 0, 30], [21, 0, 36], GRAVEL);
  g.set(19, 1, 36, ...B.fence("dark_oak"));
  g.set(21, 1, 36, ...B.fence("dark_oak"));
  g.set(20, 1, 36, DARK_OAK_FENCE_GATE, { facing: "south", open: "false", in_wall: "false", powered: "false" });

  // ---- garden oaks: trunk x 8 and x 32 at z 32, crowns of persistent leaves ----------------------------------------
  oakTree(g, 8, 32, 1);
  oakTree(g, 32, 32, 1);
}
