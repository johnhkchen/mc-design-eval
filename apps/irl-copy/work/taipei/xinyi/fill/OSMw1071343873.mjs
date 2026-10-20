import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343873";
const W = 32, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
};

// Bounds-guarded setter; props optional
const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };
const LANTERN_HANG = { hanging: "true", waterlogged: "false" };

// Entrance: middle of the north (street) facade
const northXs = cells.filter(([x, z]) => faceOf(x, z) === "north").map(([x]) => x).sort((a, b) => a - b);
const doorX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;

for (const [x, z, gr] of cells) {
  const B = Math.round(gr);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  if (!edge) {
    // Interior: floor slabs per storey, air between, flat roof slab
    put(x, B, z, "smooth_stone");          // ground floor slab
    put(x, B + 5, z, "smooth_stone");      // second floor slab
    put(x, B + 10, z, "light_gray_concrete"); // roof slab

    // Warm interior lights standing on the floors, seen through glass
    if ((x * 3 + z) % 7 === 0) put(x, B + 1, z, "lantern", LANTERN);
    if ((x + 2 * z) % 6 === 0) put(x, B + 6, z, "lantern", LANTERN);

    // Roof mechanical units (two-high boxes on the roof slab)
    if (x % 9 >= 4 && x % 9 <= 5 && z % 7 >= 3 && z % 7 <= 4) {
      put(x, B + 11, z, "iron_block");
      put(x, B + 12, z, "iron_block");
    }
    continue;
  }

  // ---- Edge cells: the facade shell ----
  const face = faceOf(x, z);
  const idx = face === "north" || face === "south" ? x : z;
  const isDoor = face === "north" && x === doorX;

  put(x, B, z, "stone_bricks");            // plinth
  if (isDoor) {
    put(x, B + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, B + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, B + 3, z, "quartz_block");
  } else {
    put(x, B + 1, z, "polished_andesite"); // base course
    put(x, B + 2, z, idx % 3 === 0 ? "quartz_block" : "glass_pane", idx % 3 === 0 ? undefined : PANE);
    put(x, B + 3, z, idx % 3 === 0 ? "quartz_block" : "glass_pane", idx % 3 === 0 ? undefined : PANE);
  }
  put(x, B + 4, z, "quartz_block");        // shopfront lintel
  put(x, B + 5, z, "smooth_stone");        // storey line belt

  put(x, B + 6, z, "quartz_block");        // upper sill/head frame
  const mullion = idx % 3 === 0;
  put(x, B + 7, z, mullion ? "quartz_block" : "glass_pane", mullion ? undefined : PANE);
  put(x, B + 8, z, mullion ? "quartz_block" : "glass_pane", mullion ? undefined : PANE);
  put(x, B + 9, z, "quartz_block");

  put(x, B + 10, z, "smooth_quartz");      // cornice
  put(x, B + 11, z, "quartz_slab", { type: "bottom", waterlogged: "false" }); // parapet coping

  // Hanging lantern over the entrance, just inside the door
  if (isDoor && has(x, z + 1)) put(x, B + 4, z + 1, "lantern", LANTERN_HANG);
}

g.save(`${DIR}/${ID}.nbt`);
