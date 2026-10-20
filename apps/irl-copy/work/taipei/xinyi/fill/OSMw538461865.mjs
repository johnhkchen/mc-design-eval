import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey (plus parapet) mid-century commercial block: white-tiled walls,
// quartz storey bands, ground-floor shopfronts with a door, blue-tinted office
// glass above, a rooftop water tank and HVAC unit. Roof sits 11 blocks above
// the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538461865";
const W = 20, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...cells.map((c) => c[2]));
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, Math.round(gr - minG));

const has = (x, z) => foot.has(`${x},${z}`);
const isExt = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const g = new Voxels([W, H, D]);

// Bounds-checked, footprint-only placement.
function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

for (const [key, gr] of foot) {
  const [x, z] = key.split(",").map(Number);
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const ext = mN || mS || mW || mE;
  const corner = (mN || mS) && (mW || mE);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!ext) {
    // Interior: floor slabs per storey, roof slab, air between (no interiors).
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    // Rooftop water tank (2x2) and HVAC unit.
    if (x >= 4 && x <= 5 && z >= 4 && z <= 5) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "iron_block");
    }
    if (x >= 14 && x <= 15 && z >= 9 && z <= 10) {
      put(x, gr + 11, z, "gray_concrete");
    }
    continue;
  }

  // Exterior cell: determine the street-facing side.
  const face = mN ? "north" : mS ? "south" : mW ? "west" : "east";
  const alongX = face === "north" || face === "south";
  const i = alongX ? x : z;
  const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[face];

  // Base course, storey bands, cornice, parapet.
  put(x, gr, z, "stone_bricks");
  put(x, gr + 5, z, "smooth_quartz");
  put(x, gr + 10, z, "smooth_quartz");
  put(x, gr + 11, z, "white_concrete");

  // Corners and pillars: white tiled piers every 4 cells.
  if (corner || i % 4 === 0) {
    for (const y of [1, 2, 3, 4, 6, 7, 8, 9]) put(x, gr + y, z, "white_concrete");
    continue;
  }

  // Ground floor: shopfront glass, door on the south face, fascia band.
  const isDoor = face === "south" && x === 9;
  if (isDoor) {
    const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
    put(x, gr + 1, z, "dark_oak_door", { ...door, half: "lower" });
    put(x, gr + 2, z, "dark_oak_door", { ...door, half: "upper" });
    put(x, gr + 3, z, "glass");
  } else {
    for (const y of [1, 2, 3]) put(x, gr + y, z, "glass");
    // Warm shop light behind some glass.
    if (i % 8 === 5) {
      const ix = x + inward[0], iz = z + inward[1];
      if (has(ix, iz) && !isExt(ix, iz)) put(ix, gr + 2, iz, "shroomlight");
    }
  }
  put(x, gr + 4, z, "gray_concrete");

  // Upper floor: blue-tinted office windows with white lintel.
  for (const y of [6, 7, 8]) put(x, gr + y, z, "light_blue_stained_glass_pane");
  put(x, gr + 9, z, "white_concrete");

  // Glowstone behind some upper windows.
  if (i % 8 === 2) {
    const ix = x + inward[0], iz = z + inward[1];
    if (has(ix, iz) && !isExt(ix, iz)) put(ix, gr + 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
