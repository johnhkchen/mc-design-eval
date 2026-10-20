// P2 Segment (plot 1, box x and z 0..75, y 0..46): one of the eight stacked segments (plan.md PLOT 1).
// Foot floor y0 (62 sq, notched) -> 8 flared bands (inset 7..0, one step out every 6 courses) with step courses closing
// each soffit -> lit band y44, smooth_quartz fascia y45 -> solid notched top ledge y46 (76 sq). The four flared corners
// carry a light strip (sea lantern behind light blue glass); a 10 x 12 ruyi stands proud at the centre of each face's
// foot, and a small ruyi sits in each corner notch at the foot.
import {
  bandRing, stepCourse, litBand, ledgeSlab, notchRing,
  LIGHT_BLUE_GLASS, IRON_BLOCK, GRAY_CONCRETE, SEA_LANTERN, SMOOTH_QUARTZ, SMOOTH_STONE, LIGHT_GRAY_CONCRETE, PLOT_ORIGIN,
} from "../vocab.mjs";
import { carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// the helpers and this part work in plot-local coordinates; the world grid is offset by plot 1's origin (x 197)
const OX = PLOT_ORIGIN[1][0];
const local = (g) => ({
  set: (x, y, z, b, s) => g.set(x + OX, y, z, b, s),
  isAir: (x, y, z) => g.isAir(x + OX, y, z),
  inBounds: (x, y, z) => g.inBounds(x + OX, y, z),
  blockAt: (x, y, z) => g.blockAt(x + OX, y, z),
});

const BOX = { x0: 0, z0: 0, x1: 75, z1: 75 };
const BOX_ARR = [0, 0, 75, 75];
const FOOT = [7, 7, 68, 68];

// the bands: [inset from the box, first y, last y]; band 0 is the top band, its last two courses are the lit band and fascia
const BANDS = [[7, 0, 5], [6, 6, 11], [5, 12, 17], [4, 18, 23], [3, 24, 29], [2, 30, 35], [1, 36, 41], [0, 42, 45]];

// the notched plan, the same rule as notchRing: a corner cell is left out when (a<2 && b<4) or (a<4 && b<2)
const inPlan = ([x0, z0, x1, z1], x, z) =>
  x >= x0 && x <= x1 && z >= z0 && z <= z1 &&
  ![[x - x0, z - z0], [x1 - x, z - z0], [x - x0, z1 - z], [x1 - x, z1 - z]].some(([a, b]) => (a < 2 && b < 4) || (a < 4 && b < 2));

// the foot: solid notched course at y0 (dark prismarine perimeter from the band, smooth stone inside, a sea lantern
// flush every 8 x 8 in the interior). The plot's ground pavement under it is cleared first; the corners stay paving.
function foot(g, world) {
  const [x0, z0, x1, z1] = FOOT;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (inPlan(FOOT, x, z)) carve(world, [x + OX, 0, z], [x + OX, 0, z]);
  }
  for (let x = x0 + 1; x < x1; x++) for (let z = z0 + 1; z < z1; z++) {
    const interior = inPlan(FOOT, x, z) && inPlan(FOOT, x - 1, z) && inPlan(FOOT, x + 1, z) && inPlan(FOOT, x, z - 1) && inPlan(FOOT, x, z + 1);
    if (!interior) continue;
    const lantern = (x - x0) % 8 === 4 && (z - z0) % 8 === 4;
    g.set(x, 0, z, lantern ? SEA_LANTERN : SMOOTH_STONE);
  }
}

// the four corner noses (the (2,2) cell from each corner of a band) as a light strip, y 1..45, through the floor lines:
// light_blue_stained_glass on the nose with a sea_lantern in the cell diagonally inside it (the (3,3) cell)
function cornerLights(g) {
  for (const [k, y0, y1] of BANDS) {
    const lo = k + 2, hi = 75 - k - 2;
    for (let y = Math.max(1, y0); y <= y1; y++) {
      for (const [x, z] of [[lo, lo], [hi, lo], [lo, hi], [hi, hi]]) {
        g.set(x, y, z, LIGHT_BLUE_GLASS);
        g.set(x + (x === lo ? 1 : -1), y, z + (z === lo ? 1 : -1), SEA_LANTERN);
      }
    }
  }
}

// the face ruyi, 10 wide x 12 tall (rows top to bottom; X iron_block, E gray_concrete eye); the head (y 6..11) gets a
// smooth_quartz outline. Rows y 0..5 stand 1 proud of the inset-7 wall, the head 1 proud of the inset-6 wall above it.
const RUYI_BIG = [
  ".XXX..XXX.", // y11
  "XXXXXXXXXX", // y10
  "XXEXXXXEXX", // y9
  "XXXXXXXXXX", // y8
  ".XXXXXXXX.", // y7
  "..XXXXXX..", // y6
  "...XXXX...", // y5
  "....XX....", // y4
  "....XX....", // y3
  "....XX....", // y2
  "...XXXX...", // y1
  "..XXXXXX..", // y0
].reverse();

// one face: along 33..42 (centred on the box), out = the cell 1 proud of the inset-7 wall (S z 69, N z 6, E x 69, W x 6)
function bigRuyi(g, face) {
  const step = face === "south" || face === "east" ? 1 : -1;
  const out = face === "south" || face === "east" ? 69 : 6;
  const filled = (r, c) => r >= 0 && r < 12 && c >= 0 && c < 10 && RUYI_BIG[r][c] !== ".";
  RUYI_BIG.forEach((row, r) => {
    for (let c = 0; c < 10; c++) {
      if (row[c] === ".") continue;
      const edge = !filled(r - 1, c) || !filled(r + 1, c) || !filled(r, c - 1) || !filled(r, c + 1);
      const block = row[c] === "E" ? GRAY_CONCRETE : r >= 6 && edge ? SMOOTH_QUARTZ : IRON_BLOCK;
      const d = r >= 6 ? out + step : out, a = 33 + c;
      if (face === "south" || face === "north") g.set(a, r, d, block); else g.set(d, r, a, block);
    }
  });
}

// the small corner ruyi at each corner's foot, in the notch of the inset-7 band where it meets the ledge below: a stem on
// the outermost cell, a head wrapping the corner and resting on the outer noses (4,0) and (0,4). [a, b, y] from the corner.
const RUYI_CORNER = [
  [1, 1, 1], [1, 1, 2],
  [0, 0, 3], [1, 0, 3], [0, 1, 3], [1, 1, 3],
  [0, 0, 4], [1, 0, 4], [2, 0, 4], [0, 1, 4], [1, 1, 4], [0, 2, 4],
  [0, 0, 5], [1, 0, 5], [2, 0, 5], [3, 0, 5], [0, 1, 5], [1, 1, 5], [0, 2, 5], [0, 3, 5],
];
function cornerRuyi(g) {
  for (const [cx, sx] of [[7, 1], [68, -1]]) for (const [cz, sz] of [[7, 1], [68, -1]]) {
    for (const [a, b, y] of RUYI_CORNER) {
      const outer = y === 5 || (y === 4 && (a === 2 || b === 2)) || (y === 3 && a === 0 && b === 0);
      g.set(cx + sx * a, y, cz + sz * b, outer ? SMOOTH_QUARTZ : IRON_BLOCK);
    }
  }
}

export function build(world) {
  const g = local(world);
  foot(g, world);
  // the eight bands; band 0's top two courses are written below (lit band, fascia)
  for (const [k, y0, y1] of BANDS) bandRing(g, { box: BOX, inset: k, y0, y1: k === 0 ? 43 : y1 });
  // a step course at the bottom of each band above the foot: closes the soffit it overhangs
  for (const [k, y0] of BANDS.slice(1)) stepCourse(g, { box: BOX_ARR, insetNew: k, y: y0 });
  // top band: lit band at y44 (glass ring, sea lanterns just inside), smooth quartz fascia at y45
  litBand(g, { y: 44, ring: BOX_ARR });
  for (const [x, z] of notchRing(...BOX_ARR)) if (g.isAir(x, 45, z)) g.set(x, 45, z, SMOOTH_QUARTZ);
  // the solid notched top ledge at y46; the next segment's foot stands in its middle
  ledgeSlab(g, { box: BOX, y: 46, notch: "double", top: LIGHT_GRAY_CONCRETE, lanternRing: 3, every: 5 });
  cornerLights(g);
  // ruyi at the foot centre of each face, standing proud of the wall, and a small one in each corner notch at the foot
  for (const f of ["south", "north", "east", "west"]) bigRuyi(g, f);
  cornerRuyi(g);
}
