import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi low-rise commercial block, c. 1980s: two storeys over a shopfront
// plinth, white tiled walls, tinted glass bays, stone cornices and a parapet
// with rooftop units. Storey lines at base+5 and base+10; roof surface at base+11.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw537993157";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 15, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), gr);

// outward directions: [dx, dz, facing]
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance on the north (street) face, at the median north-face cell.
const northXs = cells
  .filter(([x, z]) => !gmap.has(key(x, z - 1)))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;

for (const [x, z, gr] of cells) {
  const base = gr;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  const outs = DIRS.filter(([dx, dz]) => !gmap.has(key(x + dx, z + dz)));
  const edge = outs.length > 0;

  if (!edge) {
    // Interior: floor slabs only, air above (no interiors).
    put(x, base, z, "smooth_stone");
    put(x, base + 5, z, "smooth_stone");
    put(x, base + 10, z, "gray_concrete");
    // Rooftop units on the roof slab.
    if (x % 4 === 1 && z % 4 === 1) put(x, base + 11, z, "iron_block");
    continue;
  }

  const [dx, dz, face] = outs[0];
  const u = dx !== 0 ? z : x; // along-facade index
  const pier = u % 3 === 0;
  const isDoor = dz === -1 && x === doorX;
  const canopyBay = dz === -1 && Math.abs(x - doorX) <= 1;
  const inX = x - dx, inZ = z - dz;
  const hasInterior = gmap.has(key(inX, inZ));
  const lightBay = !pier && u % 6 === 2 && hasInterior;

  // Plinth course.
  put(x, base, z, "polished_granite");

  // Ground storey: shopfront, dy 1..3; lintel band dy 4.
  for (let dy = 1; dy <= 3; dy++) {
    const y = base + dy;
    if (isDoor) {
      if (dy === 1) {
        put(x, y, z, "oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (dy === 2) {
        put(x, y, z, "oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "smooth_stone");
      }
    } else if (pier) {
      put(x, y, z, "stone_bricks");
    } else {
      put(x, y, z, "glass");
    }
  }
  if (lightBay) put(inX, base + 1, inZ, "glowstone");

  // Lintel / canopy band over the shopfront.
  if (canopyBay) {
    put(x, base + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    put(x, base + 4, z, "smooth_stone");
  }

  // First-floor cornice line.
  put(x, base + 5, z, "smooth_stone");

  // Upper storey: dy 6..8 windows, dy 9 lintel band.
  for (let dy = 6; dy <= 8; dy++) {
    const y = base + dy;
    put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }
  put(x, base + 9, z, "white_concrete");
  if (lightBay) put(inX, base + 6, inZ, "shroomlight");

  // Roof cornice and parapet.
  put(x, base + 10, z, "smooth_stone");
  put(x, base + 11, z, "white_concrete");
}

g.save(`${dir}/${id}.nbt`);
