// Dalaran's market stall: Lordaeron's 3 x 3 stall contract (the trade's declared workstation at the centre on the
// counter line, its locker chest behind, goods on the counters either side, the customers' side south) in Dalaran's
// dress: red posts, a dark timber floor and counters, a small hipped roof of violet tile with upturned corners (the houses' hipRoof), the
// trade's colour on a cloth hung across the back, a lantern under the roof.
import { Grid } from "../grid.mjs";
import { WS, GOODS, AWNING } from "../lordaeron/stalls.mjs";
import { hipRoof } from "./modules.mjs";

const POST = "mangrove_fence[east=false,north=false,south=false,waterlogged=false,west=false]";

export function dalaranStall(trade) {
  const roof = hipRoof(3, 3), g = new Grid([3, 4 + roof.size[1], 3]), [c1] = AWNING[trade];
  for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) g.set(x, 0, z, "dark_oak_slab[type=top,waterlogged=false]");   // a timber floor
  for (const [x, z] of [[0, 0], [2, 0], [0, 2], [2, 2]]) for (let y = 1; y <= 3; y++) g.set(x, y, z, POST);
  g.set(1, 1, 0, "chest[facing=south,type=single,waterlogged=false]");
  g.set(0, 1, 1, "dark_oak_slab[type=top,waterlogged=false]"); g.set(2, 1, 1, "dark_oak_slab[type=top,waterlogged=false]");
  g.set(0, 2, 1, GOODS[trade][0]); g.set(2, 2, 1, GOODS[trade][1]);
  g.set(1, 1, 1, WS[trade]);
  // the trade's cloth across the back, between the posts, over the locker
  g.set(1, 3, 0, `${c1}_wool`);
  g.set(1, 2, 0, trade === "butcher" ? "chain[axis=y,waterlogged=false]" : "air");
  // the roof: Dalaran's hip at stall size (the houses' own builder): upturned corners, a capped peak and a finial
  g.paste(roof, 0, 4, 0);
  g.set(1, 3, 1, "lantern[hanging=true,waterlogged=false]");
  const ws = WS[trade].replace(/\[.*$/, "");
  return { grid: g, meta: { footprint: [3, 3], height: g.size[1], ground: 0, entrances: [{ at: [1, 1, 2], facing: "south", width: 1 }],
    beds: [], workstations: [{ at: [1, 1, 1], block: `minecraft:${ws}` }], lockers: [{ at: [1, 1, 0], for: [1, 1, 1] }],
    markers: [], pilings: [], entities: [], mirror: true } };
}
