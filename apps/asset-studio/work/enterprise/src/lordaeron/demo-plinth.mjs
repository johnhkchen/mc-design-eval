// A demo of rev 3's pieces: a stepped plinth (rise 2) round a 5 x 5 block on a fill, and a side flight (rise 3) in a
// 3-deep front yard with retaining tiles along the rest of the street edge.
import { plinth, sideSteps, retain } from "./earthworks.mjs";
import { Grid } from "../grid.mjs";
const g = new Grid([30, 9, 14]);
for (let x = 0; x < 30; x++) for (let z = 0; z < 14; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, "grass_block[snowy=false]"); }
// the house block at x 4-8, z 4-8, its ground at layer 4 (rise 2)
const h = 2, X0 = 4, Z0 = 4, N = 5;
for (let x = X0; x < X0 + N; x++) for (let z = Z0; z < Z0 + N; z++) { g.set(x, 3, z, "dirt"); g.set(x, 4, z, "stone_bricks"); for (let y = 5; y < 8; y++) g.set(x, y, z, "white_terracotta"); }
const run = plinth({ h, seed: 3 }), cor = plinth({ h, seed: 4, corner: true });
for (let i = 0; i < N; i++) {
  g.paste(run, X0 + i, 0, Z0 + N);                        // south face: z 0 of the tile touches the wall
  g.paste(run, X0 + N, 0, Z0 + i, { q: 3 });               // east face
  g.paste(run, X0 + i, 0, Z0 - h - 1, { q: 2 });           // north face
  g.paste(run, X0 - h - 1, 0, Z0 + i, { q: 1 });           // west face
}
g.paste(cor, X0 + N, 0, Z0 + N);                           // the south-east corner (house to its north-west)
g.paste(cor, X0 + N, 0, Z0 - h - 1, { q: 3 }); g.paste(cor, X0 - h - 1, 0, Z0 - h - 1, { q: 2 }); g.paste(cor, X0 - h - 1, 0, Z0 + N, { q: 1 });
// the side flight: a yard 3 high above the street, 3 deep, z 3-5 of a strip at x 14-29 (street to the south, z 6+)
const s = sideSteps({ h: 3, seed: 1 }); const SX = 18;
const pad = new Grid([12, 9, 3]);
for (let x = 0; x < 30; x++) if (x >= 14) for (let z = 0; z < 6; z++) { for (let y = 3; y < 5; y++) g.set(x, y, z, "dirt"); g.set(x, 5, z, "grass_block[snowy=false]"); }
g.paste(s, SX, 0, 3);
for (let x = 14; x < 30; x++) if (x < SX || x >= SX + s.size[0]) g.paste(retain(["T", "W", "A"], { h: 3, seed: x }), x, 0, 4);
g.save(process.argv[2] || "out/earthworks/demo_plinth.nbt");
