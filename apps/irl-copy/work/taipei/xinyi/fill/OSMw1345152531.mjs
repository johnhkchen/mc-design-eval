// 三長廟 (Sanchang Temple), Xinyi, Taipei. Read from the lidar record:
// roof about 7 blocks above lowest ground, so one storey with a tiled hip roof.
// Era: mid-20th-century temple: red plastered walls, a yellow cornice band,
// a dark glazed-tile roof, and a plain stone plinth. Doors face the street (z = 0).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1345152531";
const W = 13, D = 20, H = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gnd] of cells) ground.set(`${x},${z}`, gnd);
const inFp = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const maxGb = Math.max(...cells.map((c) => c[2] - minG));

// Eave course sits 5 above the highest floor, so the roof tops out about 7 above the lowest ground.
const E = maxGb + 5;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const edge = (x, z) =>
  !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
const corner = (x, z) =>
  edge(x, z) && (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

const stairP = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });
const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const doorP = (half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });

// 1. Foundations, floor slabs and walls, per footprint cell
for (const [x, z, gnd] of cells) {
  const gb = gnd - minG;
  // foundation below the floor, then the floor slab itself
  for (let y = 0; y <= gb; y++) put(x, y, z, "stone_bricks");

  if (edge(x, z)) {
    put(x, gb + 1, z, "stone_bricks");                 // base course
    for (let y = gb + 2; y <= E - 2; y++) {
      put(x, y, z, corner(x, z) ? "quartz_pillar" : "red_concrete", corner(x, z) ? { axis: "y" } : undefined);
    }
    put(x, E - 1, z, "yellow_concrete");               // cornice band
  } else {
    put(x, E - 1, z, "dark_oak_planks");               // interior ceiling, air below
  }
}

// 2. Windows, warm lights and the street entrance
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gb = cells.find((c) => c[0] === x && c[1] === z)[2] - minG;
  if (!edge(x, z)) continue;

  // side windows on the long walls (x = 0 and x = 12)
  if ((x === 0 || x === W - 1) && [4, 7, 10, 13, 16].includes(z)) {
    put(x, gb + 2, z, "glass_pane", paneNS);
    put(x, gb + 3, z, "glass_pane", paneNS);
  }
  // back windows (z = 19)
  if (z === D - 1 && [3, 9].includes(x)) {
    put(x, gb + 2, z, "glass_pane", paneEW);
    put(x, gb + 3, z, "glass_pane", paneEW);
  }
  // street facade (z = 0): double doors, hanging lanterns either side
  if (z === 0 && (x === 5 || x === 6)) {
    const hinge = x === 5 ? "left" : "right";
    put(x, gb + 1, z, "dark_oak_door", doorP("lower", hinge));
    put(x, gb + 2, z, "dark_oak_door", doorP("upper", hinge));
  }
  if (z === 0 && (x === 3 || x === 9)) {
    put(x, gb + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Warm glow behind two side windows
for (const z of [7, 13]) {
  if (inFp(1, z) && !edge(1, z)) {
    const gb = cells.find((c) => c[0] === 1 && c[1] === z)[2] - minG;
    put(1, gb + 2, z, "glowstone");
  }
}

// 3. Hip roof: three stepped courses, edges as outward-facing stairs
for (let k = 0; k < 3; k++) {
  const y = E + k;
  for (let x = k; x <= W - 1 - k; x++) {
    for (let z = k; z <= D - 1 - k; z++) {
      if (!inFp(x, z)) continue;
      const exW = x === k, exE = x === W - 1 - k;
      const ezN = z === k, ezS = z === D - 1 - k;
      if (exW) put(x, y, z, "deepslate_tile_stairs", stairP("west"));
      else if (exE) put(x, y, z, "deepslate_tile_stairs", stairP("east"));
      else if (ezN) put(x, y, z, "deepslate_tile_stairs", stairP("north"));
      else if (ezS) put(x, y, z, "deepslate_tile_stairs", stairP("south"));
      else if (k === 2 && x === 6) put(x, y, z, "yellow_concrete"); // ridge line
      else put(x, y, z, "deepslate_tiles");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
