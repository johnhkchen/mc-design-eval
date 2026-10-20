// Part 4, flag ring and floodlights (plan.md PARTS 4; elements 13-15, 21 at the base): the paved ring walk 15.5 <= r < 17.5
// at y 5 (over the lawn the ground laid), fifty flagpoles at r 16 (flagPole), an ochre froglight flush in the walk under
// each pole's foot, and the base floodlights from the plan's RESERVED list (plaza paving cells: refused if the plaza part
// has already paved them, see the report).
// vocab.mjs star-exports floodlight from both h1 and h2 (a conflict), so the h1 helpers are imported by name here.
import { flagPole, floodlight } from "../vocab/h1.mjs";
import { radiusAt, FLAG_RING, FLAG_R, FLAG_POLES, PLAZA_Y, CENTRE, FLOODLIGHTS, WHITE_CONCRETE_POWDER } from "../vocab/base.mjs";

export function build(g) {
  const { x: cx, z: cz } = CENTRE;

  // Ring walk: every cell in the band, over the lawn the ground part laid (the ground is writable; earlier parts are not).
  for (let x = 0; x < 100; x++) for (let z = 0; z < 100; z++) {
    const r = radiusAt(x, z);
    if (r >= FLAG_RING.r0 && r < FLAG_RING.r1) g.set(x, PLAZA_Y, z, WHITE_CONCRETE_POWDER);
  }

  // Fifty poles, each on the same cell flagPole rounds to, then a froglight in the walk under its foot.
  for (let k = 0; k < FLAG_POLES; k++) {
    flagPole(g, k, cx, cz, FLAG_R, PLAZA_Y, { count: FLAG_POLES });
    const a = (k * 360 / FLAG_POLES) * Math.PI / 180;
    floodlight(g, Math.round(cx + FLAG_R * Math.cos(a)), PLAZA_Y, Math.round(cz + FLAG_R * Math.sin(a)), { over: true });
  }

  // Base floodlights: plaza cells the plan reserves for froglights in place of the paving.
  for (const [x, y, z] of FLOODLIGHTS) floodlight(g, x, y, z, { over: true });
}
