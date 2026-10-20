import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000032";
const W = 15, H = 21, D = 5;

// 1900s-style red brick loft/warehouse: brick walls, stone base and cornice,
// glazed storefront at street level, warm lights behind some windows.
const BRICK = "bricks";
const BAND = "stone_bricks";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const CAP = "smooth_stone";
const GLASS = "glass";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Gather lidar records per footprint cell
const rec = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const g = clamp(Math.round(gr), 0, H - 10);
  const r = clamp(Math.round(rf), g + 6, H - 1);
  rec.set(`${x},${z}`, { g, r });
}
let minG = Infinity;
for (const v of rec.values()) minG = Math.min(minG, v.g);
if (!isFinite(minG)) minG = 0;

const cell = (x, z) => rec.get(`${x},${z}`) ?? { g: minG, r: clamp(minG + 9, minG + 6, H - 1) };
const topOf = (x, z) => { const c = cell(x, z); return Math.max(c.r, c.g + 6); };

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Highest roof across the footprint
let topR = -Infinity;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) topR = Math.max(topR, topOf(x, z));

// Massing: per-column foundation, storeys on a 2-block pitch, cornice cap
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const { g: gr } = cell(x, z);
    const top = topOf(x, z); // exclusive top of solid
    const shell = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const front = (z === 0 || z === D - 1) && x > 0 && x < W - 1;
    const pier = x === 0 || x === W - 1 || x % 3 === 0;

    // Foundation from y0 up to ground
    for (let y = 0; y < gr; y++) S(x, y, z, FOUND);

    for (let y = gr; y < top - 1; y++) {
      const rel = y - gr;
      if (rel === 0) {
        // Base course on the shell, floor slab inside
        S(x, y, z, shell ? BASE : CAP);
        continue;
      }
      const storeyLine = rel % 2 === 0;
      if (storeyLine) {
        // Brick storey line on the shell, floor slab inside
        S(x, y, z, shell ? BRICK : CAP);
        continue;
      }
      // Window row (rel odd)
      if (shell) {
        if (front && !pier) S(x, y, z, GLASS);
        else S(x, y, z, BRICK);
      }
      // Interior at window rows stays air
    }

    // Stone cornice cap on top of the solid
    S(x, top - 1, z, BAND);

    // Brick parapet with stone coping on street faces
    if (front && top < H) {
      S(x, top, z, BRICK);
    }
  }
}

// Street-front entrance: oak door centred on the front, stone surround
const doorX = 7;
const doorY = cell(doorX, 0).g + 1;
if (doorY + 2 < H) {
  S(doorX, doorY, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  S(doorX, doorY + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  S(doorX - 1, doorY, 0, BASE);
  S(doorX + 1, doorY, 0, BASE);
  S(doorX - 1, doorY + 1, 0, BASE);
  S(doorX + 1, doorY + 1, 0, BASE);
  S(doorX, doorY + 2, 0, BAND);
}

// Warm light behind some street-front windows
for (let x = 1; x < W - 1; x++) {
  if (x % 3 === 0) continue;
  for (const z of [0, D - 1]) {
    const interiorZ = z === 0 ? 1 : D - 2;
    const gr = cell(x, z).g;
    const top = topOf(x, z);
    for (let y = gr + 1; y < top - 1; y += 2) {
      if ((x * 3 + y) % 4 === 0 && !(z === 0 && x === doorX)) {
        S(x, y, interiorZ, "glowstone");
      }
    }
  }
}

// Rooftop penthouse on the tallest part of the roof, if it fits.
// Columns beneath it are filled up to its floor so nothing floats.
if (topR + 2 <= H - 1) {
  for (let x = 4; x <= 10; x++) {
    for (let z = 1; z <= 3; z++) {
      for (let y = topOf(x, z); y < topR; y++) S(x, y, z, BRICK);
      const perim = x === 4 || x === 10 || z === 1 || z === 3;
      S(x, topR, z, perim ? BRICK : CAP);
      if (perim) S(x, topR + 1, z, BRICK);
      S(x, topR + 2, z, CAP);
    }
  }
  for (let x = 5; x <= 9; x++) S(x, topR + 1, 1, GLASS);
}

g.save(`${DIR}/${ID}.nbt`);
