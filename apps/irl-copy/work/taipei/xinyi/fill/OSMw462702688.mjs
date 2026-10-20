import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 吉福華廈: a 1970s-80s Taipei mixed-use block. Two storeys of cream tile over a
// granite plinth, a shopfront ground floor, tinted-glass windows with iron balcony
// rails, a cornice band, a parapet and a flat roof with rooftop AC units.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw462702688";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 56, H = 23, D = 54;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// Footprint centroid
let sx = 0, sz = 0;
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = sx / cells.length, cz = sz / cells.length;

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward facing directions for each perimeter cell (cells with a missing 4-neighbour)
const outward = (x, z) => {
  const dirs = [];
  if (!has(x, z - 1)) dirs.push("north");
  if (!has(x, z + 1)) dirs.push("south");
  if (!has(x - 1, z)) dirs.push("west");
  if (!has(x + 1, z)) dirs.push("east");
  return dirs;
};

// Pick the entrance: perimeter cell nearest the middle of the north (smaller z) face
let door = null, bestD = Infinity;
for (const [x, z] of cells) {
  const dirs = outward(x, z);
  if (!dirs.length || !dirs.includes("north")) continue;
  const d = (x - cx) ** 2 + (z - (cz - 27)) ** 2;
  if (d < bestD) { bestD = d; door = { x, z }; }
}
if (!door) {
  // fallback: any perimeter cell
  for (const [x, z] of cells) { if (outward(x, z).length) { door = { x, z }; break; } }
}

const hash = (x, z) => ((x * 73856093) ^ (z * 19349663)) >>> 0;

for (const [x, z, gr] of cells) {
  const b = gr;               // ground under this cell
  const roof = b + 10;        // roof deck row
  const parapet = b + 11;     // parapet row (top of building is about 11 above lowest ground)
  const dirs = outward(x, z);
  const edge = dirs.length > 0;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone");

  // Floor slabs and roof deck (every cell, interior air otherwise)
  put(x, b, z, edge ? "polished_granite" : "smooth_stone");
  put(x, b + 5, z, "light_gray_concrete");
  put(x, roof, z, "light_gray_concrete");

  if (!edge) continue;

  const outDir = dirs[0];
  const idx = (outDir === "north" || outDir === "south") ? x : z;
  const isWindow = idx % 4 !== 0;      // every 4th column is a pier
  const lit = hash(x, z) % 7 === 0;    // some windows glow warm

  // Shopfront storey (b+1 .. b+3)
  for (let dy = 1; dy <= 3; dy++) {
    if (!isWindow) put(x, b + dy, z, "white_concrete");
    else if (dy === 2 && lit) put(x, b + dy, z, "glowstone");
    else put(x, b + dy, z, "cyan_stained_glass");
  }
  // Canopy / storey band above shopfront
  put(x, b + 4, z, "light_gray_concrete");

  // Upper storey (b+6 .. b+9)
  put(x, b + 6, z, isWindow ? "iron_bars" : "white_concrete");   // balcony rail
  for (let dy = 7; dy <= 8; dy++) {
    if (!isWindow) put(x, b + dy, z, "white_concrete");
    else if (dy === 7 && lit) put(x, b + dy, z, "glowstone");
    else put(x, b + dy, z, "gray_stained_glass");
  }
  put(x, b + 9, z, "white_concrete");

  // Cornice and parapet
  put(x, roof, z, "light_gray_concrete");
  put(x, parapet, z, "white_concrete");

  // Entrance
  if (door && x === door.x && z === door.z) {
    put(x, b + 1, z, "oak_door", { facing: outDir, half: "lower", hinge: "left", open: "false" });
    put(x, b + 2, z, "oak_door", { facing: outDir, half: "upper", hinge: "left", open: "false" });
    put(x, b + 3, z, "gray_stained_glass");
  }
}

// Rooftop AC units and a small service block on the flat roof (interior cells only)
for (const [x, z, gr] of cells) {
  if (outward(x, z).length) continue;
  if (x % 9 !== 4 || z % 9 !== 4) continue;
  const roof = gr + 10;
  put(x, roof + 1, z, "light_gray_concrete");
  put(x, roof + 2, z, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
