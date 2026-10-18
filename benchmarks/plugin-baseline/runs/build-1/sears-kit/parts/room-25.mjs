// Room "P3 kitchen" (interior designer's part): the kitchen is 3 x 2 cells (x58..60, z19..20), feet at y2. The front
// door (59,18) and the back door (58,21) both open onto a clear first cell, so (59,19) and (58,20) stay bare, and the
// only lane between them runs through (59,20).
//
// The furniture is NOT placed. Every cell of this room (x58..60, y2..4, z19..20) was already written as air by
// "shell west (plots 0-3)", and runParts locks air too, so the stove, barrel counter, potted poppy and hanging lantern
// were all refused. No cell here is free to move them to. Intended layout, to restore once the room may fit out
// the shell's interior air (or the shell leaves these cells unbuilt):
//   y2 (feet): x58 z19 barrel counter (facing up, open), x60 z19 smoker (facing west, lit), x60 z20 furnace (facing west, lit)
//   y3:        x58 z19 potted poppy on the barrel lid
//   y4:        x58 z19 lantern hanging (hanging true) over the barrel counter
export function build(g) {}
