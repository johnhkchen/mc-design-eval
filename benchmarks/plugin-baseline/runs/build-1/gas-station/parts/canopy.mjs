// Part "Fuel canopy and pumps" (parts/canopy.mjs): the flat fuel canopy deck (y7..9, x6..34 z9..20), its four 2x1
// columns on the pump islands, the two raised islands with yellow bollards, and the four pumps (two per island).
// Coordinates from plan.md SITE / FACADES / RESERVED. Nothing pitched; every write goes through the vocab helpers,
// which only write into air inside their own footprint.
import { canopy_deck, canopy_column, pump_island, fuel_pump, CANOPY_DECK, CANOPY_COLUMNS, ISLAND_A, ISLAND_B } from "../vocab.mjs";

export function build(g) {
  // Canopy deck: soffit y7 (smooth_quartz, sea_lantern light grid), perimeter ring y7 white / y8 red, top y9 white.
  canopy_deck(g, CANOPY_DECK.x0, CANOPY_DECK.z0, CANOPY_DECK.x1, CANOPY_DECK.z1);

  // Pump islands: polished_andesite curb at y1, yellow bollards y2 on the end corners.
  pump_island(g, ISLAND_A.x0, ISLAND_A.z0, ISLAND_A.z1);
  pump_island(g, ISLAND_B.x0, ISLAND_B.z0, ISLAND_B.z1);

  // Canopy columns: 2x1 stubs, polished_andesite base y2, smooth_quartz shaft to y6, under the soffit at y7.
  for (const [x, z] of CANOPY_COLUMNS) canopy_column(g, x, z);

  // Fuel pumps: one pair per island, at z14 and z15; z13 and z16 stay clear (hose / air).
  for (const x of [ISLAND_A.x0, ISLAND_B.x0]) for (const z of [14, 15]) fuel_pump(g, x, z);
}
