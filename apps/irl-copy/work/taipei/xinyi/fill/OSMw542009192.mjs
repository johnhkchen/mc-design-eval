import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542009192";
const W = 14, H = 23, D = 19;

// Footprint and per-cell ground. Lowest ground is y 0; roof surface lands at y 11.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(2, Math.round(gy))));
}
const inFp = (x, z) => ground.has(`${x},${z}`);

// Entrance: the front (min z) perimeter cell nearest the footprint's centre x.
let minZ = Infinity;
for (const k of ground.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
const frontXs = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z === minZ) frontXs.push(x);
}
const meanX = frontXs.reduce((a, b) => a + b, 0) / frontXs.length;
const doorX = frontXs.reduce((best, x) => (Math.abs(x - meanX) < Math.abs(best - meanX) ? x : best), frontXs[0]);
const isEntrance = (x, z) => z === minZ && x === doorX;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS = "light_blue_stained_glass_pane";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const PIER_GROUND = "gray_concrete";

for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const eN = !inFp(x, z - 1), eS = !inFp(x, z + 1);
  const eW = !inFp(x - 1, z), eE = !inFp(x + 1, z);
  const perim = eN || eS || eW || eE;

  if (!perim) {
    // Interior: floor slabs, roof deck, air gaps behind the glass.
    put(x, gy, z, "smooth_stone");
    put(x, 5, z, BAND);
    put(x, 10, z, BAND);
    // Warm light behind the upper glazing, scattered through the interior.
    if ((x * 2 + z) % 5 === 0) put(x, 7, z, "glowstone");
    continue;
  }

  // Perimeter: choose the facade this cell reads on and its bay index.
  const nsFace = eN || eS;
  const along = nsFace ? x : z;
  const isPier = along % 3 === 0;
  const pane = nsFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const entrance = eN && isEntrance(x, z);

  // Base course.
  put(x, gy, z, "polished_granite");

  // Ground storey: shopfront glazing, framed piers, door at the entrance.
  for (let y = gy + 1; y <= 3; y++) {
    if (entrance && y <= gy + 2) continue; // door handled below
    if (isPier) put(x, y, z, PIER_GROUND);
    else put(x, y, z, GLASS, pane);
  }
  if (entrance) {
    put(x, gy + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  // Lintel band over the ground storey.
  if (gy < 4) put(x, 4, z, BAND);

  // Second storey spandrel, windows, and sill band.
  put(x, 5, z, BAND);
  for (let y = 6; y <= 8; y++) {
    if (isPier) put(x, y, z, WALL);
    else put(x, y, z, GLASS, pane);
  }
  put(x, 9, z, BAND);

  // Parapet and cornice.
  put(x, 10, z, "smooth_stone");
}

// Roof plant: two AC blocks and a stair housing, all on footprint cells.
const roofUnits = [[3, 4], [4, 4], [3, 5], [4, 5], [10, 12], [11, 12], [10, 13], [11, 13]];
for (const [x, z] of roofUnits) {
  if (!inFp(x, z)) continue;
  put(x, 11, z, "iron_block");
}
const housing = [[9, 9], [10, 9], [9, 10], [10, 10]];
for (const [x, z] of housing) {
  if (!inFp(x, z)) continue;
  put(x, 11, z, "stone_bricks");
  put(x, 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
