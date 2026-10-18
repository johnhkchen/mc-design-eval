// Room "P2 living and dining" (interior designer's part): Craftsman great room. Inner air x36..43, z14..17 (the stair
// joiner's flight runs up x44 and is not touched). The hearth (36,2,17) is Part 6's campfire, so its cell stays as is.
// Focal piece: the hearth, with a spruce settle (stair chairs) facing it across a carpet rug. Dining set east: oak fence
// table at (41,15), top slab on it, stair chairs north and south of it. Barrels with a pot on the east wall. Lanterns:
// two hanging from the ceiling over the lane and the rug, one standing on the table. The lane x40, z14..17 stays clear.
//
// HELD BACK: "shell west" fills the whole interior of this house with air (shell-west.mjs, its interior fill), and runParts
// refuses any write into a cell an earlier part claimed, air included. Every cell of this room (x36..43, z14..17, y2..4) is
// claimed, so nothing below can be placed and this part places nothing. The layout is kept commented out, to restore once
// the shell stops claiming the interior (the import and the call go back together).
//
// import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Lamplighter's pass, held with the layout: two hanging lanterns from the upper floor's block layer (y5). Measured
// with `mcd room --only "P2 living and dining"` on a build where they were written: min 8, 0 dim, 0 dark (the hearth alone
// leaves min 4 with 20 dim cells). Not written yet: the same lock as the furniture refuses them (shell west claims the
// interior air). Restore with the layout, after the shell releases the room.
//
// export function build(g) {
//   for (const [x, y, z] of [[39, 4, 15], [42, 4, 17]]) g.set(x, y, z, "lantern", { hanging: "true" });
// }

export function build(g) {}

// export function build(g) {
//   // y2 (feet): settle, rug, table post, stair chairs, barrels
//   // y3: pot on the barrel, table top slab
//   // y4: hanging lanterns and the table lantern
//   layers(g, [36, 2, 14], {
//     "n": ["oak_stairs", { facing: "north", half: "bottom" }],
//     "s": ["oak_stairs", { facing: "south", half: "bottom" }],
//     "S": ["spruce_stairs", { facing: "north", half: "bottom" }],
//     "C": "white_carpet",
//     "T": "oak_fence",
//     "B": "barrel",
//     "H": ["oak_slab", { type: "top" }],
//     "P": "flower_pot",
//     "L": ["lantern", { hanging: "true" }],
//     "M": ["lantern", { hanging: "false" }],
//   }, [
//     [
//       ".....n.B",
//       "SS...T.B",
//       ".CC..s..",
//       ".CC.....",
//     ],
//     [
//       ".......P",
//       ".....H..",
//       "........",
//       "........",
//     ],
//     [
//       "........",
//       "...L.M..",
//       "........",
//       "......L.",
//     ],
//   ]);
// }
