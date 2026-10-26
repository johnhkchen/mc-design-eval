// Saint Luke's Episcopal Church, 1514 15th St NW: a stone Gothic Revival church, a steep slate nave roof running
// east-west with a flat-roofed parish hall behind it. The lidar roof per row is smoothed to its median so each
// row of the footprint is one clean tier; the nave's pitch is stair courses, the ridge is solid, the hall is flat.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC69505.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([13, 19, 11]);

const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => fp.has(`${x},${z}`);

// roof height per row of the footprint: the median of the row's lidar readings (noise smoothed into tiers)
const rows = {}; for (const [x, z, , r] of cells) (rows[z] ??= []).push(r);
const T = {}; for (const z in rows) { const a = rows[z].sort((p, q) => p - q); T[z] = a[a.length >> 1]; }
const roofOf = (z) => T[z] ?? 0;

const GLASS_N_S = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_E_W = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// the roof cover of one cell: stair courses on the nave slopes, solid on peaks, valleys and the flat hall
function roofBlock(z, x) {
  const tz = roofOf(z), up = roofOf(z + 1), dn = roofOf(z - 1);
  const flat = z >= 7 ? "smooth_stone" : "deepslate_tiles";
  if (tz >= up && tz >= dn) return { block: flat };
  if (dn < tz && up >= tz) return { block: "deepslate_tile_stairs", state: { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" } };
  if (up < tz && dn >= tz) return { block: "deepslate_tile_stairs", state: { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" } };
  return { block: flat };   // valley between two higher tiers: a solid gutter
}

for (const [x, z, ground] of cells) {
  const t = roofOf(z);
  const bx = !has(x - 1, z) || !has(x + 1, z), bz = !has(x, z - 1) || !has(x, z + 1);
  const boundary = bx || bz, corner = bx && bz;

  // foundation to the lowest ground under it, then the ground floor
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, ground, z, boundary ? "polished_andesite" : "stone_bricks");

  if (boundary) {
    for (let y = ground + 1; y <= t - 3; y++) {
      if (corner) { g.set(x, y, z, "polished_andesite"); continue; }   // quoins: the corner columns
      if (y === 3) { g.set(x, y, z, "smooth_stone"); continue; }      // storey line
      const windowable = y === 1 || y === 2 || y === 4 || y === 5;
      const xFace = bx && !bz && z % 2 === 1, zFace = bz && !bx && x % 3 === 1;
      if (windowable && (xFace || zFace)) {
        g.set(x, y, z, "glass_pane", xFace ? GLASS_N_S : GLASS_E_W);
        continue;
      }
      g.set(x, y, z, "stone_bricks");
    }
    if (t - 2 >= 1) g.set(x, t - 2, z, "chiseled_stone_bricks");        // cornice under the roof
  } else {
    if (t - 2 >= 1) g.set(x, t - 2, z, "stone_bricks");                 // ceiling slab under the roof
    if (3 < t - 2) g.set(x, 3, z, "stone_bricks");                       // a floor slab per storey
  }

  const r = roofBlock(z, x);
  g.set(x, t - 1, z, r.block, r.state);
}

// warm light: glowstone on the air behind some of the gable-end windows
g.set(1, 1, 1, "glowstone");
g.set(1, 1, 5, "glowstone");
g.set(1, 2, 3, "glowstone");

// the west door on the eave front, in the middle of the 3-block narthex
g.set(6, 1, 0, "dark_oak_door", DOOR("lower"));
g.set(6, 2, 0, "dark_oak_door", DOOR("upper"));

const out = g.save(`${dir}/DC69505.nbt`);
console.log(JSON.stringify(out));
