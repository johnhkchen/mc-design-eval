import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1980s: two storeys over a stone-brick plinth,
// white-concrete piers, ribbon glazing with light-concrete spandrels, a smooth-stone
// cornice, a concrete parapet, a recessed glazed entrance and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540893365";
const W = 15, H = 23, D = 12;

const rows = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, gr] of rows) {
  if (x >= 0 && x < W && z >= 0 && z < D) cell.set(key(x, z), Math.round(gr));
}

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 },
  { name: "west", dx: -1, dz: 0 },
];

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}
const outsOf = (x, z) => DIRS.filter((d) => !cell.has(key(x + d.dx, z + d.dz)));

// Pane connection props for a glass pane lying in the wall plane of face d
function paneProps(d) {
  return d.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Pick the main entrance: south-facing, non-pier cell nearest the frontage centre
let door = null;
{
  let best = Infinity;
  for (const [k] of cell) {
    const [x, z] = k.split(",").map(Number);
    const outs = outsOf(x, z);
    if (outs.length !== 1 || outs[0].name !== "south") continue;
    if (x % 3 === 0) continue;
    const dist = Math.abs(x - (W - 1) / 2);
    if (dist < best) { best = dist; door = { x, z, d: outs[0] }; }
  }
}

for (const [k, gr] of cell) {
  const [x, z] = k.split(",").map(Number);
  const outs = outsOf(x, z);
  const exterior = outs.length > 0;

  // Foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!exterior) {
    // Interior: floor slabs per storey and roof slab; air elsewhere
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_quartz");
    put(x, gr + 10, z, "light_gray_concrete");
    continue;
  }

  // Plinth, cornice and parapet ring
  put(x, gr, z, "stone_bricks");
  put(x, gr + 10, z, "smooth_stone");
  put(x, gr + 11, z, "white_concrete");

  const corner = outs.length >= 2;
  const d = outs[0];
  const idx = d.dz !== 0 ? x : z;
  const pier = corner || idx % 3 === 0;

  if (pier) {
    for (let y = gr + 1; y <= gr + 9; y++) put(x, y, z, "white_concrete");
    continue;
  }

  // Storey 1: shopfront glazing, or entrance door with transom lantern
  const isDoor = door && door.x === x && door.z === z;
  if (isDoor) {
    const dprops = { facing: d.name, hinge: "left", open: "false", powered: "false" };
    put(x, gr + 1, z, "dark_oak_door", { ...dprops, half: "lower" });
    put(x, gr + 2, z, "dark_oak_door", { ...dprops, half: "upper" });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(d));
    }
  }
  put(x, gr + 4, z, "light_gray_concrete");

  // Storey 2: sill, glazing, head
  put(x, gr + 5, z, "light_gray_concrete");
  for (let y = gr + 6; y <= gr + 8; y++) {
    put(x, y, z, "gray_stained_glass_pane", paneProps(d));
  }
  put(x, gr + 9, z, "light_gray_concrete");

  // Warm light behind some upper-floor glass
  if (idx % 6 === 2) {
    const ix = x - d.dx, iz = z - d.dz;
    if (cell.has(key(ix, iz))) put(ix, gr + 7, iz, "glowstone");
  }
}

// Rooftop plant room on the central interior roof
for (const [k, gr] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (outsOf(x, z).length > 0) continue;
  if (x >= 5 && x <= 9 && z >= 4 && z <= 7) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
