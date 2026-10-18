// Room "P0 upper hall" (interior designer's part): the landing at the top of the stair (top step z18) to the balcony
// French doors on the north wall. Focal piece: a bench of two stairs against the south wall, where the stair lands.
// Supporting: a chest in the north-west corner, a barrel dresser with a poppy pot on the east wall, a coat rack by the
// east door, a potted poppy on the floor, and two lanterns hung down the centre line. Lanes kept clear: the stair
// column x6 z15..17 (to the west bedroom door at x5 z16), x9 z16 (east bedroom door at x10 z16), x7..8 z14 (balcony
// doorway), and x7 z15 linking them.
//
// Nothing is placed yet. Shell-west fills every interior cell of this room with air (84 cells, y6..8, x6..9, z14..20),
// and runParts locks every cell an earlier part set, air included, so all 11 writes listed here were refused. No cell
// inside the room is open to a later part, so the writes were removed rather than moved. The furniture above comes back
// when the shell leaves the room's interior unowned (or runParts lets room parts fill air the shell carved).
// The coat rack's banner (brown_banner) is not in palette.json; it must be swapped if the rack is restored.
export function build(g) {}
