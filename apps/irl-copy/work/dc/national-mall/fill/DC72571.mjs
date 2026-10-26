import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72571.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72571.nbt";

const W = 6, H = 16, D = 12;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const map = new Map();
let G = 0;
const roofs = [];
for (const c of cells) {
  const [x, z, gnd, roof] = c;
  const gi = Math.round(gnd);
  const ri = Math.round(roof);
  map.set(`${x},${z}`, { gnd: gi, roof: ri });
  if (gi > G) G = gi;
  roofs.push(ri);
}
roofs.sort((a, b) => a - b);
const medianRoof = roofs.length ? roofs[Math.floor(roofs.length / 2)] : 4;

// One-storey fast-food box: brick walls, stone base, red sign band, flat roof.
const R = Math.max(G + 4, medianRoof);

const isPerim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;

// Foundations, floors, walls, deck, parapet
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = map.get(`${x},${z}`);
    if (!c) continue;
    const gnd = c.gnd;
    const perim = isPerim(x, z);

    for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

    put(x, gnd, z, perim ? "polished_granite" : "smooth_stone");

    if (perim) {
      for (let y = gnd + 1; y <= R - 1; y++) put(x, y, z, "bricks");
      // stone base course one block above the sill
      if (gnd + 1 <= R - 1) put(x, gnd + 1, z, "stone_bricks");
    }

    // solid roof deck over every cell
    put(x, R, z, "stone_bricks");

    if (perim) {
      put(x, R + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Pilasters on the front corners and between storefront bays (articulation)
for (const x of [0, W - 1]) {
  const c = map.get(`${x},0`);
  if (!c) continue;
  for (let y = c.gnd + 1; y <= R - 1; y++) put(x, y, 0, "stone_bricks");
}

// Front (z = 0): sign band, storefront glass, entrance door
for (let x = 0; x < W; x++) {
  const c = map.get(`${x},0`);
  if (!c) continue;
  put(x, c.gnd + 3, 0, "red_terracotta");
}
for (let x = 1; x <= 4; x++) {
  const c = map.get(`${x},0`);
  if (!c) continue;
  const gnd = c.gnd;
  if (x === 2) {
    put(x, gnd + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gnd + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    put(x, gnd + 1, 0, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    put(x, gnd + 2, 0, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  }
}
// Entrance: stone-brick step-in threshold ring on the sill line
for (const x of [1, 3]) {
  const c = map.get(`${x},0`);
  if (c) put(x, c.gnd, 0, "smooth_stone");
}

// Side walls (x = 0 and x = 5): window bays with panes running north-south
for (const sx of [0, W - 1]) {
  for (const z of [2, 3, 4, 7, 8, 9]) {
    const c = map.get(`${sx},${z}`);
    if (!c) continue;
    put(sx, c.gnd + 1, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    put(sx, c.gnd + 2, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
}

// Rear (z = 11): service door
{
  const c = map.get(`4,${D - 1}`);
  if (c) {
    put(4, c.gnd + 1, D - 1, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(4, c.gnd + 2, D - 1, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Warm light behind the front glass (interior, against the storefront)
for (const lx of [1, 4]) {
  const c = map.get(`${lx},1`);
  if (c) put(lx, c.gnd + 1, 1, "glowstone");
}
// Warm light behind the side glass
for (const lz of [3, 8]) {
  const c = map.get(`1,${lz}`);
  if (c) put(1, c.gnd + 2, lz, "shroomlight");
}

// Front roof sign: red box on the parapet line with a yellow stripe
for (let x = 1; x <= 4; x++) {
  const c = map.get(`${x},0`);
  if (!c) continue;
  put(x, R + 1, 0, "red_concrete");
  put(x, R + 2, 0, "red_concrete");
}
for (const x of [2, 3]) {
  const c = map.get(`${x},0`);
  if (c) put(x, R + 1, 0, "yellow_concrete");
}

// Roof equipment: rooftop HVAC unit on interior cells
for (const [vx, vz] of [[1, 7], [2, 7], [1, 8], [2, 8]]) {
  const c = map.get(`${vx},${vz}`);
  if (!c) continue;
  put(vx, R + 1, vz, "iron_block");
}

g.save(OUT);
