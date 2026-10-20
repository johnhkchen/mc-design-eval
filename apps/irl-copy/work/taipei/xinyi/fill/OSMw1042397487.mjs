import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1042397487.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1042397487.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 14, H = 23, D = 25;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground level (top of foundation)
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Exposed faces of a perimeter cell (outward normal)
function exposed(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ nx: 0, nz: -1 });
  if (!has(x, z + 1)) f.push({ nx: 0, nz: 1 });
  if (!has(x - 1, z)) f.push({ nx: -1, nz: 0 });
  if (!has(x + 1, z)) f.push({ nx: 1, nz: 0 });
  return f;
}

// Set a block only inside the footprint and the volume
function put(x, y, z, name, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

const ROOF_Y = 11;       // roof membrane top sits at y=11
const PARAPET_TOP = 13;  // parapet cap
const MINX = 0, MINZ = 0;

// 1) Foundations, perimeter walls, interior floors and ceilings
for (const [x, z, b] of cells) {
  // Foundation solid from 0 up to this cell's ground, base course on top
  for (let y = 0; y < b; y++) put(x, y, z, "stone");
  put(x, b, z, "stone_bricks");

  if (isPerim(x, z)) {
    const faces = exposed(x, z);
    const f = faces[0];
    // Position along the exposed face; piers every third bay, starting at the corner
    const a = f.nx !== 0 ? z - MINZ : x - MINX;
    const win = a % 3 !== 0;

    for (let y = b + 1; y <= PARAPET_TOP; y++) {
      if (y === 6 || y === 11) put(x, y, z, "white_concrete");           // storey line / cornice
      else if (y === 12) put(x, y, z, "smooth_quartz");                  // parapet
      else if (y === 13) put(x, y, z, "quartz_slab", { type: "top", waterlogged: "false" }); // cap
      else if (y <= 5) put(x, y, z, win ? "light_blue_stained_glass" : "stone_bricks");     // shopfront
      else put(x, y, z, win ? "gray_stained_glass" : "smooth_quartz");   // upper storey
    }

    // Warm light behind some upper-floor glass (interior air cell inward of the window)
    if (win && a % 6 === 1) {
      const ix = x - f.nx, iz = z - f.nz;
      if (has(ix, iz) && !isPerim(ix, iz)) put(ix, 8, iz, "glowstone");
    }
  } else {
    // Interior: air cavity, floor slab at storey line, roof slab on top
    if (6 > b) put(x, 6, z, "smooth_stone");
    put(x, ROOF_Y, z, "gray_concrete");
  }
}

// 2) Entrance on the south (+z) face, near the middle, on a window bay
{
  let best = null;
  for (const [x, z, b] of cells) {
    if (!has(x, z + 1) && isPerim(x, z)) {
      const a = x - MINX;
      if (a % 3 === 0) continue;
      const d = Math.abs(x - 6.5);
      if (!best || d < best.d) best = { x, z, b, d };
    }
  }
  if (best) {
    const { x, z, b } = best;
    const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
    if (b + 1 <= 5) put(x, b + 1, z, "dark_oak_door", doorProps("lower"));
    if (b + 2 <= 5) put(x, b + 2, z, "dark_oak_door", doorProps("upper"));
    if (b + 3 <= 5) put(x, b + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 3) Roof equipment: water tank and stair housing, standing on the roof at y=11
// Water tank, 3x3 block with a capped top
for (let x = 3; x <= 5; x++) {
  for (let z = 4; z <= 6; z++) {
    for (let y = 12; y <= 14; y++) put(x, y, z, "light_gray_concrete");
    put(x, 15, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Stair housing, 3x3 with a flat cap and a door on its north face
for (let x = 9; x <= 11; x++) {
  for (let z = 16; z <= 18; z++) {
    for (let y = 12; y <= 14; y++) put(x, y, z, "smooth_quartz");
    put(x, 15, z, "gray_concrete");
  }
}
put(10, 12, 16, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(10, 13, 16, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

g.save(OUT);
