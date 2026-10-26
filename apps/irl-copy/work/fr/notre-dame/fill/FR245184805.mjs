// FR245184805: a commercial block on the Île Saint-Louis side of the Seine, 8 x 19 blocks, built from the lidar cells.
// Massing: each cell's roof (lidar, blocks above y 0) is smoothed into three tiers (17 tower, 11 body, 6 wing); the
// tiers are solid columns, so every storey stands on the one below. Facades: calcite walls on a stone base course,
// storey lines of smooth stone every 5 blocks, shopfront glass on the ground floor with a dark-oak fascia, pane windows
// on the upper storeys, and a stone-brick cornice. Interiors are air behind the glass with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184805.cells.json", "utf8"));
const W = 8, L = 19;

// Smoothed tier per cell (0 = not built): 17 = tower, 11 = body, 6 = wing; lidar noise below 5 is dropped.
const top = Array.from({ length: W }, () => Array(L).fill(0));
const base = Array.from({ length: W }, () => Array(L).fill(0));
for (const [x, z, ground, roof] of cells) {
  base[x][z] = ground;
  top[x][z] = roof >= 14 ? 17 : roof >= 9 ? 11 : roof >= 5 ? 6 : 0;
}

const built = (x, z) => x >= 0 && z >= 0 && x < W && z < L && top[x][z] > 0;
// Outward faces of a cell at height y: a face is exposed where the neighbour is off the footprint or lower than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const faces = (x, z, y) => DIRS.filter(([, dx, dz]) => !built(x + dx, z + dz) || top[x + dx][z + dz] <= y).map(([d]) => d);

const g = new Voxels([W, 33, L]);

for (let x = 0; x < W; x++) for (let z = 0; z < L; z++) {
  if (!built(x, z)) continue;
  for (let y = 0; y < top[x][z]; y++) {
    if (y < base[x][z]) { g.set(x, y, z, "stone_bricks"); continue; }      // foundation (none on this flat ground)
    const f = faces(x, z, y), top_ = top[x][z] - 1;
    if (y === top_) { g.set(x, y, z, f.length ? "stone_bricks" : "deepslate_tiles"); continue; }   // cornice / roof deck
    if (y === 0) { g.set(x, y, z, f.length ? "stone_bricks" : "smooth_stone"); continue; }        // base course / ground slab
    if (y % 5 === 0) { g.set(x, y, z, "smooth_stone"); continue; }                                // storey line / floor slab
    if (!f.length) continue;                                                                        // interior air
    const side = f[0];
    const t = side === "W" || side === "E" ? z : x;                                                 // position along the face
    const storey = Math.floor(y / 5);                                                               // 0 shop, 1 and 2 offices
    const pane = side === "W" || side === "E" ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
                                              : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
    if (storey === 0) {
      // Shopfront: door on the west (street) face at the centre, glass bays between dark-oak posts, fascia at y 4.
      if (side === "W" && t === 9 && y <= 2) {
        const door = { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        g.set(x, y, z, "dark_oak_door", door); continue;
      }
      if (y === 4) { g.set(x, y, z, "dark_oak_planks"); continue; }
      if (t % 3 === 0) { g.set(x, y, z, "dark_oak_log"); continue; }
      g.set(x, y, z, "glass_pane", pane); continue;
    }
    // Upper storeys: a window every third block, calcite piers between.
    if (t % 3 === 1) {
      g.set(x, y, z, "glass_pane", pane);
      // some windows show a warm light: glowstone just inside the glass where the room is air
      const [, dx, dz] = DIRS.find(([d]) => d === side);
      const ix = x - dx, iz = z - dz;
      if ((t * 5 + y * 7 + x * 3 + z) % 4 === 0 && built(ix, iz) && top[ix][iz] > y && !faces(ix, iz, y).length) {
        g.set(ix, y, iz, "glowstone");
      }
    } else {
      g.set(x, y, z, "calcite");
    }
  }
}

// Two chimney stacks on the tower roof (stand on the deck at y 16).
g.set(2, 17, 1, "stone_brick_wall");
g.set(4, 17, 1, "stone_brick_wall");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184805.nbt";
console.log(g.save(out));
