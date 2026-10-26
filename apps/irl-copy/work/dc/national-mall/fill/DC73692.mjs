// 1775 Massachusetts Ave NW: a 1960s-70s pale-concrete office block on a granite-base podium, stepping from a
// one-storey wing up to three storeys and a three-storey tower. Built on the footprint cells only: each cell's
// column is solid from y 0 to its ground (foundation), its envelope rises to its tier, and the interior is air
// behind the glass with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73692.cells.json`, "utf8"));   // [x, z, ground, roof]

const X = 28, Y = 27, Z = 16;

// Lidar roof heights are noisy: snap each cell to one of four flat tiers (1, 2, 3 and 3+ storeys).
const tier = (r) => (r <= 4 ? 4 : r <= 8 ? 8 : r <= 12 ? 12 : 15);
const plan = new Map();
for (const [x, z, gr, roof] of cells) plan.set(`${x},${z}`, { gr, T: tier(roof) });
const at = (x, z) => plan.get(`${x},${z}`);

// a neighbour covers height y if it is on the footprint and its tier still rises above y
const covered = (x, z, y) => { const c = at(x, z); return !!c && y < c.T; };
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !covered(x + dx, z + dz, y));

// the entrance: the north (z 0) face, the middle of the street front
const DOOR = { x: 7, z: 0 };

const blocks = new Map();   // "x,y,z" -> [block, state]
const set = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, [block, state]);
const has = (x, y, z) => blocks.has(`${x},${y},${z}`);
const GLASS = "light_blue_stained_glass_pane";

for (const [key, { gr, T }] of plan) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    if (y < gr) { set(x, y, z, "stone_bricks"); continue; }            // foundation to the ground
    const ext = exposed(x, z, y);
    if (y === T - 1) {                                                   // cap: parapet on the edge, roof deck inside
      if (ext.length) set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else set(x, y, z, "smooth_stone");
      continue;
    }
    if (!ext.length) {                                                   // interior: a floor slab per storey, else air
      if (y === gr || y % 4 === 0) set(x, y, z, "smooth_stone");
      continue;
    }
    // envelope: the wall runs along x on a north/south face, along z otherwise
    const runsX = ext.some(([n]) => n === "north" || n === "south");
    const along = runsX ? x : z;
    const pier = along % 3 === 0;
    const isDoor = x === DOOR.x && z === DOOR.z && (y === gr + 1 || y === gr + 2);
    const paneState = runsX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    if (isDoor) {
      const half = y === gr + 1 ? "lower" : "upper";
      set(x, y, z, "iron_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
    } else if (y === gr) {
      set(x, y, z, "stone_bricks");                                     // base course
    } else if (y < 3) {                                                 // ground-floor storefront: glass, stone piers
      if (pier) set(x, y, z, "stone_bricks"); else set(x, y, z, GLASS, paneState);
    } else if (y % 4 === 0) {
      set(x, y, z, "smooth_stone");                                     // belt course at each storey line
    } else if (y % 4 === 3) {
      set(x, y, z, "light_gray_concrete");                              // spandrel under each window band
    } else if (pier) {
      set(x, y, z, "white_concrete");                                   // window mullion
    } else {
      set(x, y, z, GLASS, paneState);
    }
  }
}

// Every envelope block needs something under it: where a setback wall starts above an open interior cell,
// the cell below becomes a slab (the lower tier's roof, or a floor).
for (const [key, { gr, T }] of plan) {
  const [x, z] = key.split(",").map(Number);
  for (let y = gr + 1; y < T; y++) {
    if (has(x, y, z) && !has(x, y - 1, z)) set(x, y - 1, z, "smooth_stone");
  }
}

// Warm light behind some ground-of-window-band panes: the inside cell is air on a floor slab.
for (const [key, { gr, T }] of plan) {
  const [x, z] = key.split(",").map(Number);
  for (let y = gr + 1; y < T - 1; y++) {
    if (y % 4 !== 1 || !has(x, y, z)) continue;
    const [block, state] = blocks.get(`${x},${y},${z}`);
    if (block !== GLASS) continue;
    const out = DIRS.find(([, dx, dz]) => !covered(x + dx, z + dz, y)) ?? DIRS.find(([, dx, dz]) => !covered(x - dx, z - dz, y));
    if (!out) continue;
    const [, dx, dz] = out;
    const ix = x - dx, iz = z - dz;
    if (!at(ix, iz) || has(ix, y, iz) || !has(ix, y - 1, iz)) continue;
    const h = (x * 31 + z * 17 + y * 7) % 9;
    if (h === 0) set(ix, y, iz, "glowstone");
    else if (h === 4) set(ix, y, iz, "shroomlight");
  }
}

// Roof equipment on the interior of each tier's roof deck: a few plant boxes, no parapet cells.
for (const [key, { T }] of plan) {
  const [x, z] = key.split(",").map(Number);
  if (T < 8 || has(x, T, z)) continue;
  if (blocks.get(`${x},${T - 1},${z}`)?.[0] !== "smooth_stone") continue;
  if ((x * 3 + z * 5) % 11 === 0) set(x, T, z, "iron_block");
}

const g = new Voxels([X, Y, Z]);
for (const [key, [block, state]] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/DC73692.nbt`);
console.log(`DC73692.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
