import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 24 x 23 footprint, roof about 11 blocks above the lowest ground.
// Read as a two-storey, white-tiled Taiwanese commercial block of the 1980s-90s:
// stone base course, white-tile walls, glass shopfront with white piers,
// one storey-2 band of glass, a light-grey cornice and a parapet, plus rooftop plant boxes.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538121683.cells.json", "utf8"));

const W = 24, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const G = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const ground = Math.round(gr);
  G.set(x + "," + z, ground);
  if (ground < minG) minG = ground;
}

const has = (x, z) => G.has(x + "," + z);
const groundAt = (x, z) => G.get(x + "," + z);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Which outward face a perimeter cell sits on, with the along-face index and the inward offset.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "N", along: x, inX: 0, inZ: 1 };
  if (!has(x, z + 1)) return { face: "S", along: x, inX: 0, inZ: -1 };
  if (!has(x - 1, z)) return { face: "W", along: z, inX: 1, inZ: 0 };
  if (!has(x + 1, z)) return { face: "E", along: z, inX: -1, inZ: 0 };
  return null;
}

// Bounds-checked setter so nothing is written outside the box.
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Level plan (absolute y, base = minG):
//  minG+0       ground floor slab (per cell at its own ground)
//  minG+1       stone base course
//  minG+2..3    ground-storey glass band, white piers every 4 blocks
//  minG+4       light-grey spandrel
//  minG+5       storey-2 floor slab
//  minG+6       sill
//  minG+7..8    storey-2 glass band
//  minG+9       head spandrel
//  minG+10      roof slab / cornice
//  minG+11      parapet (perimeter) and plant boxes (interior)
const TOP = minG + 11;

for (const [x, z, gr] of cells) {
  const ground = Math.round(gr);
  const edge = isEdge(x, z);
  const f = edge ? faceOf(x, z) : null;

  // Foundation fill up to this cell's ground, then the floor surface.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");
  put(x, ground, z, "smooth_stone");

  for (let y = ground + 1; y <= TOP; y++) {
    if (y === TOP) {
      if (edge) put(x, y, z, "white_concrete");
      else if (x % 7 === 3 && z % 7 === 3) put(x, y, z, "iron_block");
      continue;
    }
    if (y === minG + 10) {
      if (edge) put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === minG + 5) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (!edge || !f) continue;

    const a = f.along;
    const pier = a % 4 === 0;
    const isEntrance = f.face === "N" && (a === 11 || a === 12);

    if (y === minG + 1) {
      if (isEntrance && (ground <= minG + 1)) {
        put(x, y, z, "oak_door", {
          facing: "north", half: "lower", hinge: a === 11 ? "left" : "right",
          open: "false", powered: "false",
        });
      } else put(x, y, z, "stone_bricks");
      continue;
    }
    if (y === minG + 2 && isEntrance && ground <= minG + 2) {
      put(x, y, z, "oak_door", {
        facing: "north", half: "upper", hinge: a === 11 ? "left" : "right",
        open: "false", powered: "false",
      });
      continue;
    }
    if (y === minG + 4 || y === minG + 6 || y === minG + 9) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    const windowRow = y === minG + 2 || y === minG + 3 || y === minG + 7 || y === minG + 8;
    if (windowRow) {
      if (pier) put(x, y, z, "white_concrete");
      else if (isEntrance && y <= minG + 3) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "light_blue_stained_glass");
      continue;
    }
    // Remaining wall rows (ground above base course, etc.) are plain white tile.
    if (y > ground) put(x, y, z, "white_concrete");
  }
}

// Warm light behind glass: glowstone on the interior floor one bay in from selected windows.
for (const [x, z, gr] of cells) {
  const ground = Math.round(gr);
  if (!isEdge(x, z)) continue;
  const f = faceOf(x, z);
  if (!f) continue;
  const ix = x + f.inX, iz = z + f.inZ;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const igr = groundAt(ix, iz);
  // Ground storey: light on the interior floor at minG+1 (sits on the ground-floor slab).
  if (f.along % 8 === 2 && igr <= minG && ground <= minG) {
    put(ix, minG + 1, iz, "glowstone");
  }
  // Storey 2: light on the storey-2 floor slab at minG+6.
  if (f.along % 8 === 4 && igr <= minG + 5) {
    put(ix, minG + 6, iz, "glowstone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538121683.nbt");
