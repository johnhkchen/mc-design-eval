// P9 glazing: glass runs into every window opening on plots 0-3, per plan OPENINGS. Glass sits 1 in from the wall face
// (base d p+1, recessed wall d w+1, attic a+1), so each run is written at its glass depth through its face frame.
// Only air is written: a cell an earlier part left closed is refused and reported, never forced. Drum, lantern and
// door transoms are not glazed here.
import { faceFrame, glassRun } from "../vocab.mjs";

const N = faceFrame("north", [0, 0, 175, 63]);
const S0 = faceFrame("south", [0, 0, 63, 63]);
const E0 = faceFrame("east", [0, 0, 63, 63]);
const W0 = faceFrame("west", [0, 0, 63, 63]);
const E = faceFrame("east", [144, 0, 175, 30]);

// Base storey glass y 3..7, lower storey y 11..19, upper y 23..30 (the wall's two storeys)
const BASE = [3, 7], LOWER = [11, 19], UPPER = [23, 30];

export function build(g) {
  const refused = [];
  // a cell already glass is the corner that two faces both glaze (the window's inner corner): not a refusal
  const run = (F, u0, u1, d, [y0, y1]) => {
    const res = glassRun(g, F, u0, u1, d, y0, y1);
    refused.push(...res.refused.filter(([x, y, z]) => !/gray_stained_glass_pane$/.test(g.blockAt(x, y, z))));
  };
  const twoStorey = (F, u0, u1, d) => { run(F, u0, u1, d, LOWER); run(F, u0, u1, d, UPPER); };

  // plot 0: the dome pavilion, seven windows on each face (glass at d 3 in the base, d 7 in the walls)
  const plot0 = [[7, 8], [15, 16], [23, 24], [31, 32], [39, 40], [47, 48], [55, 56]];
  for (const F of [N, S0, E0, W0]) for (const [u0, u1] of plot0) {
    run(F, u0, u1, 3, BASE);
    twoStorey(F, u0, u1, 7);
  }

  // plot 1: the portico (glass d 2 in the base, d 6 in the recessed wall, d 13 behind the central attic)
  for (const [u0, u1] of [[79, 80], [111, 112]]) {
    run(N, u0, u1, 2, BASE);
    twoStorey(N, u0, u1, 6);
  }
  for (const [u0, u1] of [[87, 88], [95, 96], [103, 104]]) run(N, u0, u1, 6, [11, 30]); // the tall central openings
  for (const x of [64, 127]) { run(N, x, x, 3, BASE); twoStorey(N, x, x, 7); } // joint columns, wing plane
  for (const [u0, u1] of [[87, 88], [103, 104]]) run(N, u0, u1, 13, [39, 40]); // central attic

  // plot 2: the wing bay (joint halves at 128 and 143; 127 and 144 belong to the neighbouring plots)
  for (const x of [128, 143]) { run(N, x, x, 3, BASE); twoStorey(N, x, x, 7); }
  run(N, 135, 136, 3, BASE); twoStorey(N, 135, 136, 7);
  for (const x of [128, 135, 136, 143]) run(N, x, x, 4, [38, 38]); // attic

  // plot 3: the corner pavilion (north: d 2 base, d 6 walls; east: x 173 base, x 169 walls, x 172 attic)
  for (const [u0, u1] of [[152, 153], [160, 161], [168, 169]]) {
    run(N, u0, u1, 2, BASE);
    twoStorey(N, u0, u1, 6);
  }
  run(N, 144, 144, 3, BASE); twoStorey(N, 144, 144, 7); // joint column
  for (const [u0, u1] of [[152, 153], [168, 169]]) run(N, u0, u1, 3, [39, 40]); // north attic
  for (const [u0, u1] of [[6, 7], [15, 16], [24, 25]]) run(E, u0, u1, 2, BASE); // base: all three
  for (const [u0, u1] of [[15, 16], [24, 25]]) twoStorey(E, u0, u1, 6); // upper: z 6..7 is the north window's corner (P1 omits it)
  for (const [u0, u1] of [[6, 7], [24, 25]]) run(E, u0, u1, 3, [39, 40]); // east attic

  connectPanes(g);
  if (refused.length) console.log(`glazing: ${refused.length} glass cells refused (not air)`, JSON.stringify(refused.slice(0, 40)));
}

// A pane also joins glass that meets it round a corner (the two faces' windows share their corner cell), so each
// pane is connected to every glass neighbour as well as to the solid wall its run was set against.
function connectPanes(g) {
  for (const c of [...g.cells.values()]) {
    if (!/gray_stained_glass_pane$/.test(c.block)) continue;
    const [x, y, z] = c.pos;
    const s = { north: "false", east: "false", south: "false", west: "false", ...c.state };
    const next = { north: [x, y, z - 1], south: [x, y, z + 1], east: [x + 1, y, z], west: [x - 1, y, z] };
    let changed = false;
    for (const [dir, [nx, ny, nz]] of Object.entries(next))
      if (g.inBounds(nx, ny, nz) && /gray_stained_glass_pane$/.test(g.blockAt(nx, ny, nz)) && s[dir] !== "true") {
        s[dir] = "true";
        changed = true;
      }
    if (changed) g.set(x, y, z, "gray_stained_glass_pane", s);
  }
}
