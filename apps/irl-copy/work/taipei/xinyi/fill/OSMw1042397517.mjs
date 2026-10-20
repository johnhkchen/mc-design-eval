import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397517";
const W = 28, D = 13, H = 23;

// Record-driven reading: roof ~11 blocks above lowest ground. Two commercial storeys
// (5 blocks each, ground floor shopfronts) under a cornice and parapet, in pale
// quartz render with a stone base course, typical of a late-20th-century Taipei
// commercial block. Storey lines sit at y=5 (floor band) and y=11 (cornice / roof).
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const WALL = "smooth_quartz";
const BAND = "polished_andesite";
const LINTEL = "stone_bricks";
const CORNICE = "stone_bricks";
const PARAPET = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane";
const FLOOR = "smooth_stone";
const ROOF = "smooth_stone";
const LIGHT = "shroomlight";
const PANE = { north: "true", south: "true", east: "true", west: "true" };

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

function facade(x, z, y, gy, zFace) {
  const pillar = zFace ? x % 3 === 0 : z % 3 === 0;
  if (y === gy) return [BASE];
  if (y === 4) return [LINTEL];
  if (y === 5) return [BAND];
  if (y === 10) return [WALL];
  if (pillar) return [WALL];
  return [GLASS, PANE];
}

for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, FOUND);

  // Cells on high ground that reach the roof line get no building body.
  if (gy >= 11) continue;

  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const ext = zFace || xFace;

  // Roof level: cornice on the perimeter, roof deck inside, parapet on the edge.
  put(x, 11, z, ext ? CORNICE : ROOF);
  if (ext) put(x, 12, z, PARAPET);

  if (ext) {
    const front = zFace && z === 0;
    for (let y = gy; y <= 10; y++) {
      // Entrance door on the front (z=0) face at x=13.
      if (front && x === 13 && (y === gy + 1 || y === gy + 2)) {
        const half = y === gy + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      const [b, p] = facade(x, z, y, gy, zFace);
      put(x, y, z, b, p);
    }
  } else {
    // Interior: floor slabs at the storey lines, air between (no interiors modelled).
    const ys = new Set([gy, 5].filter((y) => y >= gy && y <= 10));
    for (const y of ys) put(x, y, z, FLOOR);
    // Warm lights set back behind some front and back windows.
    if ((z === 1 || z === D - 2) && x % 6 === 1) {
      if (2 > gy) put(x, 2, z, LIGHT);
      if (8 > gy) put(x, 8, z, LIGHT);
    }
    // Roof plant: two small air-handling units on the deck.
    if (x >= 4 && x <= 5 && z >= 4 && z <= 5) {
      put(x, 12, z, "iron_block");
    }
    if (x >= 20 && x <= 21 && z >= 4 && z <= 5) {
      put(x, 12, z, "light_gray_concrete");
      put(x, 13, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
