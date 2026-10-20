// Part 2, obelisk (plan.md PARTS 2, elements 2-9), revised on the owner's comment (v2): one clean 7x7 prism from the plaza
// to the pyramidion, smooth quartz to y 24 and ONE block (smooth sandstone) above the crisp colour line at y 24/25; the
// taper is only the four corner columns clipped from y 41 (36 above the plaza), never a ledge. The shaft runs to y 71 and
// the pyramidion is one stair course per step in (7, 5, 3: smooth 45-degree faces) to a single apex block at y 75 and a
// one-chain dark tip at y 76 (71 above the plaza); windows y 69 and red lights y 70 in the 7-wide faces just under it;
// warm froglights flush in the plaza ring round the base.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { OBELISK, OBELISK_LOWER_TOP, PLAZA_Y } from "../vocab/base.mjs";

const UPPER = "smooth_sandstone";
const CHAMFER_Y = 41;   // corner columns clipped from here up
const SHAFT_TOP = 71;   // pyramidion y 72..75, tip y 76
const WINDOW_Y = SHAFT_TOP - 2, LIGHT_Y = SHAFT_TOP - 1;

// Stairs on the ring of half-width h round (50, 50) at y, facing in, corners as outer corners; clip drops the corners.
function stairRing(g, y, h, clip = false) {
  for (let x = 50 - h; x <= 50 + h; x++) for (let z = 50 - h; z <= 50 + h; z++) {
    const ex = Math.abs(x - 50) === h, ez = Math.abs(z - 50) === h;
    if (!ex && !ez) continue;
    if (ex && ez) {
      if (clip) continue;
      // outer corner: facing along z (north row faces south), shape turns toward the x side
      const facing = z < 50 ? "south" : "north";
      const shape = (z < 50) === (x < 50) ? "outer_left" : "outer_right";
      g.set(x, y, z, ...B.stairs(UPPER, facing, "bottom", shape));
    } else if (ez) g.set(x, y, z, ...B.stairs(UPPER, z < 50 ? "south" : "north"));
    else g.set(x, y, z, ...B.stairs(UPPER, x < 50 ? "east" : "west"));
  }
}
const square = (g, y, h, block) => { for (let x = 50 - h; x <= 50 + h; x++) for (let z = 50 - h; z <= 50 + h; z++) g.set(x, y, z, block); };

export function build(g) {
  const { x0, x1, z0, z1 } = OBELISK;   // 47..53

  // Warm floodlights flush in the plaza ring that touches the shaft (the pavilion's foot on the east is left alone).
  for (const [x, z] of [[46, 46], [48, 46], [50, 46], [52, 46], [54, 46], [46, 48], [46, 50], [46, 52], [46, 54],
    [48, 54], [50, 54], [52, 54], [54, 54], [54, 48]]) g.set(x, PLAZA_Y, z, "ochre_froglight");

  // The shaft: one 7x7 prism, y 6..71; corner columns clipped from CHAMFER_Y.
  for (let y = PLAZA_Y + 1; y <= SHAFT_TOP; y++) {
    const block = y <= OBELISK_LOWER_TOP ? "smooth_quartz" : UPPER;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
      if (corner && y >= CHAMFER_Y) continue;
      let b = block;
      const onFace = x === x0 || x === x1 || z === z0 || z === z1;
      const off = Math.abs(x - 50) + Math.abs(z - 50) - 3;   // 0 = face centre, 1 = beside it
      if (onFace && y === WINDOW_Y && off === 1 && !corner) b = "tinted_glass";
      if (onFace && y === LIGHT_Y && off === 0) b = "red_stained_glass";
      // glowstone directly behind each red light
      if (!onFace && y === LIGHT_Y && Math.abs(x - 50) + Math.abs(z - 50) === 2 && (x === 50 || z === 50)) b = "glowstone";
      g.set(x, y, z, b);
    }
  }

  // Pyramidion, y 72..75: one stair ring per course (the 7-ring keeps the clipped corners), a single apex block, chain tip.
  const y = SHAFT_TOP + 1;
  stairRing(g, y, 3, true); square(g, y, 2, UPPER);
  stairRing(g, y + 1, 2); square(g, y + 1, 1, UPPER);
  stairRing(g, y + 2, 1); g.set(50, y + 2, 50, UPPER);
  g.set(50, y + 3, 50, UPPER);
  g.set(50, y + 4, 50, ...B.chain("y", false));
}
