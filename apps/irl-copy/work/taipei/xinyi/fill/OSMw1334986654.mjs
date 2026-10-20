import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334986654";
const W = 5, H = 19, D = 6;

// [x, z, ground] per footprint cell
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const stairsLess = { waterlogged: "false" };
const glassProps = undefined;

// Two-storey shophouse-style block: stone base, white tiled walls,
// light-grey storey bands, glazed bays, flat roof with parapet.
for (const [x, z, b] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const left = !has(x - 1, z);
  const right = !has(x + 1, z);
  const perim = front || back || left || right;
  const mid = Math.floor(W / 2);

  if (!perim) {
    // Interior: floor slabs per storey, air between, roof slab on top
    put(x, b, z, "smooth_stone");
    put(x, b + 3, z, "smooth_stone");
    put(x, b + 6, z, "light_gray_concrete");
    continue;
  }

  // Base course at ground level
  put(x, b, z, "stone_bricks");

  // Ground floor (commercial): shopfront, entrance, fascia
  if (front) {
    if (x === mid) {
      put(x, b + 1, z, "oak_door", {
        facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      put(x, b + 2, z, "oak_door", {
        facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
      });
    } else if (x === 0 || x === W - 1) {
      put(x, b + 1, z, "stone_bricks");
      put(x, b + 2, z, "stone_bricks");
    } else {
      put(x, b + 1, z, "glass");
      put(x, b + 2, z, "dark_oak_planks");
    }
  } else {
    put(x, b + 1, z, "white_concrete");
    put(x, b + 2, z, "white_concrete");
    if ((left || right) && (z === 2 || z === 4)) {
      put(x, b + 1, z, "glass");
    }
  }

  // Storey line between floors
  put(x, b + 3, z, "light_gray_concrete");

  // Upper floor: window grid with white frames
  for (const y of [b + 4, b + 5]) {
    if (front) {
      if (x === 0 || x === W - 1 || x === mid) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass");
    } else if (back) {
      if (x === 1 || x === W - 2) put(x, y, z, "glass");
      else put(x, y, z, "white_concrete");
    } else {
      // side walls
      if (z === 2 || z === 4) put(x, y, z, "glass");
      else put(x, y, z, "white_concrete");
    }
  }

  // Parapet with cornice cap
  put(x, b + 6, z, "smooth_stone");
}

// Warm interior lights behind the front glazing
if (has(1, 1)) put(1, cellsGround(1, 1) + 4, 1, "glowstone");
if (has(3, 1)) put(3, cellsGround(3, 1) + 5, 1, "glowstone");
if (has(3, 1)) put(3, cellsGround(3, 1) + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

// Roof plant: one rooftop unit on an interior roof cell
if (has(2, 3)) put(2, cellsGround(2, 3) + 6, 3, "iron_block");

function cellsGround(x, z) {
  return ground.get(`${x},${z}`);
}

g.save(`${DIR}/${ID}.nbt`);
