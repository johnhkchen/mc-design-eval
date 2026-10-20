import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888785.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888785.nbt";

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 9, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Ground map. y 0 is the lowest ground under the footprint.
const minG = Math.min(...raw.map(c => c[2]));
const minX = Math.min(...raw.map(c => c[0]));
const minZ = Math.min(...raw.map(c => c[1]));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, Math.max(0, Math.min(10, Math.round(gr - minG))));
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Outward face of an edge cell: north (-z), south (+z), west (-x), east (+x).
function faceOf(x, z) {
  if (!has(x, z - 1)) return { dx: 0, dz: -1, along: "x" };
  if (!has(x, z + 1)) return { dx: 0, dz: 1, along: "x" };
  if (!has(x - 1, z)) return { dx: -1, dz: 0, along: "z" };
  return { dx: 1, dz: 0, along: "z" };
}
const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Entrance: the north-facing edge cell closest to the middle of the face.
const northCells = [];
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  if (isEdge(x, z) && !has(x, z - 1)) northCells.push([x, z]);
}
let entrance = null;
if (northCells.length) {
  const xs = northCells.map(c => c[0]);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  northCells.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
  entrance = northCells[0];
}

const paneProps = (along) => along === "x"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = G(x, z);
  const lx = x - minX, lz = z - minZ;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    // Shell: smooth quartz wall from ground to parapet top (y 10).
    for (let y = gr; y <= 10; y++) put(x, y, z, "smooth_quartz");
    put(x, gr, z, "polished_andesite");          // base course
    if (gr <= 5) put(x, 5, z, "smooth_quartz");  // storey line
    if (gr <= 9) put(x, 9, z, "smooth_quartz");  // cornice band
    put(x, 10, z, "smooth_quartz");              // parapet cap

    const f = faceOf(x, z);
    const a = f.along === "x" ? lx : lz;
    const mullion = a % 3 === 0;
    const bands = [];
    for (let y = gr + 1; y <= 3; y++) bands.push(y);
    for (let y = 6; y <= 8; y++) bands.push(y);

    const isEntrance = entrance && entrance[0] === x && entrance[1] === z;

    if (isEntrance) {
      // Recessed entrance: door on the middle cell, lantern just inside.
      put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "smooth_quartz");
      const ix = x - f.dx, iz = z - f.dz;
      if (has(ix, iz)) put(ix, gr + 1, iz, "lantern", { hanging: "false" });
    } else {
      for (const y of bands) {
        if (mullion) {
          put(x, y, z, "polished_andesite");
        } else {
          put(x, y, z, "light_blue_stained_glass_pane", paneProps(f.along));
        }
      }
      // Warm light behind some upper-storey windows.
      if (!mullion && a % 3 === 1 && (y => y)(0) === 0) {
        const ix = x - f.dx, iz = z - f.dz;
        if (has(ix, iz)) put(ix, 7, iz, "glowstone");
      }
    }
  } else {
    // Interior: ground floor slab, storey slabs, roof deck and structural columns.
    put(x, gr, z, "light_gray_concrete");
    if (gr <= 5) put(x, 5, z, "light_gray_concrete");
    if (gr <= 9) put(x, 9, z, "light_gray_concrete");
    if (lx % 4 === 2 && lz % 4 === 0) {
      for (let y = gr + 1; y <= 4; y++) put(x, y, z, "polished_andesite");
      for (let y = 6; y <= 8; y++) put(x, y, z, "polished_andesite");
    }
    // Rooftop plant room, a small block on the roof deck.
    if (lx >= 3 && lx <= 4 && lz >= 6 && lz <= 7) {
      put(x, 10, z, "light_gray_concrete");
      if (lx === 3 && lz === 6) put(x, 11, z, "iron_block");
    }
  }
}

g.save(OUT);
