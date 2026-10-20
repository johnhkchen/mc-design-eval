// Interior designer for "Galleria east arm" (room 20): x 170..197, y 1..5. z 123 is the arm's south wall (base y1, glass
// above, the south doors at x 184..187), so the interior is z 121..122. The north row (z 121) holds the benches (stairs
// as seats), a counter, and a focal glass column at the east end; the lane (z 122) from the galleria hall (west) to the
// east end stays open, and the south door cells x 184..187 stay clear. Palette-only blocks (palette.json).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 170;
const Z0 = 121;
const LEN = 28;

// one row of LEN cells from a sparse spec: { index: char }, everything else '.'
function row(spec) {
  const r = Array(LEN).fill(".");
  for (const [i, c] of Object.entries(spec)) r[Number(i)] = c;
  return r.join("");
}

// y1: floor furniture at z 121 (row 0); z 122 (row 1) is the open lane.
const floor1 = [
  row({
    ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((i) => [i, "S"])), // bench of seats
    ...Object.fromEntries([8, 9, 10, 11, 12, 13].map((i) => [i, "C"])), // counter plinth
    ...Object.fromEntries([19, 20, 21].map((i) => [i, "S"])), // second bench
    24: "G", // focal column, base
    0: "l", // lamps on the floor at the west end, the lane kept clear
    22: "l", // lifts the dim cells west and by the focal
  }),
  row({}),
];

// y2: things standing on the floor furniture
const floor2 = [
  row({ 9: "l", 12: "l", 24: "R" }), // lanterns on the counter, focal red glass
  row({}),
];

// y3..y4: the focal column's top
const floor3 = [row({ 24: "Y" }), row({})];
const floor4 = [row({ 24: "E" }), row({})];

const legend = {
  S: ["smooth_quartz_stairs", { facing: "south", half: "bottom" }],
  C: "polished_andesite",
  G: "orange_stained_glass",
  R: "red_stained_glass",
  Y: "yellow_stained_glass",
  E: ["end_rod", { facing: "up" }],
  l: ["lantern", { hanging: "false" }],
};

export function build(g) {
  layers(g, [X0, 1, Z0], legend, floor1);
  layers(g, [X0, 2, Z0], legend, floor2);
  layers(g, [X0, 3, Z0], legend, floor3);
  layers(g, [X0, 4, Z0], legend, floor4);
}
