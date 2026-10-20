import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075550";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 16, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup: (x,z) -> ground index
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Street facade is the north edge (lowest z). Door sits on the median x of that edge.
const zMin = Math.min(...cells.map(c => c[1]));
const northXs = cells.filter(c => c[1] === zMin).map(c => c[0]).sort((a, b) => a - b);
const doorX = northXs[Math.floor(northXs.length / 2)];

const PANE_WIN = "light_blue_stained_glass_pane";
const PILLAR = "white_concrete";
const BASE = "stone_bricks";
const FOUND = "stone_bricks";
const CORNICE = "smooth_stone";
const ROOF = "light_gray_concrete";
const FLOOR = "smooth_stone";

function facadeBlock(x, z, gr, y) {
  const faceN = !has(x, z - 1), faceS = !has(x, z + 1);
  const faceW = !has(x - 1, z), faceE = !has(x + 1, z);
  const faceNS = faceN || faceS;
  const faceEW = faceW || faceE;
  const u = faceNS ? x : z;
  const corner =
    (faceNS && (!has(x - 1, z) || !has(x + 1, z))) ||
    (faceEW && (!has(x, z - 1) || !has(x, z + 1)));
  if (corner || u % 4 === 0) {
    g.set(x, y, z, PILLAR);
    return;
  }
  // Glass panes connected along the facade run
  const props = {
    north: "false", south: "false", east: "false", west: "false",
  };
  if (faceNS) { props.east = "true"; props.west = "true"; }
  if (faceEW) { props.north = "true"; props.south = "true"; }
  if (faceNS && faceEW) { props.north = props.south = props.east = props.west = "true"; }
  g.set(x, y, z, PANE_WIN, props);
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  if (!isEdge(x, z)) {
    // Interior: floor slab, empty storey air, roof cap
    g.set(x, gr, z, FLOOR);
    g.set(x, gr + 3, z, ROOF);

    // Warm light behind the street-side glass
    if (z === zMin + 1 && x % 4 === 2 && gr + 1 < H) {
      g.set(x, gr + 1, z, "glowstone");
    }

    // Roof plant on a few interior cells
    if (gr + 4 < H && x % 7 === 3 && z % 5 === 2) {
      g.set(x, gr + 4, z, "gray_concrete");
    }
  } else {
    // Perimeter: base course, two glazed storey rows, cornice
    g.set(x, gr, z, BASE);
    facadeBlock(x, z, gr, gr + 1);
    facadeBlock(x, z, gr, gr + 2);
    g.set(x, gr + 3, z, CORNICE);
  }
}

// Entrance door on the street facade (two blocks tall, lower + upper halves)
const doorGround = gnd(doorX, zMin);
g.set(doorX, doorGround + 1, zMin, "dark_oak_door", {
  facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
});
g.set(doorX, doorGround + 2, zMin, "dark_oak_door", {
  facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
});

// Warm lantern just inside the entrance
if (has(doorX, zMin + 1)) {
  const ig = gnd(doorX, zMin + 1);
  g.set(doorX, ig + 1, zMin + 1, "lantern", { hanging: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
