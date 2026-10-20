import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265925";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 41, D = 15;
const ROOF = 29;      // roof slab level, about 29 blocks above the lowest ground
const PARAPET = 30;   // parapet course on the perimeter
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));
const inF = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));
const missX = (x, z) => !inF(x - 1, z) || !inF(x + 1, z);
const missZ = (x, z) => !inF(x, z - 1) || !inF(x, z + 1);
const isPerim = (x, z) => missX(x, z) || missZ(x, z);
const isCorner = (x, z) => missX(x, z) && missZ(x, z);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Facade block for a perimeter (non-corner) cell at height y.
// Storeys are 5 blocks: y%5==0 ledge, 1..3 window band, 4 spandrel/lintel.
// Ground storey (0..4) is a shopfront with glass, plinth and lintel.
function facade(x, z, y) {
  const s = Math.floor(y / 5), r = y % 5;
  const faceZ = missZ(x, z); // cell sits on a front/back wall, panes run east-west
  const paneProps = faceZ
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const mull = (x + z) % 3 === 0;

  if (s === 0) {
    if (r === 0) return ["stone_bricks"];
    if (r === 4) return ["white_concrete"];
    if (mull) return ["dark_oak_planks"];
    return ["light_blue_stained_glass_pane", paneProps];
  }
  if (r === 0) return ["smooth_stone"];
  if (r === 4) return ["light_gray_concrete"];
  if (mull) return ["white_concrete"];
  return ["light_blue_stained_glass_pane", paneProps];
}

// ---- Main volume ----
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const G = gnd(x, z);
  const perim = isPerim(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  if (perim) {
    for (let y = G; y <= ROOF - 1; y++) {
      if (isCorner(x, z)) put(x, y, z, "white_concrete");
      else {
        const [id, p] = facade(x, z, y);
        put(x, y, z, id, p);
      }
    }
    put(x, ROOF, z, "smooth_stone");          // cornice
    put(x, PARAPET, z, "white_concrete");     // parapet
  } else {
    // Interior: air gap with a floor slab per storey, no interior fit-out
    for (const k of [0, 5, 10, 15, 20, 25]) {
      if (k >= G) put(x, k, z, "smooth_stone");
    }
  }

  // Roof membrane over every footprint cell
  if (!perim) put(x, ROOF, z, "light_gray_concrete");
}

// ---- Warm lights behind glass (interior, near the perimeter, on a floor slab) ----
const nearPerim = (x, z) => {
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      if (inF(x + dx, z + dz) && isPerim(x + dx, z + dz)) return true;
  return false;
};
for (const k of [0, 5, 10, 15, 20]) {
  const y = k + 1;
  for (const kk of ground.keys()) {
    const [x, z] = kk.split(",").map(Number);
    const G = gnd(x, z);
    if (isPerim(x, z) || y < G) continue;
    if (!nearPerim(x, z)) continue;
    if ((x * 7 + z * 5 + k) % 11 === 0) put(x, y, z, "glowstone");
  }
}

// ---- Roof plant: central penthouse box with mast ----
for (const kk of ground.keys()) {
  const [x, z] = kk.split(",").map(Number);
  if (x < 5 || x > 10 || z < 4 || z > 9) continue;
  const ring = x === 5 || x === 10 || z === 4 || z === 9;
  for (let y = PARAPET; y <= 32; y++) {
    if (ring) {
      if (y === 31 && (x + z) % 2 === 0)
        put(x, y, z, "light_blue_stained_glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      else put(x, y, z, "white_concrete");
    }
  }
  put(x, 33, z, "smooth_stone");
}
if (inF(7, 7) && inF(7, 6)) {
  for (let y = 34; y <= 38; y++)
    put(7, y, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// ---- Entrance on the south (high-z) front, centred on the footprint ----
const front = [];
for (const kk of ground.keys()) {
  const [x, z] = kk.split(",").map(Number);
  if (isPerim(x, z) && !inF(x, z + 1)) front.push([x, z]);
}
if (front.length) {
  const meanX = front.reduce((s, [x]) => s + x, 0) / front.length;
  front.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX) || a[0] - b[0]);
  const [dx, dz] = front[0];
  const gd = gnd(dx, dz);

  // Door (two-block), facing the street
  put(dx, gd, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, gd + 1, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

  // Canopy over the entrance bay (top half-slab band at lintel level)
  for (const [x, z] of front) {
    if (Math.abs(x - dx) <= 1) put(x, 4, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
  // Hanging lantern under the canopy when there is headroom above the door
  if (gd + 1 < 3) put(dx, 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
