import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540296200";
const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));

// Footprint 17 x 23; roof about 11 blocks above the lowest ground.
// Read as a late-1980s/1990s low-rise commercial block: two storeys over a
// shopfront ground floor, cream tiled facade with stone-brick plinth, a
// red-tiled entrance canopy, a parapet, and a rooftop of plant boxes.
const W = 17, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));

const has = (x, z) => ground.has(`${x},${z}`);
const inner = (x, z) => has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Street (front) facade is the north edge (minimum z).
let minZ = Infinity;
for (const k of ground.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
const frontXs = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([, z]) => z === minZ)
  .map(([x]) => x);
const doorX = frontXs.length
  ? Math.round(frontXs.reduce((a, b) => a + b, 0) / frontXs.length)
  : 0;

const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (inner(x, z)) {
    // Interior: air gap with a floor slab per storey and a roof deck.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");

    // Rooftop plant boxes on the deck, in 2x2 units.
    if ((x % 6 === 3 || x % 6 === 4) && (z % 7 === 3 || z % 7 === 4)) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }

    // Warm lanterns standing on the upper floor, seen through the windows.
    if ((x * 3 + z * 5) % 13 === 0) {
      put(x, gr + 6, z, "lantern");
    }
    continue;
  }

  // Perimeter (facade) cells.
  const isFront = z === minZ;
  const isDoor = isFront && x === doorX;

  // Plinth course.
  put(x, gr, z, "stone_bricks");

  // Ground floor shopfront: glass with quartz piers, entrance at the front.
  const shopPier = (x + z) % 4 === 0;
  for (let dy = 1; dy <= 3; dy++) {
    if (isDoor && dy <= 2) {
      put(x, gr + dy, z, "dark_oak_door", { ...DOOR, half: dy === 1 ? "lower" : "upper" });
    } else if (shopPier) {
      put(x, gr + dy, z, "smooth_quartz");
    } else {
      put(x, gr + dy, z, "glass_pane");
    }
  }

  // Transom band; red tiled canopy over the entrance.
  const canopy = isFront && Math.abs(x - doorX) <= 1;
  put(x, gr + 4, z, canopy ? "red_terracotta" : "smooth_quartz");

  // Storey line at the second floor.
  put(x, gr + 5, z, "polished_andesite");

  // Upper storey: window grid with quartz piers and a lintel course.
  const upperPier = (x + z) % 3 === 0;
  for (let dy = 6; dy <= 8; dy++) {
    put(x, gr + dy, z, upperPier ? "smooth_quartz" : "glass_pane");
  }
  put(x, gr + 9, z, "smooth_quartz");

  // Cornice and parapet.
  put(x, gr + 10, z, "polished_andesite");
  put(x, gr + 11, z, "smooth_quartz");
}

g.save(`${SRC}.nbt`);
