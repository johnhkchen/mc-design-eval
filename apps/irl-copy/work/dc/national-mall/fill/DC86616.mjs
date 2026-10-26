import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86616.cells.json`, "utf8"));

const W = 23, D = 17, H = 32;
const g = new Voxels([W, H, D]);

// Washington office block, c. 1970s-80s: stone-clad base, pale quartz piers,
// tinted glass bays, stone cornice and a set-back penthouse.
const FOUND = "stone_bricks";
const BAND = "smooth_stone";
const PIER = "stone_bricks";
const WALL = "smooth_quartz";
const SPANDREL = "polished_andesite";
const GLASS = "light_blue_stained_glass";
const CORNICE = "stone_bricks";
const ROOF = "light_gray_concrete";
const PARAPET = "stone_bricks";
const PH_WALL = "smooth_quartz";
const PH_CAP = "stone_bricks";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, rf] of cells) raw.set(key(x, z), { gr, rf });
const has = (x, z) => raw.has(key(x, z));
const isPerim = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Smooth the lidar roof over each cell's 3x3 neighbourhood, then quantise to
// whole 4-block storeys. This removes spikes and gives flat tiers.
const info = new Map();
for (const [x, z, gr0] of cells) {
  const gr = clamp(Math.round(gr0), 0, 12);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz));
    if (c) { sum += c.rf; n++; }
  }
  const smooth = sum / n;
  const rf = clamp(Math.round(smooth / 4) * 4, gr + 4, 28);
  info.set(key(x, z), { gr, rf });
}

// Penthouse footprint: central cells that are interior, set back from the edge.
const ph = (x, z) => x >= 7 && x <= 15 && z >= 5 && z <= 11 && has(x, z) && !isPerim(x, z);
const phPerim = (x, z) => ph(x, z) && (!ph(x, z - 1) || !ph(x, z + 1) || !ph(x - 1, z) || !ph(x + 1, z));

// Base build: foundation, storeys, facade, cornice, roof.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { gr, rf } = info.get(key(x, z));
  const perim = isPerim(x, z);

  const faces = [];
  if (!has(x, z - 1)) faces.push({ i: x, dx: 0, dz: 1, pil: !has(x - 1, z) || !has(x + 1, z) });
  if (!has(x, z + 1)) faces.push({ i: x, dx: 0, dz: -1, pil: !has(x - 1, z) || !has(x + 1, z) });
  if (!has(x - 1, z)) faces.push({ i: z, dx: 1, dz: 0, pil: !has(x, z - 1) || !has(x, z + 1) });
  if (!has(x + 1, z)) faces.push({ i: z, dx: -1, dz: 0, pil: !has(x, z - 1) || !has(x, z + 1) });

  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let y = gr; y < rf; y++) {
    const rel = y - gr;
    const s = Math.floor(rel / 4);

    if (rel % 4 === 0) { g.set(x, y, z, BAND); continue; }
    if (!perim) continue;

    if (y === rf - 1) { g.set(x, y, z, CORNICE); continue; }

    let mat = WALL;
    let windowFace = null;
    if (faces.some(f => f.pil)) {
      mat = PIER;
    } else if (faces.length) {
      const f = faces[0];
      if (rel % 4 === 3) {
        mat = SPANDREL;
      } else if (f.i % 3 !== 0) {
        mat = GLASS;
        windowFace = f;
      } else {
        mat = PIER;
      }
    }

    // Warm light behind some bays, only where an interior cell exists.
    if (windowFace && (windowFace.i + s) % 4 === 1 && (rel % 4 === 1 || rel % 4 === 2)) {
      const ix = x + windowFace.dx, iz = z + windowFace.dz;
      if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, y, iz, "shroomlight");
    }

    g.set(x, y, z, mat);
  }

  // Roof: parapet ring on the edge, roof deck inside.
  g.set(x, rf, z, perim ? PARAPET : ROOF);
}

// Penthouse: two storeys of quartz walls with a glass band, stone cap.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!ph(x, z)) continue;
  const { rf } = info.get(key(x, z));
  if (rf + 4 > H - 1) continue;
  const edge = phPerim(x, z);
  for (let k = 1; k <= 3; k++) {
    const y = rf + k;
    if (k === 3) { g.set(x, y, z, PH_CAP); continue; }
    if (!edge) { g.set(x, y, z, "air"); continue; }
    const glassBand = (x + z) % 2 === 0 && k === 1;
    g.set(x, y, z, glassBand ? GLASS : PH_WALL);
  }
}

// Street-side entrance: centre bay of the northern (lowest-z) edge, with a
// proper door block and flanking piers.
const northCells = cells.filter(([x, z]) => !has(x, z - 1));
if (northCells.length) {
  const minZ = Math.min(...northCells.map(c => c[1]));
  const row = northCells.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
  const dx = row[Math.floor(row.length / 2)];
  const dz = minZ;
  const { gr } = info.get(key(dx, dz));
  const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(dx, gr + 1, dz, "dark_oak_door", { ...doorProps, half: "lower" });
  g.set(dx, gr + 2, dz, "dark_oak_door", { ...doorProps, half: "upper" });
  // Flanking piers and a lintel course above the opening.
  for (const ox of [-1, 1]) {
    if (has(dx + ox, dz)) {
      g.set(dx + ox, gr + 1, dz, PIER);
      g.set(dx + ox, gr + 2, dz, PIER);
    }
  }
  g.set(dx, gr + 3, dz, CORNICE);
}

g.save(`${DIR}/DC86616.nbt`);
