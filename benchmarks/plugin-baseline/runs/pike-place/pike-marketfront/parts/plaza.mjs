// Part 5, Plaza and grounds: planter beds with trees, benches, glass rails on the plaza edges, lamp posts and the bronze
// pig, all on the plaza deck (y 28, walk 29). plan.md gives plot-local x; the grid is in site x, so every x is shifted by
// PLOT0's origin. Only air above a deck cell is written; nothing is placed where the deck (shell0) is missing.
// The spruce deck strips are not written: they replace shell0's smooth_stone, which runParts locks.
import { PLOT0, planterBed, benchRow, lampPost, bronzePig, glassRail } from "../vocab.mjs";

const DECK = 28, WALK = 29;
const sx = (lx) => lx + PLOT0[0];
const deck = (g, x, z) => !g.isAir(x, DECK, z);
const rectDeck = (g, x0, x1, z0, z1) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (!deck(g, x, z)) return false;
  return true;
};

// The largest rectangle inside [x0..x1] x [z0..z1] that is all deck: each side is pulled in while its edge line has a
// cell with no deck under it (a bed is clipped to the footprint, as plan.md says, not dropped).
function fitDeck(g, x0, x1, z0, z1) {
  const row = (z) => { for (let x = x0; x <= x1; x++) if (!deck(g, x, z)) return false; return true; };
  const col = (x) => { for (let z = z0; z <= z1; z++) if (!deck(g, x, z)) return false; return true; };
  while (z0 <= z1 && !row(z0)) z0++;
  while (z1 >= z0 && !row(z1)) z1--;
  while (x0 <= x1 && !col(x0)) x0++;
  while (x1 >= x0 && !col(x1)) x1--;
  return z0 <= z1 && x0 <= x1 ? { x0, x1, z0, z1 } : null;
}

// contiguous [a, b] runs of a list of integers
function runs(values) {
  const out = [];
  for (const v of [...values].sort((a, b) => a - b)) {
    const last = out[out.length - 1];
    if (last && v === last[1] + 1) last[1] = v; else out.push([v, v]);
  }
  return out;
}

// plaza bounds in site x and z (plan.md: local x 70..125, z 98..230)
const PX0 = sx(70), PX1 = sx(125), PZ0 = 98, PZ1 = 230;

// Glass rail on every deck edge except the open east edge: a deck cell with no deck beside it on the west, north or south.
function railPlaza(g) {
  const has = (x, z) => x >= PX0 && x <= PX1 && z >= PZ0 && z <= PZ1 && deck(g, x, z);
  const westBy = new Map(), northBy = new Map(), southBy = new Map();
  const add = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v); };
  for (let z = PZ0; z <= PZ1; z++) for (let x = PX0; x <= PX1; x++) {
    if (!has(x, z)) continue;
    if (!has(x - 1, z)) add(westBy, x, z);
    if (!has(x, z - 1)) add(northBy, z, x);
    if (!has(x, z + 1)) add(southBy, z, x);
  }
  for (const [x, zs] of westBy) for (const [a, b] of runs(zs)) glassRail(g, { from: [x, a], to: [x, b], y: WALK });
  for (const [z, xs] of northBy) for (const [a, b] of runs(xs)) glassRail(g, { from: [a, z], to: [b, z], y: WALK });
  for (const [z, xs] of southBy) for (const [a, b] of runs(xs)) glassRail(g, { from: [a, z], to: [b, z], y: WALK });
}

export function build(g) {
  // the planter beds (plan.md: x 76..81 / 88..93 / 108..113, z 150..157 / 180..187 / 210..215); a tree in every other bed
  const BEDS_X = [[76, 81], [88, 93], [108, 113]];
  const BEDS_Z = [[150, 157], [180, 187], [210, 215]];
  BEDS_Z.forEach(([lz0, lz1], j) => BEDS_X.forEach(([lx0, lx1], i) => {
    const fit = fitDeck(g, sx(lx0), sx(lx1), lz0, lz1);
    if (!fit) { console.log(`plaza: bed ${lx0}..${lx1} x ${lz0}..${lz1} is off the deck, skipped`); return; }
    const { x0, x1, z0, z1 } = fit;
    if (!rectDeck(g, x0, x1, z0, z1)) { console.log(`plaza: bed ${lx0}..${lx1} x ${lz0}..${lz1} has no clean deck, skipped`); return; }
    // a tree needs a bed at least 5 wide and deep for its crown; the narrower clipped beds get soil and planting only
    const tree = (i + j) % 2 === 0 && x1 - x0 >= 4 && z1 - z0 >= 4;
    planterBed(g, { x0, x1, z0, z1, y: WALK, tree });
    if (fit.x0 !== sx(lx0) || fit.x1 !== sx(lx1) || fit.z0 !== lz0 || fit.z1 !== lz1) {
      console.log(`plaza: bed ${lx0}..${lx1} x ${lz0}..${lz1} clipped to ${x0 - PLOT0[0]}..${x1 - PLOT0[0]} x ${z0}..${z1}${tree ? "" : " (no tree)"}`);
    }
    // a bench on the west side of each bed, facing west as plan.md says, where the deck is
    const seats = [];
    for (let z = z0; z <= z1; z++) if (deck(g, x0 - 1, z)) seats.push(z);
    for (const [a, b] of runs(seats)) benchRow(g, { x: x0 - 1, z0: a, len: b - a + 1, y: WALK, facing: "west" });
  }));

  // the railing along the plaza edges (west, north, south; the east edge is the open entry to Pike Place)
  railPlaza(g);

  // a lantern on every glass-rail post, so the plaza edge reads as a line of lights at dusk
  for (let x = PX0; x <= PX1; x++) for (let z = PZ0; z <= PZ1; z++)
    if (/minecraft:andesite_wall$/.test(g.blockAt(x, WALK, z)) && g.isAir(x, WALK + 1, z)) g.set(x, WALK + 1, z, "lantern", { hanging: "false", waterlogged: "false" });

  // lamp posts every 9 along x 71 and x 124 (plan.md), where the deck is
  for (let lz = 102; lz <= 228; lz += 9) {
    for (const lx of [71, 124]) {
      if (deck(g, sx(lx), lz)) lampPost(g, { x: sx(lx), z: lz, y: WALK });
    }
  }

  // the bronze pig "Billie": plan.md x 99..103, z 170..171 (local)
  if (rectDeck(g, sx(99), sx(103), 170, 171)) bronzePig(g, { x: sx(99), z: 170, y: WALK });
  else console.log("plaza: pig is off the deck, skipped");
}
