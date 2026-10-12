// ROOM bath 1 (interior designer): hall bathroom, white quartz, windowless. Inner air box [26,2,14,27,4,16]; the
// doorway (25,2..3,15) from the corridor enters the lane at z=15. Footprint is exactly the 2x3 room, so the bath_fit
// fixture runs along the north wall (basin + mirror, WC) and the tub along the south end, with the z=15 row kept clear
// as the walking lane. The windowless room is lit by a sea_lantern set into the ceiling corner above the basin mirror.
import { bath_fit } from "../vocab.mjs";

export function build(g) {
  // basin (cauldron) + mirror (glass_pane) at x=26 z=14; WC (quartz stairs) at x=27 z=14; tub (2 quartz slabs) at z=16
  bath_fit(g, 26, 14);
  // vanity light: on top of the mirror at y=4, the room's top air cell (sits on the mirror, so nothing floats)
  g.set(26, 4, 14, "sea_lantern");
}
