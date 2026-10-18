// P1 front shell: plots 1-3 masonry, interior floors, party walls, the portico's attic block.
import { faceFrame, ground, rusticatedBase, terraceAndFloor, recessedWall, entablature, attic, deck, plainWall } from "../vocab.mjs";

const DI = "polished_diorite", SS = "smooth_stone";
const N = faceFrame("north", [0, 0, 175, 63]);
const E = faceFrame("east", [144, 0, 175, 30]);

export function build(g) {
  const fill = (x0, y0, z0, x1, y1, z1, b) => g.fill([x0, y0, z0], [x1, y1, z1], b);
  const win = (list) => list.map(([u0, u1]) => ({ u0, u1, y0: 3, y1: 8 }));
  const doors = [[86, 89], [94, 97], [102, 105]].map(([u0, u1]) => ({ u0, u1, y0: 1, y1: 8, door: true }));

  for (const p of [[0, 0, 63, 63], [64, 0, 127, 23], [128, 0, 143, 23], [144, 0, 175, 31]]) ground(g, p[0], p[1], p[2], p[3]);

  // base storeys: wing plane p 2, forward plane p 1; the keystone cell y 8 is left to P4, its back is closed here
  const baseSeg = (F, u0, u1, p, wins, extra = []) => {
    rusticatedBase(g, F, u0, u1, p, { openings: [...win(wins), ...extra] });
    for (const o of win(wins)) for (let u = Math.max(o.u0, u0); u <= Math.min(o.u1, u1); u++)
      for (const d of [p + 1, p + 2]) { const [x, z] = F.at(u, d); fill(x, 8, z, x, 8, z, DI); }
  };
  baseSeg(N, 64, 66, 2, [[63, 64]]);
  baseSeg(N, 67, 124, 1, [[79, 80], [111, 112]], doors);
  baseSeg(N, 125, 127, 2, [[127, 128]]);
  baseSeg(N, 128, 143, 2, [[127, 128], [135, 136], [143, 144]]);
  baseSeg(N, 144, 146, 2, [[143, 144]]);
  baseSeg(N, 147, 174, 1, [[152, 153], [160, 161], [168, 169]]);
  baseSeg(E, 1, 30, 1, [[6, 7], [15, 16], [24, 25]]);

  // floors y1, y9 (terrace and floor), y21, y33
  for (const [a, b] of [[64, 85], [90, 93], [98, 101], [106, 127]]) fill(a, 1, 4, b, 1, 22, SS);
  fill(128, 1, 2, 143, 1, 22, SS);
  fill(144, 1, 2, 146, 1, 29, SS); fill(147, 1, 1, 174, 1, 29, SS);
  terraceAndFloor(g, N, 64, 66, 2, 22, 9);
  terraceAndFloor(g, N, 67, 124, 1, 22, 9);
  terraceAndFloor(g, N, 125, 143, 2, 22, 9);
  fill(144, 9, 2, 146, 9, 29, SS); fill(147, 9, 1, 174, 9, 29, SS);
  for (const y of [21, 33]) {
    fill(65, y, 8, 126, y, 22, SS); fill(129, y, 8, 142, y, 22, SS); fill(145, y, 7, 168, y, 29, SS);
  }

  // recessed walls
  recessedWall(g, N, 64, 66, 6, { windows: [63] });
  recessedWall(g, N, 67, 84, 5, { windows: [79] });
  recessedWall(g, N, 85, 106, 5, { windows: [87, 95, 103], tall: true });
  recessedWall(g, N, 107, 124, 5, { windows: [111] });
  recessedWall(g, N, 125, 127, 6, { windows: [127] });
  recessedWall(g, N, 128, 143, 6, { windows: [127, 135, 143] });
  recessedWall(g, N, 144, 146, 6, { windows: [143] });
  recessedWall(g, N, 150, 171, 5, { windows: [152, 160, 168] });
  recessedWall(g, E, 7, 27, 5, { windows: [15, 24] });
  fill(169, 10, 4, 170, 33, 4, DI);
  // anta piers (solid; pilasters come later)
  fill(147, 10, 1, 149, 33, 6, DI);
  fill(172, 10, 1, 174, 33, 6, DI);
  fill(169, 10, 28, 174, 33, 30, DI);

  // entablature (triglyph cells left empty)
  entablature(g, N, 64, 66, 2);
  entablature(g, N, 67, 124, 1, { plainFrom: 75, plainTo: 116 });
  entablature(g, N, 125, 146, 2);
  entablature(g, N, 147, 174, 1);
  entablature(g, E, 1, 30, 1);
  fill(73, 36, 7, 118, 36, 11, SS); // supports the pediment's back

  // attics
  const pairs = (l) => l.map((u) => [u, u + 1]);
  attic(g, N, 64, 66, 3, 37, 39);
  attic(g, N, 67, 72, 2, 37, 39);
  attic(g, N, 119, 124, 2, 37, 39);
  attic(g, N, 125, 127, 3, 37, 39);
  attic(g, N, 128, 143, 3, 37, 39, { windows: pairs([127, 135, 143]), wy: 38 });
  attic(g, N, 144, 146, 3, 37, 39);
  attic(g, N, 147, 174, 2, 37, 42, { windows: pairs([152, 168]), wy: [39, 40] });
  attic(g, E, 1, 30, 2, 37, 42, { windows: pairs([6, 24]), wy: [39, 40] });
  attic(g, N, 73, 118, 12, 37, 43, { windows: pairs([87, 103]), wy: [39, 40] });
  fill(73, 37, 14, 73, 43, 22, DI); fill(118, 37, 14, 118, 43, 22, DI);

  // decks
  deck(g, 64, 5, 66, 22, 39); deck(g, 67, 4, 72, 22, 39); deck(g, 119, 4, 124, 22, 39); deck(g, 125, 5, 127, 22, 39);
  deck(g, 128, 5, 143, 22, 39);
  deck(g, 73, 12, 118, 23, 43);
  deck(g, 144, 5, 146, 7, 39);
  deck(g, 145, 8, 171, 29, 42); deck(g, 147, 4, 171, 7, 42);

  // rear and party walls
  fill(64, 1, 23, 127, 39, 23, DI); fill(73, 40, 23, 118, 43, 23, DI);
  fill(128, 1, 23, 143, 39, 23, DI);
  for (const x of [64, 127, 128, 143]) fill(x, 1, 8, x, 39, 22, DI);
  fill(144, 1, 8, 144, 42, 23, DI);
  plainWall(g, [144, 1, 24, 144, 42, 30]);
  plainWall(g, [145, 1, 30, 174, 42, 30]);
}
