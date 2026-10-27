import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Block 7, Mt Eden / Eden Terrace side: a flat-roofed 1960s-70s concrete office block, eight storeys on 4-block
// storey pitch (slab rows 5, 9, ... 29), a shopfront ground storey where the ground is low, and a roof plant room.
// The lidar roof is flat (33-34 across the footprint), so the massing is one slab; the 11-32 edge returns are noise.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588414.cells.json", "utf8"));
const W = 32, D = 24, H = 47;
const ROOF = 33;                               // top block row (lidar roof surface at y 34)
const SLABS = [5, 9, 13, 17, 21, 25, 29];      // floor slab rows; storeys sit between them (3 wall rows + slab = 4 blocks)

const ground = Array.from({ length: D }, () => Array(W).fill(-1));
for (const [x, z, g] of cells) ground[z][x] = g;
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground[z][x] >= 0;
const edge = (x, z) => inside(x, z) && (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1));
const outward = (x, z) => {
  const o = [];
  if (!inside(x - 1, z)) o.push([-1, 0]); if (!inside(x + 1, z)) o.push([1, 0]);
  if (!inside(x, z - 1)) o.push([0, -1]); if (!inside(x, z + 1)) o.push([0, 1]);
  return o;
};

const B = new Map();                           // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => { if (x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < H) B.set(`${x},${y},${z}`, [block, state]); };
const has = (x, y, z) => B.has(`${x},${y},${z}`);

// a facade column is a pier where its bay coordinate is a multiple of 3 (glass bays between). On a stepped corner
// both faces count, so the stepped diagonal keeps glass between its piers instead of reading as one solid pier wall
const pierAt = (x, z, out) => {
  const xf = out.some(([dx]) => dx), zf = out.some(([, dz]) => dz);
  if (xf && zf) return x % 3 === 0 || z % 3 === 0;
  if (xf) return z % 3 === 0;
  return x % 3 === 0;
};

// the entrance: an east-facing edge cell on the low ground, nearest the middle of the east face
let entrance = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const out = outward(x, z);
  if (!edge(x, z) || out.length !== 1 || out[0][0] !== 1 || pierAt(x, z, out)) continue;
  if (ground[z][x] !== 0) continue;
  if (!entrance || Math.abs(z - 11.5) < Math.abs(entrance.z - 11.5)) entrance = { x, z };
}

// the walls, slab, roof and foundation per footprint cell
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const G = ground[z][x], isEdge = edge(x, z), out = outward(x, z);
  const pier = isEdge && pierAt(x, z, out);
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");                       // foundation to the lowest-ground
  for (let y = G; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, isEdge ? "stone_bricks" : "smooth_stone"); continue; }
    if (SLABS.includes(y)) { put(x, y, z, "light_gray_concrete"); continue; }
    if (!isEdge) continue;                                                        // interior: air gap behind the glass
    if (y <= 4) {                                                                 // ground storey
      if (y === G) put(x, y, z, "polished_andesite");                             // base course
      else if (y === 4) put(x, y, z, "dark_oak_planks");                          // shop fascia
      else put(x, y, z, pier ? "polished_andesite" : "glass");                    // shopfront
    } else {                                                                      // upper storeys: sill, then two glass rows
      const s = 5 + 4 * Math.floor((y - 5) / 4), k = y - s;
      if (k === 1) put(x, y, z, pier ? "light_gray_concrete" : "white_concrete");
      else put(x, y, z, pier ? "light_gray_concrete" : "light_blue_stained_glass_pane");
    }
  }
}

// warm light behind some glass: shroomlights in the shopfronts, glowstone in some upper windows (in the air gap)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!edge(x, z)) continue;
  const out = outward(x, z); if (out.length !== 1 || pierAt(x, z, out)) continue;
  const [ox, oz] = out[0], ix = x - ox, iz = z - oz;
  if (!inside(ix, iz) || edge(ix, iz)) continue;
  const G = ground[z][x];
  if (G <= 3 && (x + 2 * z) % 4 === 0) put(ix, G + 2, iz, "shroomlight");
  for (const y of [7, 8, 11, 12, 15, 16, 19, 20, 23, 24, 27, 28, 31, 32]) {
    if (y < G) continue;
    if (((x * 7 + z * 3 + y) % 9) === 0) put(ix, y, iz, "glowstone");
  }
}

// the entrance: a dark oak door in the glass bay (lower and upper halves), a hanging lantern above it
if (entrance) {
  const { x, z } = entrance;
  put(x, 1, z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 2, z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof plant room on the flat roof, in the middle of the footprint
for (let z = 9; z <= 11; z++) for (let x = 13; x <= 15; x++) {
  if (!inside(x, z) || edge(x, z)) continue;
  put(x, 34, z, "light_gray_concrete"); put(x, 35, z, "light_gray_concrete"); put(x, 36, z, "stone_bricks");
}

// glass panes: connect to any neighbour that is a block (piers, sills, other panes), as a vanilla pane does
for (const [key, [block]] of B) {
  if (block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const c = (dx, dz) => (has(x + dx, y, z + dz) ? "true" : "false");
  B.set(key, [block, { east: c(1, 0), north: c(0, -1), south: c(0, 1), west: c(-1, 0), waterlogged: "false" }]);
}

const g = new Voxels([W, H, D]);
for (const [key, [block, state]] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588414.nbt");
console.log(`way_401588414.nbt: ${blocks} blocks, ${palette} palette entries`);
