import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw831857620: no record, so this is a two-storey 1980s Taipei commercial block.
// Shopfront ground floor, white tiled concrete upper storey with blue-tinted glazing,
// quartz cornice and parapet, flat roof deck with rooftop plant.
// Footprint 23 x 14. Roof about 11 blocks above datum: 5 + 5 + 1 parapet.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857620";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, L = 14;
const g = new Voxels([W, H, L]);

const cellList = cells.map(([x, z, ground]) => ({ x, z, ground }));
const inside = new Set(cellList.map(c => `${c.x},${c.z}`));
const has = (x, z) => inside.has(`${x},${z}`);

// Common datum: the highest ground under the footprint, so every floor is level.
const datum = Math.max(...cellList.map(c => c.ground));
const TOP = datum + 11;

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= L || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Missing-neighbour directions: [dx, dz, face]
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// 1. Foundation and plinth: solid from y 0 up to the datum under every footprint cell.
for (const { x, z } of cellList) {
  for (let y = 0; y < datum; y++) put(x, y, z, "stone_bricks");
}

// 2. Floor slabs at each storey line, roof deck interior.
for (const { x, z } of cellList) {
  put(x, datum, z, "smooth_stone");          // ground floor slab
  put(x, datum + 5, z, "smooth_stone");      // second floor slab
  put(x, datum + 10, z, "light_gray_concrete"); // roof deck slab
}

// Choose the door: on the north (min z) face, nearest the middle of the frontage.
const minZ = Math.min(...cellList.map(c => c.z));
const northCells = cellList.filter(c => c.z === minZ).map(c => c.x);
const midX = northCells.reduce((a, b) => a + b, 0) / northCells.length;
const doorX = northCells.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), northCells[0]);

// 3. Perimeter walls, window grids, storey lines, cornice, parapet.
for (const { x, z } of cellList) {
  const miss = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (miss.length === 0) continue; // interior cell, no facade

  const [mdx, mdz] = miss[0];
  const along = mdz !== 0 ? x : z;          // index along the facade
  const corner = miss.length > 1;
  const pillar = corner || along % 3 === 0; // columns on a 3-block bay
  const ix = x - mdx, iz = z - mdz;         // interior cell behind this facade
  const interiorOK = has(ix, iz);

  const isDoor = mdz === -1 && z === minZ && x === doorX;

  // Ground storey: shopfront, glass with pillars, quartz lintel.
  for (let r = 1; r <= 3; r++) {
    const y = datum + r;
    if (isDoor) {
      if (r === 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (r === 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "smooth_quartz");
      continue;
    }
    if (pillar) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass");
  }
  // Lintel over the shopfront.
  put(x, datum + 4, z, "smooth_quartz");

  // Storey line band.
  put(x, datum + 5, z, "quartz_block");

  // Upper storey: spandrels top and bottom, glass between pillars.
  put(x, datum + 6, z, "white_concrete");
  for (let r = 7; r <= 8; r++) {
    put(x, datum + r, z, pillar ? "white_concrete" : "light_blue_stained_glass");
  }
  put(x, datum + 9, z, "white_concrete");

  // Cornice and parapet.
  put(x, datum + 10, z, "quartz_block");
  put(x, TOP, z, "quartz_block");

  // Warm light behind some windows, in the interior air gap.
  if (interiorOK && !pillar && !isDoor) {
    if (along % 6 === 2) put(ix, datum + 2, iz, "glowstone");
    if (along % 6 === 5) put(ix, datum + 7, iz, "shroomlight");
  }
  // Light just inside the door.
  if (isDoor && interiorOK) put(ix, datum + 1, iz, "glowstone");
}

// 4. Rooftop plant on the roof deck, inside the parapet.
for (const { x, z } of cellList) {
  const isInterior = DIRS.every(([dx, dz]) => has(x + dx, z + dz));
  if (!isInterior) continue;
  if ((x + 2 * z) % 9 === 0) {
    put(x, TOP, z, "iron_block");
  } else if ((x + 2 * z) % 9 === 4) {
    put(x, TOP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
