import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1071343816";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Two-storey low-rise commercial block, white concrete with stone base and cornice,
// ground-floor shopfront, pane-and-pier upper windows, a door and lanterns, flat roof
// with a small plant box.
const W = 15, H = 23, D = 32;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const isPerim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const PANE = "light_blue_stained_glass_pane";
const PIER = "light_gray_concrete";
const WALL = "white_concrete";

for (const [x, z, gr] of cells) {
  const ex = !has(x - 1, z) || !has(x + 1, z); // exposed to east/west faces
  const ez = !has(x, z - 1) || !has(x, z + 1); // exposed to north/south faces
  const perim = ex || ez;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const top = gr + 11;

  if (!perim) {
    // Interior: floor slabs per storey and roof slab, air between
    put(x, gr, z, "light_gray_concrete");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, top, z, "light_gray_concrete");
    // Roof plant box in the middle of the roof
    if (x >= 6 && x <= 8 && z >= 14 && z <= 17) {
      put(x, top + 1, z, "iron_block");
    }
    continue;
  }

  // Perimeter cell
  const t = ex ? z : x; // position along the exposed face
  const pier = t % 3 === 0;
  const paneProps = ex
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  const isDoor =
    ((!has(x, z - 1) || !has(x, z + 1)) && x === Math.floor(W / 2)) ||
    ((!has(x - 1, z) || !has(x + 1, z)) && z === Math.floor(D / 2));

  // Base course
  put(x, gr, z, "polished_andesite");

  // Storey 1: shopfront
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isDoor) continue; // door handled below
    if (pier) put(x, y, z, PIER);
    else put(x, y, z, PANE, paneProps);
  }
  put(x, gr + 4, z, "stone_bricks");   // lintel / transom band
  put(x, gr + 5, z, "smooth_stone");   // storey line

  // Storey 2: sill, windows, cornice
  put(x, gr + 6, z, WALL);
  for (let y = gr + 7; y <= gr + 9; y++) {
    if (pier) put(x, y, z, PIER);
    else put(x, y, z, PANE, paneProps);
  }
  put(x, gr + 10, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  put(x, gr + 11, z, "smooth_stone");  // parapet

  // Entrance
  if (isDoor) {
    let facing = "east";
    if (!has(x, z - 1)) facing = "north";
    else if (!has(x, z + 1)) facing = "south";
    else if (!has(x - 1, z)) facing = "west";
    put(x, gr + 1, z, "dark_oak_door", {
      facing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 2, z, "dark_oak_door", {
      facing, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Warm light behind some upper-storey windows (glowstone in the interior air cell)
  if (!isDoor && !pier && t % 6 === 1) {
    let dx = 0, dz = 0;
    if (ex) dx = !has(x - 1, z) ? 1 : -1;
    else dz = !has(x, z - 1) ? 1 : -1;
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isPerim(nx, nz)) {
      const ng = ground.get(`${nx},${nz}`);
      put(nx, ng + 8, nz, "glowstone");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
