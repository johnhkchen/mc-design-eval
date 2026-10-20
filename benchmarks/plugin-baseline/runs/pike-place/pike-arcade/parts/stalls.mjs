// Part: Stalls, craft tables, flower buckets, dusk props (parts/stalls.mjs).
// Street counters (S, x37..39) heaped with produce, flowers, fish, honey and crates in segments with gaps; the hall
// tables in B1 (x37..39, aisle x34..36 clear); the North Arcade craft tables (x30..32, z2..130, period 3: pair + lane).
// Every write goes through the vocab helpers, which only write into air.
// Local craft table: vocab's craft_table puts a decorated_pot and honeycomb_block is off palette, so the same table
// is drawn here with flower_pot-family wares (potted_*) that the palette has.
import { stall } from "../vocab.mjs";

// Street counters: x37..39 along S (z161..279). Floor 20 for z161..188 (counter y 21), floor 22 for z189..279 (y 23).
// Segments of 8 with 2-cell gaps keep the stalls as separate shops; the gaps stay air so the aisle reads.
// honey (honeycomb_block) is off palette: its segments are flowers, the palette's pot kind.
const S_KINDS = ["produce", "flowers", "produce", "fish", "flowers", "produce", "crates", "flowers", "produce", "fish", "flowers", "produce"];
const S_X = { x0: 37, x1: 39 };

const POST = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };

// Craft table x0..x0+2, z..z+1: fence legs from y, a top slab at y+1, wares at y+2. All-or-nothing, air only.
function craftTable(g, { x0, z, y }) {
  const cells = [];
  for (const x of [x0, x0 + 2]) for (const zz of [z, z + 1]) cells.push([x, y, zz, "dark_oak_fence", POST]);
  for (let x = x0; x <= x0 + 2; x++) for (let zz = z; zz <= z + 1; zz++) cells.push([x, y + 1, zz, "dark_oak_slab", { type: "top", waterlogged: "false" }]);
  cells.push([x0, y + 2, z, "potted_red_tulip"], [x0 + 2, y + 2, z, "potted_orange_tulip"], [x0, y + 2, z + 1, "candle", { candles: "1", lit: "true" }], [x0 + 2, y + 2, z + 1, "potted_poppy"]);
  if (!cells.every(([x, y2, zz]) => g.inBounds(x, y2, zz) && g.isAir(x, y2, zz))) return 0;
  for (const [x, y2, zz, block, state] of cells) g.set(x, y2, zz, block, state);
  return cells.length;
}

export function build(g) {
  // S: street counters
  let k = 0;
  for (let z0 = 161; z0 + 7 <= 279; z0 += 10, k++) {
    const z1 = z0 + 7;
    const y = z1 <= 188 ? 21 : 23; // stall base at floor + 1
    stall(g, { ...S_X, z0, z1, y, kind: S_KINDS[k % S_KINDS.length] });
  }

  // B1: hall craft tables, x37..39 (the aisle x34..36 stays clear), z134..159, pairs with one-cell lanes
  for (let z = 134; z + 1 <= 159; z += 3) craftTable(g, { x0: 37, z, y: 21 });

  // North Arcade: craft tables x30..32, z2..130, pairs with one-cell lanes, standing on the floor at 19
  for (let z = 2; z + 1 <= 130; z += 3) craftTable(g, { x0: 30, z, y: 20 });
}
