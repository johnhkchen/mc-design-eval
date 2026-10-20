import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw839833613";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Footprint 17 x 13. Era: 1990s Xinyi commercial mid-rise, two storeys of
// white concrete with light grey bands, a polished-andesite base, a
// ground-floor glass shopfront, and a parapet roof with a small plant box.
const W = 17, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const B = Math.min(...cells.map((c) => c[2]));   // lowest ground under the footprint
const TOP = B + 11;                              // roof about 11 blocks above lowest ground
const frontZ = Math.max(...cells.map((c) => c[1])); // street-facing row (south, +z)
const doorX = 8;                                 // central entrance

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, name, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

// Ground floor shopfront and upper storey windows.
const windowBand = (y) => (y >= B + 2 && y <= B + 4) || (y >= B + 7 && y <= B + 9);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const door = edge && z === frontZ && x === doorX;

  for (let y = gr + 1; y <= TOP; y++) {
    if (!edge) {
      // Interior: floor slabs per storey and the roof deck; air otherwise.
      if (y === gr + 1 || y === B + 6 || y === TOP) put(x, y, z, "smooth_stone");
      continue;
    }

    // Street-facing door and canopy.
    if (door && y === B + 1) {
      put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (door && y === B + 2) {
      put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (z === frontZ && x >= doorX - 1 && x <= doorX + 1 && y === B + 3) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    if (y === TOP) { put(x, y, z, "light_gray_concrete"); continue; }        // parapet cap
    if (y === B + 10 || y === B + 6) { put(x, y, z, "light_gray_concrete"); continue; } // storey lines
    if (y === B + 5) { put(x, y, z, "light_gray_concrete"); continue; }     // ground-floor lintel
    if (y === B + 1) { put(x, y, z, "polished_andesite"); continue; }       // base course

    if (windowBand(y)) {
      const mullion = (x + z) % 3 === 0;
      if (mullion) { put(x, y, z, "light_gray_concrete"); continue; }
      // Warm glow behind some panes (shroomlight in sparse window cells).
      if ((x * 5 + z * 3 + y) % 13 === 0) { put(x, y, z, "shroomlight"); continue; }
      put(x, y, z, "glass");
      continue;
    }

    put(x, y, z, "white_concrete");
  }
}

// Roof plant box: a 3 x 3 penthouse on the roof deck, only if all nine cells exist.
const plant = [];
for (let x = 7; x <= 9; x++) for (let z = 5; z <= 7; z++) plant.push(has(x, z) && !isEdge(x, z));
if (plant.every(Boolean)) {
  for (let x = 7; x <= 9; x++) {
    for (let z = 5; z <= 7; z++) {
      put(x, TOP + 1, z, "light_gray_concrete");
      put(x, TOP + 2, z, "smooth_stone");
    }
  }
  put(8, TOP + 1, 6, "iron_block");
}

g.save(`${dir}/${id}.nbt`);
