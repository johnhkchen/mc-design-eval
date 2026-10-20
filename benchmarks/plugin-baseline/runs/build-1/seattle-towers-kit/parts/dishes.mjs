// P4 satellite dishes: the 14 dishes of plan.md's DISHES table (D1..D11 on KOMO Plaza East, W1..W3 on KOMO Plaza West),
// each set on its roof with dish(). deckY is the roof slab's block y (KOMO_*_ROOF_Y): the pedestal stands on that
// block, so the walking surface is one above it. Every dish top then sits at or under its table top y.
import { dish, KOMO_E_NORTH_ROOF_Y, KOMO_E_SOUTH_ROOF_Y, KOMO_PODIUM_ROOF_Y, KOMO_TAIL_ROOF_Y, KOMO_W_ROOF_Y } from "../vocab.mjs";

// [name, cx, cz, deckY, bowl diameter], from plan.md's DISHES table
const DISHES = [
  ["D1", 40, 26, KOMO_E_NORTH_ROOF_Y, 9],
  ["D2", 60, 20, KOMO_E_NORTH_ROOF_Y, 7],
  ["D3", 82, 16, KOMO_E_NORTH_ROOF_Y, 9],
  ["D4", 94, 36, KOMO_E_NORTH_ROOF_Y, 7],
  ["D5", 34, 40, KOMO_E_NORTH_ROOF_Y, 5],
  ["D6", 68, 62, KOMO_E_SOUTH_ROOF_Y, 9],
  ["D7", 90, 72, KOMO_E_SOUTH_ROOF_Y, 7],
  ["D8", 70, 88, KOMO_E_SOUTH_ROOF_Y, 7],
  ["D9", 92, 102, KOMO_E_SOUTH_ROOF_Y, 9],
  ["D10", 88, 120, KOMO_TAIL_ROOF_Y, 5],
  ["D11", 50, 54, KOMO_PODIUM_ROOF_Y, 5],
  ["W1", 120, 36, KOMO_W_ROOF_Y, 7],
  ["W2", 136, 44, KOMO_W_ROOF_Y, 5],
  ["W3", 146, 57, KOMO_PODIUM_ROOF_Y, 5],
];

export function build(g) {
  const refused = [];
  let placed = 0;
  for (const [, cx, cz, deckY, d] of DISHES) {
    const r = dish(g, { cx, cz, deckY, d });
    placed += r.placed;
    refused.push(...r.refused);
  }
  return { placed, refused };
}
