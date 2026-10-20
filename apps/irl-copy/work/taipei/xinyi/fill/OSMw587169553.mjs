import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587169553.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587169553.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 22, H = 41, D = 15;
const g = new Voxels([W, H, D]);

// Lookup of footprint cells and their ground heights
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);

// Exterior faces per cell
const facesOf = new Map();
for (const [x, z] of cells) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  facesOf.set(`${x},${z}`, f);
}
const facesAt = (x, z) => facesOf.get(`${x},${z}`) || [];

const minG = Math.min(...cells.map(c => c[2]));
// 5 storeys of 5 blocks, then a 4-block parapet/roof zone: roof at minG + 29
const T = minG + 29;

const PIER = "white_concrete";
const SPANDREL = "smooth_quartz";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane";

// Main door: prefer a south-facing (street) bay away from piers, near the middle
const southCells = cells.filter(([x, z]) => facesAt(x, z).length === 1 && facesAt(x, z)[0] === "south");
let door = null;
if (southCells.length) {
  const meanX = southCells.reduce((a, c) => a + c[0], 0) / southCells.length;
  const cand = southCells
    .filter(([x]) => x % 3 !== 0)
    .sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
  door = cand[0] || southCells[0];
}

for (const [x, z, gr] of cells) {
  const faces = facesAt(x, z);
  const exterior = faces.length > 0;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let y = gr; y < T; y++) {
    const rel = y - minG;
    const o = rel % 5;
    const s = Math.floor(rel / 5);

    if (!exterior) {
      // Interior: floor slabs at each storey line and at the base, no walls
      if (y === gr || (rel < 25 && o === 0) || rel === 25) g.set(x, y, z, FLOOR);
      continue;
    }

    // Exterior shell
    if (rel >= 26) {
      g.set(x, y, z, rel === 28 ? "stone_bricks" : PIER); // parapet and cap
      continue;
    }
    if (rel === 25) {
      g.set(x, y, z, "stone_bricks"); // cornice
      continue;
    }
    if (y === gr) {
      g.set(x, y, z, BASE); // base course
      continue;
    }
    if (o === 0 || o === 4) {
      g.set(x, y, z, SPANDREL); // storey lines
      continue;
    }

    // Window zone (o = 1..3)
    const a = (faces[0] === "north" || faces[0] === "south") ? x : z;
    const pier = faces.length >= 2 || a % 3 === 0;
    if (pier) {
      g.set(x, y, z, PIER);
    } else {
      const ns = faces[0] === "north" || faces[0] === "south";
      g.set(x, y, z, GLASS, ns
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    }
  }
}

// Warm lights behind some window glass (second row of each storey, inner cell must be air)
for (const [x, z, gr] of cells) {
  const faces = facesAt(x, z);
  if (faces.length !== 1) continue;
  const f = faces[0];
  const [ix, iz] = f === "north" ? [x, z + 1]
    : f === "south" ? [x, z - 1]
    : f === "west" ? [x + 1, z]
    : [x - 1, z];
  if (!has(ix, iz) || facesAt(ix, iz).length > 0) continue;
  const a = (f === "north" || f === "south") ? x : z;
  if (a % 3 === 0) continue;
  for (let s = 0; s < 5; s++) {
    if ((a + s) % 3 !== 0) continue;
    const y = minG + s * 5 + 2;
    if (y < gr || y >= T) continue;
    g.set(ix, y, iz, (s === 0) ? "glowstone" : "shroomlight");
  }
}

// Main entrance on the street face, with a lower and upper door block
if (door) {
  const [dx, dz, dg] = door;
  g.set(dx, dg + 1, dz, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, dg + 2, dz, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof plant: a penthouse box on the interior roof with a lightning-rod mast
for (const [x, z] of cells) {
  if (facesAt(x, z).length > 0) continue;
  if (x >= 8 && x <= 13 && z >= 5 && z <= 9) {
    g.set(x, minG + 26, z, "light_gray_concrete");
    g.set(x, minG + 27, z, "light_gray_concrete");
    g.set(x, minG + 28, z, "stone_bricks");
  }
}
if (has(10, 7)) {
  for (let y = minG + 29; y <= minG + 31; y++) g.set(10, y, 7, "lightning_rod");
}

g.save(OUT);
