// Part 2, Hillclimb landing: plot 1 terraces, N planted slope, zigzag stairs, benches and lamps.
// Works in plot-LOCAL coordinates (plan.md) and converts to site coordinates with the plot origin (PLOT1).
import { PLOT1, DECKS, onFootprint, groundAt } from "../vocab.mjs";
import { terraceMass, stairFlight, lampPost, benchRow } from "../vocab.mjs";

const Z = PLOT1[2];
const inL = (x, z) => onFootprint(1, x, z - Z);
const gndL = (x, z) => groundAt(1, x, z - Z);
const box = (x0, x1, z0, z1) => ({ x0, x1, z0: z0 + Z, z1: z1 + Z });

// Air-only write: an earlier part's block (or one of ours) is never overwritten.
function put(g, x, y, z, name, state) {
  if (!g.isAir(x, y, z)) return false;
  if (state) g.set(x, y, z, name, state); else g.set(x, y, z, name);
  return true;
}

// A planted step of the N slope: polished_andesite body from the ground up to deck-1 (the grey retaining face on
// its north side), grass and moss at the deck, low planting at deck+1, one small oak per 12 cells.
function plantedStep(g, { x0, x1, z0, z1, deck }) {
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0 + Z; z <= z1 + Z; z++) {
    if (!inL(x, z)) continue;
    const h = gndL(x, z);
    for (let y = h; y < deck; y++) put(g, x, y, z, "polished_andesite");
    put(g, x, deck, z, (x * 3 + z * 5) % 7 === 0 ? "moss_block" : "grass_block");
    cells.push([x, z]);
  }
  cells.forEach(([x, z], i) => {
    const pick = (x + 2 * z) % 5;
    if (pick === 1) put(g, x, deck + 1, z, "short_grass");
    else if (pick === 3) put(g, x, deck + 1, z, "azalea");
    else if (pick === 4) put(g, x, deck + 1, z, "flowering_azalea");
  });
  cells.forEach(([x, z], i) => {
    if (i % 12 !== 6) return;
    for (let dy = 1; dy <= 3; dy++) put(g, x, deck + dy, z, "oak_log", { axis: "y" });
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) put(g, x + dx, deck + 3, z + dz, "oak_leaves", { persistent: "true" });
    put(g, x, deck + 4, z, "oak_leaves", { persistent: "true" });
  });
  return cells.length;
}

export function build(g) {
  // 1. The zigzag stairs first, 9 wide, climbing north: S10 (D0 -> D1), S21 (D1 -> D2), S32 (D2 -> D3). Each flight:
  // from = its first tread (the south end), to = the upper deck's layer (7 treads each), landing = the row at the top.
  // They go first so the terraces (which only add into air) cannot put a rail post on a landing.
  const s10 = stairFlight(g, { from: [12, 3, 93 + Z], facing: "north", to: DECKS.D1, width: 9 });
  const s21 = stairFlight(g, { from: [24, 10, 69 + Z], facing: "north", to: DECKS.D2, width: 9 });
  const s32 = stairFlight(g, { from: [45, 17, 51 + Z], facing: "north", to: DECKS.D3, width: 9 });

  // 2. The built-up terraces, D0 .. D3 (each adds only into air, so the stair cells keep their treads and landings).
  terraceMass(g, { box: box(0, 44, 87, 131), deck: DECKS.D0, ground: gndL, inside: inL });
  terraceMass(g, { box: box(3, 50, 63, 86), deck: DECKS.D1, ground: gndL, inside: inL });
  terraceMass(g, { box: box(18, 62, 45, 62), deck: DECKS.D2, ground: gndL, inside: inL });
  terraceMass(g, { box: box(45, 77, 18, 44), deck: DECKS.D3, ground: gndL, inside: inL });
  // D3's east edge is open to the bridge from MarketFront: take out the rail posts on x 77 (our own blocks)
  for (const z of [18, 28, 38, 44]) if (g.isAir(77, 24, z + Z) === false) g.set(77, 24, z + Z, "air");
  // the rail posts and seats the terraces put at the upper deck's walk level, on a stair's zone (its cheeks, headroom
  // and landing row), come out: the flight owns those cells. Only those two block kinds are cleared, never a tread.
  for (const [sx, sz, top] of [[12, 93, DECKS.D1], [24, 69, DECKS.D2], [45, 51, DECKS.D3]]) {
    for (let x = sx - 1; x <= sx + 9; x++) for (let z = sz - 7; z <= sz; z++) {
      const y = top + 1, id = g.blockAt(x, y, z + Z);
      if (/minecraft:(andesite_wall|smooth_stone_slab)$/.test(id)) g.set(x, y, z + Z, "air");
    }
  }

  // 3. The N planted slope: three planted steps falling north (deck 16, 9, 2), each with its grey face to the north.
  const slope = [
    plantedStep(g, { x0: 30, x1: 65, z0: 12, z1: 17, deck: DECKS.D2 }),
    plantedStep(g, { x0: 30, x1: 53, z0: 6, z1: 11, deck: DECKS.D1 }),
    plantedStep(g, { x0: 30, x1: 44, z0: 0, z1: 5, deck: DECKS.D0 }),
  ];

  // 4. Benches on the landing plaza (D0) and the upper terrace (D2), facing west, on the deck tops.
  const benches = [
    benchRow(g, { x: 38, z0: 100 + Z, len: 6, y: DECKS.D0 + 1, facing: "west" }),
    benchRow(g, { x: 22, z0: 52 + Z, len: 6, y: DECKS.D2 + 1, facing: "west" }),
  ];

  // 5. Lamp posts on the deck tops at the stair heads.
  const lamps = [
    lampPost(g, { x: 54, z: 44 + Z, y: DECKS.D3 + 1 }),
    lampPost(g, { x: 23, z: 62 + Z, y: DECKS.D2 + 1 }),
    lampPost(g, { x: 33, z: 62 + Z, y: DECKS.D2 + 1 }),
    lampPost(g, { x: 11, z: 86 + Z, y: DECKS.D1 + 1 }),
    lampPost(g, { x: 21, z: 86 + Z, y: DECKS.D1 + 1 }),
  ];

  // 6. Dusk: a lantern on top of every terrace rail post, so each terrace edge reads as a line of lights.
  let railLights = 0;
  for (const d of [DECKS.D0, DECKS.D1, DECKS.D2, DECKS.D3]) for (let x = 0; x <= 80; x++) for (let z = Z; z <= Z + 132; z++) {
    if (/minecraft:andesite_wall$/.test(g.blockAt(x, d + 1, z)) && g.isAir(x, d + 2, z)) {
      g.set(x, d + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
      railLights++;
    }
  }

  return { stairs: [s10, s21, s32], slope, benches, lamps, railLights };
}
