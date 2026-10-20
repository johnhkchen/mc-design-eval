import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof ~29 blocks above lowest ground.
// Read as a 1990s-2000s Taipei mid-rise office/retail block: six storeys on a
// white-tile and glass grid, granite shopfront, light-grey storey lines,
// cornice and parapet, rooftop plant boxes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265962";
const W = 24, H = 41, D = 15;
const ROOF = 29;            // roof slab top level (absolute y)
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 4, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const OFF = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const exposed = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};

const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const FLOOR = "smooth_stone";
const GLASS = "light_blue_stained_glass";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const LIGHT = "glowstone";

for (const [key, B] of ground) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, z);
  const perim = ex.length > 0;
  const corner = ex.length >= 2;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < B; y++) put(x, y, z, FOUND);

  // Storey levels for this cell: slabs at B + 5k while the storey fits under the roof.
  const storeys = [];
  for (let S = B; S <= ROOF - 4; S += STOREY) storeys.push(S);

  if (!perim) {
    // Interior: floor slabs and roof only, air between (no interiors).
    for (const S of storeys) put(x, S, z, FLOOR);
    put(x, ROOF, z, FLOOR);
    continue;
  }

  // Perimeter: solid wall from ground to roof, then cornice and parapet.
  for (let y = B; y < ROOF; y++) put(x, y, z, WALL);
  put(x, ROOF, z, BAND);                                   // cornice band
  put(x, ROOF + 1, z, WALL);                               // parapet
  put(x, ROOF + 2, z, WALL);
  put(x, ROOF + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // parapet cap

  // Base course at the ground line.
  put(x, B, z, BASE);

  for (const S of storeys) {
    put(x, S + 4, z, BAND);                                 // storey line / spandrel
    if (S !== B) put(x, S, z, BAND);                        // floor line on facade
  }

  // Window grid: glass in 2-of-3 bays on single-face cells, piers at corners.
  const face = ex[0];
  const idx = (face === "north" || face === "south") ? x : z;
  const isWindowBay = !corner && (idx % 3 !== 0);

  for (const S of storeys) {
    if (isWindowBay) {
      for (let y = S + 1; y <= S + 3; y++) put(x, y, z, GLASS);
      // Warm light behind some panes, in the interior cell just inside the wall.
      const ix = x - OFF[face][0], iz = z - OFF[face][1];
      if (has(ix, iz) && (x * 7 + z * 3 + S) % 5 === 0) {
        put(ix, S + 2, iz, LIGHT);
      }
    }
  }
}

// Street entrance on the north (z = 0) frontage, ground storey.
for (const [key, B] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (z !== 0 || !has(x, z) || !exposed(x, z).includes("north")) continue;
  if (x < 10 || x > 13) continue;
  if (x === 10 || x === 13) {
    for (let y = B + 1; y <= B + 3; y++) put(x, y, z, BASE);       // stone pillars
  } else if (x === 11) {
    put(x, B + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, B + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, B + 3, z, GLASS);                                        // transom
  } else {
    for (let y = B + 1; y <= B + 3; y++) put(x, y, z, GLASS);       // glass door leaf
  }
  put(x, B + 4, z, BAND);                                           // canopy lintel
}

// Rooftop plant: a few light-grey service boxes with slab caps on the roof.
for (const [key, B] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (exposed(x, z).length > 0) continue;
  const interiorNeighbours = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return has(nx, nz) && exposed(nx, nz).length === 0;
  });
  if (!interiorNeighbours) continue;
  if (x % 6 === 3 && z % 4 === 2) {
    for (let y = ROOF + 1; y <= ROOF + 2; y++) put(x, y, z, BAND);
    put(x, ROOF + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
