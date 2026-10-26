// 926 Rear N St NW: a three-storey brick commercial block (red brick on a stone plinth, calcite trim, shopfront
// at street level) with flat roof tiers: a 4-block body, 3-block side wings, and a 5-block core at the back.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC71572.cells.json`, "utf8"));
const W = 9, D = 12, H = 17;
const g = new Voxels([W, H, D]);

const LIDAR = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));

// the lidar roof (blocks above y0) is noisy (3 to 5); it is smoothed into three flat tiers
function tierOf(x, z, roof) {
  if (x >= 3 && x <= 5 && z >= 8 && z <= 10 && roof >= 5) return 5;   // the 3x3 core rising at the back
  if ((x === 0 || x === W - 1) && z > 0) return 3;                    // lower side wings
  return 4;                                                           // the main body (corners included)
}

const BASE = "stone_bricks", FLOOR = "smooth_stone", BRICK = "bricks", TRIM = "calcite";
const pane = (axis) => ["glass_pane", axis === "ew"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];

// a street-facing or rear wall: glass on odd x, brick between with calcite quoins at the corners; a side wing: glass on
// odd z, brick between
function facade(x, z) {
  if (z === 0 || z === D - 1) return x % 2 ? pane("ew") : [x === 0 || x === W - 1 ? TRIM : BRICK];
  return z % 2 ? pane("ns") : [BRICK];
}
const put = (x, y, z, [block, state]) => g.set(x, y, z, block, state);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const { ground, roof } = LIDAR.get(`${x},${z}`);
  const top = tierOf(x, z, roof);
  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const inner = x >= 2 && x <= W - 3 && z >= 2 && z <= D - 3;

  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);            // foundation up to the cell's ground
  g.set(x, ground, z, edge ? BASE : FLOOR);                          // plinth at the edge, floor slab inside

  if (edge && top === 3) {                                           // side wing: one storey and a cap
    put(x, 1, z, facade(x, z)); g.set(x, 2, z, TRIM);
    continue;
  }
  if (edge) {                                                        // body wall: two storeys and a cornice
    put(x, 1, z, facade(x, z)); put(x, 2, z, facade(x, z)); g.set(x, 3, z, TRIM);
    continue;
  }
  if (inner) g.set(x, 2, z, FLOOR);                                  // storey 2 floor; the ring behind the glass stays air
  if (top >= 4) g.set(x, 3, z, FLOOR);                               // roof deck over the body and the core
  if (top === 5) {                                                   // the core: cornice, then a parapet and HVAC
    const ring = x === 3 || x === 5 || z === 8 || z === 10;
    if (ring) { g.set(x, 4, z, TRIM); g.set(x, 5, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); }
    else { g.set(x, 4, z, FLOOR); g.set(x, 5, z, "iron_block"); }
  }
}

// the street entrance: a stone step, a door in the middle bay, a dark lintel canopy over it
g.set(4, 0, 0, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
for (const half of ["lower", "upper"]) {
  g.set(4, half === "lower" ? 1 : 2, 0, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
}
for (let x = 3; x <= 5; x++) g.set(x, 3, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });

// rooftop plant on the body
g.set(2, 4, 2, "iron_block"); g.set(6, 4, 4, "iron_block");

// warm light behind some glass
g.set(3, 1, 1, "glowstone"); g.set(5, 2, 1, "glowstone"); g.set(1, 1, 5, "glowstone");
g.set(3, 2, 10, "glowstone"); g.set(7, 1, 10, "shroomlight");

const out = `${DIR}/DC71572.nbt`;
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, palette ${r.palette}`);
