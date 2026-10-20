import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3335874.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3335874.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 11, H = 40, D = 21;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const info = new Map();           // "x,z" -> { g0, T }
const has = (x, z) => info.has(x + "," + z);

let maxRoof = 0;
for (const [, , , r] of cells) maxRoof = Math.max(maxRoof, r);
// one flat roof tier for the main mass, rounded to an even course
const Tmax = Math.min(H - 6, Math.round(maxRoof / 2) * 2);

for (const [x, z, gr, roof] of cells) {
  const g0 = Math.max(0, Math.round(gr));
  // smooth lidar noise into tiers; low wings keep their own lower roof
  let T = Math.round(roof / 2) * 2;
  T = Math.min(Tmax, Math.max(g0 + 8, T));
  info.set(x + "," + z, { g0, T });
}

function set(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Entrance: exterior cell on the lowest-z (street) face, nearest the middle of the front
let doorKey = null;
{
  let minZ = Infinity;
  for (const [, z] of cells) minZ = Math.min(minZ, z);
  const mid = (W - 1) / 2;
  let best = Infinity;
  for (const [x, z] of cells) {
    if (z !== minZ) continue;
    if (has(x - 1, z) && has(x + 1, z)) continue; // must sit on the front face
    const d = Math.abs(x - mid);
    if (d < best) { best = d; doorKey = x + "," + z; }
  }
}

// ---- build each footprint column --------------------------------------------
for (const [x, z] of cells) {
  const { g0, T } = info.get(x + "," + z);

  const xFace = !has(x - 1, z) || !has(x + 1, z);   // walls facing east/west
  const zFace = !has(x, z - 1) || !has(x, z + 1);   // walls facing north/south
  const ext = xFace || zFace;
  const corner = xFace && zFace;
  const along = xFace && !zFace ? z : x;            // position along the wall
  const isDoor = doorKey === x + "," + z;
  // piers every third column; glass in the two columns between
  const pier = along % 3 === 0;

  // foundation / plinth below ground
  for (let y = 0; y < g0; y++) set(x, y, z, "stone_bricks");

  // ground floor: base course, shopfront, lintel (g0 .. g0+3)
  if (ext) {
    set(x, g0, z, "stone_bricks");                 // base course
    set(x, g0 + 3, z, "polished_andesite");        // storefront lintel / ground ceiling
    for (const rel of [1, 2]) {
      const y = g0 + rel;
      if (corner || pier) set(x, y, z, "stone_bricks");
      else if (isDoor) {
        // door handled after the loop
      } else set(x, y, z, "glass");              // shopfront glass
    }
  } else {
    set(x, g0, z, "smooth_stone");                 // interior floor
    set(x, g0 + 3, z, "smooth_stone");             // ground-floor ceiling slab
  }

  // upper storeys: 2-block storeys (window row on even rel, spandrel/slab on odd rel)
  for (let y = g0 + 4; y <= T - 3; y++) {
    const rel = y - g0;
    if (ext) {
      if (rel % 2 === 0) {
        if (corner || pier) set(x, y, z, "stone_bricks");   // pier columns
        else set(x, y, z, "glass");                          // window
      } else {
        set(x, y, z, "white_concrete");                      // spandrel band
      }
    } else {
      if (rel % 2 === 1) set(x, y, z, "smooth_stone");       // floor slab
      else if (((x * 7 + z * 3 + y) % 5) === 0) set(x, y, z, "glowstone"); // warm light behind glass
    }
  }

  // top: cornice (T-2), parapet (T-1), roof deck inside
  if (ext) {
    set(x, T - 2, z, "smooth_stone");              // cornice
    set(x, T - 1, z, "stone_brick_wall");          // parapet
  } else {
    set(x, T - 2, z, "smooth_stone");              // top floor ceiling
    set(x, T - 1, z, "gray_concrete");             // roof deck
  }

  // rooftop plant boxes on the interior roof
  if (!ext && x % 4 === 1 && z % 6 === 3) {
    set(x, T, z, "light_gray_concrete");
    set(x, T + 1, z, "light_gray_concrete");
  }
}

// ---- entrance -----------------------------------------------------------------
if (doorKey) {
  const [dx, dz] = doorKey.split(",").map(Number);
  const { g0 } = info.get(doorKey);
  // stone surround so the door reads from the street
  for (const ox of [-1, 1]) {
    if (has(dx + ox, dz)) {
      set(dx + ox, g0 + 1, dz, "stone_bricks");
      set(dx + ox, g0 + 2, dz, "stone_bricks");
    }
  }
  set(dx, g0 + 1, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(dx, g0 + 2, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // dark canopy band over the entrance at the lintel line
  for (const ox of [-1, 0, 1]) {
    if (has(dx + ox, dz)) set(dx + ox, g0 + 3, dz, "black_concrete");
  }
  // warm lanterns flanking the door, on the wall face
  for (const ox of [-1, 1]) {
    if (has(dx + ox, dz)) set(dx + ox, g0 + 1, dz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(OUT);
