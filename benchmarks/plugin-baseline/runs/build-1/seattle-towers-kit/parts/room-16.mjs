// Room 16, Aperture shops (interior designer): a row of five shops behind the glass bays. Inner air x 203..246, z 4..14,
// y 1..6, entered through the shop doors on the front (z 2/3). Palette only (palette.json has no shop fittings): birch
// planks are the counters and shelving, lanterns stand on the counters for light. Lanes: z 4..8 is the clear front
// lane from every door; gaps in the counter row (x 213..216, 223..226, 233..236, 243..246) let a player walk back to
// the shelf wall at z 14. The focal counter is the middle one (x 227..232), on the axis of the central door.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 203, X1 = 246, Z0 = 4, Z1 = 14, Y0 = 1;

// One text row along x for a given z: f(x) gives the character of each cell.
const row = (f) => {
  let s = "";
  for (let x = X0; x <= X1; x++) s += f(x);
  return s;
};
const inSegs = (x, segs) => segs.some(([a, b]) => x >= a && x <= b);

// z 9..10: the counter row, four shop counters (x 207..212, 217..222, 227..232 focal, 237..242).
const COUNTERS = [[207, 212], [217, 222], [227, 232], [237, 242]];
// z 14: the shelf wall against the back, one block high (no second layer, so the walk checker sees no ledge).
const SHELVES = [[204, 209], [214, 219], [224, 229], [234, 239], [244, 245]];
// Standing lanterns on the counter tops: one per counter, two over the focal counter.
const LANTERNS = [209, 219, 229, 231, 239];
// Standing lanterns on the floor in the back zone (z 12), lifting the dim corners.
const LOW_LANTERNS = [207, 217, 227, 237, 245];

const layerY1 = [];
const layerY2 = [];
for (let z = Z0; z <= Z1; z++) {
  if (z === 9 || z === 10) {
    layerY1.push(row((x) => (inSegs(x, COUNTERS) ? "C" : ".")));
    layerY2.push(row((x) => (z === 9 && LANTERNS.includes(x) ? "L" : ".")));
  } else if (z === 14) {
    layerY1.push(row((x) => (inSegs(x, SHELVES) ? "C" : ".")));
    layerY2.push(row(() => "."));
  } else if (z === 12) {
    // Floor lanterns in the back zone, between the shelf wall and the counters.
    layerY1.push(row((x) => (LOW_LANTERNS.includes(x) ? "L" : ".")));
    layerY2.push(row(() => "."));
  } else {
    layerY1.push(row(() => "."));
    layerY2.push(row(() => "."));
  }
}

const LEGEND = {
  C: "birch_planks",
  L: ["lantern", { hanging: "false" }],
};

export function build(g) {
  layers(g, [X0, Y0, Z0], LEGEND, [layerY1, layerY2]);
}
