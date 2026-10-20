import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw772136248";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 7, H = 23, D = 25;
const g = new Voxels([W, H, D]);

// Levels (absolute y). Two storeys of ~5 blocks, cornice, parapet.
const BASE = 1;     // plinth course
const FLOOR = 5;    // storey slab between floors
const SILL = 6;     // upper window sill
const HEAD = 9;     // upper window head
const CORN = 10;    // cornice
const ROOF = 11;    // roof / parapet top

// Footprint lookup: key "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`) ?? 0;

// Main entrance: the north-end (min z) cell nearest the centre line
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
let doorX = -1, bestD = Infinity;
for (const [x, z] of cells) {
  if (z !== minZ) continue;
  const d = Math.abs(x - 3);
  if (d < bestD) { bestD = d; doorX = x; }
}

// Exterior faces of a cell: [faceName, index along that face]
function exteriorFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push(["n", x]);
  if (!has(x, z + 1)) f.push(["s", x]);
  if (!has(x - 1, z)) f.push(["w", z]);
  if (!has(x + 1, z)) f.push(["e", z]);
  return f;
}

// 1. Foundations: solid from y 0 up to each cell's ground
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!has(x, z)) continue;
    const gr = G(x, z);
    for (let y = 0; y <= gr && y < H; y++) g.set(x, y, z, "stone_bricks");
  }
}

// 2. Building shell, storeys, roof and roof equipment
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!has(x, z)) continue;
    const gr = G(x, z);
    const faces = exteriorFaces(x, z);
    const boundary = faces.length > 0;
    const face = faces[0];
    const i = face ? face[1] : -1;
    const isPier = i % 3 === 0;

    for (let y = gr + 1; y <= ROOF; y++) {
      // Roof and parapet
      if (y === ROOF) {
        g.set(x, y, z, boundary ? "white_concrete" : "light_gray_concrete");
        continue;
      }
      // Cornice (perimeter only)
      if (y === CORN) {
        if (boundary) g.set(x, y, z, "smooth_stone");
        continue;
      }
      // Storey slab across the whole footprint
      if (y === FLOOR) {
        g.set(x, y, z, "light_gray_concrete");
        continue;
      }
      // Interior: hanging warm lanterns under the upper slab, rooftop units
      if (!boundary) {
        if (y === FLOOR - 1 && (x + z) % 6 === 0) {
          g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        }
        continue;
      }
      // Perimeter walls
      if (y === BASE) {
        g.set(x, y, z, "polished_granite");
        continue;
      }
      if (y >= 2 && y <= 4) {
        // Ground floor shopfront
        if (face && face[0] === "n" && x === doorX && z === minZ && (y === 2 || y === 3)) {
          g.set(x, y, z, "oak_door", {
            facing: "north",
            half: y === 2 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (y === 4) {
          g.set(x, y, z, isPier ? "white_concrete" : "light_gray_concrete");
        } else {
          g.set(x, y, z, isPier ? "white_concrete" : "glass");
        }
        continue;
      }
      if (y >= SILL && y <= HEAD) {
        if (isPier) {
          g.set(x, y, z, "white_concrete");
        } else if (y === SILL || y === HEAD) {
          g.set(x, y, z, "light_gray_concrete");
        } else {
          g.set(x, y, z, "glass");
        }
        continue;
      }
      // Remaining wall course (above the lower floor, below the cornice)
      g.set(x, y, z, "white_concrete");
    }

    // Rooftop equipment standing on the roof slab
    if (!boundary && (x + 2 * z) % 7 === 0) {
      g.set(x, ROOF + 1, z, "iron_block");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
