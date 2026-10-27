// A demo of the cut-face finish: a 12-long natural cut 3 high, variants by hash, a 1-wide path stair through it.
import { cutFace, steps } from "./earthworks.mjs";
import { Grid } from "../grid.mjs";
const h = 3, g = new Grid([15, 2 + h + 3, 7]);
let x = 0;
for (let i = 0; i < 12; i++) {
  if (i === 5) { const s = steps({ h, seed: 43, flight: 1 }); g.paste(s, x, 0, 7 - s.size[2]); x += 3; continue; }
  g.paste(cutFace({ h, seed: "abc".charCodeAt(i * 7 % 3) * 17 + h + i }), x, 0, 4); x += 1;
}
for (let xx = 0; xx < g.size[0]; xx++) for (let z = 0; z < 4; z++) if (!g.get(xx, 2, z)) { for (let y = 0; y < 2 + h; y++) g.set(xx, y, z, "dirt"); g.set(xx, 2 + h, z, "grass_block[snowy=false]"); }
g.save(process.argv[2] || "out/earthworks/demo_cutface_h3.nbt");
