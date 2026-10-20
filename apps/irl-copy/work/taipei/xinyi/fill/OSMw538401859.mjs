import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401859";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: no name. Read as a 1970s-80s Xinyi-era mid-rise commercial block,
// two storeys of white tiled walls over a stone plinth, shopfronts at street level,
// a light cornice, and a rooftop water tank. Roof sits at y=11 above the lowest ground.
const W = 14, H = 23, D = 18;
const ROOF = 11;
const g = new Voxels([W, H, D]);

const cm = new Map();
for (const [x, z, gr] of cells) cm.set(`${x},${z}`, gr);
const has = (x, z) => cm.has(`${x},${z}`);
const ground = (x, z) => cm.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
function outward(x, z) {
  const out = [];
  for (const [n, [dx, dz]] of Object.entries(DIRS)) if (!has(x + dx, z + dz)) out.push(n);
  return out;
}

function put(x, y, z, b, p) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p === undefined) g.set(x, y, z, b);
  else g.set(x, y, z, b, p);
}
function putCell(x, y, z, b, p) {
  if (!has(x, z)) return;
  put(x, y, z, b, p);
}

// Facade block for one exterior wall cell, at height y of a storey starting at ground gr.
function faceBlock(x, y, z, dir, gr) {
  const ns = dir === "north" || dir === "south";
  const a = ns ? x : z;                       // position along the wall
  const pane = ns ? { north: "true", south: "true" } : { east: "true", west: "true" };
  const front = dir === "north";              // street-facing side (z = 0 edge)

  if (y === gr + 5) return ["light_gray_concrete"];   // storey line
  if (y === ROOF - 1) return ["light_gray_concrete"]; // cornice

  // Upper storey: window grid with frames
  if (y >= gr + 6 && y <= gr + 9) {
    if (a % 3 === 1) {
      if (y === gr + 9) return ["light_gray_concrete"]; // head frame
      return ["glass_pane", pane];
    }
    return ["white_concrete"];
  }

  // Ground storey (gr+1 .. gr+4): shopfronts
  if (front) {
    if (a === 6 && (y === gr + 1 || y === gr + 2)) {
      return ["dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      }];
    }
    if (a >= 4 && a <= 9 && y === gr + 3) return ["red_terracotta"]; // entrance canopy band
    if (a >= 4 && a <= 9 && y === gr + 4) return ["light_gray_concrete"];
  }
  if (a % 3 === 0) return ["white_concrete"]; // pilasters
  if (y === gr + 4) return ["white_concrete"];
  return ["glass_pane", pane];
}

for (const [x, z, gr] of cells) {
  // Foundation: solid below the cell's own ground, nothing floats on a slope
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const out = outward(x, z);
  const exterior = out.length > 0;

  // Floor level and base course
  put(x, gr, z, exterior ? "stone_bricks" : "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");   // storey slab (all cells)
  put(x, ROOF, z, "light_gray_concrete"); // roof slab (all cells)

  // Exterior walls, ground to just under the roof
  if (exterior) {
    for (let y = gr + 1; y <= ROOF - 1; y++) {
      for (const dir of out) {
        const [b, p] = faceBlock(x, y, z, dir, gr);
        put(x, y, z, b, p);
      }
    }
  }
}

// Warm lights behind upper-storey glass, placed in the interior cell just inside the wall
for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  for (const dir of out) {
    const ns = dir === "north" || dir === "south";
    const a = ns ? x : z;
    if (a % 6 !== 1) continue;
    if (a % 3 !== 1) continue;
    const [dx, dz] = DIRS[dir];
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz)) continue;
    if (outward(ix, iz).length > 0) continue;
    const lamp = a % 12 === 7 ? "shroomlight" : "glowstone";
    put(ix, gr + 7, iz, lamp);
  }
}

// Rooftop: water tank on a 3x3 footprint block, lightning rod, and a small plant unit
for (let x = 3; x <= 5; x++) {
  for (let z = 6; z <= 8; z++) {
    if (!has(x, z)) continue;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) putCell(x, y, z, "smooth_stone");
    putCell(x, ROOF + 4, z, "stone_bricks");
  }
}
putCell(1, ROOF + 1, 1, "lightning_rod");
putCell(1, ROOF + 2, 1, "iron_bars");
for (let x = 9; x <= 10; x++) {
  for (let z = 12; z <= 13; z++) putCell(x, ROOF + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
