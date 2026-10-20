import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi low-rise commercial block, c. 1980s-90s: two storeys over a stone plinth,
// white concrete frame with light-gray spandrels, glazed bays, shopfront on the
// entrance face, flat roof with cornice, parapet and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458734";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, gr);
const inside = (x, z) => map.has(`${x},${z}`);
const groundAt = (x, z) => map.get(`${x},${z}`);
const faces = (x, z) => ({
  n: !inside(x, z - 1),
  s: !inside(x, z + 1),
  w: !inside(x - 1, z),
  e: !inside(x + 1, z),
});

const DOOR_FACING = "north";

// Pass 1: foundation, floor slabs, storey lines, roof slab, interior fill
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");        // ground floor slab
  g.set(x, gr + 5, z, "smooth_stone");    // first floor slab
  g.set(x, gr + 10, z, "smooth_stone");   // roof slab
}

// Pass 2: exterior walls, frames, glazing
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const exterior = f.n || f.s || f.w || f.e;
  if (!exterior) continue;

  const corner = (f.n || f.s) && (f.w || f.e);
  const along = (f.n || f.s) ? x : z;
  const pillar = corner || along % 3 === 0;
  const frame = "light_gray_concrete";
  const glaze = "glass_pane";

  // plinth / base course
  g.set(x, gr + 1, z, "polished_andesite");
  // storey 1 glazing with spandrel
  for (const dy of [2, 3]) g.set(x, gr + dy, z, pillar ? frame : glaze);
  g.set(x, gr + 4, z, frame);
  // storey line
  g.set(x, gr + 5, z, frame);
  // storey 2 glazing with spandrel
  for (const dy of [6, 7, 8]) g.set(x, gr + dy, z, pillar ? frame : glaze);
  g.set(x, gr + 9, z, frame);
  // cornice and parapet
  g.set(x, gr + 10, z, "white_concrete");
  g.set(x, gr + 11, z, "white_concrete");
}

// Pass 3: entrance face (north, lowest z) with shopfront and door
const northCells = cells.filter(([x, z]) => faces(x, z).n).map(([x, z, gr]) => [x, z, gr]);
if (northCells.length) {
  const minZ = Math.min(...northCells.map(c => c[1]));
  const front = northCells.filter(c => c[1] === minZ);
  const xs = front.map(c => c[0]).sort((a, b) => a - b);
  const doorX = xs[Math.floor(xs.length / 2)];
  for (const [x, z, gr] of front) {
    // shopfront glazing on ground storey
    g.set(x, gr + 1, z, "polished_andesite");
    g.set(x, gr + 2, z, "glass_pane");
    g.set(x, gr + 3, z, "glass_pane");
    g.set(x, gr + 4, z, "light_gray_concrete");
    if (x === doorX) {
      g.set(x, gr + 1, z, "oak_door", {
        facing: DOOR_FACING, half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 2, z, "oak_door", {
        facing: DOOR_FACING, half: "upper", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 3, z, "glass_pane");
    }
  }
}

// Pass 4: rooftop plant, centred on the footprint's middle cell
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
const cgr = groundAt(cx, cz);
if (cgr !== undefined) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const x = cx + dx, z = cz + dz;
      if (inside(x, z) && groundAt(x, z) === cgr) {
        g.set(x, cgr + 11, z, "light_gray_concrete");
      }
    }
  }
  // two HVAC units on the penthouse corners
  const units = [[cx - 1, cz - 1], [cx + 1, cz + 1]];
  for (const [x, z] of units) {
    if (inside(x, z) && groundAt(x, z) === cgr) {
      g.set(x, cgr + 12, z, "iron_block");
    }
  }
}

// Pass 5: warm light behind glazing on interior floor cells
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (f.n || f.s || f.w || f.e) continue;
  if (x % 6 === 3 && z % 6 === 3) {
    g.set(x, gr + 1, z, "glowstone");
    g.set(x, gr + 6, z, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
