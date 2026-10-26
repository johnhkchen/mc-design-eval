import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC53965 - 1776 I St NW, Washington DC 20006
// Commercial-Office-Large: a 1970s-80s Modern office block with precast
// buff piers, bronze-blue glazing, a granite base, a stone cornice and a
// central mechanical penthouse. One common roof level, floor lines on a
// common datum so the tiers stay clean across the footprint.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC53965";
const W = 19, H = 30, D = 26;
const STOREY = 3;
const MAX_TOP = 26;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, gr, rf] of raw) {
  cells.set(`${x},${z}`, { x, z, g: Math.round(gr), r: Math.round(rf) });
}
const has = (x, z) => cells.has(`${x},${z}`);
const all = [...cells.values()];

// Common datum and a single roof tier from the median lidar roof
const base = Math.min(...all.map(c => c.g));
const roofs = all.map(c => c.r).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const N = Math.max(2, Math.min(8, Math.round((medRoof - base) / STOREY)));
const TOP = Math.min(MAX_TOP, base + STOREY * N);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const PIER = "smooth_sandstone";
const BASE = "polished_granite";
const GLASS = "light_blue_stained_glass";
const CORE = "light_gray_concrete";
const FOUND = "stone_bricks";
const LIGHT = "glowstone";
const CAP = "stone_brick_slab";

const inPenthouse = (x, z) => x >= 6 && x <= 12 && z >= 8 && z <= 17;

for (const c of all) {
  const { x, z } = c;
  const gr = c.g;

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const exN = !has(x, z - 1); // street face (north, -z)
  const exS = !has(x, z + 1);
  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const exposed = exN || exS || exW || exE;

  for (let y = gr; y < TOP; y++) {
    const rel = y - base;
    const k = Math.floor(rel / STOREY);
    const off = rel % STOREY;

    if (!exposed) {
      put(x, y, z, CORE);
      continue;
    }

    // Entrance: centre bay of the street face, ground storey
    if (exN && x === Math.floor(W / 2) && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    let b;
    if (y === gr && k === 0) {
      b = BASE; // granite base course
    } else if (off === 0) {
      b = PIER; // storey line / spandrel
    } else if ((x + z) % 3 === 0) {
      b = PIER; // mullion column
    } else if ((x * 5 + y * 3) % 23 === 0 && k >= 1) {
      b = LIGHT; // sparse warm glow behind glass
    } else {
      b = GLASS;
    }
    put(x, y, z, b);
  }

  // Parapet cornice on the roof edge; roof deck is the core below TOP
  if (exposed && !inPenthouse(x, z)) {
    put(x, TOP, z, PIER);
    put(x, TOP + 1, z, CAP);
  }

  // Central mechanical penthouse: solid base, glass band, stone cap
  if (inPenthouse(x, z)) {
    put(x, TOP, z, CORE);
    put(x, TOP + 1, z, GLASS);
    put(x, TOP + 2, z, PIER);
  }
}

g.save(`${DIR}/${ID}.nbt`);
