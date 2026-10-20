import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no OSM tags. Reading: a 2-storey Xinyi-district commercial block
// (late-1990s/2000s), white tiled concrete walls, granite plinth, quartz cornice,
// glazed shopfront with a central entrance, a 2nd-floor band of stained-glass
// windows, a flat roof with parapet and rooftop plant. Roof at 11 blocks above
// the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw662834859";
const W = 73, H = 23, D = 49;

const FLOOR2 = 5;   // slab / spandrel line of the upper storey
const CORNICE = 9;  // roof deck and cornice course
const PARAPET = 10; // top block of the parapet (roof top = 11)
const GF_TOP = 4;   // top block of the ground storey

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const gmap = new Map();
let minG = Infinity;
for (const [x, z, g] of list) {
  gmap.set(`${x},${z}`, g);
  if (g < minG) minG = g;
}
const base = minG;
const has = (x, z) => gmap.has(`${x},${z}`);
const G = (x, z) => gmap.get(`${x},${z}`) - base;

// Edge information: null for interior cells; otherwise the outward normal and
// the coordinate that runs along the facade.
function edgeInfo(x, z) {
  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  if (!(n || s || w || e)) return null;
  const corner = (n || s) && (w || e);
  let ox = 0, oz = 0;
  if (n) oz = -1; else if (s) oz = 1; else if (w) ox = -1; else ox = 1;
  const u = ox !== 0 ? z : x;
  return { ox, oz, u, corner };
}

// Main entrance: centre of the north-facing frontage.
const northXs = [];
for (const [x, z] of list.map(([x, z]) => [x, z])) {
  if (has(x, z) && !has(x, z - 1)) northXs.push(x);
}
northXs.sort((a, b) => a - b);
const entrCentre = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -999;

const g = new Voxels([W, H, D]);

// 1. Foundations and interior floor/roof slabs
for (const [x, z] of list.map(([x, z]) => [x, z])) {
  const gc = G(x, z);
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");
  if (FLOOR2 > gc) g.set(x, FLOOR2, z, "light_gray_concrete");
  if (CORNICE > gc) g.set(x, CORNICE, z, "light_gray_concrete");
}

// 2. Shell: facades on edge cells
for (const [x, z] of list.map(([x, z]) => [x, z])) {
  const info = edgeInfo(x, z);
  if (!info) continue;
  const gc = G(x, z);
  const { ox, oz, u, corner } = info;
  const isPier = corner || u % 3 === 0;
  const isEntr = oz === -1 && Math.abs(x - entrCentre) <= 1;

  for (let y = gc; y <= PARAPET; y++) {
    let mat;
    if (y === gc) {
      mat = "polished_granite";                       // plinth course
    } else if (y === CORNICE) {
      mat = "smooth_quartz";                          // cornice
    } else if (y === PARAPET) {
      mat = "white_concrete";                         // parapet
    } else if (y <= GF_TOP) {                         // ground storey
      if (isEntr && y <= 3) mat = "glass";            // entrance doors
      else if (isEntr && y === 4) mat = "smooth_quartz"; // entrance lintel
      else if (isPier) mat = "white_concrete";
      else if (y === GF_TOP) mat = "smooth_quartz";   // shopfront head band
      else mat = "light_blue_stained_glass";          // shopfront glazing
    } else {                                          // upper storey 5..8
      if (isPier) mat = "white_concrete";
      else if (y === FLOOR2 || y === 8) mat = "light_gray_concrete";
      else mat = "light_blue_stained_glass_pane";     // window band 6..7
    }
    g.set(x, y, z, mat);
  }

  // Warm light behind some glazing (inside the air gap)
  const ix = x - ox, iz = z - oz;
  if (has(ix, iz) && !edgeInfo(ix, iz)) {
    if (!isPier && !isEntr && u % 9 === 4) {
      g.set(ix, 6, iz, "glowstone");
    }
    if (!isPier && !isEntr && u % 5 === 2 && gc < 4) {
      g.set(ix, gc, iz, "lantern");
    }
  }
}

// 3. Entrance: lantern just inside the doors
for (const [x, z] of list.map(([x, z]) => [x, z])) {
  const info = edgeInfo(x, z);
  if (!info || info.oz !== -1 || x !== entrCentre) continue;
  const gc = G(x, z);
  const iz = z + 1;
  if (has(x, iz) && !edgeInfo(x, iz) && gc < 4) {
    g.set(x, gc, iz, "lantern");
  }
}

// 4. Roof plant on the interior deck
const boxes = [
  [14, 19, 14, 20],
  [50, 56, 28, 33],
  [30, 38, 36, 40],
];
for (const [x0, x1, z0, z1] of boxes) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z) || edgeInfo(x, z)) continue;
      const gc = G(x, z);
      if (CORNICE <= gc) continue;
      g.set(x, PARAPET, z, "gray_concrete");
      g.set(x, PARAPET + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
