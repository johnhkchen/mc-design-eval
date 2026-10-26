import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC64087.cells.json`, "utf8"));

const W = 58, H = 32, D = 28;
const g = new Voxels([W, H, D]);
const S = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// ---- footprint, ground, and roof with two smoothing passes ----
const raw = new Map();
for (const [x, z, gr, rf] of cells) raw.set(`${x},${z}`, { gr, rf });
const has = (x, z) => raw.has(`${x},${z}`);

let roofField = new Map();
for (const [k, c] of raw) roofField.set(k, c.rf);
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [k] of raw) {
    const [x, z] = k.split(",").map(Number);
    let sum = 0, n = 0;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const kk = `${x + dx},${z + dz}`;
      if (roofField.has(kk)) { sum += roofField.get(kk); n++; }
    }
    next.set(k, sum / n);
  }
  roofField = next;
}

// Quantise to 3-block storey tiers above each cell's own ground, clamp to a clean range
const cellsOut = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  let r = c.gr + 3 * Math.round((roofField.get(k) - c.gr) / 3);
  r = Math.max(c.gr + 6, Math.min(r, H - 5));
  cellsOut.set(k, { x, z, gr: c.gr, r });
}

const isPerim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const inwardOf = (x, z) => {
  if (!has(x, z + 1) && has(x, z - 1)) return [x, z - 1];
  if (!has(x, z - 1) && has(x, z + 1)) return [x, z + 1];
  if (!has(x + 1, z) && has(x - 1, z)) return [x - 1, z];
  if (!has(x - 1, z) && has(x + 1, z)) return [x + 1, z];
  return null;
};

// Street facade is z = 0; the entrance is centred on it at x 28..29.
const zMin = 0;
const doorXs = new Set([28, 29]);
const canopyX = (x) => x >= 25 && x <= 32;

// ---- main pass: foundation, walls, floors, roof ----
for (const { x, z, gr, r } of cellsOut.values()) {
  const perim = isPerim(x, z);
  const alongX = !has(x, z - 1) || !has(x, z + 1);

  // Foundation
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  if (perim) {
    for (let y = gr; y <= r - 2; y++) {
      const off = (y - gr) % 3;
      const k = Math.floor((y - gr) / 3);
      if (y === gr) { S(x, y, z, "stone_bricks"); continue; }           // base course
      if (off === 0) { S(x, y, z, "calcite"); continue; }               // string course
      // window band (off 1 and 2)
      const pilaster = ((x + z) % 4 === 0);
      if (pilaster) { S(x, y, z, "calcite"); continue; }
      if (k === 0 && z === zMin && doorXs.has(x)) {
        S(x, y, z, "dark_oak_door", {
          facing: "north",
          half: off === 1 ? "lower" : "upper",
          hinge: x === 28 ? "left" : "right",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (alongX) {
        S(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      } else {
        S(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      }
      // warm light just inside some windows
      if (k % 2 === 1 && (x + z) % 8 === 2) {
        const inw = inwardOf(x, z);
        if (inw && !isPerim(inw[0], inw[1])) S(inw[0], gr + 3 * k + 2, inw[1], "shroomlight");
      }
    }
  }

  // Interior floor slabs at storey lines
  for (let y = gr + 3; y <= r - 2; y += 3) {
    if (!perim) S(x, y, z, "smooth_stone");
  }

  // Roof slab and cornice at r-1, parapet at r on the perimeter
  S(x, r - 1, z, perim ? "calcite" : "smooth_stone");
  if (perim) S(x, r, z, "bricks");
}

// ---- entrance: canopy over the doors, lanterns hanging beneath it ----
for (const { x, z, gr, r } of cellsOut.values()) {
  if (z >= 1 && z <= 2 && canopyX(x) && has(x, z)) {
    // canopy slab across the entrance bay, on the storey line above the doors
    S(x, gr + 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
}
for (const { x, z, gr } of cellsOut.values()) {
  if (z === 1 && (x === 26 || x === 31) && has(x, z)) {
    S(x, gr + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// ---- rooftop: one cohesive plant block on the highest interior roof ----
let maxR = -Infinity;
for (const c of cellsOut.values()) if (!isPerim(c.x, c.z)) maxR = Math.max(maxR, c.r);
for (const { x, z, r } of cellsOut.values()) {
  if (isPerim(x, z) || r !== maxR) continue;
  // a sparse, deliberate set of 2x2 plant boxes on the top tier
  if (((x >> 2) + (z >> 2)) % 3 === 1 && (x % 4) < 2 && (z % 4) < 2) {
    S(x, r, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/DC64087.nbt`);
