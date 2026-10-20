import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541457994";
const cells = JSON.parse(readFileSync(base + ".cells.json", "utf8"));

const W = 19, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(x + "," + z, gy);
const has = (x, z) => ground.has(x + "," + z);

// Edge cells touch the outside on at least one side; interior cells are enclosed.
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = Math.round((minX + maxX) / 2), cz = Math.round((minZ + maxZ) / 2);

// Entrance: north (low z) edge cell nearest the centre line
let door = null;
for (const [x, z] of cells) {
  if (z !== minZ || !isEdge(x, z)) continue;
  if (!door || Math.abs(x - cx) < Math.abs(door.x - cx)) door = { x, z };
}

// Interior neighbour used to place a warm light behind a window
const interiorNeighbour = (x, z) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isEdge(nx, nz)) return { x: nx, z: nz };
  }
  return null;
};

const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, gr] of cells) {
  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  if (!edge) {
    // Interior: floor slab per storey and roof cap, air between (no interiors)
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 11, z, "gray_concrete");
    continue;
  }

  // Exterior shell, 1 cell thick, following each cell's own ground
  put(x, gr, z, "polished_andesite"); // base course
  for (let y = gr + 1; y <= gr + 3; y++) {
    // Ground storey: shopfront glass with stone piers
    put(x, y, z, (x + z) % 3 === 0 ? "stone_bricks" : "glass_pane");
  }
  put(x, gr + 4, z, "smooth_stone"); // lintel / storey line
  put(x, gr + 5, z, "smooth_stone"); // floor band
  for (let y = gr + 6; y <= gr + 9; y++) {
    // Upper storey: window grid with white wall between
    put(x, y, z, (x + z) % 2 === 0 ? "glass_pane" : "white_concrete");
  }
  put(x, gr + 10, z, "stone_bricks"); // cornice
  put(x, gr + 11, z, "gray_concrete"); // roof cap
  put(x, gr + 12, z, "stone_bricks"); // parapet

  // Entrance on the north face
  if (door && x === door.x && z === door.z) {
    put(x, gr + 1, z, "oak_door", doorProps("lower"));
    put(x, gr + 2, z, "oak_door", doorProps("upper"));
    put(x, gr + 3, z, "lantern", { hanging: "true" });
  }

  // Warm light behind some upper windows
  if ((x + z) % 4 === 0) {
    const n = interiorNeighbour(x, z);
    if (n) put(n.x, gr + 7, n.z, "shroomlight");
  }
}

// Roof equipment: a short stair-stepped plant room on the central spine
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (x === cx && Math.abs(z - cz) <= 1) {
    put(x, gr + 12, z, "smooth_quartz");
    put(x, gr + 13, z, "smooth_quartz");
  }
}

g.save(base + ".nbt");
