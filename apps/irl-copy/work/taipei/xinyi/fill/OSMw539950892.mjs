import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539950892";
const cells = JSON.parse(readFileSync(BASE + ".cells.json", "utf8"));

// Footprint 12 x 18; roof about 11 blocks above lowest ground.
// Era: late-1990s/2000s Xinyi mid-rise commercial block. Two storeys of about
// 5 blocks each (ground shopfront band + upper office band), white concrete
// piers, smooth quartz cornice, stone base, tinted glazing, parapet and rooftop plant.
const W = 12, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr);
const has = (x, z) => ground.has(x + "," + z);

const DIRS = [
  { n: "south", dx: 0, dz: 1 },
  { n: "north", dx: 0, dz: -1 },
  { n: "east", dx: 1, dz: 0 },
  { n: "west", dx: -1, dz: 0 },
];

// Bounds-checked setter; anything above the canvas is skipped.
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Exterior faces of a footprint cell: directions whose neighbour is outside the footprint.
const faces = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Along-face coordinate: x for south/north faces, z for east/west faces.
const along = (f, x, z) => (f.dz !== 0 ? x : z);

// Pass 1: foundation, floor slabs, roof, walls, windows.
for (const [x, z, G] of cells) {
  const fs = faces(x, z);
  const edge = fs.length > 0;
  const corner = fs.length >= 2;

  // Foundation from y 0 up to this cell's ground; floor surface at ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone");
  put(x, G, z, "smooth_stone");

  // Floor slab per storey (ground+5) and roof slab (ground+10).
  put(x, G + 5, z, "light_gray_concrete");
  put(x, G + 10, z, "light_gray_concrete");

  if (!edge) {
    // Interior: air above the slabs, with occasional rooftop plant on the roof slab.
    if ((x * 3 + z * 5) % 7 === 0) {
      put(x, G + 11, z, "light_gray_concrete");
    }
    continue;
  }

  const f0 = fs[0];
  const a = along(f0, x, z);
  const pier = corner || a % 3 === 0;

  // Base course.
  put(x, G + 1, z, "stone_bricks");

  // Storey 1: shopfront band, piers in stone, glass between, quartz lintel.
  if (pier) {
    put(x, G + 2, z, "stone_bricks");
    put(x, G + 3, z, "stone_bricks");
  } else {
    put(x, G + 2, z, "glass");
    put(x, G + 3, z, "glass");
  }
  put(x, G + 4, z, "smooth_quartz");

  // Storey line (ground+5) already placed as light_gray_concrete.

  // Storey 2: upper office band, white concrete piers, tinted blue glazing.
  put(x, G + 6, z, "smooth_quartz");
  if (pier) {
    put(x, G + 7, z, "white_concrete");
    put(x, G + 8, z, "white_concrete");
  } else {
    put(x, G + 7, z, "light_blue_stained_glass");
    put(x, G + 8, z, "light_blue_stained_glass");
  }
  put(x, G + 9, z, "white_concrete");

  // Cornice and parapet.
  put(x, G + 10, z, "smooth_quartz");
  put(x, G + 11, z, "white_concrete");

  // Warm light behind selected upper windows: glowstone one cell inward.
  if (!pier && a % 6 === 1) {
    const ix = x - f0.dx, iz = z - f0.dz;
    if (has(ix, iz)) put(ix, G + 7, iz, "glowstone");
  }
}

// Pass 2: entrance on the first exterior face, at the middle of its run.
let door = null;
for (const d of DIRS) {
  const cand = cells
    .filter(([x, z]) => {
      const fs = faces(x, z);
      return fs.length === 1 && fs[0].n === d.n;
    })
    .sort((p, q) => along(d, p[0], p[1]) - along(d, q[0], q[1]));
  if (cand.length) {
    door = { d, cell: cand[Math.floor(cand.length / 2)] };
    break;
  }
}
if (door) {
  const [dx0, dz0, G] = door.cell;
  const props = (half) => ({
    facing: door.d.n,
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(dx0, G + 1, dz0, "dark_oak_door", props("lower"));
  put(dx0, G + 2, dz0, "dark_oak_door", props("upper"));
  // Recessed entrance: glass transom above the door under the quartz lintel.
  put(dx0, G + 3, dz0, "glass");
}

g.save(BASE + ".nbt");
