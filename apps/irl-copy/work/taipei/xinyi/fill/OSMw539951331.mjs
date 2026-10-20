import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey 1990s Taipei commercial block: granite-look plinth, pale tiled
// concrete walls, shopfront glass on the ground floor, punched window bands
// above, stone cornice and parapet, rooftop AC plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951331";
const W = 27, H = 23, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8")); // [x, z, ground]
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const occ = new Map();
for (const [x, z, gr] of cells) occ.set(key(x, z), gr);
const has = (x, z) => occ.has(key(x, z));

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: middle of the north (z-min) street frontage.
const northCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x, z, gr]) => [x, z, gr])
  .sort((a, b) => a[0] - b[0]);
const entrance = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;
const entKey = entrance ? key(entrance[0], entrance[1]) : null;

for (const [x, z, gr] of cells) {
  const ex = { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
  const bnd = ex.n || ex.s || ex.w || ex.e;

  // Foundation from y 0 up to this cell's ground, then base course on the ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, bnd ? "polished_andesite" : "smooth_stone");

  // Floor slab for the second storey, all cells.
  put(x, gr + 5, z, "smooth_stone");

  // Roof slab over the whole footprint.
  put(x, gr + 10, z, bnd ? "stone_bricks" : "light_gray_concrete");

  if (bnd) {
    const zFace = ex.n || ex.s;
    const along = zFace ? x : z;
    const mullion = along % 3 === 0;
    const isEnt = key(x, z) === entKey;

    // Ground storey: shopfront glass, pillars, fascia.
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (isEnt && ex.n && y <= gr + 2) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      } else if (isEnt && ex.n && y === gr + 3) {
        put(x, y, z, "lantern", { hanging: "true" });
      } else {
        put(x, y, z, mullion ? "white_concrete" : "glass");
      }
    }
    put(x, gr + 4, z, "polished_andesite"); // fascia / sign band

    // Upper storey: spandrels top and bottom, glass between mullions.
    put(x, gr + 6, z, "white_concrete");
    put(x, gr + 9, z, "white_concrete");
    for (let y = gr + 7; y <= gr + 8; y++) {
      put(x, y, z, mullion ? "white_concrete" : "glass");
    }

    // Parapet.
    put(x, gr + 11, z, "stone_bricks");
  } else {
    // Interior: air behind the glass, floor lights on the ground floor and upper floor.
    if ((x * 7 + z * 3) % 5 === 0) put(x, gr + 1, z, "glowstone");
    if ((x * 5 + z * 2) % 6 === 1) put(x, gr + 6, z, "shroomlight");

    // Rooftop plant boxes.
    if (x % 6 === 3 && z % 4 === 1) put(x, gr + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
