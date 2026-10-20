import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 醫學模擬教育大樓: a three-storey, flat-roofed reinforced-concrete school block
// of the 1970s-80s Taipei institutional type. Light tiled-concrete facade, grid of
// aluminium-framed windows, stone plinth and a smooth cornice, and a rooftop plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw556179245";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 29, H = 28, D = 50;
const g = new Voxels([W, H, D]);

const ROOF = 16;                       // top of parapet, from lidar (~16 above lowest ground)
const FOUND = "stone_bricks";          // foundation below each cell's ground
const INNER = "light_gray_concrete";   // solid structure behind the facade
const PIER = "white_concrete";         // facade piers
const SPAND = "light_gray_concrete";   // spandrels under windows
const LINE = "smooth_quartz";          // storey lines
const BASE = "polished_andesite";      // base course at each cell's ground
const CORNICE = "smooth_stone";        // roof cornice
const PARAPET = "white_concrete";
const PANE = "light_blue_stained_glass_pane";
const WIN_BANDS = [1, 2, 3, 6, 7, 8, 11, 12, 13];
const SPANDREL_Y = [4, 9, 14];
const LINE_Y = [5, 10];

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

let sx = 0, n = 0, xMin = 99, xMax = -1, zMin = 99, zMax = -1;
for (const [x, z] of cells) {
  sx += x; n++;
  xMin = Math.min(xMin, x); xMax = Math.max(xMax, x);
  zMin = Math.min(zMin, z); zMax = Math.max(zMax, z);
}
const cx = sx / n;

// Exposed faces per cell: a face is exposed when the neighbour is not in the footprint.
const faceMap = new Map();
for (const [x, z] of cells) {
  const ex = dirs.filter(([dx, dz]) => !has(x + dx, z + dz));
  faceMap.set(`${x},${z}`, ex);
}
const perimeter = new Set([...faceMap].filter(([, f]) => f.length).map(([k]) => k));

// Entrance: a three-bay opening on the south (+z) face near the centre.
const entrance = new Set();
for (const [k, faces] of faceMap) {
  const [x] = k.split(",").map(Number);
  if (faces.some(([dx, dz]) => dx === 0 && dz === 1) && Math.abs(x - cx) <= 1) entrance.add(k);
}

// 1. Foundations and solid structure behind the facade.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  for (let y = gr; y <= 15; y++) g.set(x, y, z, INNER);
}

// 2. Facade on perimeter cells, from each cell's ground up to the parapet.
const windowCells = [];
for (const [x, z, gr] of cells) {
  const k = `${x},${z}`;
  const faces = faceMap.get(k);
  if (!faces.length) continue;
  const [dx, dz] = faces[0];
  const along = dz !== 0 ? x : z;
  const isEnt = entrance.has(k);
  const pier = faces.length > 1 || along % 4 === 0;
  const paneProps = dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) { g.set(x, y, z, BASE); continue; }
    if (y === ROOF) { g.set(x, y, z, PARAPET); continue; }
    if (y === 15) { g.set(x, y, z, CORNICE); continue; }
    if (LINE_Y.includes(y)) { g.set(x, y, z, LINE); continue; }
    if (isEnt) {
      if (y >= 1 && y <= 3) g.set(x, y, z, "glass");
      else if (y === 4) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, PIER);
      continue;
    }
    if (SPANDREL_Y.includes(y)) { g.set(x, y, z, pier ? PIER : SPAND); continue; }
    if (WIN_BANDS.includes(y)) {
      if (pier) g.set(x, y, z, PIER);
      else g.set(x, y, z, PANE, paneProps);
      continue;
    }
    g.set(x, y, z, PIER);
  }
  if (!isEnt && !pier) windowCells.push({ x, z, dx, dz, along, gr });
  if (isEnt) windowCells.push({ x, z, dx, dz, along, gr, ent: true });
}

// 3. Air gap behind each window (and entrance), and warm lights behind some glass.
for (const w of windowCells) {
  const ix = w.x - w.dx, iz = w.z - w.dz;
  if (!has(ix, iz) || perimeter.has(`${ix},${iz}`)) continue;
  const bands = w.ent ? [1, 2, 3] : WIN_BANDS;
  for (const y of bands) g.set(ix, y, iz, "air");
  if (w.ent) {
    g.set(ix, 2, iz, "glowstone");
  } else if (w.along % 8 === 2) {
    // Storeys 2 and 3: lit classrooms and labs.
    g.set(ix, 7, iz, "glowstone");
    g.set(ix, 12, iz, "glowstone");
  }
}

// 4. Rooftop plant enclosure (interior cells only, resting on the solid roof deck).
for (const [x, z] of cells) {
  if (perimeter.has(`${x},${z}`)) continue;
  if (x < cx - 5 || x > cx + 5) continue;
  if (z < zMin + 6 || z > zMin + 14) continue;
  g.set(x, 16, z, INNER);
  g.set(x, 17, z, LINE);
}

g.save(`${DIR}/${ID}.nbt`);
