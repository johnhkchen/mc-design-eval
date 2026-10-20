import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339263105";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 24, D = 7;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Glass pane orientation: alongX = wall runs east-west, alongZ = north-south
const paneProps = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- Per-cell massing ----
// Era: 1980s-style Taipei commercial block. Two storeys of 5 blocks, parapet to 12.
// Street face assumed on the north (z = 0) side.
for (const [x, z, gr] of cells) {
  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const left = !has(x - 1, z);
  const right = !has(x + 1, z);
  const perim = front || back || left || right;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor / base course at ground
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  if (!perim) {
    // Interior: storey floor, roof slab, air between
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "light_gray_concrete");
    continue;
  }

  const alongX = front || back;
  const idx = alongX ? x : z;
  const pillar = idx % 3 === 0;
  const pane = paneProps(alongX);
  const isEntrance = front && alongX && x === 10;

  // Ground storey: shopfront glazing with pillars
  for (let dy = 1; dy <= 3; dy++) {
    if (isEntrance) continue;
    if (pillar) put(x, gr + dy, z, "white_concrete");
    else put(x, gr + dy, z, "glass_pane", pane);
  }

  // Entrance: double door with transom
  if (isEntrance) {
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "glass_pane", pane);
  }

  // Shelf / cornice between storeys
  put(x, gr + 4, z, "smooth_stone");
  // Storey line
  put(x, gr + 5, z, "light_gray_concrete");

  // Upper storey: window grid with pillars
  for (let dy = 6; dy <= 8; dy++) {
    if (pillar) put(x, gr + dy, z, "white_concrete");
    else put(x, gr + dy, z, "glass_pane", pane);
  }

  // Lintel band, roof cornice, parapet cap
  put(x, gr + 9, z, "light_gray_concrete");
  put(x, gr + 10, z, "smooth_stone");
  put(x, gr + 11, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Warm lamps behind selected upper front windows (air gap at z = 1)
  if (front && alongX && !pillar && x % 6 === 4) {
    const inner = ground.get(`${x},1`);
    if (inner !== undefined) put(x, inner + 7, 1, "glowstone");
  }
}

// Roof equipment: a pair of plant boxes on the upper roof, interior cells
for (const [x, z, gr] of cells) {
  if ((x === 15 || x === 16) && (z === 2 || z === 3) && has(x, z)) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
