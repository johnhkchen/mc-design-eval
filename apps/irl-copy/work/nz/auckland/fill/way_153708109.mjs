// UUNZ Tower: a ten-storey concrete-and-tinted-glass office block of the 1970s-80s, on a site that falls 7 blocks
// from its west edge to the east. A shell: a one-block skin of piers, spandrels and glass, one slab per storey (4
// blocks), air behind the glass, a parapet on the lidar's 40, and a stepped plant core on the 41-44 cells.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_153708109.cells.json", "utf8"));

const W = 28, H = 57, D = 22;
const v = new Voxels([W, H, D]);
const M = new Map();                                  // what was placed, so glass panes can join their neighbours
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => {
  if (x < 0 || x >= W || z < 0 || z >= D) return;
  M.set(key(x, y, z), block); v.set(x, y, z, block, state);
};

const FP = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const has = (x, z) => FP.has(`${x},${z}`);
const isCore = (x, z) => FP.get(`${x},${z}`)?.r >= 41;     // the lidar's 41-44 cells: the plant core

const DECK = 38;       // the roof deck row (top of the body at 39); the lidar's 40 round the edge is the parapet
// Which outside faces a cell shows. u runs along the wall; corners and one-cell slivers are piers.
function facade(same, x, z) {
  const e = !same(x + 1, z), w = !same(x - 1, z), s = !same(x, z + 1), n = !same(x, z - 1);
  const ex = e || w, ez = s || n;
  if (!ex && !ez) return { ring: false };
  if ((ex && ez) || (e && w) || (s && n)) return { ring: true, corner: true };
  return ex ? { ring: true, corner: false, u: z } : { ring: true, corner: false, u: x };
}
const ringBody = (x, z) => facade(has, x, z).ring;
const ringCore = (x, z) => facade(isCore, x, z);

// Body: fill to each cell's ground, then storeys on a fixed 4-block grid (slab at 4k, glass at 4k+1..2, spandrel 4k+3).
for (const [k, { g }] of FP) {
  const [x, z] = k.split(",").map(Number);
  const f = facade(has, x, z);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  for (let y = g; y <= DECK; y++) {
    if (!f.ring) {
      if (y === DECK) put(x, y, z, "light_gray_concrete");              // roof deck
      else if (y % 4 === 0) put(x, y, z, "white_concrete");              // floor slab
      else if (y % 4 === 1 && y > g && (x * 3 + z * 5 + y) % 7 === 0 &&
               [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => ringBody(x + dx, z + dz)))
        put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });   // a warm light behind the glass
      // else air: the room behind the glass
    } else if (y === g) put(x, y, z, "stone_bricks");                    // base course
    else if (y === DECK || y % 4 === 0 || y % 4 === 3) put(x, y, z, "white_concrete");   // cap, slabs, spandrels
    else if (f.corner || f.u % 3 === 0) put(x, y, z, "light_gray_concrete");              // piers every 3rd block
    else put(x, y, z, y < 4 ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane");
  }
  if (f.ring && !isCore(x, z)) put(x, 39, z, "white_concrete");          // parapet
}

// Plant core: the 41-44 cells stepped to 42 and 44, louvred on the outside, solid within, on the deck.
for (const [k, { r }] of FP) {
  if (r < 41) continue;
  const [x, z] = k.split(",").map(Number);
  const top = r >= 43 ? 44 : 42;
  const f = ringCore(x, z);
  for (let y = 39; y < top; y++) {
    if (!f.ring) put(x, y, z, "light_gray_concrete");
    else if (y === 39 || y === top - 1) put(x, y, z, "white_concrete");
    else if (f.corner || f.u % 3 === 0) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "iron_bars");
  }
}

// Roof plant: two units on the interior roof deck.
const unit = (x0, z0, w, d, h, block) => {
  for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) {
    if (!has(x, z) || isCore(x, z) || ringBody(x, z)) continue;
    for (let y = 39; y < 39 + h; y++) put(x, y, z, block);
  }
};
unit(15, 7, 3, 2, 2, "gray_concrete");
unit(8, 8, 3, 2, 1, "light_gray_concrete");

// Entrance on the east face, where the ground is lowest: a dark oak door with a canopy over it and a lit lobby.
put(26, 1, 13, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
put(26, 2, 13, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const z of [12, 13, 14]) put(26, 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
put(25, 1, 13, "lantern", { hanging: "false", waterlogged: "false" });

// Glass panes and iron louvres join the neighbours they touch in the wall plane.
const joins = (b) => b && /concrete|stone_bricks|glass_pane|iron_bars/.test(b);
const near = (x, y, z) => ({
  north: joins(M.get(key(x, y, z - 1))) ? "true" : "false",
  south: joins(M.get(key(x, y, z + 1))) ? "true" : "false",
  east: joins(M.get(key(x + 1, y, z))) ? "true" : "false",
  west: joins(M.get(key(x - 1, y, z))) ? "true" : "false",
  waterlogged: "false",
});
for (const [k, b] of M) {
  if (!/glass_pane|iron_bars/.test(b)) continue;
  const [x, y, z] = k.split(",").map(Number);
  v.set(x, y, z, b, near(x, y, z));
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_153708109.nbt";
const { blocks, palette } = v.save(out);
console.log(`UUNZ Tower: ${blocks} blocks, palette ${palette} -> ${out}`);
