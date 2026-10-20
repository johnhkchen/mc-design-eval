// Interior designer for "West aisle 2F" (room 9): the mezzanine over the food hall. Inner air x6..19, z36..131, y8..13.
// Entered from the north doorway (x12..13, z35). The walking lane is x9..11 (plus x13) down the whole length; the
// furnished band is x6 (market-stall counters against the west wall), x14..16 (small tables with chairs) and x18..19
// (the focal stall, near the atrium edge at x20). Every lamp sits on a block: stall counters, fence posts, table tops.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 6;
const Z0 = 36;
const ROWS = 96; // z36..131
const COLS = 14; // x6..19

const LEGEND = {
  C: "polished_andesite", // stall counter (full block) at y8
  S: "smooth_quartz", // focal stall counter at y8
  F: "oak_fence", // table post and lamp post at y8
  q: ["smooth_quartz_stairs", { facing: "west", half: "bottom" }], // chair west of a table, back to the west
  e: ["smooth_quartz_stairs", { facing: "east", half: "bottom" }], // chair east of a table, back to the east
  T: ["smooth_quartz_slab", { type: "top" }], // table top, y9
  L: ["lantern", { hanging: "false" }], // standing lantern on a counter, post or table top
  H: "shroomlight", // the focal piece's glow, on the focal counter at y9
  M: ["lantern", { hanging: "false" }], // standing lantern on a table top at y10
};

// one layer's rows (z36..131), drawn from the room's repeat: tables every 8 rows, stalls and posts between them
function rowsFor(layer) {
  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    const m = r % 8;
    const cells = Array(COLS).fill(" ");
    const put = (col, ch) => { cells[col] = ch; };
    const focal = r >= 4 && r <= 7; // focal stall, x18..19, z40..43
    if (layer === 0) {
      if (m === 4) put(0, "C");
      if (m === 6) put(6, "F");
      if (focal) { put(12, "S"); put(13, "S"); }
      if (m === 0) { put(8, "q"); put(9, "F"); put(10, "e"); }
    } else if (layer === 1) {
      if (m === 4) put(0, "L");
      if (m === 6) put(6, "L");
      if (r === 4) put(12, "L");
      if (r === 5) put(12, "H");
      if (r === 7) put(13, "L");
      if (m === 0) put(9, "T");
    } else {
      if (m === 0) put(9, "M");
    }
    rows.push(cells.join(""));
  }
  return rows;
}

export function build(g) {
  const layersRows = [rowsFor(0), rowsFor(1), rowsFor(2)];
  layers(g, [X0, 8, Z0], LEGEND, layersRows);
}
