import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280196";
const W = 28, H = 33, D = 21;
const TOP = 20;   // roof slab level; parapet sits at TOP+1

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => c[2]));
const G = new Map();
for (const [x, z, gr] of raw) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(`${x},${z}`, gr - minG);
}
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const nearEdge = (x, z) => isEdge(x - 1, z) || isEdge(x + 1, z) || isEdge(x, z - 1) || isEdge(x, z + 1);

const g = new Voxels([W, H, D]);

// place only on footprint cells, and never below that cell's ground
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (y < gnd(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// 1. foundation: solid from y 0 up to each cell's ground
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. facade logic for exterior cells (glass curtain wall on white concrete piers)
function facade(x, y, z, gr) {
  const s = Math.floor(y / 5), r = y % 5;
  if (y === gr) return "polished_granite";          // base course
  if (y === TOP) return "white_concrete";           // cornice
  if (s === 0 && r === 4) return "polished_granite"; // shopfront fascia
  if (r === 0) return "white_concrete";             // storey line
  if (r === 4) return "white_concrete";             // spandrel
  const pier = (x % 3 === 0) || (z % 3 === 0);
  if (pier) return s === 0 ? "polished_granite" : "white_concrete";
  return "light_blue_stained_glass";
}

// 3. body: walls on the perimeter, floor slabs and roof slab across the plate
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);
  for (let y = gr; y <= TOP; y++) {
    if (edge) {
      put(x, y, z, facade(x, y, z, gr));
    } else if (y === gr || y % 5 === 0) {
      put(x, y, z, "smooth_stone");                 // floor slabs and roof deck
    }
    // interior air otherwise (no interiors)
  }
  // parapet cap on exterior cells
  if (edge) put(x, TOP + 1, z, "quartz_slab", { type: "bottom", waterlogged: "false" });

  // warm lights behind glass in some windows (interior cells beside the facade)
  if (!edge && nearEdge(x, z)) {
    for (let s = 0; s < 4; s++) {
      const y = s * 5 + 2;
      if (y > gr && y < TOP && (x * 7 + z * 3 + s) % 13 === 0) {
        put(x, y, z, "glowstone");
      }
    }
  }
}

// 4. main entrance on the north (minimum z) face, centred on that run
{
  let zmin = Infinity;
  for (const key of G.keys()) zmin = Math.min(zmin, Number(key.split(",")[1]));
  const xs = [];
  for (const key of G.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (z === zmin) xs.push(x);
  }
  xs.sort((a, b) => a - b);
  const xm = xs[Math.floor(xs.length / 2)];
  const gr = gnd(xm, zmin);
  const ey = gr + 1;
  g.set(xm, gr, zmin, "smooth_stone");
  g.set(xm, ey, zmin, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(xm, ey + 1, zmin, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // recessed entrance: glass returns beside the door
  if (has(xm + 1, zmin)) g.set(xm + 1, ey, zmin, "light_blue_stained_glass");
  if (has(xm - 1, zmin)) g.set(xm - 1, ey, zmin, "light_blue_stained_glass");
}

// 5. roof plant: a light grey mechanical box with a glazed band, and a mast
for (let x = 8; x <= 19; x++) {
  for (let z = 7; z <= 13; z++) {
    if (!has(x, z)) continue;
    const rim = x === 8 || x === 19 || z === 7 || z === 13;
    put(x, TOP + 1, z, "light_gray_concrete");
    put(x, TOP + 2, z, rim ? "light_blue_stained_glass" : "light_gray_concrete");
    put(x, TOP + 3, z, "smooth_stone");
  }
}
if (has(14, 10) && has(14, 7) !== undefined) {
  for (let y = TOP + 4; y <= TOP + 10; y++) {
    put(14, y, 10, "lightning_rod", { facing: "up", powered: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
