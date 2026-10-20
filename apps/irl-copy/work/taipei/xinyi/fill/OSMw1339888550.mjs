import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw1339888550.cells.json`, "utf8"));

const W = 4, H = 19, D = 5;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const has = (x, z) => ground.has(`${x},${z}`);
const boundary = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// pane orientations
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const base = Math.round(gr);
  const edge = boundary(x, z);

  // foundation under the cell, then ground-floor slab at its ground level
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");
  put(x, base, z, "smooth_stone");

  // roof slab over every cell, with a light cornice course on the perimeter
  put(x, base + 5, z, "light_gray_concrete");

  if (edge) {
    // walls: stone base course, white concrete body, parapet above the cornice
    put(x, base + 1, z, "stone_bricks");
    put(x, base + 2, z, "white_concrete");
    put(x, base + 3, z, "white_concrete");
    put(x, base + 4, z, "white_concrete");
    put(x, base + 6, z, "white_concrete");
  } else {
    // interior: air storey, no interior fit-out
    // (air left as-is; floor slab and roof slab already placed)
  }
}

// Front facade (z = 0, facing north): door at x=1, shopfront glass at x=2
for (const [x, z, gr] of cells) {
  if (z !== 0 || !has(x, z)) continue;
  const b = Math.round(gr);
  if (x === 1) {
    // entrance door, two halves, with a dark lintel above
    put(x, b + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, b + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
  if (x === 2) {
    // shopfront glass with a concrete transom
    put(x, b + 1, z, "gray_stained_glass_pane", PANE_EW);
    put(x, b + 2, z, "light_gray_concrete");
  }
  if (x === 1 || x === 2) {
    // upper storey window band with frame
    put(x, b + 3, z, "gray_stained_glass_pane", PANE_EW);
    put(x, b + 4, z, "gray_stained_glass_pane", PANE_EW);
  }
}

// Side walls (x = 0 and x = 3): windows at z = 1 and z = 3, upper storey only
for (const [x, z, gr] of cells) {
  if ((x !== 0 && x !== 3) || !has(x, z)) continue;
  const b = Math.round(gr);
  if (z === 1 || z === 3) {
    put(x, b + 3, z, "gray_stained_glass_pane", PANE_NS);
    put(x, b + 4, z, "gray_stained_glass_pane", PANE_NS);
  }
}

// Warm lights behind the glass
for (const [x, z, gr] of cells) {
  const b = Math.round(gr);
  if (x === 2 && z === 1) {
    put(x, b + 1, z, "lantern", { hanging: "false", waterlogged: "false" }); // shopfront lantern
    put(x, b + 3, z, "glowstone"); // upper room glow behind window
  }
}

// Roof equipment on the interior of the roof, standing on the roof slab
for (const [x, z, gr] of cells) {
  const b = Math.round(gr);
  if (x === 1 && z === 3 && !boundary(x, z)) {
    put(x, b + 6, z, "iron_block");
  }
}

g.save(`${DIR}/OSMw1339888550.nbt`);
