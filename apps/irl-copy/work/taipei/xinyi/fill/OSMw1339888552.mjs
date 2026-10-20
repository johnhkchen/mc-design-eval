import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Narrow 1960s-80s Taipei shophouse block: 5 x 60 footprint, roof about 7 blocks
// above the lowest ground. Grey-concrete frame, white wall tiles, stone base,
// a shopfront band with a dark-oak-framed door, one upper storey of windows
// with lit rooms behind the glass, and a parapet with rooftop units.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339888552.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339888552.nbt";

const W = 5, H = 19, D = 60;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const groundOf = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  groundOf.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}

// Flat roofline at lowest ground + 7, kept inside the volume with room for parapet and units.
const T = Math.min(minG + 7, H - 3);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Keep at least five body rows above the foundation.
  const gc = Math.min(gr, T - 5);
  const isFacade = x === 0 || x === W - 1;
  const isEnd = z === 0 || z === D - 1;
  const perimeter = isFacade || isEnd;
  const inward = x === 0 ? 1 : (x === W - 1 ? W - 2 : -1);

  // Storey lines: shopfront top, upper spandrel, roof deck.
  const F1 = Math.min(gc + 4, T - 3);
  const M = Math.floor((F1 + T) / 2);

  // Foundation under the ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  // Body from ground up to the roof deck.
  for (let y = gc; y < T; y++) {
    if (isEnd) {
      put(x, y, z, y === gc ? "stone_bricks" : "white_concrete");
      continue;
    }
    if (isFacade) {
      if (y === gc) { put(x, y, z, "stone_bricks"); continue; }
      if (y < F1) {
        // Shopfront band.
        if (z === 30 && x === 0 && y <= gc + 1) {
          put(x, y, z, "dark_oak_door", {
            facing: "west",
            half: y === gc ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (z % 4 === 0) {
          put(x, y, z, "dark_oak_log");
        } else {
          put(x, y, z, "glass_pane", paneProps);
        }
        continue;
      }
      if (y === F1) { put(x, y, z, "smooth_stone"); continue; }
      // Upper storey.
      if (y === M) { put(x, y, z, "light_gray_concrete"); continue; }
      if (z % 3 === 0) { put(x, y, z, "light_gray_concrete"); continue; }
      put(x, y, z, "light_gray_stained_glass_pane", paneProps);
      continue;
    }
    // Interior cells: air except floor slabs at ground, shopfront top, and spandrel level.
    if (y === gc || y === F1 || y === M) put(x, y, z, "smooth_stone");
  }

  // Lintel/awning band over the entrance on the west facade.
  if (x === 0 && z >= 28 && z <= 32) put(x, gc + 2, z, "red_concrete");

  // Warm light behind glass: shopfront shroomlights and upper-storey glowstone.
  if (isFacade && !isEnd && inward >= 0) {
    if (z % 8 === 2 && gc + 1 < F1) put(inward, gc + 1, z, "shroomlight");
    if (z % 6 === 1 && T - 1 > M) put(inward, T - 1, z, "glowstone");
  }

  // Roof deck.
  put(x, T, z, "light_gray_concrete");

  // Parapet on the perimeter.
  if (perimeter) put(x, T + 1, z, "light_gray_concrete");
}

// Rooftop units: small plant boxes on the roof.
for (const z of [12, 13, 30, 31, 48, 49]) {
  put(2, T + 1, z, "stone");
  put(1, T + 1, z, "stone");
}

g.save(OUT);
