// ROOM bath 2 (interior designer): en-suite for bedroom 2, inside the air box [29,2,14,30,4,16].
// Entry: the doorway (29,2..3,17) from bedroom 2 lands on (29,16). The north row z=14 holds the basin under its mirror
// (29) and the WC (30) against the north partition. The south row z=16 keeps the entry cell (29,16) clear and holds a
// one-cell smooth_quartz tub at (30,16); a lantern on top of the tub at (30,3,16) is the light. The clear cells are
// (29,15), (30,15) and (29,16): every fixture is one step off that lane. The vault above z=14..19 is open, so nothing
// hangs from a ceiling here. bath_fit is not used: its tub fills both south cells and seals the doorway.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // basin (cauldron) under its mirror, on the north row
  g.set(29, 2, 14, "cauldron");
  g.set(29, 3, 14, ...B.pane());

  // WC: quartz stairs with the back to the north wall, seat facing the room (south)
  g.set(30, 2, 14, ...B.stairs("quartz", "south", "bottom"));

  // tub: a one-cell smooth_quartz tub on the south-east corner, clear of the doorway
  g.set(30, 2, 16, ...B.slab("smooth_quartz", "bottom"));

  // the light: a standing lantern on top of the WC, beside the mirror, so the focal basin sits in the brightest light
  g.set(30, 3, 14, ...B.lantern(false));
}
