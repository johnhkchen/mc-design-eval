// 三連大樓 — Sanlian-style 1980s-90s Taipei office/residential slab block.
// Roof ~69 blocks above lowest ground ≈ 14 storeys at ~5 blocks each.
// Pale quartz spandrels and white concrete mullions, tinted blue glass bands,
// corner pilasters running the full height for a vertical read, a plinth,
// a shopfront ground storey, two entrances with canopies, and a sparse rooftop plant line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw295048179";
const W = 51, H = 81, D = 81;
const ROOF_TOP = 68;     // top solid layer; roof surface at y = 69
const FLOOR = 5;         // blocks per storey

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), Math.round(gr));

const exposed = (x, z, dx, dz) => !fp.has(key(x + dx, z + dz));
const isExt = (x, z) =>
  fp.has(key(x, z)) &&
  (exposed(x, z, 0, -1) || exposed(x, z, 0, 1) || exposed(x, z, -1, 0) || exposed(x, z, 1, 0));

// deterministic pseudo-random for sparse lit windows and rooftop plant
const hash = (x, y, z) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ Math.imul(y, 2246822519);
  h ^= h >>> 13;
  h = Math.imul(h, 1274126177);
  return (h >>> 0);
};

// centroid of footprint in x, used to centre the entrances
let cx = 0;
{
  let s = 0, n = 0;
  for (const k of fp.keys()) { s += Number(k.split(",")[0]); n++; }
  cx = s / n;
}

// one entrance on the north face and one on the south face, nearest the centre line
const entrances = new Map();
{
  let bestN = null, bestS = null;
  for (const k of fp.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!isExt(x, z)) continue;
    const dxC = Math.abs(x - cx);
    if (exposed(x, z, 0, -1)) {
      if (!bestN || dxC < bestN.d || (dxC === bestN.d && z < bestN.z)) bestN = { x, z, d: dxC };
    }
    if (exposed(x, z, 0, 1)) {
      if (!bestS || dxC < bestS.d || (dxC === bestS.d && z > bestS.z)) bestS = { x, z, d: dxC };
    }
  }
  if (bestN) entrances.set(key(bestN.x, bestN.z), "north");
  if (bestS) entrances.set(key(bestS.x, bestS.z), "south");
}
// entrance canopy: the entrance cell and its two neighbours along the same face
const canopyCells = new Set();
for (const [k, facing] of entrances) {
  const [x, z] = k.split(",").map(Number);
  for (const dx of [-1, 0, 1]) canopyCells.add(key(x + dx, z));
}

// mullion grid on the faces; corners are full-height pilasters
const faceFlags = (x, z) => {
  const nS = exposed(x, z, 0, -1) || exposed(x, z, 0, 1);
  const eW = exposed(x, z, -1, 0) || exposed(x, z, 1, 0);
  return { nS, eW };
};
const isCorner = (x, z) => { const f = faceFlags(x, z); return f.nS && f.eW; };
const isMullion = (x, z) => {
  const { nS, eW } = faceFlags(x, z);
  return (nS && x % 3 === 0) || (!nS && eW && z % 3 === 0);
};

// exterior facade block name at (x, y, z)
const facadeName = (x, z, y) => {
  const gr = fp.get(key(x, z));
  if (y === gr) return "polished_andesite";                 // plinth course
  if (y >= ROOF_TOP) return "smooth_quartz";                // parapet cap
  if (y >= ROOF_TOP - 2) return "white_concrete";           // parapet
  if (isCorner(x, z)) return "white_concrete";              // full-height corner pilasters
  if (y % FLOOR === 0) return "smooth_quartz";              // storey lines (spandrels)
  if (y < FLOOR) return isMullion(x, z) ? "white_concrete" : "light_blue_stained_glass"; // shopfront
  if (isMullion(x, z)) return "white_concrete";
  if (hash(x, y, z) % 31 === 0) return "glowstone";         // sparse warm lit offices
  return "light_blue_stained_glass_pane";
};

const paneProps = (x, z, y) => {
  const conn = (dx, dz) => {
    const nx = x + dx, nz = z + dz;
    return fp.has(key(nx, nz)) && isExt(nx, nz) && facadeName(nx, nz, y) !== null;
  };
  return {
    north: String(conn(0, -1)), south: String(conn(0, 1)),
    east: String(conn(1, 0)), west: String(conn(-1, 0)),
    waterlogged: "false",
  };
};

const interiorName = (gr, y) => (y === gr || y % FLOOR === 0 || y === ROOF_TOP ? "light_gray_concrete" : null);

// --- build ---
const interiorCells = [];
for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);
  const ext = isExt(x, z);

  // foundation up to the cell's ground
  for (let y = 0; y < gr; y++) vox.set(x, y, z, "stone_bricks");

  if (!ext) {
    interiorCells.push([x, z, gr]);
    for (let y = gr; y <= ROOF_TOP; y++) {
      const n = interiorName(gr, y);
      if (n) vox.set(x, y, z, n);
    }
    continue;
  }

  const ent = entrances.get(k);
  for (let y = gr; y <= ROOF_TOP; y++) {
    // entrance: double door, canopy slab above it
    if (ent && (y === gr + 1 || y === gr + 2)) {
      vox.set(x, y, z, "oak_door", {
        facing: ent, half: y === gr + 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (y === gr + 3 && canopyCells.has(k) && gr + 3 < FLOOR) {
      vox.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    const name = facadeName(x, z, y);
    if (!name) continue;
    if (name === "light_blue_stained_glass_pane") {
      vox.set(x, y, z, name, paneProps(x, z, y));
    } else {
      vox.set(x, y, z, name);
    }
  }
}

// rooftop plant (sparse, two-high boxes) and a single antenna at the centroid
if (interiorCells.length) {
  let sx = 0, sz = 0;
  for (const [x, z] of interiorCells) { sx += x; sz += z; }
  sx /= interiorCells.length; sz /= interiorCells.length;
  let centre = interiorCells[0], best = Infinity;
  for (const c of interiorCells) {
    const d = (c[0] - sx) ** 2 + (c[1] - sz) ** 2;
    if (d < best) { best = d; centre = c; }
  }
  for (const [x, z] of interiorCells) {
    if (x === centre[0] && z === centre[1]) continue;
    if (hash(x, 0, z) % 41 === 0) {
      vox.set(x, ROOF_TOP + 1, z, "light_gray_concrete");
      vox.set(x, ROOF_TOP + 2, z, "gray_concrete");
    }
  }
  for (let y = ROOF_TOP + 1; y <= ROOF_TOP + 6; y++) {
    vox.set(centre[0], y, centre[1], "iron_bars");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
