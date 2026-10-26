import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86660";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 1112 16th St NW: 1960s-70s commercial office, about 4 storeys of 4 blocks,
// pale limestone-style cladding, granite base, glazed bays, cornice and penthouse.
const W = 12, D = 11, H = 29;
const g = new Voxels([W, H, D]);

const WALL = "calcite";
const PIER = "smooth_stone";
const BASE = "polished_granite";
const CORNICE = "smooth_stone";
const FOUND = "stone";
const GLASS = "glass";
const LIT = "glowstone";
const PENT = "light_gray_concrete";
const STOREY = 4;

// Raw per-cell records
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(`${x},${z}`, { gr, roof: Math.round(roof) });
const has = (x, z) => raw.has(`${x},${z}`);

// Smooth the lidar roof: median of the 3x3 footprint neighbourhood removes single-cell spikes
// and stepped noise at the edges, leaving flat tiers.
const map = new Map();
for (const [key, { gr, roof }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = raw.get(`${x + dx},${z + dz}`);
    if (r) vals.push(r.roof);
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  const R = Math.max(gr + STOREY, Math.min(H - 4, med));
  map.set(key, { gr, R });
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outFaces = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isPerim = (x, z) => outFaces(x, z).length > 0;

// Pass 1: foundations and columns
for (const [key, { gr, R }] of map) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  const faces = outFaces(x, z);
  const perim = faces.length > 0;
  for (let y = gr; y < R; y++) {
    let b = WALL;
    if (y === gr) b = perim ? BASE : WALL;
    else if (y === R - 1) b = CORNICE;
    else if (perim) {
      if (faces.length >= 2) {
        b = PIER;
      } else {
        const [dx, dz] = faces[0];
        const t = dx !== 0 ? z : x;
        if (y % STOREY === 0) b = WALL;
        else if (t % 2 === 0) b = PIER;
        else {
          b = GLASS;
          if ((t * 3 + y) % 11 === 0) b = LIT;
        }
      }
    }
    g.set(x, y, z, b);
  }
}

// Pass 2: air gap behind the glazed bays (one interior cell in)
const gapCells = new Set();
for (const [key] of map) {
  const [x, z] = key.split(",").map(Number);
  const faces = outFaces(x, z);
  if (faces.length !== 1) continue;
  const [dx, dz] = faces[0];
  const ix = x - dx, iz = z - dz;
  if (map.has(`${ix},${iz}`) && !isPerim(ix, iz)) gapCells.add(`${ix},${iz}`);
}
for (const key of gapCells) {
  const [x, z] = key.split(",").map(Number);
  const { gr, R } = map.get(key);
  for (let y = gr + 1; y < R - 1; y++) {
    if (y % STOREY !== 0) g.set(x, y, z, "air");
  }
}

// Pass 3: street entrance on the north (z=0) face, centred
for (const [key, { gr }] of map) {
  const [x, z] = key.split(",").map(Number);
  if (z !== 0) continue;
  if (x >= 4 && x <= 7) g.set(x, gr + 3, z, BASE); // granite lintel over the entrance
  if (x === 5 || x === 6) {
    if (x === 5) {
      g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      g.set(x, gr + 1, z, GLASS);
      g.set(x, gr + 2, z, GLASS);
    }
  }
  // lanterns flanking the door, set into the piers
  if (x === 4 || x === 7) {
    g.set(x, gr + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 4: rooftop penthouse on the highest smoothed tier
const maxR = Math.max(...[...map.values()].map(v => v.R));
for (const [key, { R }] of map) {
  const [x, z] = key.split(",").map(Number);
  if (R !== maxR || isPerim(x, z)) continue;
  if (x < 3 || x > 8 || z < 3 || z > 7) continue;
  for (let y = R; y <= Math.min(R + 1, H - 1); y++) g.set(x, y, z, PENT);
}

g.save(`${DIR}/${ID}.nbt`);
