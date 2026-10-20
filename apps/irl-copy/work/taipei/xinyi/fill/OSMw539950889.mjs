import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950889";
const W = 13, D = 9, H = 23;
const ROOF = 11;          // parapet top, absolute y above lowest ground
const FLOOR_LINES = [5, 10]; // storey lines (2 storeys of 5 blocks)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

// Materials: mid-1980s/90s Taipei commercial-office low-rise. Cream/white concrete
// body, grey spandrel bands, stone base, glass shopfront, red awning.
const BODY = "white_concrete";
const BAND = "light_gray_concrete";
const BASE = "stone_bricks";
const FOUND = "smooth_stone";
const GLASS = "glass";
const AWN = "red_concrete";
const WARM = "glowstone";

const g = new Voxels([W, H, D]);

// Pass 1: foundations and per-cell geometry
for (const [x, z, gr] of cells) {
  const gl = gr - minG;
  const outN = !has(x, z - 1), outS = !has(x, z + 1);
  const outW = !has(x - 1, z), outE = !has(x + 1, z);
  const ext = outN || outS || outW || outE;

  // foundation fill from y0 up to this cell's ground
  for (let y = 0; y < gl; y++) g.set(x, y, z, FOUND);

  if (!ext) {
    // interior: floor slabs only, air between (no interiors modelled)
    for (const fy of [gl, ...FLOOR_LINES]) {
      if (fy >= gl && fy <= 10) g.set(x, fy, z, FOUND);
    }
    continue;
  }

  const corner = (outN || outS) && (outE || outW);
  const front = outS;
  const idx = (outN || outS) ? x : z;
  const pier = corner || idx % 2 === 0;

  for (let y = gl; y <= ROOF; y++) {
    if (y === ROOF) { g.set(x, y, z, BAND); continue; }           // parapet
    if (y === gl) { g.set(x, y, z, BASE); continue; }             // base course
    if (FLOOR_LINES.includes(y)) { g.set(x, y, z, BAND); continue; } // spandrels
    if (y === 4 && front) { g.set(x, y, z, AWN); continue; }      // shopfront awning
    if (front && x === 6 && (y === 1 || y === 2)) continue;       // entrance opening (air)
    if (front && x === 6 && y === 3) { g.set(x, y, z, GLASS); continue; } // transom
    g.set(x, y, z, pier ? BODY : GLASS);
  }

  // warm light behind a subset of glass at the upper floor
  if (!corner && !pier && idx % 4 === 1) {
    let ix = x, iz = z;
    if (outS) iz = z - 1; else if (outN) iz = z + 1;
    else if (outW) ix = x + 1; else if (outE) ix = x - 1;
    const inside = has(ix, iz) && !(!has(ix, iz - 1) || !has(ix, iz + 1) || !has(ix - 1, iz) || !has(ix + 1, iz));
    if (inside) g.set(ix, 7, iz, WARM);
  }
}

// Roof-level equipment on interior cells
const roofFree = (x, z) => {
  if (!has(x, z)) return false;
  const edge = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  return !edge;
};

// Two rooftop AC units (2 blocks high)
for (const [x, z] of [[2, 2], [3, 2], [2, 3], [3, 3], [5, 5], [6, 5]]) {
  if (roofFree(x, z)) {
    g.set(x, 11, z, BAND);
    g.set(x, 12, z, "iron_block");
  }
}

// Small stair/lift penthouse, 3x3 shell
for (let x = 8; x <= 10; x++) {
  for (let z = 3; z <= 5; z++) {
    if (!roofFree(x, z)) continue;
    const ring = x === 8 || x === 10 || z === 3 || z === 5;
    if (ring) for (let y = 11; y <= 13; y++) g.set(x, y, z, BODY);
    g.set(x, 14, z, BAND);
    if (!ring) g.set(x, 11, z, FOUND); // floor of penthouse
  }
}

g.save(`${DIR}/${ID}.nbt`);
