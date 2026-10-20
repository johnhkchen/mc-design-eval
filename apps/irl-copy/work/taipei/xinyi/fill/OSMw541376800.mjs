import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "OSMw541376800";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 23, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground layer (solid from y 0 up to and including it)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

// Exterior faces of a footprint cell (neighbour missing)
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const set = (x, y, z, id, p) => g.set(x, y, z, id, p);

// Glass pane running along the facade (axisZ = facade lies on a north/south face)
const pane = (x, y, z, axisZ) =>
  set(x, y, z, "light_blue_stained_glass_pane", axisZ
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Plan: 2 storeys of ~5 blocks (floor slab y=5), flat roof deck y=10, parapet to y=11.
// Ground floor: plinth y=gr+1, shopfront glass gr+2..gr+3, lintel gr+4.
// Upper floor: glass y=6..8, spandrel band y=9, cornice y=10, parapet slab y=11.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation / ground slab, solid from y 0 up to the cell's ground
  for (let y = 0; y <= gr; y++) set(x, y, z, "stone_bricks");

  const fs = faces(x, z);

  if (!fs.length) {
    // Interior: floor slabs per storey and the roof deck; air elsewhere
    set(x, 5, z, "smooth_stone");
    set(x, 10, z, "stone_bricks");
    // Sparse roof plant boxes standing on the deck
    if (x > 1 && x < 21 && z > 1 && z < 10 && (3 * x + 5 * z) % 8 === 0) {
      set(x, 11, z, "light_gray_concrete");
      set(x, 12, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter (facade) cell
  const prim = fs[0];
  const axisZ = prim === "north" || prim === "south";
  const idx = axisZ ? x : z;
  const pier = idx % 4 === 0;

  // Wall shell
  for (let y = gr + 1; y <= 10; y++) set(x, y, z, "white_terracotta");
  set(x, gr + 1, z, "polished_andesite");           // base course
  set(x, 5, z, "light_gray_concrete");              // storey line
  set(x, 9, z, "light_gray_concrete");              // spandrel band
  set(x, 10, z, "quartz_block");                    // cornice
  set(x, 11, z, "quartz_slab", { type: "bottom", waterlogged: "false" }); // parapet cap

  // Upper-floor windows with piers as frames
  for (let y = 6; y <= 8; y++) {
    if (pier) set(x, y, z, "light_gray_concrete");
    else pane(x, y, z, axisZ);
  }

  // Shopfront on the ground floor
  for (const y of [gr + 2, gr + 3]) {
    if (y > 4) continue;
    if (pier) set(x, y, z, "gray_concrete");
    else pane(x, y, z, axisZ);
  }

  // Warm light standing inside behind some windows
  const [dx, dz] = OUT[prim];
  const ix = x - dx, iz = z - dz;
  if (!pier && has(ix, iz) && faces(ix, iz).length === 0) {
    if ((x + z) % 2 === 0 && gr + 1 <= 4) {
      set(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
    if ((x + z) % 3 === 0) {
      set(ix, 6, iz, "glowstone");
    }
  }
}

// Street entrance on the north face, nearest the centre of the facade
const front = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => faces(x, z).includes("north"))
  .sort((a, b) => Math.abs(a[0] - 11) - Math.abs(b[0] - 11));

if (front.length) {
  const [x, z] = front[0];
  const gr = ground.get(`${x},${z}`);
  const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  set(x, gr + 1, z, "dark_oak_door", door("lower"));
  set(x, gr + 2, z, "dark_oak_door", door("upper"));
  pane(x, gr + 3, z, true);                          // transom glass
  set(x, gr + 4, z, "white_terracotta");             // lintel over the door
}

g.save(`${DIR}/${ID}.nbt`);
