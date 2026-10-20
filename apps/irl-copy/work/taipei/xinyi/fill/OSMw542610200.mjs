import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century (1960s-80s) Taipei low-rise commercial block: stone-clad base,
// painted concrete upper storey, shopfront at grade, glazed bays, parapet, rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610200";
const W = 19, H = 23, D = 26;
const TOP = 11;          // parapet top, ~11 blocks above lowest ground
const FLOOR1 = 5;        // slab between ground and upper storey
const ROOF_DECK = 10;    // roof deck / cornice level

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);
const isWall = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Front (street) door: lowest-z footprint cell in the middle bays, x 8..10
const doorCells = new Set();
for (let x = 8; x <= 10; x++) {
  let maxZ = -1;
  for (const [cx, cz] of cells) if (cx === x && cz > maxZ) maxZ = cz;
  if (maxZ >= 0) doorCells.add(`${x},${maxZ}`);
}
const isDoor = (x, z) => doorCells.has(`${x},${z}`);

// Inward direction for a wall cell: the neighbour that is interior footprint
function inward(x, z) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dz] of dirs) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isWall(nx, nz)) return [nx, nz];
  }
  return null;
}

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(TOP, gr0));
  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
  if (gr >= TOP) continue;

  const wall = isWall(x, z);

  if (!wall) {
    // Interior: floor slabs and roof deck only, air between (no interiors)
    set(x, gr, z, "smooth_stone");
    if (gr <= FLOOR1) set(x, FLOOR1, z, "smooth_stone");
    if (gr <= ROOF_DECK) set(x, ROOF_DECK, z, "light_gray_concrete");
    // Rooftop plant on a sparse grid
    if (x % 5 === 2 && z % 6 === 3) set(x, TOP, z, "iron_block");
    else if (x % 7 === 4 && z % 7 === 1) set(x, TOP, z, "light_gray_concrete");
    continue;
  }

  // Exterior wall cell
  const pier = (x + z) % 3 === 0;
  // Pane connections to neighbouring footprint walls
  const conn = {
    north: has(x, z - 1) && isWall(x, z - 1) ? "true" : "false",
    south: has(x, z + 1) && isWall(x, z + 1) ? "true" : "false",
    east: has(x + 1, z) && isWall(x + 1, z) ? "true" : "false",
    west: has(x - 1, z) && isWall(x - 1, z) ? "true" : "false",
  };

  for (let y = gr; y <= TOP; y++) {
    if (y === gr) {
      set(x, y, z, "stone_bricks");                       // base course
    } else if (y <= 4) {
      // Ground floor: shopfront
      const rel = y - gr;
      if (isDoor(x, z) && (rel === 1 || rel === 2)) {
        set(x, y, z, "dark_oak_door", {
          facing: "south",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (y === 4) {
        set(x, y, z, "white_concrete");                   // lintel
      } else if (isDoor(x, z) && rel === 3) {
        set(x, y, z, "white_concrete");                   // over door
      } else if (pier) {
        set(x, y, z, "white_concrete");                   // pier
      } else {
        set(x, y, z, "glass");                            // shop glazing
      }
    } else if (y === FLOOR1) {
      set(x, y, z, "stone_bricks");                       // storey band
    } else if (y <= 9) {
      // Upper storey: glazed bays with concrete mullions
      if (pier) set(x, y, z, "white_concrete");
      else set(x, y, z, "glass_pane", conn);
    } else if (y === ROOF_DECK) {
      set(x, y, z, "quartz_block");                       // cornice
    } else if (y === TOP) {
      set(x, y, z, "white_concrete");                     // parapet
    }
  }

  // Warm lights behind glass, in the interior cell beside a window
  const inn = inward(x, z);
  if (inn && !isDoor(x, z)) {
    const [ix, iz] = inn;
    // ground floor glowstone on the interior floor
    if (((x * 2 + z) % 4) === 1 && gr < 4) set(ix, gr + 1, iz, "glowstone");
    // upper storey shroomlight on the slab at y=6
    if (gr <= FLOOR1 && ((x * 5 + z * 3) % 4) === 0 && !pier) set(ix, FLOOR1 + 1, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
