// room: Outdoor deck, interior designer's room (ring walk).
// The open-air ring on the deck floor (y218) behind the r27 glass rail; only y219..220 is written, inside the box
// [5,219,5,59,222,59]. Layout, from the outside in:
//   r 25  six bench groups of smooth_quartz_stairs (3 wide), each seat facing outward to the view (the stair's back
//         is on the inward side); the focal group is the wider one at the south (180 degrees).
//   r 24  19 lamp posts (white_concrete, a sea lantern on top), flanking the focal group. The walk lane is r 22..23
//         plus the gaps between the posts, so the ring stays open from every exit at r 21.
// Palette only: palette.json has no lantern or fence, so the lamps are sea lanterns on a white post.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const C = 32;                                  // the tower's axis cell
const BENCH_R = 25;                            // bench ring
const LAMP_R = 24;                             // lamp-post ring
const BENCH_HALF = 3.5;                        // degrees: a 3-cell bench
const FOCAL_HALF = 7;                          // degrees: the wider focal group
const BENCHES = [25, 75, 150, 210, 285, 330];  // clockwise from north
const FOCAL = 180;                             // south, flanked by the two posts nearest it
const LAMP_COUNT = 19;                         // about every 8 blocks along r 24

const BOX = [5, 219, 5, 59, 222, 59];
const [X0, Y0, Z0, X1, , Z1] = BOX;

const deg = (a) => ((a % 360) + 360) % 360;
const angDiff = (a, b) => {
  const d = Math.abs(deg(a) - deg(b));
  return Math.min(d, 360 - d);
};
// clockwise-from-north azimuth of a cell, the same convention as plan.md (direction (sin θ, -cos θ))
const azimuth = (dx, dz) => deg((Math.atan2(dx, -dz) * 180) / Math.PI);

// the bench group a cell belongs to, or null
function benchAt(dx, dz) {
  const th = azimuth(dx, dz);
  if (angDiff(th, FOCAL) <= FOCAL_HALF) return true;
  return BENCHES.some((b) => angDiff(th, b) <= BENCH_HALF);
}

// a seat faces outward: its full-height back is on the side toward the tower's axis
function facingIn(dx, dz) {
  if (Math.abs(dx) > Math.abs(dz)) return dx > 0 ? "w" : "e";
  return dz > 0 ? "n" : "s";
}

// lamp posts: LAMP_COUNT evenly spaced cells at r LAMP_R, offset half a step so none sits on an exit's azimuth
function lampCells() {
  const step = 360 / LAMP_COUNT;
  const cells = new Set();
  for (let k = 0; k < LAMP_COUNT; k++) {
    const th = (k + 0.5) * step;
    const rad = (th * Math.PI) / 180;
    const x = Math.round(C + LAMP_R * Math.sin(rad));
    const z = Math.round(C - LAMP_R * Math.cos(rad));
    cells.add(`${x},${z}`);
  }
  return cells;
}

export function build(g) {
  const lamps = lampCells();
  const legend = {
    n: ["smooth_quartz_stairs", { facing: "north", half: "bottom" }],
    s: ["smooth_quartz_stairs", { facing: "south", half: "bottom" }],
    e: ["smooth_quartz_stairs", { facing: "east", half: "bottom" }],
    w: ["smooth_quartz_stairs", { facing: "west", half: "bottom" }],
    P: "white_concrete",
  };
  const lampLegend = { L: "sea_lantern" };

  const rows = [];
  const tops = [];
  for (let z = Z0; z <= Z1; z++) {
    let row = "";
    let top = "";
    for (let x = X0; x <= X1; x++) {
      const dx = x - C;
      const dz = z - C;
      const r = Math.hypot(dx, dz);
      let ch = ".";
      let lt = ".";
      if (r >= BENCH_R - 0.5 && r < BENCH_R + 0.5 && benchAt(dx, dz)) ch = facingIn(dx, dz);
      else if (lamps.has(`${x},${z}`) && r >= LAMP_R - 1 && r <= LAMP_R + 1) {
        ch = "P";
        lt = "L";
      }
      row += ch;
      top += lt;
    }
    rows.push(row);
    tops.push(top);
  }
  layers(g, [X0, Y0, Z0], legend, rows);
  layers(g, [X0, Y0 + 1, Z0], lampLegend, tops);
}
