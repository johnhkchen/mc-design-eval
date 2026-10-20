import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020156";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 6 x 18. Two storeys of about 5 blocks, flat parapet roof at y 11.
// Era: 1980s-90s Taipei mid-rise shophouse: white concrete frame, quartz bands,
// ground-floor shopfront, tinted glass, rooftop plant.
const W = 6, H = 23, D = 18;
const TOP = 11;      // parapet top, ~11 blocks above lowest ground
const ROOF = 10;     // roof slab
const FLOOR2 = 5;    // storey line between ground and upper floor
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.min(ROOF - 1, Math.round(gr))));
}

const has = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Pass 1: foundation, base, floors, walls, cornice, parapet.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const perim = isPerim(x, z);

  // Foundation fill from y 0 up to this cell's ground (downhill side gets extra storeys).
  for (let y = 0; y < gr; y++) put(x, y, z, perim ? "stone_bricks" : "stone");
  // Ground line / base course.
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  for (let y = gr + 1; y <= TOP; y++) {
    if (!perim) {
      // Interior: floor slabs and roof slab only, air elsewhere (no interiors).
      if (y === FLOOR2 || y === ROOF) put(x, y, z, "smooth_stone");
      continue;
    }
    const pier = (x + z) % 3 === 0;
    if (y <= 3) {
      // Ground storey shopfront: piers and tinted glass.
      put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass_pane");
    } else if (y === 4) {
      put(x, y, z, "smooth_quartz");           // shopfront lintel band
    } else if (y === FLOOR2) {
      put(x, y, z, "smooth_quartz");           // storey line
    } else if (y >= 6 && y <= 8) {
      put(x, y, z, pier ? "white_concrete" : "glass_pane");
    } else if (y === 9) {
      put(x, y, z, "smooth_quartz");           // upper sill / lintel
    } else if (y === ROOF) {
      put(x, y, z, "smooth_quartz");           // cornice
    } else if (y === TOP) {
      put(x, y, z, "white_concrete");          // parapet
    }
  }
}

// Pass 2: entrance on the z = 0 face, with a door at x = 2.
if (has(2, 0)) {
  const g0 = ground.get(key(2, 0));
  const props = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(2, g0 + 1, 0, "dark_oak_door", props("lower"));
  put(2, g0 + 2, 0, "dark_oak_door", props("upper"));
}

// Pass 3: warm light behind some upper windows (glowstone on the inside cell).
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  if ((x + z) % 6 !== 1) continue;
  let ix = x, iz = z;
  if (x === 0) ix = 1;
  else if (x === W - 1) ix = W - 2;
  else if (z === 0) iz = 1;
  else if (z === D - 1) iz = D - 2;
  else continue;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const igr = ground.get(key(ix, iz));
  if (igr >= 7) continue;
  put(ix, 7, iz, "glowstone");
}

// Pass 4: rooftop plant on the roof slab, set back from the parapet.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (gr >= ROOF) continue;
  if (isPerim(x, z)) continue;
  if ((x === 2 || x === 3) && z === 8) put(x, TOP, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
