import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618830";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 10 x 22 footprint, roof about 11 blocks above lowest ground.
// Reads as a two-storey Taipei commercial block (1970s-80s): concrete
// frame with quartz render, stone-clad street level with shopfront glazing,
// a stone parapet and a dark tiled roof.
const W = 10, H = 23, D = 22;
const TOP = 11;          // roof slab layer
const STREET_Z = 0;      // street-facing side (north, z = 0)

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => Math.max(0, Math.min(ground.get(`${x},${z}`), TOP - 1));

const outFaces = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isEdge = (x, z) => {
  const f = outFaces(x, z);
  return f.n || f.s || f.w || f.e;
};

// Street-face cells (north edge); door at the median x of that edge.
const streetCells = cells
  .filter(([x, z]) => z === STREET_Z || outFaces(x, z).n)
  .filter(([x, z]) => outFaces(x, z).n)
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = streetCells.length ? streetCells[Math.floor(streetCells.length / 2)] : -1;
const doorZ = STREET_Z;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z] of cells) {
  const gr = groundOf(x, z);
  const f = outFaces(x, z);
  const edge = isEdge(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // Ground-storey floor slab (plinth on the edge).
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // Ground storey: gr+1 .. 4
  for (let y = gr + 1; y <= 4; y++) {
    if (!edge) continue; // interior air
    if (f.n) {
      // Street shopfront
      if (x === doorX && (y === gr + 1 || y === gr + 2)) {
        // Door handled below
        continue;
      }
      if (y === 4) put(x, y, z, "smooth_quartz");
      else if (x % 3 === 0) put(x, y, z, "polished_andesite");
      else put(x, y, z, "glass");
    } else {
      // Other ground-floor faces: stone base wall
      put(x, y, z, "stone_bricks");
    }
  }

  // Storey line between floors
  if (5 > gr) {
    if (edge) put(x, 5, z, "smooth_quartz");
    else put(x, 5, z, "smooth_stone");
  }

  // Upper storey: 6 .. 9 (windows with quartz piers, lintel at 9)
  for (let y = 6; y <= 9; y++) {
    if (y <= gr) continue;
    if (!edge) continue; // interior air gap behind glass
    if (y === 9) { put(x, y, z, "smooth_quartz"); continue; }
    if ((x + z) % 3 === 0) {
      put(x, y, z, "smooth_quartz"); // pier
    } else {
      put(x, y, z, "glass");
    }
  }

  // Warm lights just behind some upper windows (inside the air gap).
  if (edge && 7 > gr && (x + z) % 6 === 1) {
    let ix = x, iz = z;
    if (f.n) iz = z + 1;
    else if (f.s) iz = z - 1;
    else if (f.w) ix = x + 1;
    else if (f.e) ix = x - 1;
    if (has(ix, iz) && !isEdge(ix, iz) && (ix + iz) % 3 !== 0) {
      put(ix, 7, iz, "shroomlight");
    }
  }

  // Parapet at 10 and roof slab at 11
  if (edge) {
    if (10 > gr) put(x, 10, z, "smooth_quartz");
    put(x, TOP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    put(x, TOP, z, "deepslate_tiles");
  }

  // Simple roof equipment: a few plant boxes on the roof.
  if (!edge && x % 4 === 2 && z % 5 === 2) {
    put(x, TOP + 1, z, "light_gray_concrete");
    put(x, TOP + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance door on the street face, with lintel canopy above.
if (doorX >= 0 && ground.has(`${doorX},${doorZ}`)) {
  const gr = groundOf(doorX, doorZ);
  const lower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
  const upper = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
  if (gr + 1 <= 4) put(doorX, gr + 1, doorZ, "dark_oak_door", lower);
  if (gr + 2 <= 4) put(doorX, gr + 2, doorZ, "dark_oak_door", upper);
  // Canopy slab above the door, in the lintel band
  if (gr + 3 <= 4) put(doorX, gr + 3, doorZ, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
