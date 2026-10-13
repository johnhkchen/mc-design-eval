// Stairs (part 2): the stair wells of A (x9..10), B (x12..13) and C (x20..21), z20..23, plus the attic ladders.
// Each well holds one four-riser flight per floor it climbs (A and C: floors 7 and 12; B: 7, 12 and 17). A flight
// rises south along the room-side column xr; the hole in the floor sits on the party-wall column xh. Its top riser
// stands at floor level in the hole, and the walker steps off away from the party wall onto the solid floor of the
// room, one block up. Stringers of planks stand under each riser that has hole or room air beneath it, and a fence
// runs along the hole side with a gap at the top step.
import { stairFlight, atticLadder } from "../vocab.mjs";

const WOOD = "spruce";
const STRINGER = "spruce_planks";
const Z0 = 20;

// One flight from floor surface floorY-4 up to the hole's top cell at floorY (the room floor, one block up, lies beyond).
function flight(g, { xr, xh, floorY }) {
  stairFlight(g, xr, Z0, floorY, WOOD);
  for (let i = 0; i < 4; i++) {
    const y = floorY - 4 + i, z = Z0 + i;
    // A riser at y=3 stands on the shell's ground floor (y=2); every higher riser needs a stringer under it.
    if (y - 1 >= 3) g.set(xr, y - 1, z, STRINGER);
    // Rail on the hole side, one above each riser, not at the top step (the gap to step off).
    if (i < 3) g.set(xh, y + 1, z, `${WOOD}_fence`, { north: "true", south: "true", east: "false", west: "false" });
  }
}

export function build(g) {
  // A: room side west of the well, exit west at each top step.
  flight(g, { xr: 9, xh: 10, floorY: 7 });
  flight(g, { xr: 9, xh: 10, floorY: 12 });
  // B: room side east of the well, exit east.
  flight(g, { xr: 13, xh: 12, floorY: 7 });
  flight(g, { xr: 13, xh: 12, floorY: 12 });
  flight(g, { xr: 13, xh: 12, floorY: 17 });
  // C: mirror of A about x=15.
  flight(g, { xr: 21, xh: 20, floorY: 7 });
  flight(g, { xr: 21, xh: 20, floorY: 12 });
  // Attic ladders on the outer walls, facing away from them: from the second-floor room (y13) up through the hatch in
  // the attic floor (y17, left open by the shell) to the attic (y18..20).
  atticLadder(g, 4, 23, "east", { y0: 13, y1: 20 });
  atticLadder(g, 26, 23, "west", { y0: 13, y1: 20 });
  // The ladders above y=18 hang on the mansard's west face at x=3 (and east at x=27), which is open there: a block of
  // the mansard's own stone stands behind each ladder cell so it does not pop off.
  for (const y of [19, 20]) {
    g.set(3, y, 23, "polished_blackstone_bricks");
    g.set(27, y, 23, "polished_blackstone_bricks");
  }
}
