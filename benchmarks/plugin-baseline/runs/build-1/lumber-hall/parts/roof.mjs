// Part 4, Slate roof: roof.json (granary, slate, footprint 2,3,21,34;21,3,40,34, y 24, keep the gable cells and the
// ridge notches) is laid by runParts right after the shell, so this part only adds the ridge monitor vents. roof.json
// keeps the ridge cells x 11..12 and x 30..31, y 33..35, z 8..29 open (its `keep`), so each vent is built into air
// where the ridge would be, and the roof's own monitor is off (its louvres are spruce; the vent is dark oak).
import { monitorVent } from "../vocab.mjs";

// the two ridges: twin columns at the middle of each gable roof (plan HOIST_X line)
const RIDGES = [[11, 12], [30, 31]];
// the vent runs along the ridge, clear of the eaves at each end
const VENT_Y = 33, VENT_Z0 = 8, VENT_Z1 = 29;
// a solid core under each vent (y 32), so it stands on the roof's slope and not in air
const CORE_Y = 32;

export function build(g) {
  for (const [x0, x1] of RIDGES) {
    for (let x = x0; x <= x1; x++) for (let z = VENT_Z0; z <= VENT_Z1; z++) g.set(x, CORE_Y, z, "cobbled_deepslate");
    monitorVent(g, x0, x1, VENT_Y, VENT_Z0, VENT_Z1);
  }
}
