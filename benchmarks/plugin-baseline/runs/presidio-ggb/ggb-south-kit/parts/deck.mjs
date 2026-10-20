// Plot 1 deck and truss: the deck from z 11 to 190 on the Y(z) descent (DECK_STEPS), the stiffening truss at x 8 and
// x 22 from z 14 to 190, and the Deco lamp posts. Plot 1's local coordinates, y 0 is the water and is never written.
// The cable housings (part 3) own z 72..75 on the curb, rail, truss and outer walk (x 8, 9, 21, 22): this part leaves
// those cells alone and lays the inner cross-section (x 10..20) there by hand, since deckSection writes the full width.
import { DECK_STEPS, CABLE_X, deckSection, deckLamp, hangLantern } from "../vocab.mjs";

const HOUSING_Z = [72, 75];

// The cable housing's collar (part 3) rings the mouth at z 71, x 6..10 and 20..24, y 33..37: its cut_sandstone owns
// those cells, so the truss chord that passes through them is left out.
const COLLAR_Z = 71;
const COLLAR_Y = [33, 37];
const inCollar = (x, y, z) => z === COLLAR_Z && y >= COLLAR_Y[0] && y <= COLLAR_Y[1];

// The walking level Y at plan row z (the descent table).
const yAt = (z) => DECK_STEPS.find((s) => z >= s.z[0] && z <= s.z[1]).y;

// One row of the cross-section at z, leaving out the housing columns x 8, 9, 21, 22 (deckSection's rules, x 10..20).
function innerRow(g, z, Y, slab) {
  for (let x = 10; x <= 20; x++) g.set(x, Y - 1, z, "gray_concrete");
  for (const x of [10, 20]) {
    if (slab) g.set(x, Y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    else g.set(x, Y, z, "smooth_stone");
  }
  for (let x = 11; x <= 19; x++) {
    const d = x - 8;
    if (d === 7) g.set(x, Y, z, "yellow_concrete");
    else if ((d === 4 || d === 10) && (z % 4 === 0 || z % 4 === 1)) g.set(x, Y, z, "smooth_quartz");
    else g.set(x, Y, z, "polished_deepslate");
  }
}

// Deck: deckSection for every step of the table (split around the housing rows), innerRow for the housing rows.
function deck(g) {
  for (const s of DECK_STEPS) {
    for (let z = s.z[0]; z <= s.z[1]; z++) {
      if (z >= HOUSING_Z[0] && z <= HOUSING_Z[1]) {
        innerRow(g, z, s.y, s.slab);
        continue;
      }
      let end = z;
      while (end + 1 <= s.z[1] && !(end + 1 >= HOUSING_Z[0] && end + 1 <= HOUSING_Z[1])) end++;
      deckSection(g, z, end, s.y, { slab: s.slab });
      z = end;
    }
  }
}

// Stiffening truss on x 8 and x 22, z 14..190, one column per z. Chords at Y-4 and Y-1 (filled between neighbours
// where the deck steps down); a vertical at z = 2 (mod 4); a red_terracotta zigzag through each 4-long bay in rows Y-3
// and Y-2, its direction alternating from bay to bay.
function truss(g) {
  for (const x of CABLE_X) {
    let prev = null;
    for (let z = 14; z <= 190; z++) {
      if (z >= HOUSING_Z[0] && z <= HOUSING_Z[1]) { prev = null; continue; }
      const Y = yAt(z);
      const fromY = prev ?? Y;
      for (const [lo, hi] of [[Y - 4, fromY - 4], [Y - 1, fromY - 1]]) {
        for (let y = Math.min(lo, hi); y <= Math.max(lo, hi); y++) if (!inCollar(x, y, z)) g.set(x, y, z, "orange_terracotta");
      }
      prev = Y;
      const j = (z - 14) % 4;
      if (j === 0) {
        g.set(x, Y - 3, z, "orange_terracotta");
        g.set(x, Y - 2, z, "orange_terracotta");
      } else {
        const k = Math.floor((z - 14) / 4);
        const upper = (j % 2 === 1) !== (k % 2 === 1);
        g.set(x, upper ? Y - 2 : Y - 3, z, "red_terracotta");
      }
    }
  }
}

// Art Deco lamp posts. West (x 8) and east (x 22) posts stand on the railing line; for z <= 70 the cable owns y 36
// on x 8 and x 22, so those posts stand on the outer walk (x 9 / x 21) with a clear lane inward. carve replaces the
// railing cell the post stands in.
function lamps(g) {
  const outerW = [16, 32, 48, 64];
  const outerE = [24, 40, 56];
  const innerW = [80, 96, 112, 128, 144, 160, 176];
  const innerE = [88, 104, 120, 136, 152, 168, 184];
  for (const z of outerW) deckLamp(g, 9, z, yAt(z), true, { lane: 1 });
  for (const z of outerE) deckLamp(g, 21, z, yAt(z), true, { lane: -1 });
  for (const z of innerW) deckLamp(g, 8, z, yAt(z), false, { carve: true });
  for (const z of innerE) deckLamp(g, 22, z, yAt(z), false, { carve: true });
}

// Hanging lanterns under the deck floor on the centre line over the middle of the bridge (z 66..106, where no arch or
// bent lies below and the posts leave the road dark). Every 8 rows, from the floor (Y-1) down to Y-2.
function centreLights(g) {
  for (const z of [12, 66, 74, 82, 90, 98, 106]) hangLantern(g, 15, yAt(z) - 2, z);
}

export function build(g) {
  deck(g);
  truss(g);
  lamps(g);
  centreLights(g);
}
