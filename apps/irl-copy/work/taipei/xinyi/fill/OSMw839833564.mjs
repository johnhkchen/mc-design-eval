import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1970s-80s Taipei commercial block: two storeys over a stone base,
// pale quartz walls with grey concrete storey bands, glazed shopfront, parapet,
// and a rooftop plant box. Roof sits 11 blocks above the lowest ground.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833564";
const W = 18, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const G = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => G.has(`${x},${z}`);
const gr = (x, z) => G.get(`${x},${z}`);

const exN = (x, z) => !has(x, z - 1);
const exS = (x, z) => !has(x, z + 1);
const exW = (x, z) => !has(x - 1, z);
const exE = (x, z) => !has(x + 1, z);
const isEdge = (x, z) => exN(x, z) || exS(x, z) || exW(x, z) || exE(x, z);

// Absolute storey lines anchored on the lowest ground.
const base = minG + 1;       // top of base course / ground floor slab
const lintel = minG + 5;     // ground floor head band
const storey = minG + 6;     // first floor slab line
const cornice = minG + 10;   // cornice course
const T = Math.min(H - 4, minG + 11); // roof deck / parapet cap

// Entrance: front (south-facing) edge cell nearest the footprint centre.
const cellsArr = cells.map(([x, z]) => [x, z]);
const meanX = cellsArr.reduce((s, [x]) => s + x, 0) / cellsArr.length;
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of cellsArr) {
    if (!exS(x, z)) continue;
    const d = Math.abs(x - meanX);
    if (d < best) { best = d; entrance = `${x},${z}`; }
  }
  if (!entrance) {
    for (const [x, z] of cellsArr) {
      if (!isEdge(x, z)) continue;
      const d = Math.abs(x - meanX);
      if (d < best) { best = d; entrance = `${x},${z}`; }
    }
  }
}

for (const [x, z, gg] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gg; y++) g.set(x, y, z, "stone");

  if (gg >= T) continue;

  const edge = isEdge(x, z);

  // Interior floor slabs and roof deck (all footprint cells).
  if (base > gg) g.set(x, base, z, "light_gray_concrete");
  if (storey > gg) g.set(x, storey, z, "light_gray_concrete");
  g.set(x, T, z, "smooth_stone");

  if (!edge) continue;

  const corner = (exN(x, z) || exS(x, z)) && (exE(x, z) || exW(x, z));
  const bay = (exN(x, z) || exS(x, z)) ? x : z;
  const pier = corner || bay % 3 === 0;
  const isEntrance = `${x},${z}` === entrance;

  for (let y = gg + 1; y <= T; y++) {
    if (y === T) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y === cornice) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y > cornice) { g.set(x, y, z, "smooth_quartz"); continue; }

    if (y === base) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y < base) continue;

    if (y === lintel || y === storey) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (y > base && y < lintel) {
      // Ground-floor shopfront.
      if (isEntrance && y <= base + 2) {
        const half = y === base + 1 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (pier) {
        g.set(x, y, z, "smooth_quartz");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane");
      }
      continue;
    }

    if (y > storey && y < cornice) {
      // Upper-floor windows, a few lit warmly.
      if (pier) {
        g.set(x, y, z, "smooth_quartz");
      } else {
        const lit = y === storey + 2 && bay % 4 === 1;
        g.set(x, y, z, lit ? "glowstone" : "gray_stained_glass_pane");
      }
      continue;
    }
  }
}

// Rooftop plant box near the footprint centroid.
{
  const cz = cellsArr.reduce((s, [, z]) => s + z, 0) / cellsArr.length;
  let cx0 = Math.round(meanX), cz0 = Math.round(cz);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const x = cx0 + dx, z = cz0 + dz;
      if (!has(x, z) || isEdge(x, z)) continue;
      if (T + 2 >= H) continue;
      g.set(x, T + 1, z, "light_gray_concrete");
      g.set(x, T + 2, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
