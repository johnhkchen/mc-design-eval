// Part 5: Corner landmarks: the PUBLIC MARKET CENTER sign, the corner clocks, the MEET THE PRODUCER band, the Pike
// Place Fish ice bed. Writes go into air only.
// The sign (v2, on the owner's comment): wide and shallow, an open white frame on a light steel frame, red neon letters
// (red stained glass with glowstone right behind) and sky between them; PUBLIC MARKET on top, CENTER on a shorter
// lower line. Facing east (up Pike Street from the hero view). Top at y 60, 18 above the roof deck (y 42).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { layoutText } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/brush-sign.mjs";
import { ice_bed, ICE_BED } from "../vocab.mjs";

const BARS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const isAir = (g, x, y, z) => g.inBounds(x, y, z) && g.isAir(x, y, z);
const put = (g, x, y, z, ...b) => { if (isAir(g, x, y, z)) g.set(x, y, z, ...b); };

// One line of neon letters on the face x = FX (glass) with glowstone at FX-1 and a steel bar at FX-2 behind each
// letter cell, centred on zc, bottom row at y0. Letters read left to right toward -z (seen from the east).
function neonLine(g, text, zc, y0) {
  const L = layoutText(text, "wide"), zLeft = zc + Math.floor(L.width / 2);
  const lit = new Set(L.cells.map((c) => `${y0 + c.y},${zLeft - c.x}`));
  for (const c of L.cells) {
    const z = zLeft - c.x, y = y0 + c.y;
    put(g, 39, y, z, "red_stained_glass");
    put(g, 38, y, z, "glowstone");
    put(g, 37, y, z, "red_terracotta"); // v3: the light's back is closed, so no bare white shows from behind
  }
  // v3: a thin red_terracotta rim round each stroke in the light's own plane (x 38), so the glowstone shows only through
  // the red glass (its sides, top and bottom are covered) and each letter reads as red neon outlined in red
  for (const c of L.cells) {
    const z = zLeft - c.x, y = y0 + c.y;
    for (const [dy, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
      if (!lit.has(`${y + dy},${z + dz}`)) {
        put(g, 38, y + dy, z + dz, "red_terracotta");
        put(g, 37, y + dy, z + dz, "iron_bars", BARS); // the rim hangs on the steel lattice too
      }
  }
  return L;
}

// A frame box on the plane x 38 (white_concrete rails and stiles), bulbs (end rods facing east) on the face x 39 every
// other cell along the rails, and a light steel lattice (iron bars, x 37) behind the letter columns.
function frameBox(g, { z0, z1, y0, y1 }) {
  for (let z = z0; z <= z1; z++) for (const y of [y0, y1]) {
    put(g, 38, y, z, "white_concrete"); put(g, 37, y, z, "white_concrete");
    if ((z - z0) % 2 === 0) put(g, 39, y, z, "end_rod", { facing: "east" });
  }
  for (const z of [z0, z1]) for (let y = y0 + 1; y < y1; y++) {
    put(g, 38, y, z, "white_concrete");
    if ((y - y0) % 2 === 0) put(g, 39, y, z, "end_rod", { facing: "east" });
  }
}

// Steel legs: iron bars at x 38 from the first built cell below up to y1, each with a back strut at x 37.
function leg(g, z, y1) {
  let y = y1;
  while (y > 20 && isAir(g, 38, y, z)) y--;
  for (let yy = y + 1; yy <= y1; yy++) { put(g, 38, yy, z, "iron_bars", BARS); put(g, 37, yy, z, "iron_bars", BARS); }
}

function sign(g) {
  // top box: PUBLIC MARKET, z 256..310, y 52..60; lower box: CENTER, centred under it, y 44..52 (shares the rail at 52)
  const top = { z0: 256, z1: 310, y0: 52, y1: 60 }, zc = 283;
  const low = { z0: 270, z1: 296, y0: 44, y1: 52 };
  frameBox(g, top);
  frameBox(g, low);
  const Lt = neonLine(g, "PUBLIC MARKET", zc, 54);
  const Ll = neonLine(g, "CENTER", zc, 46);
  // the steel lattice behind each letter column: bars at x 37 from rail to rail, so the letters hang on the frame
  const lattice = (L, box, yLo, yHi) => {
    const zLeft = zc + Math.floor(L.width / 2), cols = new Set(L.cells.map((c) => zLeft - c.x));
    for (const z of cols) for (let y = yLo; y <= yHi; y++) put(g, 37, y, z, "iron_bars", BARS);
  };
  lattice(Lt, top, top.y0 + 1, top.y1 - 1);
  lattice(Ll, low, low.y0 + 1, low.y1 - 1);
  // legs on the roof deck (z >= 280) and, north of the corner block, down to the arcade shed roof
  for (const z of [272, 284, 294]) leg(g, z, low.y0 - 1);
  for (const z of [258, 266, 300, 308]) leg(g, z, top.y0 - 1);
  // diagonal braces from the lower box's stiles out to the overhanging top box (iron bars, x 37)
  for (let i = 1; i <= 6; i++) { put(g, 37, low.y1 - i, low.z0 - i, "iron_bars", BARS); put(g, 37, low.y1 - i, low.z1 + i, "iron_bars", BARS); }
}

// A round clock about 5 across, hung on a face: white dial (3 x 3 inside), black hands (9 o'clock) and a black centre, a
// red neon ring of red stained glass with glowstone behind it. cell(a, b, out) maps dial coordinates to the grid.
function clock5(g, cell) {
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
    if (Math.abs(a) === 2 && Math.abs(b) === 2) continue;
    const ring = Math.abs(a) === 2 || Math.abs(b) === 2;
    const hand = (a === 0 && b >= 0) || (b === 0 && a === -1); // minute hand at 12, hour hand at 9
    put(g, ...cell(a, b, 0), ring ? "red_stained_glass" : hand ? "black_concrete" : "white_concrete");
    if (ring) put(g, ...cell(a, b, -1), "glowstone");
  }
  // v3: the same red neon as the letters: a thin red_terracotta rim round the outside of the red glass ring
  const inClock = (a, b) => Math.abs(a) <= 2 && Math.abs(b) <= 2 && !(Math.abs(a) === 2 && Math.abs(b) === 2);
  for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++)
    if (!inClock(a, b) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([da, db]) => inClock(a + da, b + db))) put(g, ...cell(a, b, 0), "red_terracotta");
}

export function build(g) {
  sign(g);

  // the corner clock: one round face hung proud of the set-back wall (x 40) on the corner pier, centre (41, 37, 307),
  // above the corner entrance; its glow ring was laid in the wall by the shell. (v2: the second, south face is gone:
  // the owner described one clock, and two side by side on the corner read as a pair of eyes.)
  clock5(g, (a, b, out) => [41 + out, 37 + b, 307 - a]);
  // MEET THE PRODUCER under the clock (v2: moved off the parapet, where it hid CENTER): a dark oak band on the arcade's
  // corner fascia (x 41, y 30, over the arcade storey, under the clock), and hanging signs under the band reading it
  for (let z = 284; z <= 310; z++) put(g, 41, 30, z, "dark_oak_planks");
  for (const z of [289, 297, 305]) put(g, 41, 29, z, ...B.sign("dark_oak", ["MEET THE", "PRODUCER"], { hanging: true, wall: false, rotation: 12, color: "white", glow: true, dataVersion: 3955 }));

  // Pike Place Fish ice bed: trough y 24, ice y 25, fish and kelp y 26, x 35..40, z 296..309
  ice_bed(g, { x0: ICE_BED.x0, x1: ICE_BED.x1, z0: ICE_BED.z0, z1: ICE_BED.z1, y: 24 });
}
