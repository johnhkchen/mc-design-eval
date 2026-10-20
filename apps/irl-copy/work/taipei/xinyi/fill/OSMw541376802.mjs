import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541376802.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541376802.nbt";

// Record: 40 x 14 footprint, roof ~11 above lowest ground.
// Read as a two-storey (about 5 blocks per storey) 1980s-90s Taipei street-front
// commercial block: stone base, shopfront glass at ground, tiled/white-concrete
// upper storey with glass-pane windows, a cornice and a parapet, flat roof with
// rooftop plant.
const W = 40, H = 23, D = 14;

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.floor(gr));
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (z < minZ) minZ = z;
  if (z > maxZ) maxZ = z;
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const spanX = maxX - minX;

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const doorCols = [6, spanX - 10]; // two entrances on the street face (z = minZ)

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const base = gnd(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone");

  const perim = !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
  const edgeX = x === minX || x === maxX;
  const edgeZ = z === minZ || z === maxZ;
  const corner = edgeX && edgeZ;

  // Facade coordinate along the wall and inward direction.
  const onStreetOrBack = z === minZ || z === maxZ;
  const uRel = onStreetOrBack ? x - minX : z - minZ;
  const dx = x === minX ? 1 : x === maxX ? -1 : 0;
  const dz = z === minZ ? 1 : z === maxZ ? -1 : 0;

  if (!perim) {
    // Interior: floor slabs per storey and the roof deck. Air between.
    put(x, base, z, "smooth_stone");
    put(x, base + 5, z, "smooth_stone");
    put(x, base + 9, z, "light_gray_concrete");

    // Rooftop plant boxes.
    const ix = x - minX, iz = z - minZ;
    if ((ix === 8 || ix === 9) && (iz === 3 || iz === 4)) put(x, base + 10, z, "iron_block");
    if ((ix === 20 || ix === 21) && (iz === 8 || iz === 9)) put(x, base + 10, z, "smooth_stone");
    continue;
  }

  const pilaster = corner || uRel % 4 === 0;
  const isDoorCell = z === minZ && !corner && doorCols.includes(uRel);

  // Column of facade blocks from base (base course) to parapet (base + 10).
  put(x, base, z, "stone_bricks");

  for (let k = 1; k <= 10; k++) {
    const y = base + k;
    let id = null, props;
    if (k <= 3) {
      if (pilaster) id = "light_gray_concrete";
      else if (isDoorCell && k <= 2) {
        id = "oak_door";
        props = {
          facing: "north",
          half: k === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (k === 1) id = "smooth_stone";
      else id = "glass";
    } else if (k === 4) id = "smooth_stone";
    else if (k === 5) id = "white_concrete";
    else if (k <= 8) {
      if (pilaster) id = "light_gray_concrete";
      else { id = "glass_pane"; props = PANE; }
    } else if (k === 9) id = "smooth_stone";
    else id = "white_concrete";

    put(x, y, z, id, props);
  }

  // Warm lights set two blocks inside the glass on non-pilaster bays.
  if (!corner && !pilaster && !isDoorCell && (dx === 0) !== (dz === 0)) {
    const lx = x + 2 * dx, lz = z + 2 * dz;
    if (uRel % 8 === 2 && has(lx, lz)) {
      put(lx, base + 2, lz, "glowstone");
      put(lx, base + 7, lz, "shroomlight");
    }
  }
}

g.save(OUT);
