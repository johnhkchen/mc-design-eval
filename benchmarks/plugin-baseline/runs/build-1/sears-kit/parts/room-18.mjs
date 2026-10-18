// Room "P2 kitchen" (interior designer's part): inner air x39..43, z19..20, feet y2 (floor block layer y1, ceiling y5).
// The kitchen is entered from the north at the doorway (40,2..3,18) and leaves by the back door (40,2..3,21); the
// lane x40 z19..20 stays clear between them. The focal piece is the lit stove run on the north wall, facing the
// doorway: smoker, furnace and a cauldron sink. The back-wall window (x42..43) lights the table, a stair chair and a
// pantry barrel. Lanterns hang from the ceiling block at y5.
// Nothing is placed here yet: the shell already built every interior cell (y2..4) as air, and runParts locks those
// cells, so the stove run, table, chair, barrel, pot and lantern were all refused. The furniture needs the shell to
// leave the kitchen interior unowned (shell-west.mjs house() carves it as air); until then this part adds nothing.

// LAMPLIGHTER, HELD BACK: the light check (mcd room, 2026-10-17) reports 0 dark cells and 10 dim (4..6); the lift to 8+
// is one standing lantern at (39,2,20) against the west wall. runParts refuses it ("REFUSED 1 ... 39,2,20 lantern air")
// because shell-west claims the kitchen's air. Restore once the shell stops claiming the interior (as room-17 does):
//
// import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
// export function build(g) {
//   g.set(39, 2, 20, ...B.lantern(false));   // standing lantern on the floor, against the west wall
// }

export function build(g) {
}
