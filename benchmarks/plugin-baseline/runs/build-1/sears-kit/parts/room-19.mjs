// Room "P2 ground bedroom" (interior designer's part): a 3 x 2 bedroom, box [36,2,19,38,4,20]. The bed is the focal
// piece, run north-south at x37: its head (37,2,19) against the partition at z18, its foot (37,2,20) against the south
// window pair. A bed along x cannot fit (the west wall x35 is a window, the east opening x39 is open), and bed() needs
// the two cells past the foot clear, so x37 is the only column that works. The barrel dresser and the standing lantern
// that were meant for the north-west corner (36,2,19 and 36,3,19) are not placed: shell-west owns every interior cell
// as air, and the runParts lock refuses any write into them, so the corner stays bare.
import { bedSet } from "../vocab.mjs";

export function build(g) {
  // the bed: foot at (37,2,20), head at (37,2,19) against the partition at z18
  bedSet(g, [37, 2, 20], "north", "red");
}
