// The Lordaeron market stall set: one family, a stall per trade. 3 x 3 (today's slot): the trade's workstation (the
// declared one, vanilla) at the centre on the counter line, a locker chest behind it (declared), counters either side
// showing the trade's goods, four posts, a striped stepped awning, a lantern under it. Everything else that looks like a
// job site is the mod's twin. Front (the customers' side) faces south.
import { Grid } from "../grid.mjs";

const WS = {
  farmer: "composter[level=0]", librarian: "lectern[facing=south,has_book=false,powered=false]", cartographer: "cartography_table",
  fletcher: "fletching_table", fisherman: "barrel[facing=up,open=false]", shepherd: "loom[facing=south]",
  cleric: "brewing_stand[has_bottle_0=false,has_bottle_1=false,has_bottle_2=false]", butcher: "smoker[facing=south,lit=false]",
  leatherworker: "cauldron", mason: "stonecutter[facing=south]", armorer: "blast_furnace[facing=south,lit=false]",
  toolsmith: "smithing_table", weaponsmith: "grindstone[face=floor,facing=south]",
};
// goods on the two counters: [west, east], each a block on the counter top
const GOODS = {
  farmer: ["hay_block[axis=y]", "carved_pumpkin[facing=south]"], librarian: ["bookshelf", "chiseled_bookshelf[facing=south,slot_0_occupied=true,slot_1_occupied=true,slot_2_occupied=false,slot_3_occupied=true,slot_4_occupied=false,slot_5_occupied=true]"],
  cartographer: ["white_banner[rotation=8]", "decorated_pot[cracked=false,facing=south,waterlogged=false]"], fletcher: ["target[power=0]", "hay_block[axis=x]"],
  fisherman: ["dried_kelp_block", "sea_pickle[pickles=3,waterlogged=false]"], shepherd: ["white_wool", "light_blue_wool"],
  cleric: ["candle[candles=3,lit=true,waterlogged=false]", "potted_allium"], butcher: ["chain[axis=y,waterlogged=false]", "red_terracotta"],
  leatherworker: ["brown_wool", "orange_carpet"], mason: ["chiseled_stone_bricks", "polished_andesite"],
  armorer: ["iron_block", "chain[axis=y,waterlogged=false]"], toolsmith: ["anvil[facing=east]", "iron_bars[east=false,north=false,south=false,waterlogged=false,west=false]"],
  weaponsmith: ["anvil[facing=west]", "iron_bars[east=false,north=false,south=false,waterlogged=false,west=false]"],
};
const AWNING = {
  farmer: ["green", "white"], librarian: ["brown", "white"], cartographer: ["blue", "white"], fletcher: ["lime", "white"],
  fisherman: ["light_blue", "white"], shepherd: ["pink", "white"], cleric: ["purple", "white"], butcher: ["red", "white"],
  leatherworker: ["orange", "white"], mason: ["gray", "white"], armorer: ["black", "white"], toolsmith: ["cyan", "white"], weaponsmith: ["red", "black"],
};
export const TRADES = Object.keys(WS);

/** A 3 x 3 stall: layer 0 is the paving (the ground row), the counter at layer 1. */
export function stall(trade) {
  const g = new Grid([3, 6, 3]), [c1, c2] = AWNING[trade];
  for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) g.set(x, 0, z, "spruce_slab[type=top,waterlogged=false]");   // a timber floor
  // four corner posts
  for (const [x, z] of [[0, 0], [2, 0], [0, 2], [2, 2]]) for (let y = 1; y <= 3; y++) g.set(x, y, z, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]");
  // the back: the locker chest behind the workstation, a shelf of stock either side
  g.set(1, 1, 0, "chest[facing=south,type=single,waterlogged=false]");
  g.set(0, 1, 1, "spruce_slab[type=top,waterlogged=false]"); g.set(2, 1, 1, "spruce_slab[type=top,waterlogged=false]");      // counters, west and east
  g.set(0, 2, 1, GOODS[trade][0]); g.set(2, 2, 1, GOODS[trade][1]);
  // the workstation on the counter line, the customers' side open
  g.set(1, 1, 1, WS[trade]);
  // the awning: a striped stepped canopy, high at the back, a lantern under its middle
  for (let x = 0; x < 3; x++) {
    const col = `${x % 2 ? c2 : c1}`;
    g.set(x, 4, 0, `${col}_wool`);
    g.set(x, 4, 1, `${col}_wool`);
    g.set(x, 4, 2, `${col}_carpet`);                                      // the front edge, light
  }
  g.set(1, 5, 0, "spruce_slab[type=bottom,waterlogged=false]");            // the ridge board
  g.set(1, 3, 1, "lantern[hanging=true,waterlogged=false]");
  g.set(0, 3, 0, "spruce_fence[east=true,north=false,south=false,waterlogged=false,west=false]"); g.set(2, 3, 0, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=true]");
  g.set(1, 3, 0, "spruce_fence[east=true,north=false,south=false,waterlogged=false,west=true]");                   // a rail for hanging stock
  g.set(1, 2, 0, trade === "butcher" ? "chain[axis=y,waterlogged=false]" : "air");
  const ws = WS[trade].replace(/\[.*$/, "");
  return { grid: g, meta: { footprint: [3, 3], height: 6, ground: 0, entrances: [{ at: [1, 1, 2], facing: "south", width: 1 }],
    beds: [], workstations: [{ at: [1, 1, 1], block: `minecraft:${ws}` }], lockers: [{ at: [1, 1, 0], for: [1, 1, 1] }],
    markers: [], pilings: [], entities: [], mirror: true } };
}
