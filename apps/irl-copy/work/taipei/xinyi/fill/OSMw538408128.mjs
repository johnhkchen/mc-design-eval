import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408128";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground (y of the building's floor on that cell)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Safe setter: ignores anything outside the volume
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Edge test: any 4-neighbour missing from the footprint
function faces(x, z) {
  return {
    N: !has(x, z - 1), // north face (-z)
    S: !has(x, z + 1), // south face (+z)
    W: !has(x - 1, z), // west face (-x)
    E: !has(x + 1, z), // east face (+x)
  };
}
const isEdge = (x, z) => {
  const f = faces(x, z);
  return f.N || f.S || f.W || f.E;
};

// Plan-view centre for roof plant
let sx = 0, sz = 0;
for (const [x, z] of ground.keys().map ? [...ground.keys()].map(k => k.split(",").map(Number)) : []) {
  sx += x; sz += z;
}
const n = ground.size;
const cx = sx / n, cz = sz / n;

// Pass 1: foundation, ground floor slab, upper floor slab, roof slab
for (const [key, b] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");       // foundation
  put(x, b, z, "smooth_stone");                                    // ground floor
  put(x, b + 5, z, "smooth_stone");                                // upper floor slab
  put(x, b + 10, z, isEdge(x, z) ? "light_gray_concrete" : "smooth_stone"); // roof slab / cornice
}

// Pick the main entrance: south-facing edge cell nearest the centre line, not a corner
let door = null, best = Infinity;
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z);
  if (!f.S) continue;
  if (f.W || f.E) continue; // avoid corners
  const d = Math.abs(x - cx);
  if (d < best) { best = d; door = { x, z }; }
}

// Pass 2: facade on edge cells
for (const [key, b] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const f = faces(x, z);
  const corner = (f.N || f.S) && (f.W || f.E);
  // Bay coordinate runs along the wall the cell faces
  const along = (f.N || f.S) ? x : z;
  const pillar = corner || along % 3 === 0;
  const win = !pillar;

  // Ground storey (k = offset above floor b)
  put(x, b + 1, z, "polished_andesite");                              // base course
  if (win) {
    put(x, b + 2, z, "glass_pane");
    put(x, b + 3, z, "glass_pane");
  } else {
    put(x, b + 2, z, pillar ? "light_gray_concrete" : "white_concrete");
    put(x, b + 3, z, pillar ? "light_gray_concrete" : "white_concrete");
  }
  put(x, b + 4, z, "light_gray_concrete");                            // lintel / storey line

  // Upper storey
  if (win) {
    put(x, b + 6, z, "glass_pane");
    put(x, b + 7, z, "glass_pane");
    put(x, b + 8, z, "glass_pane");
  } else {
    put(x, b + 6, z, pillar ? "light_gray_concrete" : "white_concrete");
    put(x, b + 7, z, pillar ? "light_gray_concrete" : "white_concrete");
    put(x, b + 8, z, pillar ? "light_gray_concrete" : "white_concrete");
  }
  put(x, b + 9, z, "light_gray_concrete");                            // storey line

  // Parapet
  put(x, b + 11, z, "white_concrete");
}

// Pass 3: entrance (glass-and-timber door with a lantern over it)
if (door) {
  const { x, z } = door;
  const b = gAt(x, z);
  put(x, b + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, b + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, b + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 4: warm light behind some windows (glowstone in the interior air cell)
for (const [key, b] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const f = faces(x, z);
  const corner = (f.N || f.S) && (f.W || f.E);
  const along = (f.N || f.S) ? x : z;
  if (corner || along % 3 === 0) continue; // not a window bay

  // Inward offset from the missing face (use the first missing face)
  let ix = x, iz = z;
  if (f.N) iz = z + 1;
  else if (f.S) iz = z - 1;
  else if (f.W) ix = x + 1;
  else if (f.E) ix = x - 1;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;

  if (along % 6 === 1) put(ix, b + 7, iz, "glowstone");   // upper storey
  if (along % 6 === 4) put(ix, b + 2, iz, "glowstone");   // shopfront level
}

// Pass 5: roof plant on the interior roof near the centre
for (const [key, b] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (Math.abs(x - cx) <= 1.5 && Math.abs(z - cz) <= 1.5) {
    put(x, b + 11, z, "stone_bricks");
  }
}
for (const [key, b] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (Math.abs(x - cx) <= 0.5 && Math.abs(z - cz) <= 0.5) {
    put(x, b + 12, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
