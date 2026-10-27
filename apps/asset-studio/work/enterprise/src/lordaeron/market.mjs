// The Lordaeron market hall for the Merchant's desk: an open arcade on posts at ground level (the Tudor market house),
// the desk in the middle with chests touching it (the town's stock) and room for the Blaze Banker and vendors, a
// stair up to the council room above. Body 10 x 10 (+2 relief). The desk, banker and vendors are the mod's blocks:
// markers, left as air.
import { compose, layoutOf } from "./compose.mjs";

export function marketHall() {
  const markers = [], lockers = [];
  const fitout = ({ put, top }) => {
    const [dx, dz] = [4, 5];                                            // the desk, mid-floor clear of the stair
    put(0, "workstation", [dx, dz]);                                    // an air cell; declared below as the desk marker
    put(0, "chest", [dx, dz - 1]); put(0, "chest", [dx, dz + 1]);      // the stock: chests touching the desk
    put(0, "workstation", [dx - 1, dz]); put(0, "workstation", [dx + 1, dz]);   // banker and a vendor: air, markers
    markers.push({ at: [dx, dz], what: "desk" }, { at: [dx - 1, dz], what: "blaze_banker" }, { at: [dx + 1, dz], what: "vendor" });
    for (const [x, z] of [[1, 7], [2, 7], [7, 7]]) put(0, "cask", [x, z]);
    put(0, "hay", [1, 6]); put(0, "bench", [1, 4], 1, 1); put(0, "bench", [1, 2], 1, 1);
    for (const c of [[2, 3], [6, 5], [3, 7], [7, 3]]) put(0, "lantern", c, top);
    // the council room: a long table, benches, chests and shelves, light
    for (let z = 3; z <= 6; z++) { put(1, "table", [3, z]); put(1, "bench", [2, z], 1, 3); put(1, "bench", [4, z], 1, 1); }
    put(1, "chest", [1, 8]); put(1, "shelf", [1, 1]); put(1, "shelf", [2, 1]); put(1, "shelf", [3, 1]); put(1, "candles", [3, 4], 2);
    for (const c of [[3, 2], [3, 7], [6, 6]]) put(1, "lantern", c, top);
  };
  const L = layoutOf({ W: 10, D: 10, storeys: 2, roof: "gable_x", arcade: true, fitout, door: "right" });
  return { layout: L, grid: compose(L), markers, lockers };
}
