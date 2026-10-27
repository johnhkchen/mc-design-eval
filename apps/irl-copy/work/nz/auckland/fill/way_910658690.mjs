import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 910658690: a two-storey Edwardian/interwar brick shop-and-flat on a basalt plinth, the kind that lines the
// old main streets of Mt Eden, Newton and Grafton. Flat parapet roof at lidar height 10, so: floor slabs at y0, y4, y8;
// shopfront glass on the ground storey; sash-style window bays with white lintels above; a corbelled-looking smooth
// stone cornice band at y8 and a brick parapet at y9 with stone pilasters on the corners.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658690.cells.json", "utf8"));

const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => foot.has(`${x},${z}`);
// shell cell: a footprint cell with a neighbour outside the footprint (the facade and its corners)
const edge = (x, z) => inF(x, z) && (!inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1));
// corner: a shell cell that is missing a neighbour both across and along the wall (convex or notch corners)
const corner = (x, z) => edge(x, z) && (!inF(x - 1, z) || !inF(x + 1, z)) && (!inF(x, z - 1) || !inF(x, z + 1));

const DOOR = [1, 6];                                   // the entrance on the south facade
const isDoor = (x, z) => x === DOOR[0] && z === DOOR[1];
const isWindow = (x, z) => ((x >> 1) + (z >> 1)) % 2 === 0;   // 2-wide bays alternate along the walls

const B = new Map();
const put = (x, y, z, name, state) => B.set(`${x},${y},${z}`, { name, state });
const key = (x, y, z) => `${x},${y},${z}`;

for (const [x, z, ground, roof] of cells) {
  // floors and roof deck: a full slab at y0, y4, y8 under every footprint cell (nothing floats)
  put(x, 0, z, "polished_basalt");
  put(x, 4, z, "smooth_stone");
  put(x, 8, z, "smooth_stone");
  if (!edge(x, z)) continue;

  const c = corner(x, z);
  if (c) {
    // stone pilasters up the corners, to the parapet
    for (let y = 1; y <= 9; y++) if (y !== 4) put(x, y, z, "stone_bricks");
    continue;
  }
  if (isDoor(x, z)) {
    put(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "dark_oak_planks");                  // timber lintel over the door
  } else {
    put(x, 1, z, "polished_basalt");                   // stallriser
    put(x, 2, z, "glass_pane");                        // shopfront glass
    put(x, 3, z, "glass_pane");
  }
  // upper storey: bays of glass with white lintels, brick between
  if (isWindow(x, z)) {
    put(x, 5, z, "glass_pane");
    put(x, 6, z, "glass_pane");
    put(x, 7, z, "white_concrete");
  } else {
    put(x, 5, z, "bricks");
    put(x, 6, z, "bricks");
    put(x, 7, z, "bricks");
  }
  // parapet, brick, above the cornice
  put(x, 9, z, "bricks");
}

// Warm light behind some upper windows: a glowstone or shroomlight in the air gap just inside the glass.
for (const [x, z] of cells) {
  if (!edge(x, z) || corner(x, z) || isDoor(x, z) || !isWindow(x, z)) continue;
  if ((x * 3 + z) % 4 !== 0) continue;
  const inner = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].find(([ix, iz]) => inF(ix, iz) && !edge(ix, iz));
  if (inner) put(inner[0], 5, inner[1], (x + z) % 2 ? "glowstone" : "shroomlight");
}

// A lantern hangs from the floor slab just inside the entrance, lighting the shopfront at dusk.
put(DOOR[0], 3, DOOR[1] - 1, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant: a small block on the deck, well back from the parapet.
put(6, 9, 3, "stone_bricks");
put(6, 9, 4, "stone_bricks");

// Glass panes connect to whatever is beside them in the same storey, as vanilla does.
const solid = (x, y, z) => B.has(key(x, y, z));
for (const [k, b] of B) {
  if (b.name !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  b.state = {
    north: String(solid(x, y, z - 1)),
    south: String(solid(x, y, z + 1)),
    east: String(solid(x + 1, y, z)),
    west: String(solid(x - 1, y, z)),
    waterlogged: "false",
  };
}

const g = new Voxels([9, 23, 7]);
for (const [k, b] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.name, b.state);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658690.nbt");
console.log(`way_910658690: ${out.blocks} blocks, ${out.palette} palette entries`);
