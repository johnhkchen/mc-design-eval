// A demo of Dalaran's bridge parts: two crossings over a channel (water 4 deep, banks 7 over the water): a span of 15
// (one arch of 9) and a span of 30 (arches of 5, 9 and 5 on piers), with a causeway of 3 and a ferry stage beside.
import { Grid } from "../grid.mjs";
import { crossingBlocks, causewayBlocks } from "./bridges.mjs";
import { DALARAN as S } from "../dalaran/earthworks.mjs";
const water = 6, bed = 2, deck = 14;
function scene(span, fn, label) {
  const W = 3, L = span + 2 + 8, g = new Grid([W + 10, deck + 5, L]);
  for (let x = 0; x < W + 10; x++) for (let z = 0; z < L; z++) {
    const wet = z >= 4 + 1 && z <= 4 + span;
    for (let y = 0; y <= bed; y++) g.set(x, y, z, "stone");
    if (wet) for (let y = bed + 1; y <= water; y++) g.set(x, y, z, "water");
    else { for (let y = bed + 1; y < deck; y++) g.set(x, y, z, "dirt"); g.set(x, deck, z, "grass_block[snowy=false]"); }
  }
  for (const [i, o, y, b] of fn({ span, width: W, deck, water, bedAt: () => bed, style: S })) { const x = o + 5, z = i + 4; if (x >= 0 && z >= 0 && x < W + 10 && z < L && y >= 0 && y < deck + 5) b === "air" ? g.set(x, y, z, "air") : g.set(x, y, z, b); }
  return g;
}
for (const [span, fn, name] of [[15, crossingBlocks, "arch9"], [30, crossingBlocks, "arches"], [3, causewayBlocks, "causeway"]]) scene(span, fn, name).save(`out/bridges/dalaran_${name}_${span}.nbt`);
