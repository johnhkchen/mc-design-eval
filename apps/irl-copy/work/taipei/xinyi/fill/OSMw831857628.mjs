import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise: a two-storey 1980s Taipei commercial block.
// Cream tile-clad frame, dark glass shopfront, white concrete piers,
// stone base course, a storey band, a cornice and a parapet. Flat roof with plant units.
// Walls are a one-block perimeter ring; the interior is air with floor slabs.
// Storey 1: y g+1..g+4. Storey 2: y g+6..g+8. Roof deck g+9. Parapet g+10.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831857628.cells.json", "utf8"));

const W = 21, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pier test: corners are solid; otherwise a pier every 3 blocks along each exposed face.
const isPier = (x, z, N, S, W_, E) => {
  if ((N || S) && (W_ || E)) return true;
  let p = false;
  if (N || S) p = p || x % 3 === 0;
  if (W_ || E) p = p || z % 3 === 0;
  return p;
};

// Choose the front door on the south face (exposed toward +z): non-pier cell nearest the middle.
const southCells = [];
for (const [x, z] of ground.keys().toArray ? [] : []) {} // placeholder for clarity (no-op)
let doorKey = null;
{
  const cand = [];
  for (const [x, z] of cells) {
    const N = !has(x, z - 1), S = !has(x, z + 1), W_ = !has(x - 1, z), E = !has(x + 1, z);
    if (S && !isPier(x, z, N, S, W_, E)) cand.push(x);
  }
  if (cand.length) {
    const mid = cand.reduce((a, b) => (a = a, b), 0);
    const xs = cand.sort((a, b) => a - b);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const best = xs.reduce((a, b) => (Math.abs(b - cx) < Math.abs(a - cx) ? b : a));
    const zSouth = cells.filter(([x]) => x === best).map(([, z]) => z).sort((a, b) => b - a)[0];
    doorKey = `${best},${zSouth}`;
  }
}

for (const [x, z, gr] of cells) {
  // Foundation below the cell's ground so nothing floats on a slope.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const N = !has(x, z - 1), S = !has(x, z + 1), W_ = !has(x - 1, z), E = !has(x + 1, z);
  const exposed = N || S || W_ || E;

  if (!exposed) {
    // Interior: floor slabs, roof deck, plant units and a few warm lights; otherwise air.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 9, z, "gray_concrete");
    if (x % 5 === 2 && z % 5 === 2) put(x, gr + 10, z, "iron_block");
    if (x % 4 === 1 && z % 4 === 1) put(x, gr + 1, z, "glowstone");
    if (x % 4 === 3 && z % 4 === 2) put(x, gr + 6, z, "shroomlight");
    continue;
  }

  // Perimeter ring.
  const pier = isPier(x, z, N, S, W_, E);
  const paneProps = (N || S)
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  put(x, gr, z, "polished_andesite");          // base course
  put(x, gr + 5, z, "white_concrete");         // storey band
  put(x, gr + 9, z, "smooth_quartz");          // cornice
  put(x, gr + 10, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // parapet cap

  const isDoor = doorKey === `${x},${z}`;
  for (const yOff of [1, 2, 3, 4, 6, 7, 8]) {
    const y = gr + yOff;
    if (pier) {
      put(x, y, z, "white_concrete");
    } else if (yOff === 4) {
      put(x, y, z, "white_concrete");          // shopfront lintel
    } else {
      put(x, y, z, "glass_pane", paneProps);
    }
  }

  if (isDoor) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false" });
    put(x, gr + 3, z, "white_concrete");
    put(x, gr + 4, z, "white_concrete");
  }

  // Warm light behind a few upper windows: interior air on the floor slab.
  // (Glow is placed in the interior loop above.)
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831857628.nbt");
