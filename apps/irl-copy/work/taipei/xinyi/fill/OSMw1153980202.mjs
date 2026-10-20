import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980202";
const W = 19, H = 43, D = 15;
const ROOF = 31;      // roof deck, about 31 blocks above lowest ground
const TOP_WALL = 30;  // last wall course under the parapet

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const exterior = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

function put(x, y, z, block, st) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, block, st);
  else g.set(x, y, z, block);
}

// Mid-rise commercial block, c.1990s Taipei: white tiled concrete walls,
// blue-tinted glass bands, light-grey storey lines, stone-brick cornice.
const FLOOR_LINES = [5, 10, 15, 20, 25, 30];

for (const [x, z, gr] of cells) {
  const ext = exterior(x, z);
  const bay = (x + z) % 2 === 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Roof deck and parapet
  put(x, ROOF, z, ext ? "white_concrete" : "gray_concrete");
  if (ext) put(x, ROOF + 1, z, "white_concrete");

  // Walls, storey by storey (only from this cell's ground upward)
  for (let y = gr; y <= TOP_WALL; y++) {
    if (y < 0) continue;

    if (!ext) {
      // Interior: floor slabs only, air elsewhere (no interiors)
      if (y >= 5 && y % 5 === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    if (y === TOP_WALL) {
      put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      continue;
    }

    if (y < 5) {
      // Shopfront ground storey
      if (y === gr) put(x, y, z, "polished_andesite");          // base course
      else if (y === 4) put(x, y, z, "white_concrete");         // fascia / lintel
      else put(x, y, z, bay ? "light_blue_stained_glass" : "smooth_quartz");
      continue;
    }

    const rel = y % 5;
    if (rel === 0) {
      put(x, y, z, "light_gray_concrete");                       // storey line
    } else if (rel === 4) {
      put(x, y, z, "white_concrete");                            // spandrel
    } else {
      // Window band: glass panes between smooth quartz mullions
      if (!bay) {
        put(x, y, z, "smooth_quartz");
      } else {
        const lit = rel === 2 && (x * 5 + z * 3 + Math.floor(y / 5)) % 6 === 0;
        put(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
      }
    }
  }

  // Interior floor slabs at the storey lines on interior cells above the ground
  if (!ext) {
    for (const fl of FLOOR_LINES) if (fl >= gr) put(x, fl, z, "smooth_stone");
  }
}

// Roof penthouse: a stepped core on interior cells, capped with a stone slab
for (const [x, z, gr] of cells) {
  if (exterior(x, z)) continue;
  if (x < 5 || x > 13 || z < 4 || z > 10) continue;
  for (let y = ROOF + 1; y <= 35; y++) {
    if (y === 35) {
      put(x, y, z, "smooth_stone");
    } else if (y === 33 || y === 34) {
      put(x, y, z, (x + z) % 2 === 0 ? "light_blue_stained_glass" : "smooth_quartz");
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

// Antenna mast on the penthouse centre, with a red aviation light and lightning rod
if (has(9, 7) && !exterior(9, 7)) {
  for (let y = 36; y <= 41; y++) put(9, y, 7, "iron_bars");
  put(9, 36, 7, "redstone_lamp", { lit: "true" });
  put(9, 42, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Entrance: on the north face (min z), nearest the middle of the facade
{
  let minZ = Infinity;
  const extCells = cells.filter(([x, z]) => exterior(x, z));
  for (const [, z] of extCells) minZ = Math.min(minZ, z);
  const candidates = extCells.filter(([, z]) => z === minZ);
  candidates.sort((a, b) => Math.abs(a[0] - 9) - Math.abs(b[0] - 9));
  if (candidates.length) {
    const [ex, ez, egr] = candidates[0];
    put(ex, egr, ez, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(ex, egr + 1, ez, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Recessed entry lintel sits in the fascia band already placed above the door
  }
}

g.save(`${DIR}/${ID}.nbt`);
