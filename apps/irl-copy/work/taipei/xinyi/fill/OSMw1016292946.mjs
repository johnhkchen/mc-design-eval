import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw1016292946: no record, so this is a generic 1990s Xinyi office block.
// Five storeys of 5 blocks each, roof slab at y=25, parapet at y=26,
// rooftop plant box to y=29, lightning-rod mast to y=31. Cream tile and
// smoked-blue glass, granite base, quartz spandrels.

const W = 22, H = 38, D = 20;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1016292946.cells.json", "utf8"));
const g = new Voxels([W, H, D]);

const TOP = 26;          // parapet layer; roof slab sits at y=25
const CX = 10, CZ = 9;   // plan centre for entrance and plant box

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(x + "," + z, Math.min(24, Math.max(0, Math.round(gr))));
const inFp = (x, z) => fp.has(x + "," + z);
const ext = (x, z) => inFp(x, z) && (!inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1));
const corner = (x, z) => ext(x, z) && (!inFp(x + 1, z) || !inFp(x - 1, z)) && (!inFp(x, z + 1) || !inFp(x, z - 1));

let zMin = Infinity;
for (const k of fp.keys()) zMin = Math.min(zMin, Number(k.split(",")[1]));

const S = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const pane = (x, z, y) => ({
  north: ext(x, z - 1) ? "true" : "false",
  south: ext(x, z + 1) ? "true" : "false",
  east: ext(x + 1, z) ? "true" : "false",
  west: ext(x - 1, z) ? "true" : "false",
  waterlogged: "false",
});

for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);
  const e = ext(x, z);
  const c = corner(x, z);

  // Foundation under the footprint, up to this cell's ground.
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP; y++) {
    // Entrance: doorway on the street (low-z) face, centred, three blocks high.
    const onEntranceFace = e && z === zMin && Math.abs(x - CX) <= 1;
    if (onEntranceFace && y >= gr + 1 && y <= gr + 3) continue; // air doorway
    if (e && z === zMin && Math.abs(x - CX) <= 2 && y === gr + 4) {
      S(x, y, z, "stone_bricks"); // canopy lintel over the door
      continue;
    }

    if (y === gr) {
      S(x, y, z, e ? "polished_granite" : "smooth_stone");
    } else if (y === TOP) {
      if (e) S(x, y, z, "smooth_quartz");
    } else if (y % 5 === 0) {
      S(x, y, z, e ? "smooth_quartz" : "smooth_stone");
    } else {
      // Window zone: only exterior cells carry a facade; interior stays air.
      if (!e) continue;
      if (c || (x + z) % 3 === 0) {
        S(x, y, z, "white_concrete"); // mullion / corner frame
      } else {
        S(x, y, z, "light_blue_stained_glass_pane", pane(x, z, y));
        // Warm light just behind some panes (interior neighbour, air gap kept).
        if ((x * 7 + z * 3 + y) % 11 === 0) {
          const nb = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]
            .find(([nx, nz]) => inFp(nx, nz) && !ext(nx, nz));
          if (nb) S(nb[0], y, nb[1], "glowstone");
        }
      }
    }
  }
}

// Rooftop plant box on the roof slab (y=25), inside the footprint only.
for (let x = CX - 4; x <= CX + 4; x++) {
  for (let z = CZ - 4; z <= CZ + 4; z++) {
    if (!inFp(x, z)) continue;
    for (let y = TOP; y <= 28; y++) S(x, y, z, "light_gray_concrete");
    S(x, 29, z, "smooth_quartz");
  }
}
if (inFp(CX, CZ)) {
  for (let y = 29; y <= 31; y++) {
    S(CX, y, CZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1016292946.nbt");
