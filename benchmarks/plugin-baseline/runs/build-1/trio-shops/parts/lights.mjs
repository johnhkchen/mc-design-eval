// Part: lighting. Lanterns for the lobbies, flats, lofts, aisles and rear doors (plan.md "Lit interiors"; elements.md
// last item). Hanging lanterns hang from the floor above (flats); standing ones sit on a floor or a yard block (lobby,
// loft, aisle, rear door). Writes go into air only: a lamp with no support, or a cell an earlier part owns, is skipped.
import { HOUSES } from "../vocab.mjs";

/** One lantern on (x, y, z): hanging under a solid block above, or standing on a solid block below. */
function lamp(g, x, y, z, hanging) {
  const [sx, sy, sz] = hanging ? [x, y + 1, z] : [x, y - 1, z];
  if (!g.isAir(x, y, z) || g.isAir(sx, sy, sz)) return false;
  g.set(x, y, z, "lantern", { hanging: String(hanging), waterlogged: "false" });
  return true;
}

export function build(g) {
  for (const h of Object.values(HOUSES)) {
    const { a, lobby: [l0, l1] } = h;
    const doorX = l1 - 1;                                    // the rear door: lobby x (H1 35, H2 23, H3 3)

    // lobby: standing lamps on the shop floor, against the party wall side, clear of the z 7 door and z 24 door
    lamp(g, l0, 2, 9, false);
    lamp(g, l0, 2, 20, false);

    // flats: hung from the floor above (flat 1 under y 13, flat 2 under y 18), two rows of lamps across the plan
    for (const z of [11, 18]) {
      for (const x of [a + 4, a + 9]) {
        lamp(g, x, 12, z, true);                              // flat 1
        lamp(g, x, 17, z, true);                              // flat 2
      }
    }

    // the lobby-side strip (x a+2, the stair hall's inner corner) is the flats' darkest cells: one lamp per row
    lamp(g, a + 2, 17, 14, true);                             // flat 2
    lamp(g, a + 2, 17, 20, true);
    lamp(g, a + 2, 17, 22, true);                             // the rear corner by the keeper's door
    lamp(g, a + 9, 17, 22, true);

    // loft: standing lamps on the loft floor (y 18), under the roof
    for (const z of [11, 18]) for (const x of [a + 4, a + 9]) lamp(g, x, 19, z, false);
    lamp(g, a + 2, 19, 20, false);

    // service aisle behind the back walls (keeper's route, customers never enter)
    lamp(g, a === 1 ? 9 : a + 4, 1, 23, false);

    // rear yard: a lamp beside each rear door, standing on the yard grass
    lamp(g, doorX - 1, 2, 26, false);
  }
}
