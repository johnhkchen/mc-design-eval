// Part 4: Setbacks, decks and crown. Every setback is a ledge (smooth_stone deck, stair coping on its outer edge,
// shroomlight floodlights against the upper wall); the Top of the Rock terraces I3/I4 and the C1 crown get glass-pane
// parapets; the penthouse and mast stand on C1. Coordinates are plan.md's (plot-local). The N/S flanks are mirror
// images about z = 27.5, so each flank ledge is laid on the north side and again on the south side.
import { ledge, deckParapet, mast } from "../vocab.mjs";

// Floodlit crown: the ledges from y196 up carry an unbroken row of shroomlight flush in the deck against the upper wall
// (it washes the limestone above warm white at dusk); below y196 every 4th cell (lighting and anti-spawn).
const stepFor = (topY) => (topY >= 196 ? 1 : 4);

// The same floodlight row on a Top of the Rock deck: every deck cell of `deck` (inside its curb ring) touching the
// upper box's wall becomes shroomlight. Laid before deckParapet, which then fills the rest of the deck round it.
function floodRow(g, [x0, z0, x1, z1], [ux0, uz0, ux1, uz1], y) {
  const inUpper = (x, z) => x >= ux0 && x <= ux1 && z >= uz0 && z <= uz1;
  for (let x = x0 + 1; x < x1; x++) for (let z = z0 + 1; z < z1; z++) {
    if (inUpper(x, z)) continue;
    if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => inUpper(x + dx, z + dz))) continue;
    const c = g.get(x, y, z);
    if (!c || c.block === "minecraft:air") g.set(x, y, z, "shroomlight");
  }
}

// A plot rectangle as ledge()'s box: [x0, y0, z0, x1, y1, z1]; the y is ignored there.
const box = (x0, z0, x1, z1) => [x0, 0, z0, x1, 0, z1];

// The north and south outer strips of one lower mass. ledge() lays the deck and floodlights on the first call and only
// the coping on the edge facing outDir; cells already built are refused, so the second call adds the other coping.
function flankLedges(g, lower, topY, upper) {
  ledge(g, lower, topY, "north", stepFor(topY), { upper });
  ledge(g, lower, topY, "south", stepFor(topY), { upper });
}

export function build(g) {
  // ---- The tower's north and south flanks: 212 -> 218 -> 222 (the cascade) ----
  const I2 = [60, 16, 131, 39];                  // upper shaft: the wall the flank ledges step back to
  const F2 = [68, 14, 111, 41];
  flankLedges(g, box(68, 12, 111, 43), 212, F2);  // F1 (212): outer 2-block ledge beyond F2
  flankLedges(g, box(68, 14, 111, 41), 218, I2);  // F2 (218): inner ledge beyond I2
  // These two ledges are the massing's own tops (the deck rows above were refused), so their floodlights stand on them:
  // a shroomlight uplight at the foot of every pier (even x) of the wall rising behind, washing it warm white.
  for (const [y, zN] of [[213, 13], [219, 15]]) for (let x = 68; x <= 111; x += 2) for (const z of [zN, 55 - zN]) {
    const c = g.get(x, y, z);
    if (!c || c.block === "minecraft:air") g.set(x, y, z, "shroomlight");
  }

  // ---- The shaft's sides: I1 (216) west of I2; I2 (222) beyond I3 (224) ----
  ledge(g, box(56, 16, 131, 39), 216, "west", stepFor(216), { upper: I2 });
  ledge(g, box(60, 16, 131, 39), 222, "west", stepFor(222), { upper: [76, 16, 123, 39] });
  ledge(g, box(60, 16, 131, 39), 222, "east", stepFor(222), { upper: [76, 16, 123, 39] });

  // ---- Top of the Rock: I3 (224, 67th) and I4 (228, 69th) decks with glass-pane parapets ----
  floodRow(g, [76, 16, 123, 39], [76, 18, 119, 37], 224);
  floodRow(g, [76, 18, 119, 37], [80, 24, 135, 31], 228);
  floodRow(g, [80, 24, 135, 31], [96, 25, 119, 30], 232);
  deckParapet(g, [76, 16, 123, 39], 224);
  deckParapet(g, [76, 18, 119, 37], 228);

  // ---- The crown: C1 (232) flat roof with its glass parapet, the penthouse and the mast ----
  deckParapet(g, [80, 24, 135, 31], 232);
  mast(g, 107, 27, 237, { pent: [96, 25, 119, 30] });
  // the red aircraft light: a red glass lamp on the mast head beside the rod, a shroomlight in the bars under it
  g.set(108, 243, 28, "shroomlight");
  g.set(108, 244, 28, "red_stained_glass");

  // ---- East cascade: the flank steps down to the plaza (F3 196, F4 153, F5 110) ----
  // Each is a N/S strip of the lower step, ringed by the shaft I2 above it.
  for (const [x0, x1, top] of [[112, 119, 196], [120, 127, 153], [128, 131, 110]]) {
    flankLedges(g, box(x0, 12, x1, 43), top, I2);
  }
  // F6 podium (41): nothing above it, so its two outer strips are decks in their own right.
  ledge(g, box(132, 12, 139, 15), 41, "north", stepFor(41), {});
  ledge(g, box(132, 40, 139, 43), 41, "south", stepFor(41), {});

  // ---- East end: E1 (202) and E3 (163) step round the centre spine E2 (209) ----
  const E2 = [132, 24, 143, 31];
  flankLedges(g, box(132, 16, 139, 39), 202, E2); // E1 deck: z16..23 and z32..39
  flankLedges(g, box(140, 16, 143, 39), 163, E2); // E3 deck
  // E2's east shoulder (x136..143) beyond the crown C1, which stands on its west part.
  ledge(g, box(132, 24, 143, 31), 209, "east", stepFor(209), { upper: [80, 24, 135, 31] });
  // E4 plaza-front deck (113) beyond the centre spine E5 (170); E5's own top is a flat deck.
  ledge(g, box(144, 16, 145, 39), 113, "east", stepFor(113), { upper: [144, 24, 145, 31] });
  ledge(g, box(144, 24, 145, 31), 170, "east", stepFor(170), {});
}
