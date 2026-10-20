import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001626";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, D = 6, H = 25;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> { ground, roof }
const map = new Map();
const roofs = [];
for (const [x, z, ground, roof] of cells) {
  map.set(`${x},${z}`, { ground: Math.max(0, Math.round(ground)), roof });
  roofs.push(roof);
}
const has = (x, z) => map.has(`${x},${z}`);

// One flat parapet height from the lidar median, clamped to the voxel box.
roofs.sort((a, b) => a - b);
const R = Math.min(H - 3, Math.max(8, Math.round(roofs[Math.floor(roofs.length / 2)])));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const doorXs = [9, 18];         // entrances on the front, on pier columns
const isBay = (x) => x >= 1 && x <= 19 && (x % 3 === 1 || x % 3 === 2);

for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const gr = Math.min(c.ground, R - 4);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  const front = perim && z === 0;
  const back = perim && z === D - 1;

  // Interior: floor slabs at each storey line and a top slab under the roof, so nothing hangs.
  if (!perim) {
    put(x, gr, z, "smooth_stone");
    for (let y = gr + 3; y < R - 2; y += 3) put(x, y, z, "smooth_stone");
    put(x, R - 2, z, "smooth_stone");
    put(x, R - 1, z, "black_concrete");
    continue;
  }

  // Perimeter wall, ground to top.
  for (let y = gr; y <= R - 3; y++) {
    const k = y - gr;
    if (k === 0) { put(x, y, z, "brown_terracotta"); continue; }      // brownstone base / stoop line
    if (k % 3 === 0) { put(x, y, z, "smooth_stone"); continue; }     // storey belt course
    if ((front || back) && isBay(x)) {
      put(x, y, z, "glass_pane", glassEW);                           // window
      if ((x + y) % 5 === 0 && has(x, front ? 1 : D - 2)) {
        put(x, y, front ? 1 : D - 2, "glowstone");                   // warm light behind glass
      }
    } else {
      put(x, y, z, "bricks");
    }
  }

  // Entrances: stone surround on the pier columns, dark-oak door, and a lintel.
  if (front && doorXs.includes(x)) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Flanking stone jambs on the window columns beside the door.
    put(x - 1, gr + 1, z, "stone_bricks");
    put(x - 1, gr + 2, z, "stone_bricks");
    put(x + 1, gr + 1, z, "stone_bricks");
    put(x + 1, gr + 2, z, "stone_bricks");
    // Lantern hung over the door from the belt line.
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Cornice: a stone frieze band, then a brownstone cap course.
  put(x, R - 2, z, "smooth_stone");
  put(x, R - 1, z, "brown_terracotta");
}

// Lanterns on the roof cap of the front, lit at dusk.
for (const x of [0, 6, 9, 12, 18, 20]) {
  if (has(x, 0)) put(x, R, 0, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
