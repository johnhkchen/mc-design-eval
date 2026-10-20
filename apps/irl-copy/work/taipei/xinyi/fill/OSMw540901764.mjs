import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540901764.cells.json", "utf8"));

const W = 18, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr);
const inSet = (x, z) => ground.has(x + "," + z);
const isEdge = (x, z) => !inSet(x - 1, z) || !inSet(x + 1, z) || !inSet(x, z - 1) || !inSet(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const pane = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Entrance: front (minimum z) edge, cell nearest the centre of its x span
let minZ = Infinity, minX = Infinity, maxX = -Infinity;
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  if (z < minZ) minZ = z;
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
}
const midX = (minX + maxX) / 2;
let entX = null;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (z !== minZ) continue;
  if (entX === null || Math.abs(x - midX) < Math.abs(entX - midX)) entX = x;
}
const entKey = entX === null ? null : entX + "," + minZ;

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const isEnt = entKey === x + "," + z;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floors and roof slab (interior) at storey levels
  if (!edge) {
    put(x, gr, z, "smooth_stone");          // ground floor slab
    put(x, gr + 5, z, "light_gray_concrete"); // second floor slab
    put(x, gr + 10, z, "light_gray_concrete"); // roof slab
  }

  // Facade (edge cells only)
  if (edge) {
    const pier = (x + z) % 3 === 0;
    // Base course
    put(x, gr, z, "stone_bricks");
    // Ground floor shopfront: glass with white piers, lintel at rel 4
    for (let r = 1; r <= 3; r++) {
      if (isEnt && (r === 1 || r === 2)) continue;
      if (pier) put(x, gr + r, z, "white_concrete");
      else put(x, gr + r, z, "glass");
    }
    put(x, gr + 4, z, "light_gray_concrete"); // lintel
    // Storey line
    put(x, gr + 5, z, "light_gray_concrete");
    // Upper storey wall with window grid (rel 6..8)
    for (let r = 6; r <= 8; r++) {
      if (pier) {
        put(x, gr + r, z, "white_concrete");
      } else if (r === 7 && (x * 3 + z) % 7 === 0) {
        put(x, gr + r, z, "glowstone"); // lit room behind glass
      } else {
        put(x, gr + r, z, "light_blue_stained_glass_pane", pane);
      }
    }
    put(x, gr + 9, z, "light_gray_concrete"); // sill band
    put(x, gr + 10, z, "smooth_stone");       // cornice
    put(x, gr + 11, z, "white_concrete");     // parapet
  }

  // Entrance door and hanging lantern under the lintel
  if (isEnt && edge) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Roof plant on interior roof, sitting on the roof slab
  if (!edge && x % 5 === 2 && z % 5 === 2) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540901764.nbt");
