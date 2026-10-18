import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Room "P0 dining room" (interior designer's part). Box x10..12, z14..17, floor layer y1, feet at y2.
// Currently places nothing: shell west fills this room's whole interior with air at y2..8 (house() in shell-west.mjs),
// and runParts locks air too, so every furniture write here was REFUSED. The design is kept below, commented out, for
// when the interior is open to room parts again (see the note at the bottom).
//
// The focal piece is a long table along x11 (z14..16): oak fence posts with top slabs, three stair chairs on the
// window side (x12), a barrel sideboard with a potted poppy in the north-west corner (x10, z14). One hanging lantern
// and two candles sit over the table. Lanes stay clear: x10 z15..17 from the west opening, x11 z17 to the kitchen
// door, and x12 z17 in front of the hearth mouth at (13,2,17).

export function build(g) {
  // (design, not placed) feet level y2: the sideboard, the table posts and the chairs
  //   layers(g, [10, 2, 14], {
  //     B: ["barrel", { facing: "up", open: "false" }],
  //     T: "oak_fence",
  //     C: ["oak_stairs", { facing: "east", half: "bottom" }],
  //   }, ["BTC", ".TC", ".TC", "..."]);
  //
  // (design, not placed) y3: the table top (top slabs on the posts) and the pot on the sideboard
  //   layers(g, [10, 3, 14], {
  //     P: "potted_poppy",
  //     S: ["oak_slab", { type: "top" }],
  //   }, ["PS.", ".S.", ".S.", "..."]);
  //
  // (design, not placed) y4: candles on the table, a lantern hanging from the upper floor's ceiling over its middle
  //   layers(g, [10, 4, 14], {
  //     k: ["candle", { candles: "1", lit: "true" }],
  //     L: ["lantern", { hanging: "true" }],
  //   }, [".k.", ".L.", ".k.", "..."]);
  //
  // Restoring it: the room's cells must be free of the shell's air fill (shell-west house() interior, y2..top), or the
  // shell must leave air unlocked for room parts. Then uncomment the three layers() calls and add the import
  // `import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";` at the top.

  // Lighting (lamplighter): one hanging lantern on the table's centre line, x11 z15, under the upper floor's solid
  // ceiling at y5 (dark oak planks). The two candles over the table wait for the table top at y3; that top is not
  // built, so a candle at y4 would hang in air.
  g.set(11, 4, 15, ...B.lantern(true));
}
