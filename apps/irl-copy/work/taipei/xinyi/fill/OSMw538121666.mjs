import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538121666.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538121666.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 21, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Footprint lookup
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const perim = (x, z) =>
  has(x, z) && (!has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1));
const corner = (x, z) =>
  perim(x, z) && (!has(x + 1, z) || !has(x - 1, z)) && (!has(x, z + 1) || !has(x, z - 1));

// Common datum: highest footprint ground, so every storey sits on one level.
// Everything below it is solid foundation, so nothing floats on the slope.
const datum = Math.max(...cells.map((c) => c[2]));
const roofY = datum + 11;

// Front = lowest z row; entrance at its middle cell.
const minZ = Math.min(...cells.map((c) => c[1]));
const frontXs = cells.filter((c) => c[1] === minZ).map((c) => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZc = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const cx = (minX + maxX) / 2, cz = (minZc + maxZ) / 2;

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const WINDOW = "light_blue_stained_glass";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const CORNER = "smooth_quartz";
const isWindowCol = (x, z) => (x + z) % 3 === 1;

// Pass 1: foundation, floor slabs, roof slab.
for (const [x, z] of cells) {
  for (let y = 0; y < datum; y++) put(x, y, z, "stone_bricks");
  put(x, datum, z, "smooth_stone");        // ground floor slab
  put(x, datum + 5, z, "smooth_stone");    // second floor slab
  put(x, datum + 10, z, "smooth_stone");   // roof slab
}

// Pass 2: perimeter walls, windows, bands, parapet, entrance.
for (const [x, z] of cells) {
  if (!perim(x, z)) continue;
  const isCorner = corner(x, z);
  const isFront = z === minZ;
  const isDoor = isFront && x === doorX;

  // Storey 1 (datum+1 .. datum+4)
  for (let dy = 1; dy <= 4; dy++) {
    const y = datum + dy;
    let b;
    if (isCorner) b = CORNER;
    else if (dy === 1) b = "stone_bricks";                    // base course
    else if (isWindowCol(x, z)) b = WINDOW;                   // shopfront glass
    else b = WALL;
    put(x, y, z, b);
  }
  // Storey line between storeys
  put(x, datum + 5, z, BAND);

  // Storey 2 (datum+6 .. datum+9)
  for (let dy = 6; dy <= 9; dy++) {
    const y = datum + dy;
    let b;
    if (isCorner) b = CORNER;
    else if (dy === 9) b = BAND;                              // transom band
    else if (isWindowCol(x, z)) b = WINDOW;
    else b = WALL;
    put(x, y, z, b);
  }

  // Cornice ring and parapet
  put(x, datum + 10, z, BAND);
  put(x, roofY, z, isCorner ? CORNER : BAND);
}

// Entrance: double-height door opening on front row, canopy, hanging lanterns.
put(doorX, datum + 1, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorX, datum + 2, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let dx = -1; dx <= 1; dx++) {
  put(doorX + dx, datum + 3, minZ, "smooth_stone");           // canopy
  put(doorX + dx, datum + 3, minZ + 1, "smooth_stone");       // canopy depth
}
for (const dx of [-1, 1]) {
  if (has(doorX + dx, minZ)) {
    put(doorX + dx, datum + 2, minZ, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 3: warm light behind some ground-floor and upper windows, on interior cells.
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [x, z] of cells) {
  if (!perim(x, z) || corner(x, z)) continue;
  if (!isWindowCol(x, z)) continue;
  for (const yOff of [2, 7]) {
    if ((x * 7 + z * 3 + yOff) % 4 !== 0) continue;
    for (const [dx, dz] of dirs) {
      const nx = x + dx, nz = z + dz;
      if (has(nx, nz) && !perim(nx, nz)) {
        put(nx, datum + yOff, nz, "glowstone");
        break;
      }
    }
  }
}

// Pass 4: rooftop plant on the roof slab, inside the parapet.
for (const [x, z] of cells) {
  if (perim(x, z)) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 4) {
    put(x, roofY, z, (x + z) % 2 === 0 ? "chiseled_stone_bricks" : BAND);
  }
}

g.save(OUT);
