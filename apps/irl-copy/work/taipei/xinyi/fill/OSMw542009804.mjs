import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century (1960s-70s) Taipei commercial block: two storeys over a shopfront
// base, white-painted concrete frame with a grey storey line, glass-pane windows,
// a dark entrance door on the street face and a roof terrace with planters.
// Roof sits 11 blocks above the lowest ground (2 x 5-block storeys + 1 parapet).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542009804";
const W = 17, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gy] of cells) gmap.set(key(x, z), gy);
const inside = (x, z) => gmap.has(key(x, z));

const R0 = Math.min(...cells.map((c) => c[2]));   // lowest ground under footprint
const TOP = R0 + 11;                               // roof/parapet top (exclusive)

const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Entrance: middle of the street-side (lowest z) face.
const zmin = Math.min(...cells.map((c) => c[1]));
const frontXs = cells.filter((c) => c[1] === zmin).map((c) => c[0]).sort((a, b) => a - b);
const entX = frontXs[Math.floor(frontXs.length / 2)];

const isExterior = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const ext = isExterior(x, z);
  const pier = x % 3 === 0 || z % 3 === 0;
  const isEntr = ext && z === zmin && x === entX;

  for (let y = gy; y < TOP; y++) {
    const rel = y - R0;

    if (!ext) {
      // Interior: floor slabs only, air elsewhere (no interiors).
      if (y === gy || rel === 5) put(x, y, z, "smooth_stone");
      else if (rel === 10) {
        // Roof terrace: deck with occasional moss planters.
        put(x, y, z, (x % 4 === 1 && z % 5 === 2) ? "moss_block" : "smooth_stone");
      }
      continue;
    }

    // Street entrance door (two blocks) on the ground storey.
    if (isEntr && (y === gy || y === gy + 1)) {
      const half = y === gy ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }       // base course
    if (rel === 4 || rel === 9) { put(x, y, z, "dark_gray_concrete"); continue; } // lintels
    if (rel === 5) { put(x, y, z, "light_gray_concrete"); continue; } // storey line
    if (rel === 10) { put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; } // cornice cap

    // Window bands: rel 1..3 (shopfront) and rel 6..8 (upper storey).
    if (rel >= 1 && rel <= 3 || rel >= 6 && rel <= 8) {
      if (pier) { put(x, y, z, "white_concrete"); continue; }
      const lit = (x * 31 + z * 17 + y * 7) % 11 === 0;
      put(x, y, z, lit ? "glowstone" : "glass_pane");
      continue;
    }

    put(x, y, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
