// Part 6, Dusk lighting and signs: a lit strip behind every west glass band (shroomlight / ochre_froglight ceiling row,
// hanging lanterns, lit candles on the deck), then the HILLCLIMB plaque on the ET west face and the market sign on the
// M1 west parapet. Writes only into air: the strips shell0 left open behind each tier's glass.
import { glowStrip, plaque, PLOT0 } from "../vocab.mjs";

// The glass tiers (plot 0 local x/z): floor deck F, roof deck R. The strip behind the glass is F+1..R-1 (plan FLOORS).
const TIERS = [
  { name: "T1", x0: 21, x1: 41, z0: 91, z1: 244, F: 6, R: 13 },
  { name: "T2", x0: 42, x1: 69, z0: 63, z1: 230, F: 13, R: 20 },
  { name: "T3", x0: 70, x1: 125, z0: 140, z1: 230, F: 20, R: 28 },
  { name: "T3N", x0: 77, x1: 125, z0: 98, z1: 139, F: 22, R: 28 },
];

// One strip per z row: the face is the first deck cell at F on this row (the footprint edge moves along the tier).
// Lights sit 2..4 in from the face, the pane is at 1, so each strip reads through its glass.
function tierGlow(g, t, stats) {
  const a = t.x0 + PLOT0[0], b = t.x1 + PLOT0[0];
  for (let z = t.z0; z <= t.z1; z++) {
    let face = null;
    for (let x = a; x <= b; x++) if (!g.isAir(x, t.F, z)) { face = x; break; }
    if (face === null) continue;
    const lit = glowStrip(g, { x0: face + 2, x1: face + 4, z0: z, z1: z, y: t.R - 1 });
    stats.lit += lit.placed;
    stats.refused += lit.refused.length;
    // a lantern hangs under the lit ceiling every 6 rows, in the middle of the strip
    if ((z - t.z0) % 6 === 3 && g.isAir(face + 3, t.R - 2, z)) {
      g.set(face + 3, t.R - 2, z, "lantern", { hanging: "true" });
      stats.lanterns++;
    }
    // a lit candle on the deck every 4 rows, in the stall nearest the glass
    if ((z - t.z0) % 4 === 0 && g.isAir(face + 2, t.F + 1, z)) {
      g.set(face + 2, t.F + 1, z, "candle", { candles: "1", lit: "true" });
      stats.candles++;
    }
  }
}

export function build(g) {
  const stats = { lit: 0, refused: 0, lanterns: 0, candles: 0 };
  for (const t of TIERS) tierGlow(g, t, stats);
  console.log(`dusk: ${stats.lit} lit ceiling cells, ${stats.lanterns} lanterns, ${stats.candles} candles, ${stats.refused} refused`);

  // HILLCLIMB on ET's west face (ET is plot 1, origin x 0: its west face is x 63; the board stands in front of it, y 30..34)
  const et = plaque(g, "HILLCLIMB", { face: "west", at: [62, 30, 190], width: 7, height: 5 });
  // Market sign on M1's west parapet (plot 0 x 98 + 81 = 179; the board stands in front of it at y 53..54)
  const m1 = plaque(g, "PIKE PLACE MARKET", { face: "west", at: [178, 53, 4], width: 20, height: 2 });
  console.log(`dusk: ET sign ${et.placed} cells, M1 sign ${m1.placed} cells, skipped ${et.skipped + m1.skipped}`);
}
