import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280232";
const W = 20, H = 33, D_ = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D_]);

// footprint lookup: key "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D_) continue;
  ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);

// Common floor datum: highest footprint ground, so every storey is level.
// Top of parapet is datum + 21; keep inside the 33-block grid.
let datum = 0;
for (const v of ground.values()) datum = Math.max(datum, v);
datum = Math.min(datum, 11);

// Cell bounds
let minX = W, maxX = -1, minZ = D_, maxZ = -1;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

// Outward missing neighbours for a cell
function outward(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push([0, -1]); // north
  if (!has(x, z + 1)) out.push([0, 1]);  // south
  if (!has(x - 1, z)) out.push([-1, 0]); // west
  if (!has(x + 1, z)) out.push([1, 0]);  // east
  return out;
}
const isPerimeter = (x, z) => outward(x, z).length > 0;

// Entrance: south-face perimeter cell nearest the centre x
let doorX = null;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (has(x, z) && !has(x, z + 1)) {
    if (doorX === null || Math.abs(x - cx) < Math.abs(doorX - cx)) doorX = x;
  }
}
const doorZ = maxZ;

// 1. Foundation and floor slabs
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < datum; y++) {
    const id = y < gr ? "stone_bricks" : "light_gray_concrete";
    g.set(x, y, z, id);
  }
  for (let s = 0; s <= 4; s++) {
    g.set(x, datum + 5 * s, z, "white_concrete");
  }
  // Roof surface on interior cells
  g.set(x, datum + 20, z, "light_gray_concrete");
}

// 2. Perimeter walls, windows, shopfront, cornice, parapet
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerimeter(x, z)) continue;
  const out = outward(x, z);
  const zFace = out.some(([dx, dz]) => dz !== 0);
  const isDoorCell = x === doorX && z === doorZ;

  // Cornice and parapet
  g.set(x, datum + 20, z, "smooth_stone");
  g.set(x, datum + 21, z, "white_concrete");

  for (let y = datum + 1; y <= datum + 19; y++) {
    if ((y - datum) % 5 === 0) continue; // floor slab already placed
    const s = Math.floor((y - datum - 1) / 5);
    const l = (y - datum - 1) % 5; // 0..3
    const along = zFace ? x : z;
    const isMullion = along % 3 === 0;

    if (s === 0) {
      // Ground storey: plinth, shopfront glass, sign band
      if (l === 0) { g.set(x, y, z, "stone_bricks"); continue; }
      if (l === 3) { g.set(x, y, z, "polished_andesite"); continue; }
      if (isDoorCell) {
        g.set(x, y, z, "dark_oak_door", {
          facing: zFace ? "south" : "east",
          half: l === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (isMullion) { g.set(x, y, z, "white_concrete"); continue; }
      g.set(x, y, z, "light_blue_stained_glass_pane", zFace
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      continue;
    }

    // Upper storeys: spandrel, two-row windows, lintel
    if (l === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (l === 3) { g.set(x, y, z, "white_concrete"); continue; }
    if (isMullion) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, "light_blue_stained_glass_pane", zFace
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
}

// 3. Warm lights standing on the floor slab behind some windows
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerimeter(x, z)) continue;
  const out = outward(x, z);
  if (out.length === 0) continue;
  const [dx, dz] = out[0];
  const ix = x - dx, iz = z - dz; // inward cell
  if (!has(ix, iz) || isPerimeter(ix, iz)) continue;
  const zFace = dz !== 0;
  const along = zFace ? x : z;
  if (along % 6 !== 1) continue;
  for (let s = 0; s <= 3; s++) {
    const floorY = datum + 5 * s;
    if (s === 0 && x === doorX && z === doorZ) continue;
    g.set(ix, floorY + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 4. Roof plant room, set back from the parapet
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (isPerimeter(x, z)) continue;
  if (x < minX + 5 || x > maxX - 5 || z < minZ + 4 || z > maxZ - 4) continue;
  g.set(x, datum + 21, z, "light_gray_concrete");
  if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
    g.set(x, datum + 22, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
