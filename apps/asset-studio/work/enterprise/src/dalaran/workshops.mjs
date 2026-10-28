// Dalaran trade workshops (workshop:<trade>): Lordaeron's recipe on the platform_hall shell: a 10-wide, 2-storey hall,
// the trade's workstation in the hall below (declared, vanilla), shop bays on the street with the trade's goods on the
// counter (a shop shows its product), stock in the hall, a chamber with two made beds above, one hipped roof.
import { compose, metaOf, dalaranLayout } from "./compose.mjs";
import { WS } from "../lordaeron/stalls.mjs";
import { SHOW, TRADES } from "../lordaeron/workshops.mjs";
export { TRADES };

export function dalaranWorkshop(trade) {
  const [a, b] = SHOW[trade];
  const L = dalaranLayout({ W: 10, D: 7, storeys: 2, shop: true, trade: `minecraft:${WS[trade]}`, beds: 2 });
  for (const s of L.shell.filter((s) => s.module === "bay_shop_ground")) L.plan.push({ storey: 0, module: `goods_${a}`, at: [s.i, L.body[1]], dy: 2 }, { storey: 0, module: `goods_${b}`, at: [s.i + 1, L.body[1]], dy: 2 });
  L.plan.push({ storey: 0, module: `goods_${a}`, at: [5, 1], dy: 1 }, { storey: 0, module: `goods_${b}`, at: [6, 1], dy: 1 });
  return { layout: L, grid: compose(L), meta: metaOf(L) };
}
