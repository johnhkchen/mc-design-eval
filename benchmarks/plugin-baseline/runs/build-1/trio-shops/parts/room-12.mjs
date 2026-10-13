// Part: room: H3 loft (ironmonger's attic store: tools and chain). Interior box x 2..12, z 9..23, feet at y 19.
// Two halves: the stair-hall strip x 2..4 (reached by the ladder hatch at (4,18,10)) and the store x 6..12 behind the
// x 5 partition. The partition runs full height through the loft, so the store has no way in yet: see plan.md Notes.
// Anvil bench = focal piece in each half; lanterns hang from the loft ceiling (y 23) at y 22.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Stair-hall strip: x 2..4, z 9..23. Lane x 3 (z 9..15) then x 2 (z 15..19), round the fence at (3,19..16) and the open
// floor at x 4, z 16..19. Hatch cell (4,19,10) and its neighbour (3,19,10) stay clear.
const STRIP = {
  "B": "barrel",
  "C": ["chest", { facing: "east" }],
  "D": ["chest", { facing: "west" }],
  "P": "spruce_planks",
  "A": ["anvil", { facing: "west" }],
};

// Store: x 6..12, z 9..23. Chests and barrels against the x 6 partition and the x 12 end wall; anvil bench in the middle.
const STORE = {
  "B": "barrel",
  "C": ["chest", { facing: "east" }],
  "P": "spruce_planks",
  "A": ["anvil", { facing: "west" }],
};

export function build(g) {
  // feet layer y 19, stair-hall strip (x 2..4), rows z 9..23
  layers(g, [2, 19, 9], STRIP, [
    "B.D", // z 9
    "B..", // z 10 (hatch cell x 4 clear)
    "B..", // z 11
    "B..", // z 12
    "B..", // z 13
    "C..", // z 14
    "...", // z 15
    "...", // z 16
    "...", // z 17
    "...", // z 18
    "...", // z 19
    "B..", // z 20
    "..P", // z 21 bench
    "..P", // z 22 bench
    "B..", // z 23
  ]);
  // anvil on the strip bench, y 20
  layers(g, [2, 20, 9], STRIP, Array.from({ length: 15 }, (_, i) => (i === 12 ? "..A" : "..."))); // z 21

  // store feet layer y 19, x 6..12, rows z 9..23
  layers(g, [6, 19, 9], STORE, [
    "BB.....", // z 9
    "B......", // z 10
    "C......", // z 11
    "C.....B", // z 12
    "C......", // z 13
    ".......", // z 14
    ".......", // z 15
    "...P...", // z 16 bench, anvil above
    ".......", // z 17
    ".......", // z 18
    ".......", // z 19
    ".......", // z 20
    "......B", // z 21
    "......B", // z 22
    ".......", // z 23
  ]);
  // anvil on the store bench, y 20 (the roof comes down to y 20 at x 12 and x 2, so nothing is stacked there)
  layers(g, [6, 20, 9], STORE, Array.from({ length: 15 }, (_, i) => (i === 7 ? "...A..." : "......."))); // z 16
  // standing lanterns on the floor (y 19, on the loft floor at y 18): nothing hangs, the loft has no ceiling block yet
  layers(g, [4, 19, 14], { "L": ["lantern", { hanging: "false" }] }, ["L"]); // strip, x 4 z 14
  layers(g, [7, 19, 12], { "L": ["lantern", { hanging: "false" }] }, ["L"]); // store, x 7 z 12
  layers(g, [11, 19, 18], { "L": ["lantern", { hanging: "false" }] }, ["L"]); // store, x 11 z 18
  layers(g, [2, 19, 22], { "L": ["lantern", { hanging: "false" }] }, ["L"]); // strip, x 2 z 22 (lane stays on x 3)
  layers(g, [7, 19, 10], { "L": ["lantern", { hanging: "false" }] }, ["L"]); // store, x 7 z 10 (corner by the barrels)
}
