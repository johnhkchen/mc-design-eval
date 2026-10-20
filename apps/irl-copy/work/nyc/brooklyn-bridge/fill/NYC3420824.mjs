import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3420824.cells.json", "utf8"));

const W = 9, H = 16, D = 4;
const g = new Voxels([W, H, D]);

// Transit/utility building on Jay Street: brick walls on a granite base,
// two storeys of 2 blocks, a stone cornice and a flat roof with a small
// ventilation plant. Street face is z = 0.
const MAT = {
  base: "stone_bricks",
  wall: "bricks",
  band: "smooth_stone",
  corner: "stone_bricks",
  cornice: "stone_bricks",
  deck: "smooth_stone",
  glass: "light_blue_stained_glass_pane",
  door: "black_concrete",
};

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const key = (x, z) => `${x},${z}`;
const have = new Set(cells.map(([x, z]) => key(x, z)));
const isExterior = (x, z) =>
  !have.has(key(x - 1, z)) || !have.has(key(x + 1, z)) ||
  !have.has(key(x, z - 1)) || !have.has(key(x, z + 1));

// One lowest ground and one roof level for the whole footprint (lidar noise smoothed).
const grounds = cells.map(([, , gr]) => Math.max(0, Math.round(gr)));
const G = Math.min(...grounds);     // lowest ground: storey datum
const R = Math.min(H - 4, G + 4);   // roof top (parapet course), about 4 above lowest ground

for (const [x, z, groundRaw] of cells) {
  const gc = Math.max(0, Math.round(groundRaw));

  // Foundation under each cell up to its own ground: nothing floats on the slope.
  for (let y = 0; y < gc; y++) put(x, y, z, MAT.base);

  const ext = isExterior(x, z);
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const streetFace = z === 0;
  const entranceCol = streetFace && x >= 3 && x <= 5;
  const doorway = streetFace && x === 4;

  for (let y = gc; y <= R; y++) {
    const k = y - G; // 0 base, 1 window, 2 band, 3 window, 4 cornice/roof
    if (ext) {
      if (y === R) {
        put(x, y, z, MAT.cornice);
      } else if (doorway && k <= 1) {
        // Transit doorway: open passage, nothing placed.
        continue;
      } else if (entranceCol && k === 0) {
        put(x, y, z, MAT.door);
      } else if (k === 0) {
        put(x, y, z, MAT.base);
      } else if (k === 2) {
        put(x, y, z, MAT.band);
      } else if (corner) {
        put(x, y, z, MAT.corner);
      } else if (k === 1 || k === 3) {
        put(x, y, z, MAT.glass);
      } else {
        put(x, y, z, MAT.wall);
      }
    } else {
      // Interior: air behind the glass with a floor slab per storey and the roof deck.
      if (k === 0 || k === 2 || k === 4) put(x, y, z, MAT.deck);
    }
  }
}

// Warm light behind some windows (dusk glow).
for (const [x, z] of cells) {
  if (!isExterior(x, z) && z === 1 && (x === 2 || x === 6)) put(x, G + 1, z, "glowstone");
  if (!isExterior(x, z) && z === 2 && x === 4) put(x, G + 3, z, "shroomlight");
}

// Lanterns flanking the transit doorway, set in the band course.
for (const [x, z] of cells) {
  if (z === 0 && (x === 3 || x === 5)) {
    put(x, G + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof ventilation plant standing on the roof deck.
for (const [x, z] of cells) {
  if (x >= 3 && x <= 4 && z >= 1 && z <= 2) put(x, R + 1, z, "iron_block");
}
put(4, R + 2, 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3420824.nbt");
