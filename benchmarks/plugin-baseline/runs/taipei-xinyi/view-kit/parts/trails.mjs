// Trails, sign and lamps (plan PARTS 4): one continuous stone-step trail from the north edge up to the deck, along the
// deck's east side, south-east to the plot's south edge; the cleft spur; the trail sign; the lantern posts.
// The trail follows the GROUND map (bilinear between cell centres), one block of rise per step at most, never buried.
import { GROUND, LANTERN_POSTS, TRAIL, onTrail } from "../vocab/base.mjs";
import { trailRun, lampPost } from "../vocab/h1.mjs";
import { trailSign } from "../vocab/h2.mjs";

// Ground height at (x, z), bilinear between cell centres (3c+1, 3r+1); centres keep their exact value
function groundAt(x, z) {
  const rows = GROUND.length, cols = GROUND[0].length;
  const fc = Math.min(cols - 1, Math.max(0, (x - 1) / 3));
  const fr = Math.min(rows - 1, Math.max(0, (z - 1) / 3));
  const c0 = Math.floor(fc), r0 = Math.floor(fr);
  const c1 = Math.min(cols - 1, c0 + 1), r1 = Math.min(rows - 1, r0 + 1);
  const tx = fc - c0, tz = fr - r0;
  const top = GROUND[r0][c0] * (1 - tx) + GROUND[r0][c1] * tx;
  const bot = GROUND[r1][c0] * (1 - tx) + GROUND[r1][c1] * tx;
  return top * (1 - tz) + bot * tz;
}

// Trail centre points [x, y, z] in travel order. Lower: x 67..68 (centre 68) north to south, to z 43. East: z 42..43
// (centre 43) to x 78..79. South: x 78..79 (centre 79) to z 74. Diagonal: a stepped band to (96..97, 100).
function trailPath() {
  const pts = [];
  for (let z = 0; z <= 43; z++) pts.push([68, 0, z]);
  for (let x = 69; x <= 79; x++) pts.push([x, 0, 43]);
  for (let z = 44; z <= 74; z++) pts.push([79, 0, z]);
  let x = 79;
  for (let z = 75; z <= 100; z++) {
    const nx = 79 + Math.round((17 * (z - 74)) / 26);
    // a sideways step goes at the old z first, so every move is a straight run and the band stays 2 wide
    if (nx !== x) { pts.push([nx, 0, z - 1]); x = nx; }
    pts.push([x, 0, z]);
  }
  // heights: ground + 1, never falling, never more than 1 block of rise per point
  let prev = null;
  for (const p of pts) {
    let y = Math.round(groundAt(p[0], p[2])) + 1;
    if (prev !== null) y = Math.min(Math.max(y, prev), prev + 1);
    // the lower trail meets the deck's walking level at z 42..43 (the deck top block is y 37)
    if (p[0] <= 68 && p[2] >= 42) y = Math.max(y, 37);
    p[1] = y;
    prev = y;
  }
  return pts;
}

// Cleft spur: x 60..61 (centre 61) from the deck's south edge (z 46, flush with the deck top at y 37) up to y 43
function spurPath() {
  const pts = [];
  for (let z = 46; z <= 59; z++) pts.push([61, 37 + Math.round((6 * (z - 46)) / 13), z]);
  return pts;
}

// Lantern posts on the trail's edges. The listed (79,52), (79,64) sit on the trail (x 78..79), so they move to x 80.
// (61,58) is inside the spur, so the spur's lantern stands beside its end. Extra ground lanterns keep every
// stretch of trail within about 9 cells of light.
const POSTS = [
  ...LANTERN_POSTS.filter(([x, z]) => !(x <= 66 && z <= 45) && !(x === 61 && z === 58) && !(x === 79) && !(x === 94 && z === 96)),
  [80, 52], [80, 64], [90, 96],
  [71, 40], [81, 58], [65, 4],
  [59, 59],
];

export function build(g) {
  const lower = trailPath();
  const spur = spurPath();
  trailRun(g, lower, 2);
  trailRun(g, spur, 2);
  trailSign(g, 69, 41);
  for (const [x, z] of POSTS) lampPost(g, x, z);
}
