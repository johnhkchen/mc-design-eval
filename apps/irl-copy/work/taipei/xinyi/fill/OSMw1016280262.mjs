import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280262";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 8 x 21 footprint, 33 blocks tall (roof at y=20, parapet to y=21, rooftop plant to y=24)
const W = 8, H = 33, D = 21;
const ROOF = 20;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minZ = Math.min(...cells.map((c) => c[1]));
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

const PANE_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_NS = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Pass 1: foundations, floor slabs, roof deck for every footprint cell
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  for (const fy of [gr, 5, 10, 15]) {
    if (fy >= gr && fy < ROOF) put(x, fy, z, "light_gray_concrete");
  }
  put(x, ROOF, z, "gray_concrete");
}

// Pass 2: facades, storeys, parapet, glow and entrance
for (const [x, z, gr] of cells) {
  const openN = !has(x, z - 1);
  const openS = !has(x, z + 1);
  const openW = !has(x - 1, z);
  const openE = !has(x + 1, z);
  const perim = openN || openS || openW || openE;
  if (!perim) continue;

  const front = openN && z === minZ;           // street-facing face (north)
  const frontFace = openN || openS;            // runs along x
  const corner = (openW || openE) && (openN || openS);

  // Pillar test: corners and regular mullions
  const pillar = corner || (frontFace ? (x % 3 === 0) : (z % 3 === 0));

  for (let y = gr; y < ROOF; y++) {
    const r = y % 5;
    let b = "smooth_quartz";
    let p;

    if (r === 0) {
      b = "light_gray_concrete";
    } else if (r === 4) {
      b = y < 5 && front ? "black_concrete" : "smooth_quartz";
    } else {
      // window zone (rows 1..3 of each storey)
      const isDoorCol = front && x === 3 && y < 5 && y <= 2 && gr <= 1;
      if (isDoorCol) {
        if (y === 1 || y === 2) {
          b = "dark_oak_door";
          p = { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        }
      } else if (front && x === 3 && y === 3 && gr <= 1 && y < 5) {
        b = "lantern";
        p = { hanging: "true", waterlogged: "false" };
      } else if (pillar) {
        b = "smooth_quartz";
      } else {
        b = "light_blue_stained_glass_pane";
        p = frontFace ? PANE_EW : PANE_NS;
      }
    }
    put(x, y, z, b, p);
  }

  // Cornice and parapet
  put(x, ROOF, z, "light_gray_concrete");
  put(x, ROOF + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Warm lights behind the glass on the street face and back face
  if (openN || openS) {
    const inZ = openN ? z + 1 : z - 1;
    if (has(x, inZ) && (x === 2 || x === 5)) {
      for (const y of [2, 7, 12, 17]) {
        if (y >= gr) put(x, y, inZ, y === 2 ? "glowstone" : "shroomlight");
      }
    }
  }
}

// Rooftop water tank with cap, standing on the roof deck
const tankCells = [];
for (let x = 2; x <= 4; x++) for (let z = 13; z <= 15; z++) if (has(x, z)) tankCells.push([x, z]);
for (const [x, z] of tankCells) {
  for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "iron_block");
  put(x, ROOF + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
