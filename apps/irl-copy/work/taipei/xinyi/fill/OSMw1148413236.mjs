import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 唯一大樓: a low, two-storey commercial block of the 1980s-90s Xinyi fabric.
// White tiled/rendered concrete frame, tinted glass bays, quartz piers and
// storey bands, a stone plinth, a parapet cornice, a shopfront ground floor
// with a central entrance on each long side, and a flat roof with plant units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1148413236";
const W = 41, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  g.set(x, y, z, id);
};

// Footprint: key "x,z" -> ground y. b = lowest ground under the building.
const foot = new Map();
let b = Infinity;
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gg = Math.round(gr);
  foot.set(`${x},${z}`, gg);
  b = Math.min(b, gg);
}
if (!foot.size) throw new Error("empty footprint");

const has = (x, z) => foot.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exteriorDirs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isEdge = (x, z) => exteriorDirs(x, z).length > 0;

// Primary facade per edge cell: prefer long faces (dz != 0) at corners.
const primary = new Map();
const faceXs = new Map();
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const ex = exteriorDirs(x, z);
  const pick = ex.find(([, dz]) => dz !== 0) ?? ex[0];
  const [dx, dz] = pick;
  const u = dz !== 0 ? x : z;
  primary.set(k, { dx, dz, u });
  if (dz !== 0) {
    const dk = `${dx},${dz}`;
    if (!faceXs.has(dk)) faceXs.set(dk, []);
    faceXs.get(dk).push(x);
  }
}

// Central entrance (two cells wide) on each long face.
const entrance = new Set();
for (const [dk, xs] of faceXs) {
  const mid = Math.floor((Math.min(...xs) + Math.max(...xs)) / 2);
  entrance.add(`${dk}|${mid}`);
  entrance.add(`${dk}|${mid + 1}`);
}

// Facade block for a wall cell at face coordinate u and height y.
// Levels: g = ground of cell, b+5 = first floor band, b+10 = cornice,
// roof surface at b+11.
function facadeBlock(u, y, gg, isEnt) {
  if (y === gg) return "stone_bricks";                 // plinth
  if (y === b + 10) return "smooth_quartz";            // cornice / parapet cap
  if (y === b + 5) return "smooth_quartz";             // storey band
  if (y >= gg + 1 && y <= b + 4) {                     // ground storey shopfront
    if (y === b + 4) return "smooth_quartz";           // fascia / lintel
    if (isEnt && y <= gg + 2) return "black_stained_glass";
    if (u % 4 === 0) return "smooth_quartz";           // piers
    return "cyan_stained_glass";                       // shop glazing
  }
  if (y >= b + 6 && y <= b + 9) {                      // upper storey
    if (y === b + 9) return "light_gray_concrete";     // spandrel
    if (u % 4 === 0) return "smooth_quartz";           // piers
    return "gray_stained_glass";                       // tinted office glazing
  }
  return "smooth_quartz";
}

// Pass 1: foundations, floors, roof deck and facades.
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gg = foot.get(k);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: no rooms, just floor slabs per storey and the roof deck.
    put(x, gg, z, "smooth_stone");
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 10, z, "light_gray_concrete");
  } else {
    const pr = primary.get(k);
    const isEnt = entrance.has(`${pr.dx},${pr.dz}|${pr.u}`);
    for (let y = gg; y <= b + 10; y++) {
      put(x, y, z, facadeBlock(pr.u, y, gg, isEnt && y <= gg + 2));
    }
  }
}

// Pass 2: warm lights behind some windows, on the interior floor slab.
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const gg = foot.get(k);
  const pr = primary.get(k);
  const isEnt = entrance.has(`${pr.dx},${pr.dz}|${pr.u}`);
  const ix = x - pr.dx, iz = z - pr.dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const u = pr.u;
  // Ground storey window row
  if (!isEnt && u % 8 === 6) put(ix, gg + 1, iz, "glowstone");
  // Upper storey window row
  if (u % 8 === 2) put(ix, b + 6, iz, "glowstone");
}

// Pass 3: roof plant units on the interior roof deck.
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (x % 9 === 4 && z % 6 === 3) put(x, b + 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
