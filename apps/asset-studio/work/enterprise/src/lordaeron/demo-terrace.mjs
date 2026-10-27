// A demo of two courses with a dressed terrace between: a 3-high course, a 2-deep terrace, a 3-high course, 16 long.
import { retain, terrace } from "./earthworks.mjs";
import { Grid } from "../grid.mjs";
const L = 16, g = new Grid([L, 14, 10]);
for (let x = 0; x < L; x++) {
  g.paste(retain(["T", "W", "A"], { h: 3, seed: x, lamp: x % 5 === 2 ? [0, 1] : null }), x, 0, 7);          // the lower course, low ground at z 9
  g.paste(terrace({ seed: x * 7, lamp: x % 5 === 0 }), x, 3, 6);                                           // on the lower course's top (layer 5)
  g.paste(retain(["T", "W", "A"], { h: 3, seed: 40 + x, lamp: x % 5 === 2 ? [0, 1] : null }), x, 3, 3);     // the upper course, its foot on the terrace
  for (let z = 0; z < 3; z++) { for (let y = 0; y < 8; y++) g.set(x, y, z, "dirt"); g.set(x, 8, z, "grass_block[snowy=false]"); }
  for (let z = 3; z < 7; z++) for (let y = 0; y < 3; y++) if (!g.get(x, y, z)) g.set(x, y, z, "dirt");
}
g.save(process.argv[2] || "out/earthworks/demo_terrace.nbt");
