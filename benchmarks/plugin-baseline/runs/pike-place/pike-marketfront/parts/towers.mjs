// Part 3, Towers and stairs: TW, K (two shafts) and ET glass towers, and the SH hillclimb stair (stepped half-block flights).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { towerShaft, PLOT0, PLOT1, onFootprint, groundAt } from "../vocab.mjs";

const X0 = PLOT0[0], Z1 = PLOT1[2];
const cellsOf = (x0, x1, z0, z1) => { const c = []; for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) c.push([x, z]); return c; };
const box = (xa, xb, ya, yb, za, zb) => { const c = []; for (let x = xa; x <= xb; x++) for (let y = ya; y <= yb; y++) for (let z = za; z <= zb; z++) c.push([x, y, z]); return c; };

// a tower on its ground: plinth of polished_andesite from each cell's ground up to base, then towerShaft
function tower(g, { plot, ox, oz, x0, x1, z0, z1, base, top, decks, doors = [] }) {
  for (const [x, z] of cellsOf(x0, x1, z0, z1)) {
    const gh = groundAt(plot, x - ox, z - oz);
    for (let y = Math.max(gh, 0); y < base; y++) if (g.isAir(x, y, z)) g.set(x, y, z, "polished_andesite");
  }
  return towerShaft(g, { x0: x0, x1, z0, z1, base, top, decks, doors });
}

function tw(g) {
  const doors = [];
  for (const y of [7, 14, 21, 29]) doors.push(...box(X0 + 20, X0 + 20, y, y + 1, 195, 196));
  tower(g, { plot: 0, ox: X0, oz: 0, x0: X0 + 14, x1: X0 + 20, z0: 189, z1: 202, base: 7, top: 35, decks: [13, 20, 28], doors });
}

// K: one low lift-and-stair kiosk on the north box of the Pike St cells (the twin tall shafts read as stray stubs),
// a single glass storey over its plinth with a flat cap 8 above its highest ground.
function k(g) {
  const [xa, xb, za, zb] = [105, 111, 306, 318];
  const cs = cellsOf(X0 + xa, X0 + xb, za, zb).filter(([x, z]) => onFootprint(0, x - X0, z));
  const gmax = Math.max(...cs.map(([x, z]) => groundAt(0, x - X0, z)));
  const dr = box(X0 + 105, X0 + 105, gmax, gmax + 1, 315, 316);
  tower(g, { plot: 0, ox: X0, oz: 0, x0: X0 + xa, x1: X0 + xb, z0: za, z1: zb, base: gmax, top: gmax + 8, decks: [], doors: dr });
}

function et(g) {
  const doors = [...box(63, 63, 4, 6, Z1 + 51, Z1 + 53), ...box(63, 63, 17, 19, Z1 + 51, Z1 + 53), ...box(66, 68, 24, 26, Z1 + 48, Z1 + 48)];
  for (const y of [9, 16, 23, 30]) doors.push(...box(66, 68, y, y, Z1 + 51, Z1 + 56));
  // the back (east and south) walls are solid concrete from the ground up, so the tower reads as one mass standing on
  // its terrace; the glass shaft shows on the west and north faces, toward the stairs and the bay
  for (let y = 4; y < 36; y++) {
    for (let z = Z1 + 50; z <= Z1 + 57; z++) if (g.isAir(71, y, z)) g.set(71, y, z, y % 7 === 2 ? "smooth_stone" : "light_gray_concrete");
    for (let x = 65; x <= 69; x++) if (g.isAir(x, y, Z1 + 59)) g.set(x, y, Z1 + 59, y % 7 === 2 ? "smooth_stone" : "light_gray_concrete");
  }
  tower(g, { plot: 1, ox: PLOT1[0], oz: Z1, x0: 63, x1: 71, z0: Z1 + 48, z1: Z1 + 59, base: 4, top: 36, decks: [9, 16, 23, 30], doors });
}

// SH: broad stair climbing +x as half-block steps: each level is 4 (3) columns long, opened by a stair (low side west),
// then full blocks; solid down to the ground. Clipped to the footprint.
function flight(g, { xa, xb, za, zb, y0, per }) {
  for (let x = xa; x <= xb; x++) {
    const i = Math.floor((x - xa) / per), y = y0 + i, first = (x - xa) % per === 0;
    for (let z = za; z <= zb; z++) {
      const lx = x - X0;
      if (!onFootprint(0, lx, z)) continue;
      const edge = z === za || z === zb;
      const put = (yy, ...b) => { if (g.isAir(x, yy, z)) g.set(x, yy, z, ...b); };
      if (first && i > 0 && !edge) put(y, ...B.stairs("polished_andesite", "east", "bottom"));
      else put(y, edge ? "polished_andesite" : "smooth_stone");
      if (edge) put(y + 1, "polished_andesite");
      for (let yy = y - 1; yy >= Math.max(groundAt(0, lx, z), 0) && g.isAir(x, yy, z); yy--) g.set(x, yy, z, "polished_andesite");
    }
  }
}

function sh(g) {
  flight(g, { xa: X0 + 35, xb: X0 + 62, za: 238, zb: 244, y0: 3, per: 4 });
  for (const [x, z] of cellsOf(X0 + 63, X0 + 69, 238, 244)) if (onFootprint(0, x - X0, z)) {
    if (g.isAir(x, 9, z)) g.set(x, 9, z, "smooth_stone");
    for (let y = 8; y >= Math.max(groundAt(0, x - X0, z), 0) && g.isAir(x, y, z); y--) g.set(x, y, z, "polished_andesite");
  }
  flight(g, { xa: X0 + 70, xb: X0 + 90, za: 245, zb: 251, y0: 10, per: 3 });
}

// TW is left out: its cap stood 7 above the plaza as a stray stub on the west face (fix round 2)
export function build(g) { k(g); et(g); sh(g); }
