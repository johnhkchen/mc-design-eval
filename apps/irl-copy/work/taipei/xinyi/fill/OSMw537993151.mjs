import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993151";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 18 x 15. Record gives roof about 11 blocks above lowest ground:
// a two-storey (~5 blocks per storey) low-rise commercial block of white
// concrete with a glazed shopfront, an upper storey of punched windows,
// a light cornice and a roof terrace with plant.
const W = 18, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, gr);
const has = (x, z) => cellMap.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Lowest ground under the footprint; the roof sits at a common level B + 10.
const B = Math.min(...cells.map((c) => c[2]));

// Entrance: edge cell on the south (max z) face nearest the middle of the frontage.
const maxZ = Math.max(...cells.map((c) => c[1]));
let door = null;
let bestScore = Infinity;
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const score = Math.abs(x - 9) + (maxZ - z) * 3;
  if (score < bestScore) { bestScore = score; door = { x, z, gr }; }
}

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  let T = B + 10;                 // common roof-cap level
  if (T < gr + 2) T = gr + 2;     // keep at least a floor above this cell's ground
  if (T > H - 4) T = H - 4;       // leave room for roof plant

  const b = (x + z) % 3;          // bay index along the facade

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / plinth course.
  put(x, gr, z, edge ? "polished_andesite" : "smooth_stone");

  // Ground storey shopfront: glazed bays between polished andesite piers.
  if (edge) {
    for (let y = gr + 1; y <= Math.min(gr + 3, T - 1); y++) {
      if (b === 1) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "polished_andesite");
    }
    // Lintel / fascia over the shopfront.
    if (gr + 4 < T) put(x, gr + 4, z, "light_gray_concrete");
  }

  // Storey line (second floor slab).
  if (gr + 5 < T) put(x, gr + 5, z, edge ? "light_gray_concrete" : "smooth_stone");

  // Upper storey: punched windows in white concrete, mullions in light grey.
  if (edge && gr + 5 < T) {
    for (let y = gr + 6; y <= Math.min(gr + 9, T - 1); y++) {
      if (b === 1) {
        const lit = (x * 5 + z * 7 + y) % 9 === 0;
        put(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
      } else if (b === 0) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  }

  // Roof: cornice on the edge, roof slab inside, plant on the terrace.
  if (edge) {
    put(x, T, z, "smooth_quartz");
  } else {
    put(x, T, z, "light_gray_concrete");
    if (x % 6 === 3 && z % 5 === 2 && T + 2 < H) {
      put(x, T + 1, z, "iron_block");
    }
  }
}

// Entrance door with a hanging lantern beneath the lintel.
if (door) {
  const facing = door.z === maxZ ? "south" : (door.z === 0 ? "north" : (door.x === 0 ? "west" : "east"));
  const dprops = { facing, hinge: "left", open: "false", powered: "false" };
  put(door.x, door.gr + 1, door.z, "dark_oak_door", { ...dprops, half: "lower" });
  put(door.x, door.gr + 2, door.z, "dark_oak_door", { ...dprops, half: "upper" });
  put(door.x, door.gr + 3, door.z, "lantern", { hanging: "true" });
}

g.save(`${DIR}/${ID}.nbt`);
