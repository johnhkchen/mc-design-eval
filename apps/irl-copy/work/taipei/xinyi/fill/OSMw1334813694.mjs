import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334813694";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 19, D = 10;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// bounds-safe setter
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Read as a 1980s-90s Xinyi shophouse-scale commercial block:
// one tall ground storey (5 blocks) with white tiled piers, tinted glass
// shopfront band, light spandrel, white parapet and a quartz cornice.
// Roof sits 7 blocks above the cell's ground.
for (const [x, z, gr] of cells) {
  // foundation up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  const b = gr;
  const ext = exterior(x, z);

  // base course / floor slab
  put(x, b, z, ext ? "polished_granite" : "smooth_stone");

  // pilaster rhythm: along the street-facing run use x, along side faces use z
  const alongZFace = (z === 0 || z === D - 1);
  const along = alongZFace ? x : z;
  const pier = along % 3 === 0;
  const entrance = z === 0 && x >= 9 && x <= 11;

  if (ext) {
    // shopfront / window band, storey 1 (b+1..b+3)
    for (let dy = 1; dy <= 3; dy++) {
      const y = b + dy;
      if (entrance) {
        if (x === 10) {
          if (dy <= 2) continue; // door opening, air
          put(x, y, z, "glass"); // transom
        } else {
          put(x, y, z, "white_concrete");
        }
        continue;
      }
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass");
    }
    // canopy over entrance, sits in the wall line above the opening
    if (entrance) put(x, b + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

    // storey line / spandrel, parapet, cornice
    put(x, b + 4, z, "light_gray_concrete");
    put(x, b + 5, z, "white_concrete");
    put(x, b + 6, z, "quartz_block");
  } else {
    // interior: storey floor slab and roof deck, air in between
    put(x, b + 4, z, "smooth_stone");
    put(x, b + 6, z, "smooth_stone");

    // warm lights behind the glass band on the inner row
    if (z === 1 && x % 4 === 1) put(x, b + 2, z, "shroomlight");
    else if (z === 1 && x % 4 === 3) put(x, b + 2, z, "glowstone");

    // roof equipment: a pair of plant boxes on the roof deck
    if (z === 5 && (x === 4 || x === 15)) {
      put(x, b + 7, z, "light_gray_concrete");
      put(x + 1 < W ? x : x, b + 7, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
