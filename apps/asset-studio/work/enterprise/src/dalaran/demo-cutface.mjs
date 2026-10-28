// A demo of Dalaran's cut face: a 4-high face, 12 long, dressed stone gone mossy, between two walled runs (as the set's
// rule mixes them: walls where the street runs close, cut faces in the open), a 1-wide flight through the face.
import { cutFace, steps, retain } from "../lordaeron/earthworks.mjs";
import { DALARAN as style } from "./earthworks.mjs";
import { Grid } from "../grid.mjs";
const h = 4, g = new Grid([22, 2 + h + 4, 9]);
let x = 0;
for (let i = 0; i < 4; i++) g.paste(retain(["T", "W", "A"], { h, seed: i, lamp: i === 1 ? [0, 1] : null, style }), x++, 0, 6);
for (let i = 0; i < 12; i++) {
  if (i === 5) { const s = steps({ h, seed: 43, flight: 1, style }); g.paste(s, x, 0, 9 - s.size[2]); x += 3; continue; }
  g.paste(cutFace({ h, seed: "abc".charCodeAt(i * 7 % 3) * 17 + h + i, style }), x++, 0, 6);
}
for (let i = 0; i < 4; i++) g.paste(retain(["T", "W", "A"], { h, seed: 9 + i, lamp: i === 2 ? [0, 1] : null, style }), x++, 0, 6);
for (let xx = 0; xx < g.size[0]; xx++) for (let z = 0; z < 6; z++) if (!g.get(xx, 2, z)) { for (let y = 0; y < 2 + h; y++) g.set(xx, y, z, "dirt"); g.set(xx, 2 + h, z, "grass_block[snowy=false]"); }
g.save(process.argv[2] || "out/earthworks/dalaran_demo_cutface_h4.nbt");
