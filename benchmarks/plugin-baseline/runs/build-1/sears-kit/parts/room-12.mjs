// Room "P1 kitchen" (interior designer's part). Inner air x26..28, z18..20, feet y2 (floor block y1).
// The hearth mouth is at (27,2,21) on the back wall, so the stove run sits along z20 in front of it. The way in is the
// west doorway at x25 (z18..19): the first cells x26 z18..19 stay clear, a 2-high lane runs across to the stove row.
// The table is a fence post in the NE corner with a pressure plate on top; two stair chairs sit at its west and south
// sides. A hanging lantern lights the middle; the lit smoker in front of the hearth is the brightest light.
//
// Not placed: shell-west fills every interior cell of this room with air (y2..4), and runParts locks those cells, so all
// nine furniture writes were refused. No cell in the room is left unclaimed to move them to. The designed layout is kept
// below for when the lock lets room parts furnish (or the shell stops claiming the interior air):
//
//   legend: F furnace(north, lit false)  K smoker(north, lit true)  B barrel  T oak_fence
//           C oak_stairs(west, bottom)   c oak_stairs(south, bottom)  P oak_pressure_plate
//           Q potted_poppy               L lantern(hanging true)
//   layers(g, [26, 2, 18], legend, [
//     [ ".CT", "..c", "FKB" ],     // y2 feet: z18 chair/table post, z19 chair, z20 furnace, smoker, barrel
//     [ "..P", "...", "..Q" ],     // y3: pressure plate on the table post, potted poppy on the barrel
//     [ "...", ".L.", "..." ],     // y4: hanging lantern over the middle of the room
//   ])
export function build(g) {}
