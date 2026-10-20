import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1156915707";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 15 x 17. Low-rise two-storey commercial block, white-tiled
// facade with grey glazing, stone base, cornice and parapet. Roof stands
// 11 blocks above the lowest ground (rel 0..10).
const W = 15, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);
const base = Math.min(...cells.map((c) => c[2]));
const TOP = base + 10; // top block index of the parapet (11 blocks high)

const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: a south-facing edge cell whose ground lets a 2-high door sit at base+1.
const southCells = cells
  .filter(([x, z, gr]) => !has(x, z + 1) && gr <= base + 1)
  .sort((a, b) => a[0] - b[0]);
let doorCell = null;
if (southCells.length) doorCell = southCells[Math.floor(southCells.length / 2)];
const isDoor = (x, z) => doorCell && doorCell[0] === x && doorCell[1] === z;

const doorBase = { facing: "south", hinge: "left", open: "false", powered: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = edge(x, z);
  const pier = perim && ((x + z) % 3 === 0);
  const door = isDoor(x, z);

  for (let y = gr; y <= TOP; y++) {
    const rel = y - base;

    // Floor slabs and roof deck run across every cell.
    if (rel === 0) {
      put(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (rel === 5) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (rel === 9) {
      if (perim) put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (rel === 10) {
      if (perim) {
        put(x, y, z, "white_concrete");
      } else if (x % 5 === 2 && z % 5 === 2) {
        // Roof plant units on the deck.
        put(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    // Interior air gap behind the glass.
    if (!perim) continue;

    // Ground floor: shopfront glazing with piers, door, lintel band.
    if (rel >= 1 && rel <= 4) {
      if (rel === 4) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }
      if (door && rel === 1) {
        put(x, y, z, "dark_oak_door", { ...doorBase, half: "lower" });
        continue;
      }
      if (door && rel === 2) {
        put(x, y, z, "dark_oak_door", { ...doorBase, half: "upper" });
        continue;
      }
      if (door && rel === 3) {
        put(x, y, z, "light_blue_stained_glass");
        continue;
      }
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    // Upper floor: glazed bays with piers; a few warm lit bays.
    if (rel >= 6 && rel <= 8) {
      if (pier) {
        put(x, y, z, "white_concrete");
      } else if (rel === 7 && (x * 2 + z) % 7 === 0) {
        put(x, y, z, "glowstone");
      } else {
        put(x, y, z, "gray_stained_glass");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
