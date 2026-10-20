// Part: stairs and ladders (stair joiner). The shell's rooms are all reachable already (walk: ok, arcade walk, entrance
// hall, nave, bay hall at floor level y 1). Only the tower needs a way up: a ladder at x 18, z 8 on the shaft's inner west
// wall (x 17), y 33..69, facing east. The tower part builds the wall x 17 and the decks (cut 1x1 at x18 z8 for the ladder).
export function build(g) {
  for (let y = 33; y <= 69; y++) g.set(18, y, 8, "ladder", { facing: "east" });
}
