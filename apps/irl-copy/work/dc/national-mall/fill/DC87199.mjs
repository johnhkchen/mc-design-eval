import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87199.cells.json`, "utf8"));
const g = new Voxels([6, 20, 4]);

const key = (x, z) => `${x},${z}`;
const have = new Set(cells.map(([x, z]) => key(x, z)));
const isCorner = (x, z) => (x === 0 || x === 5) && (z === 0 || z === 3);
const isExterior = (x, z) =>
  !(have.has(key(x + 1, z)) && have.has(key(x - 1, z)) &&
    have.has(key(x, z + 1)) && have.has(key(x, z - 1)));

// One flat roof level for clean tiers: median lidar roof, but never below the
// lowest-ground cell plus a three-storey height.
const rfs = cells.map(c => c[3]).sort((a, b) => a - b);
const gys = cells.map(c => Math.max(0, Math.round(c[2])));
const medianRf = Math.round(rfs[Math.floor(rfs.length / 2)]);
const maxGy = Math.max(...gys);
const minGy = Math.min(...gys);
const TOP = Math.min(17, Math.max(medianRf, minGy + 8, maxGy + 6));

// Front (south, max z) entrance, nearest the middle of the footprint.
const xs = cells.map(c => c[0]);
const zs = cells.map(c => c[1]);
const midX = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const frontZ = Math.max(...zs);
let doorCell = null;
for (const [x, z] of cells) {
  if (z !== frontZ || !isExterior(x, z)) continue;
  if (!doorCell || Math.abs(x - midX) < Math.abs(doorCell[0] - midX)) doorCell = [x, z];
}
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;
const doorSide = new Set();
if (doorCell) {
  doorSide.add(key(doorCell[0] - 1, doorCell[1]));
  doorSide.add(key(doorCell[0] + 1, doorCell[1]));
}

for (const [x, z, grRaw] of cells) {
  const gy = Math.max(0, Math.round(grRaw));
  const top = Math.max(TOP, gy + 6);
  const k = key(x, z);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  if (isExterior(x, z)) {
    const isDoor = k === doorKey;
    const isDoorSide = doorSide.has(k);
    for (let y = gy; y < top; y++) {
      const rel = y - gy;
      let block = "bricks";
      let props = null;

      if (rel === 0) block = "stone_bricks";                       // base course
      if (rel === 3) { block = "stone_brick_slab"; props = { type: "top", waterlogged: "false" }; } // string course
      if (y === top - 1) block = "stone_bricks";                   // cornice / parapet

      const windowRow = (rel === 1 || rel === 2 || rel === 4 || rel === 5) && y < top - 1;

      if (isDoor && (rel === 1 || rel === 2)) {
        g.set(x, y, z, "oak_door", {
          facing: "south",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (isDoor && rel === 3) {
        // Canopy over the door, projecting from the string course line.
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      if (isDoorSide && (rel === 1 || rel === 2)) block = "stone_bricks"; // door surround
      if (windowRow && !isCorner(x, z) && !isDoor && !isDoorSide) block = "glass_pane";

      if (props) g.set(x, y, z, block, props);
      else g.set(x, y, z, block);
    }
  } else {
    // Interior: air gaps with a floor slab per storey, no rooms.
    for (const rel of [0, 3, 6]) {
      const y = gy + rel;
      if (y < top) g.set(x, y, z, "oak_planks");
    }
    // Warm lanterns standing on alternate interior floors.
    if ((x + z) % 2 === 0 && gy + 1 < top) {
      g.set(x, gy + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }

  // Flat roof slab over every footprint cell, sitting on the walls.
  g.set(x, top, z, "smooth_stone");
}

g.save(`${DIR}/DC87199.nbt`);
