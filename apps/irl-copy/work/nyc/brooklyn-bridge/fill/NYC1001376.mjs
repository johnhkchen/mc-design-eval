import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 45 Peck Slip, 1807, Federal-style brick commercial/residential building, South Street Seaport.
// Five storeys of red brick on a stone base, grey stone storey bands and white cornice,
// ground-floor shopfront with a central door under a dark-oak header, flat roof with chimneys.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001376.cells.json", "utf8"));

const W = 9, H = 23, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cm = new Map();
for (const c of cells) cm.set(key(c[0], c[1]), c);
const has = (x, z) => cm.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Smooth the lidar roof: noisy per-cell heights become two clean tiers (even courses),
// kept within two courses of the building's median roof so the massing reads as one block.
const rawRoofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const medianRoof = rawRoofs[Math.floor(rawRoofs.length / 2)];
const targetRoof = 2 * Math.round(medianRoof / 2);
const roofOf = (c) => {
  let r = 2 * Math.round(Math.round(c[3]) / 2);
  r = Math.max(targetRoof - 2, Math.min(targetRoof + 2, r));
  return r;
};
const groundOf = (c) => Math.max(0, Math.round(c[2]));

// Pass 1: foundations, interior floors, roof deck, walls
for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = groundOf(c);
  let rf = roofOf(c);
  if (rf < gr + 4) rf = gr + 4;
  if (rf > H - 4) rf = H - 4;

  // Foundation: solid stone from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  if (!edge) {
    // Interior: hollow, with floor slabs per storey and a roof deck
    for (let y = gr; y <= rf - 2; y++) {
      const rel = y - gr;
      if (rel % 2 === 0) put(x, y, z, "smooth_stone");
    }
    put(x, rf - 1, z, "deepslate_tiles");
    continue;
  }

  // Exterior wall: facade coordinate u and face length n
  const onZFace = (z === 0 || z === D - 1);
  const u = onZFace ? x : z;
  const n = onZFace ? W : D;
  const pier = (u === 0 || u === n - 1);
  const isDoor = (onZFace && z === 0 && u === 4 && n === W);
  const doorHeader = (onZFace && z === 0 && n === W && (u === 3 || u === 5));

  for (let y = gr; y <= rf - 1; y++) {
    const rel = y - gr;

    if (rel === rf - 1 - gr) {
      put(x, y, z, "white_concrete");      // cornice / parapet course
      continue;
    }

    if (rel === 0) {
      put(x, y, z, "stone_bricks");        // base course
      continue;
    }

    if (pier) {
      put(x, y, z, "smooth_stone");        // stone quoins at corners
      continue;
    }

    if (rel % 2 === 0) {
      put(x, y, z, "smooth_stone");        // storey band (grey stone, less glare than white)
      continue;
    }

    // rel odd: window / shopfront row
    if (rel === 1) {
      if (isDoor) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, y + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "glass");             // shopfront glass
      }
      continue;
    }

    if (u % 2 === 1) {
      const warm = ((u + rel + x + z) % 5 === 0);
      put(x, y, z, warm ? "glowstone" : "glass_pane");
    } else {
      put(x, y, z, "bricks");
    }
  }

  // Entrance header: dark oak fascia over the door bay, with a lantern-lit door surround
  if (isDoor) {
    put(x, gr + 2, z, "dark_oak_planks");
  }
  if (doorHeader) {
    put(x, gr + 2, z, "dark_oak_planks");
    put(x, gr + 1, z, "dark_oak_planks");
  }
}

// Pass 2: roof equipment — two brick chimneys on interior roof cells
const chimneyCells = [[2, 2], [6, 3]];
for (const [cx, cz] of chimneyCells) {
  const c = cm.get(key(cx, cz));
  if (!c || isEdge(cx, cz)) continue;
  let rf = roofOf(c);
  if (rf < groundOf(c) + 4) rf = groundOf(c) + 4;
  if (rf > H - 4) rf = H - 4;
  put(cx, rf, cz, "bricks");
  put(cx, rf + 1, cz, "bricks");
  put(cx, rf + 2, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001376.nbt");
