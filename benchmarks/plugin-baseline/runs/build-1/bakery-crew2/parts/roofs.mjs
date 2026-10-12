// Part 2, Roofs: the main slate roof (roof.json, laid by runParts right after the shell) and the wing roof (gable,
// ridge along z at x=19, y=8). The main roof's spec lives in roof.json; roofMain re-reads it so the part stays self-contained.
// roofWing (vocab) hard-codes a polished_blackstone_bricks eave, which is off the palette, so wingRoof below is the same
// call with the palette's spruce eave.
import { readFileSync } from "node:fs";
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { roofMain } from "../vocab.mjs";

const MAIN = JSON.parse(readFileSync(new URL("../roof.json", import.meta.url), "utf8"));

// The wing: a gable over the rect [17,13..21,22], eave at y=6, overhang north/south/east 1, west 0 (it butts the main wall).
function wingRoof(g, rect, y, overhang) {
  const side = (d) => overhang[d] ?? 1;
  const [x0, z0, x1, z1] = [rect[0] - side("west"), rect[1] - side("north"), rect[2] + side("east"), rect[3] + side("south")];
  const protect = new Set();
  for (const c of g.cells.values()) if (!g.isAir(...c.pos)) protect.add(c.pos.join());
  const slate = { mix: [["cobbled_deepslate", 45], ["deepslate_tiles", 35], ["polished_deepslate", 20]], eave: "spruce", verge: "spruce" };
  const r = roof(g, [rect], "gable", { y, material: slate, contrast: false, ridgeAxis: "z", overhang, gable: "white_wool", ridge: "deepslate_brick_slab", protect });
  if (r.shift?.some(Boolean)) throw new Error(`wingRoof: the overhang grew the site (shift ${r.shift}); give it a larger grid`);
  const placed = [];
  for (const c of [...g.cells.values()]) {
    if (protect.has(c.pos.join()) || g.isAir(...c.pos)) continue;
    const [x, , z] = c.pos;
    // a corner detail may spill past the wing's own overhang: those cells were air, so give them back as air
    if (x < x0 || x > x1 || z < z0 || z > z1) g.unset(...c.pos);
    else placed.push(c.pos);
  }
  return placed;
}

export function build(g) {
  roofMain(g, MAIN);
  wingRoof(g, [17, 13, 21, 22], 6, { west: 0, north: 1, south: 1, east: 1 });
}
