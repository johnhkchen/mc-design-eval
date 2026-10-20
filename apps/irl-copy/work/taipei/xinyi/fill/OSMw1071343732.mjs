import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343732";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Roof parapet top sits at absolute y=11 (about 11 blocks above lowest ground).
// Two storeys of ~5 blocks: storey lines at y=5, parapet at y=10.
const TOP = 10;
const BAND = 5;

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: on the south (+z) face, middle of the frontage.
const EX = 6;
let EZ = -1;
for (const [x, z] of cells) {
  if (x === EX && isEdge(x, z) && z > EZ) EZ = z;
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  const pier = (x + z) % 3 === 0;
  const south = !has(x, z + 1);

  if (!isEdge(x, z)) {
    // Interior: ground slab, floor slab at storey line, roof deck; air in between.
    put(x, gr, z, "smooth_stone");
    if (gr <= BAND) put(x, BAND, z, "smooth_stone");
    if (gr <= TOP) put(x, TOP, z, "smooth_stone");
    // Warm lanterns standing on the ground-storey floor, behind windows.
    if (gr + 1 <= 4 && (x * 3 + z * 5) % 7 === 0) {
      put(x, gr + 1, z, "lantern", { hanging: "false" });
    }
    // Small roof plant on the deck.
    if (gr <= TOP && x >= 3 && x <= 9 && z >= 3 && z <= 8 && (x + z) % 4 === 0) {
      put(x, TOP + 1, z, "light_gray_concrete");
      put(x, TOP + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Exterior wall column from ground to parapet.
  for (let y = gr; y <= TOP; y++) {
    let b;
    if (y === gr) {
      b = "polished_andesite"; // base course
    } else if (y === TOP) {
      b = "smooth_quartz"; // parapet cap
    } else if (y === BAND) {
      b = "smooth_stone"; // storey line
    } else if (y < BAND) {
      // Ground storey (commercial): shopfront on south, windows elsewhere.
      if (pier) b = "white_concrete";
      else if (south) b = "glass";
      else b = "glass_pane";
    } else {
      // Upper storey: window grid with concrete piers.
      b = pier ? "white_concrete" : "glass_pane";
    }
    put(x, y, z, b);
  }
}

// Entrance door and canopy lintel on the south face.
if (EZ >= 0) {
  const gr = ground.get(`${EX},${EZ}`);
  if (gr + 2 < BAND) {
    put(EX, gr + 1, EZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(EX, gr + 2, EZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (gr + 3 < BAND) {
      put(EX, gr + 3, EZ, "stone_brick_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
