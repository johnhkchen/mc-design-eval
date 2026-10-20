import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 57 Middagh Street, Brooklyn Heights: c.1834 Greek Revival / Federal-era
// brick walk-up. One flat roof tier, brick shell, stone plinth, thin stone
// floor-line slabs, 1-block-tall glass windows, warm lanterns behind them.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001546";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;

// Smooth lidar noise: one flat roof for the whole building (median),
// per-cell ground kept so the foundation follows the slope.
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const roofMed = roofs[Math.floor(roofs.length / 2)];
const ROOF = Math.min(H - 3, Math.max(roofMed, 6));

const map = new Map();
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const r = Math.max(ROOF, ground + 4);
  map.set(key(x, z), { g: ground, r: Math.min(H - 3, r) });
}
const has = (x, z) => map.has(key(x, z));
const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const GLASS_Z = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const GLASS_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const SLAB_BOT = { type: "bottom", waterlogged: "false" };

// Pass 1: foundations, shell, floors, floor-line slabs, windows
for (const [k, { g: gr, r }] of map) {
  const [x, z] = k.split(",").map(Number);
  const top = r - 1;
  const K = top - gr;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ext = exterior(x, z);
  const zf = !has(x, z - 1) || !has(x, z + 1);
  const xf = !has(x - 1, z) || !has(x + 1, z);

  if (!ext) {
    // interior: floor slab per storey, roof slab on top, air between
    for (let y = gr; y <= top; y++) {
      const kk = y - gr;
      if (y === top) g.set(x, y, z, "smooth_stone");
      else if (kk % 2 === 0) g.set(x, y, z, "spruce_planks");
    }
    continue;
  }

  for (let y = gr; y <= top; y++) {
    const kk = y - gr;
    if (y === top) { g.set(x, y, z, "smooth_stone"); continue; }             // roof cap
    if (kk === 0) { g.set(x, y, z, "stone_bricks"); continue; }              // plinth
    if (kk === K - 1) { g.set(x, y, z, "bricks"); continue; }                // parapet
    if (kk === K - 2 && K >= 4) { g.set(x, y, z, "stone_brick_slab", SLAB_BOT); continue; } // cornice ledge
    if (kk % 2 === 0) { g.set(x, y, z, "stone_brick_slab", SLAB_BOT); continue; } // floor-line band
    // window row
    let win = null;
    if (zf && (x === 1 || x === 3)) win = "z";
    else if (xf && z >= 2 && z <= 10 && z % 2 === 0) win = "x";
    if (win === "z") g.set(x, y, z, "glass_pane", GLASS_Z);
    else if (win === "x") g.set(x, y, z, "glass_pane", GLASS_X);
    else g.set(x, y, z, "bricks");
  }
}

// Pass 2: entrance on the street face (z = 0), centred on x = 2
if (has(2, 0)) {
  const { g: gr, r } = map.get(key(2, 0));
  const top = r - 1;
  g.set(2, gr, 0, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
  g.set(2, gr + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(2, gr + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  if (gr + 3 < top) g.set(2, gr + 3, 0, "stone_brick_slab", SLAB_BOT);   // lintel course
}

// Pass 3: warm lanterns in the rooms behind street-side windows, one per storey
for (const [x, z] of [[1, 1], [3, 9]]) {
  if (!has(x, z)) continue;
  const { g: gr, r } = map.get(key(x, z));
  const top = r - 1;
  for (let y = gr + 1; y < top - 1; y += 2) {
    g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 4: brick chimney stack on the flat roof
if (has(1, 2)) {
  const { r } = map.get(key(1, 2));
  if (r + 1 < H) {
    g.set(1, r, 2, "bricks");
    g.set(1, r + 1, 2, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
