// A demo of Dalaran's earthworks on a hill: two 3-high courses with a paved, planted terrace between, a flight up
// through each (offset, as a hill town climbs), 18 long, on a paved street. North to south (z): the high ground, the
// upper course (z 5-7), the terrace (z 8 planted, z 9-13 paved, on the lower course's top), the lower course (z 13-15),
// the street (z 16-18). A flight is 2 x rise + 1 deep, so the lower one lands on the terrace's walk at z 9.
import { retain, terrace, steps } from "../lordaeron/earthworks.mjs";
import { DALARAN as style } from "./earthworks.mjs";
import { Grid } from "../grid.mjs";
const L = 18, h = 3, D = 19, g = new Grid([L, 2 + 2 * h + 4, D]);
const lower = 4, upper = 11;                               // the flights' west columns, 4 wide each
const fill = (x, z, top, surface) => { for (let y = 0; y < top; y++) g.set(x, y, z, "dirt"); g.set(x, top, z, surface); };
for (let x = 0; x < L; x++) {
  for (let z = 16; z < D; z++) fill(x, z, 2, (x + z) % 3 ? "stone_bricks" : "polished_andesite");             // the street
  for (let z = 0; z < 5; z++) fill(x, z, 2 + 2 * h, "grass_block[snowy=false]");                              // the high ground
  for (let z = 10; z < 13; z++) fill(x, z, 2 + h, (x * 3 + z) % 4 ? "polished_andesite" : "stone_bricks");    // the terrace's paving
  if (x < lower || x >= lower + 4) g.paste(retain(["T", "W", "A"], { h, seed: x, lamp: x % 5 === 2 ? [0, 1] : null, style }), x, 0, 13);
  g.paste(terrace({ seed: x * 7, lamp: x % 6 === 1, style }), x, h, 8);
  for (let z = 5; z < 10; z++) for (let y = 0; y < 3; y++) g.set(x, y, z, "dirt");                         // under the upper tiles
  if (x < upper || x >= upper + 4) g.paste(retain(["T", "W", "A"], { h, seed: 40 + x, lamp: x % 5 === 2 ? [0, 1] : null, style }), x, h, 5);
}
const s = steps({ h, seed: 3, style });
g.paste(s, lower, 0, 16 - s.size[2]);                     // foot on the lower course's apron row (z 15), landing z 9
g.paste(s, upper, h, 8 - s.size[2]);                      // foot at z 7, landing z 1 on the high ground
g.save(process.argv[2] || "out/earthworks/dalaran_demo_terrace.nbt");
