import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name on record. Read as a 7-storey (35 block) mid-rise office/commercial
// block of the late-1980s to 1990s Taipei type: beige-quartz spandrels, light-grey
// concrete mullions, tinted blue glass, a plain roof with a small penthouse and a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610204";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 47, D = 28;
const ROOF = 35;           // roof level above lowest ground
const STOREY = 5;          // blocks per storey
const TOP_BODY = ROOF - 1; // highest wall block

const FOUND = "stone";
const SPAN = "smooth_quartz";
const PILLAR = "light_gray_concrete";
const LINE = "light_gray_concrete";
const FLOOR = "smooth_quartz";
const GLASS = "light_blue_stained_glass";
const GLOW = "glowstone";
const PARAPET = "smooth_quartz";
const MAST = "lightning_rod";

const g = new Voxels([W, H, D]);

// ---- footprint and grounds --------------------------------------------------
let minG = Infinity;
for (const c of cells) minG = Math.min(minG, Number(c[2]));

const grounds = new Map();
let xMax = -Infinity, zMax = -Infinity;
for (const c of cells) {
  const x = Number(c[0]), z = Number(c[1]);
  const gr = Math.min(TOP_BODY, Math.max(0, Math.round(Number(c[2]) - minG)));
  grounds.set(`${x},${z}`, gr);
  xMax = Math.max(xMax, x);
  zMax = Math.max(zMax, z);
}
const has = (x, z) => grounds.has(`${x},${z}`);
const gnd = (x, z) => grounds.get(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// ---- pass 1: foundations, walls, floors, roof ---------------------------------
for (const [key, gg] of grounds) {
  const [x, z] = key.split(",").map(Number);
  // foundation under the cell
  for (let y = 0; y < gg; y++) g.set(x, y, z, FOUND);

  const perim = isPerim(x, z);
  const onZFace = !has(x, z - 1) || !has(x, z + 1);
  const onXFace = !has(x - 1, z) || !has(x + 1, z);
  const isEntranceFace = z === zMax;

  for (let y = gg; y <= ROOF; y++) {
    if (y === ROOF) { g.set(x, y, z, LINE); continue; } // roof deck

    if (!perim) {
      // interior: slab at each storey line and at the first floor; air otherwise
      if (y === gg || y % STOREY === 0) g.set(x, y, z, FLOOR);
      continue;
    }

    const ly = y % STOREY;
    const ground = y < STOREY;

    // entrance on the front (z max) face, central bay, ground floor
    if (ground && isEntranceFace && x >= 6 && x <= 8 && y < 3) continue; // open doorway
    if (ground && isEntranceFace && (x === 5 || x === 9) && y < 4) {
      g.set(x, y, z, PILLAR);
      continue;
    }

    // mullion grid: columns on the z-facing walls, bays on the x-facing walls
    const xm = x % 3 === 0 || x === W - 1 || x === xMax;
    const zm = z % 3 === 0 || z === D - 1 || z === zMax;
    let mull;
    if (onZFace && onXFace) mull = true;
    else if (onZFace) mull = xm;
    else mull = zm;

    if (ly === 4) {
      g.set(x, y, z, LINE);                      // storey line / lintel
    } else if (ly === 0 && !ground) {
      g.set(x, y, z, mull ? PILLAR : SPAN);      // spandrel with mullion
    } else {
      if (mull) { g.set(x, y, z, PILLAR); continue; }
      g.set(x, y, z, GLASS);

      // warm light behind some windows, in the interior cell just inside
      if (ly === 2 && (x * 7 + z * 13 + Math.floor(y / STOREY) * 3) % 5 === 0) {
        let ix = x, iz = z;
        if (!has(x, z - 1)) iz = z + 1;
        else if (!has(x, z + 1)) iz = z - 1;
        else if (!has(x - 1, z)) ix = x + 1;
        else ix = x - 1;
        if (has(ix, iz) && !isPerim(ix, iz) && gnd(ix, iz) !== y) {
          g.set(ix, y, iz, GLOW);
        }
      }
    }
  }
}

// ---- pass 2: parapet on the roof edge -----------------------------------------
for (const [key] of grounds) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  g.set(x, ROOF + 1, z, PARAPET);
  g.set(x, ROOF + 2, z, PARAPET);
}

// ---- pass 3: roof penthouse and mast ------------------------------------------
const PH = { x0: 4, x1: 10, z0: 8, z1: 19 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!has(x, z)) continue;
    const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let y = ROOF + 1; y <= ROOF + 4; y++) {
      if (edge) g.set(x, y, z, LINE);
    }
    g.set(x, ROOF + 5, z, LINE); // penthouse roof slab
  }
}
if (has(7, 13)) {
  for (let y = ROOF + 6; y <= ROOF + 9; y++) g.set(7, y, 13, MAST);
}

g.save(`${DIR}/${ID}.nbt`);
