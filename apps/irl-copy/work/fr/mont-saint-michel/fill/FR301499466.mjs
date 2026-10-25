import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499466.cells.json", "utf8"));

const W = 5, H = 23, D = 7;
const g = new Voxels([W, H, D]);

const BASE = "stone";
const WALL = "smooth_stone";       // light render-like walls
const TRIM = "stone_bricks";       // sills, lintels, storey bands
const ROOF_STAIR = "stone_brick_stairs";
const ROOF_FILL = "stone_bricks";
const GLASS = "glass_pane";
const FRAME = "stone_brick_slab";

const footprint = new Set(cells.map(c => c[0] + "," + c[1]));
const inside = (x, z) => footprint.has(x + "," + z);

// roof column offsets across the 5-wide footprint (ridge runs along z)
const TOFF = [0, 1, 2, 1, 0];

for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = Math.round(c[2]);
  const r = Math.round(c[3]);
  // two storeys (~5 blocks each), eave course above, pitched roof to lidar height
  const E = Math.min(19, Math.max(gr + 10, r - 3));

  // foundation to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  const corner = (x === 0 || x === 4) && (z === 0 || z === 6);
  const exposed = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  const facade = exposed && !corner;
  const doorCell = (x === 2 && z === 0);
  // window columns: centre cells of each exposed face
  const winCell = facade && !doorCell;

  for (let y = gr; y < E; y++) {
    const rel = y - gr;
    let blk = WALL;

    // storey bands in trim stone
    if (rel === 5 || rel === 10) blk = TRIM;

    if (facade) {
      // ground floor: door at centre of south face, windows above a sill
      if (doorCell && (rel === 0 || rel === 1)) {
        g.set(x, y, z, "oak_door", {
          facing: "north",
          half: rel === 0 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (winCell && (rel === 2 || rel === 3)) blk = GLASS;
      if (winCell && (rel === 7 || rel === 8)) blk = GLASS;
      // sills (under window) and lintels (over window) in trim
      if (winCell && (rel === 1 || rel === 6)) blk = TRIM;
      if (winCell && (rel === 4 || rel === 9)) blk = TRIM;
    }

    if (blk === GLASS) {
      g.set(x, y, z, GLASS, { north: "false", south: "false", east: "false", west: "false" });
    } else {
      g.set(x, y, z, blk);
    }
  }

  // warm lit upper windows (glowstone in place of one pane)
  if (facade && x === 4 && z === 3 && E - gr >= 9) g.set(x, gr + 7, z, "glowstone");
  if (facade && x === 0 && z === 4 && E - gr >= 9) g.set(x, gr + 2, z, "shroomlight");

  // roof: low eaves on the outside, rising to a full-block ridge along x=2
  const t = TOFF[x];
  if (t === 0) {
    g.set(x, E, z, ROOF_STAIR, { facing: x === 0 ? "west" : "east", half: "bottom", shape: "straight", waterlogged: "false" });
  } else if (t === 1) {
    g.set(x, E, z, ROOF_FILL);
    g.set(x, E + 1, z, ROOF_STAIR, { facing: x === 1 ? "west" : "east", half: "bottom", shape: "straight", waterlogged: "false" });
  } else {
    g.set(x, E, z, ROOF_FILL);
    g.set(x, E + 1, z, ROOF_FILL);
    g.set(x, E + 2, z, ROOF_FILL);
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499466.nbt");
