import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618843";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 30 x 16. Two-storey 1980s-style commercial block: cream tiled facade,
// glazed shopfront on the street side (z = 0), window bands above, flat roof with parapet.
const W = 30, H = 23, D = 16;
const has = new Set(cells.map(([x, z]) => `${x},${z}`));
const G = Math.min(...cells.map((c) => c[2]));   // lowest ground under the footprint
const TOP = G + 11;                               // roof about 11 blocks above lowest ground

const g = new Voxels([W, H, D]);
const put = (x, y, z, b) => {
  if (y < 0 || y >= H) return;
  g.set(x, y, z, b);
};

for (const [x, z, gc0] of cells) {
  const gc = Math.round(gc0);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const perim =
    !has.has(`${x - 1},${z}`) || !has.has(`${x + 1},${z}`) ||
    !has.has(`${x},${z - 1}`) || !has.has(`${x},${z + 1}`);
  const front = perim && z === 0;     // street-facing shopfront row
  const entranceOpen = front && (x === 13 || x === 14);

  for (let y = gc; y <= TOP; y++) {
    const r = y - G;     // height relative to lowest ground
    let b = null;

    if (y === gc) {
      // Base course at ground, all cells (also serves as interior floor slab).
      b = "smooth_stone";
    } else if (r === 11) {
      // Parapet on the perimeter; roof plant on the upper deck.
      if (perim) b = "white_concrete";
      else if (x >= 8 && x <= 12 && z >= 5 && z <= 9) b = "light_gray_concrete";
    } else if (r === 10) {
      // Roof deck / upper cornice, solid across the whole footprint.
      b = "smooth_stone";
    } else if (r === 5) {
      // Storey line and floor slab between the two storeys.
      b = "smooth_stone";
    } else if (r >= 1 && r <= 4) {
      // Storey 1: shopfront.
      if (perim) {
        if (front) {
          if (x === 12 || x === 15) {
            if (r <= 3) b = "white_concrete";
            else b = "white_concrete";
          } else if (entranceOpen) {
            if (r === 3) b = "light_blue_stained_glass";
            // r 1..2: open doorway, air
          } else if (r === 4) {
            b = "white_concrete";                 // fascia
          } else if (x % 5 === 0) {
            b = "white_concrete";                 // pillar
          } else {
            b = "light_blue_stained_glass";       // shop glazing
          }
        } else {
          if (r === 1 || r === 4) b = "white_concrete";
          else b = x % 2 === 0 ? "light_blue_stained_glass" : "white_concrete";
        }
      } else {
        // Interior air gap; warm lanterns just behind the shopfront glass.
        if (r === 2 && z === 1 && x % 5 === 2) b = "lantern";
      }
    } else if (r >= 6 && r <= 9) {
      // Storey 2: window bands with mullions and a spandrel.
      if (perim) {
        if (r === 6) b = "white_concrete";                  // spandrel
        else if (x % 3 === 0) b = "white_concrete";         // mullion
        else b = "light_blue_stained_glass";                // glazing
      } else {
        // Interior air; a few warm lights behind the glass.
        if (r === 7 && z === 1 && x % 6 === 1) b = "shroomlight";
      }
    }

    if (b) put(x, y, z, b);
  }
}

g.save(`${DIR}/${ID}.nbt`);
