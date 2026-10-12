// P3 street front (plan.md "Street front", E3 E4 E5 E6 E29): the sidewalk and kerb, the entrance step, the fauces doors with
// their fanlight and lintel row, the four shop counters with their pots, the shutters, and the lampstands and pots on the
// sidewalk. Everything is written from vocab.mjs helpers; the shell (P1) owns the walls, so this part only adds into air.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { ANDESITE, POLISHED_ANDESITE, DARK_OAK_PLANKS, SHOP_WINDOWS, SHUTTER_XS, SIDEWALK_LAMPSTANDS, SIDEWALK_POTS,
  STEP, FAUCES, doorPair, shopWindow, shutter, step, lampStand, pot } from "../vocab.mjs";

// The sidewalk: andesite 60 / polished_andesite 40, hashed by position so the pattern does not repeat in rows.
const paveAt = (x, z) => ((x * 7 + z * 13) % 10 < 6 ? ANDESITE : POLISHED_ANDESITE);

export function build(g) {
  // E29 pavement: sidewalk z0..1 at y0, x0..35.
  for (let x = 0; x <= 35; x++) for (let z = 0; z <= 1; z++) g.set(x, 0, z, paveAt(x, z));

  // E29 kerb: stone_brick_slab bottom along z=0 at y1, except the entrance step cells x16..19.
  for (let x = 0; x <= 35; x++) {
    if (x >= STEP.x0 && x <= STEP.x1) continue;
    g.set(x, 1, 0, ...B.slab("stone_brick", "bottom"));
  }

  // E4 entrance step: stone_brick_stairs rising south into the floor at y1, z=1.
  step(g, STEP.x0, STEP.x1, STEP.z);

  // E3 fauces doors: two open spruce door pairs at z=4 (x16+17 and x18+19), a fanlight row of spruce trapdoors at y4 and a
  // dark_oak_planks lintel at y5.
  doorPair(g, FAUCES.x0, FAUCES.zDoors, "x", "north");
  doorPair(g, FAUCES.x0 + 2, FAUCES.zDoors, "x", "north");
  for (let x = FAUCES.x0; x <= FAUCES.x1; x++) {
    g.set(x, 4, FAUCES.zDoors, ...B.trapdoor("spruce", "north", "top", false));
    g.set(x, 5, FAUCES.zDoors, DARK_OAK_PLANKS);
  }

  // E5 shop counters and pots: a stone_brick_slab counter across each street window at y2, one decorated_pot on it.
  for (const { x0, x1 } of SHOP_WINDOWS) shopWindow(g, x0, x1);

  // E6 shutters: open spruce trapdoors on the sidewalk face of the wall, two high (y3, y4), either side of each window.
  // The lampstands at x14 and x21 need the cells (14,3,1) and (21,3,1) for their lanterns, so those two shutter stacks are
  // left out (see plan.md Notes).
  const lampXs = new Set(SIDEWALK_LAMPSTANDS.map(([x]) => x));
  for (const x of SHUTTER_XS) {
    if (lampXs.has(x)) continue;
    shutter(g, x, 3, 1);
  }

  // Sidewalk lampstands (base y1: slab y1, bars y2, lantern y3) and potted ferns on stone_bricks pedestals (y1, pot y2).
  for (const [x, z] of SIDEWALK_LAMPSTANDS) lampStand(g, x, z, 1);
  for (const [x, z] of SIDEWALK_POTS) pot(g, x, z, "fern", 1);
}
