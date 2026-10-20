import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001484.cells.json", "utf8"));

const W = 17, H = 31, D = 5;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(`${x},${z}`, { gr: Math.max(0, Math.round(gr)), roof: Math.round(roof) });
}
const has = (x, z) => map.has(`${x},${z}`);
const info = (x, z) => map.get(`${x},${z}`);
const inBox = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => { if (inBox(x, y, z)) g.set(x, y, z, id, props); };

// Clean massing: one storey grid and one roofline for the whole rowhouse.
const median = arr => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const B = median(cells.map(c => Math.round(c[2])));          // common ground-floor level
const R = Math.min(H - 2, Math.max(B + 8, median(cells.map(c => Math.round(c[3])))));
const STOREY = 4;

// Pass 1: foundations, interior floors and deck, and solid perimeter walls.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { gr } = info(x, z);
  const edge = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (edge) {
    for (let y = gr; y <= R - 2; y++) put(x, y, z, "bricks");
    put(x, R - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // cornice
    put(x, R, z, "bricks");                                                          // parapet
  } else {
    put(x, Math.min(B, gr), z, "smooth_stone");
    for (let fl = B + STOREY; fl < R - 1; fl += STOREY) put(x, fl, z, "smooth_stone");
    put(x, R - 1, z, "smooth_stone");
  }
}

// Pass 2: street (z=0) and rear (z=D-1) facades with stacked string courses,
// paired window bays on piers, and warm glass behind some panes.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  if (!(front || back)) continue;
  if (x < 1 || x > W - 2) continue;

  const innerZ = front ? z + 1 : z - 1;
  const isPier = x % 3 === 0;
  for (let fl = B; fl + 3 <= R - 2; fl += STOREY) {
    put(x, fl, z, "stone_bricks");                       // string course / sill band
    const doorBay = front && fl === B && x >= 7 && x <= 9;
    if (doorBay || isPier) continue;
    put(x, fl + 1, z, "glass_pane");
    put(x, fl + 2, z, "glass_pane");
    put(x, fl + 3, z, "stone_bricks");                   // lintel band
    if (has(x, innerZ) && x % 6 === 1 && (fl - B) / STOREY % 2 === 0) {
      put(x, fl + 1, innerZ, "glowstone");
    }
  }
}

// Pass 3: street entrance at x = 8 with stoop, dark oak door and a framed bay.
if (has(8, 0)) {
  const gr8 = info(8, 0).gr;
  if (gr8 <= B) {
    put(8, B, 0, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
  }
  put(8, B + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(8, B + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(7, B + 1, 0, "stone_bricks");
  put(7, B + 2, 0, "stone_bricks");
  put(9, B + 1, 0, "stone_bricks");
  put(9, B + 2, 0, "stone_bricks");
  put(7, B + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  put(8, B + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  put(9, B + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001484.nbt");
