// DC72239: 602 Emmanuel Ct NW, a 1920s-40s brick walk-up on the 6 x 6 footprint. The lidar gives a 3-high wing ring
// with a 4-high bar across the middle rows and one 4-high corner. Each column is solid from y 0 to its roof value;
// walls are the footprint's outer ring, the interior is air with a floor slab at y 0 and a roof deck on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72239.cells.json", "utf8"));
const roof = new Map(cells.map(([x, z, ground, r]) => [`${x},${z}`, { ground, r }]));

const g = new Voxels([6, 6, 6]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// the entrance sits on the z = 0 face at x 2; its lower and upper door halves are y 0 and y 1
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

for (const [key, { ground, r }] of roof) {
  const [x, z] = key.split(",").map(Number);
  const ring = x === 0 || x === 5 || z === 0 || z === 5;
  const corner = (x === 0 || x === 5) && (z === 0 || z === 5);
  const a = z === 0 || z === 5 ? x : z;           // position along the face the ring cell sits on
  const onZFace = z === 0 || z === 5;
  const pane = onZFace ? PANE_EW : PANE_NS;
  const top = r - 1;                               // the cornice course, or the roof deck inside the ring

  // foundation below the lowest ground: nothing (ground is 0 everywhere) but kept for a slope
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  for (let y = 0; y < r; y++) {
    if (!ring) {
      if (y === top) put(x, y, z, "gray_concrete");             // interior roof deck
      else if (y === 0) put(x, y, z, "stone");                   // ground-floor slab
      continue;                                                  // air between: rooms behind the windows
    }
    if (y === top) { put(x, y, z, "smooth_stone"); continue; }   // cornice on every ring cell
    if (y === 0) {                                               // base course, with the door at a = 2
      if (onZFace && z === 0 && x === 2) put(x, 0, z, "dark_oak_door", { ...DOOR, half: "lower" });
      else put(x, 0, z, "stone_bricks");
      continue;
    }
    if (corner) { put(x, y, z, "smooth_quartz"); continue; }     // limestone quoins
    if (y === 1 && onZFace && z === 0 && x === 2) { put(x, 1, z, "dark_oak_door", { ...DOOR, half: "upper" }); continue; }
    if (a === 2 || a === 3) put(x, y, z, "glass_pane", pane);    // the two panes of each bay
    else put(x, y, z, "bricks");                                  // brick piers either side of the bay
  }
}

// the entrance hood over the door: stone slabs across the top of the wing, flush with the cornice
for (const x of [1, 2, 3]) put(x, 2, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });

// warm light behind some windows (lanterns stand on the floor slab, the glowstone on the floor too)
put(3, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
put(4, 1, 3, "lantern", { hanging: "false", waterlogged: "false" });
put(2, 1, 4, "lantern", { hanging: "false", waterlogged: "false" });
put(1, 1, 2, "glowstone");

// roof equipment: two condenser units on the wing deck and a pair of brick flues on the bar
put(1, 3, 1, "iron_block");
put(4, 3, 4, "iron_block");
put(4, 4, 2, "bricks"); put(4, 5, 2, "smooth_stone");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72239.nbt");
console.log(JSON.stringify(stats));
