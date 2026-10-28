// Lordaeron trade workshops (workshop:<trade>): a 10-wide, 2-storey house: the trade's workstation in the hall below
// (declared, vanilla), a shop front with the trade's goods on the counter in the window (a shop shows its product),
// stock in the hall, a chamber with two made beds above. The trade's yard on the street is a yard tile (by trade).
import { compose, layoutOf, metaOf } from "./compose.mjs";
import { WS } from "./stalls.mjs";

export const SHOW = {   // two goods for the shop window, by trade (modules goods_*)
  farmer: ["hay", "pumpkin"], librarian: ["books", "candle"], cartographer: ["pot", "books"], fletcher: ["target", "hay"],
  fisherman: ["kelp", "pickle"], shepherd: ["wool", "blue"], cleric: ["candle", "pot"], butcher: ["meat", "chain"],
  leatherworker: ["leather", "wool"], mason: ["stone", "stone"], armorer: ["iron", "chain"], toolsmith: ["iron", "bars"], weaponsmith: ["bars", "iron"],
};
export const TRADES = Object.keys(SHOW);

export function workshop(trade) {
  const [a, b] = SHOW[trade];
  const L = layoutOf({ W: 10, D: 7, storeys: 2, roof: "gable_x", shop: true, trade: `minecraft:${WS[trade]}`, beds: 2 });
  // the shop windows: goods on the counter of each shop bay (the relief row z = D; the counter at y 1, goods at y 2)
  for (const s of L.shell.filter((s) => s.module === "bay_shop_ground")) L.plan.push({ storey: 0, module: `goods_${a}`, at: [s.i, L.body[1]], dy: 2 }, { storey: 0, module: `goods_${b}`, at: [s.i + 1, L.body[1]], dy: 2 });
  // stock in the hall's back corner
  L.plan.push({ storey: 0, module: `goods_${a}`, at: [5, 1], dy: 1 }, { storey: 0, module: `goods_${b}`, at: [6, 1], dy: 1 });
  return { layout: L, grid: compose(L), meta: metaOf(L) };
}
