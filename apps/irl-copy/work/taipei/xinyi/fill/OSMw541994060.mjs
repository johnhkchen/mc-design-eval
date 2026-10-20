import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof about 11 blocks above lowest ground.
// Read as a 2-storey, flat-roofed reinforced-concrete commercial block of the
// 1980s-90s Xinyi fabric: white concrete frame, glazed shopfront on the ground
// floor, tinted glass upper storey, stone base, quartz belt courses, a parapet,
// and a central roof plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541994060";
const W = 19, H = 23, D = 25;
const ROOF_SLAB = 10;   // top of upper storey / roof deck
const PARAPET = 11;     // top of parapet
const FRONT_X = 9;      // entrance aims at the middle of the front (z-min) face
const PLANT_CX = 9, PLANT_CZ = 12;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const minG = Math.min(...list.map(c => c[2]));

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of list) {
  ground.set(key(x, z), Math.min(10, Math.round(gr - minG)));
}
const has = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const faces = (x, z) => ({
  n: !has(x, z - 1), // z-min side, the street/front face
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});

// Entrance: front-face cell nearest the middle, preferring low ground so the
// door and its lintel fit inside the glazed storey.
let doorKey = null;
{
  const cands = list
    .map(([x, z]) => [x, z])
    .filter(([x, z]) => faces(x, z).n)
    .map(([x, z]) => {
      const g = ground.get(key(x, z));
      return { x, z, g, score: (g > 2 ? 100 : 0) + Math.abs(x - FRONT_X) };
    })
    .filter(c => c.g <= 2)
    .sort((a, b) => a.score - b.score);
  if (cands.length) doorKey = key(cands[0].x, cands[0].z);
}

const g = new Voxels([W, H, D]);

const GLASS_GROUND = "light_blue_stained_glass";
const GLASS_UPPER = "gray_stained_glass";
const FRAME = "white_concrete";
const BELT = "smooth_quartz";
const BASE = "stone_bricks";
const FOUND = "stone";
const FLOOR = "smooth_stone";
const ROOFDECK = "gray_concrete";
const PLANT = "light_gray_concrete";

for (const [x0, z0] of list.map(([x, z]) => [x, z])) {
  const gr = ground.get(key(x0, z0));
  const perim = isPerim(x0, z0);
  const f = faces(x0, z0);
  const corner = (f.n || f.s) && (f.w || f.e);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x0, y, z0, FOUND);

  for (let y = gr; y <= PARAPET; y++) {
    if (!perim) {
      // Interior: floor slabs, roof deck, roof plant box. Air otherwise.
      if (y === gr) g.set(x0, y, z0, FLOOR);
      else if (y === 5) g.set(x0, y, z0, FLOOR);
      else if (y === ROOF_SLAB) g.set(x0, y, z0, ROOFDECK);
      else if ((y === 11 || y === 12) &&
               Math.abs(x0 - PLANT_CX) <= 3 && Math.abs(z0 - PLANT_CZ) <= 4) {
        g.set(x0, y, z0, y === 12 ? "smooth_stone" : PLANT);
      }
      continue;
    }

    // Perimeter (facade) cells.
    if (y === gr) { g.set(x0, y, z0, BASE); continue; }          // base course
    if (y === 5 || y === ROOF_SLAB) { g.set(x0, y, z0, BELT); continue; } // storey lines / roof edge
    if (y === PARAPET) { g.set(x0, y, z0, FRAME); continue; }    // parapet

    const glassRow = (y >= 1 && y <= 3) || (y >= 6 && y <= 8);
    if (!glassRow) { g.set(x0, y, z0, FRAME); continue; }        // spandrels, lintels

    // Frame pillars: corners, and every third bay along each exterior face.
    const pillar = corner ||
      ((f.n || f.s) && x0 % 3 === 0) ||
      ((f.w || f.e) && z0 % 3 === 0);

    const isDoorCell = key(x0, z0) === doorKey && f.n;
    if (isDoorCell && (y === gr + 1 || y === gr + 2)) {
      g.set(x0, y, z0, "oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoorCell && y === gr + 3) { g.set(x0, y, z0, BELT); continue; } // door lintel

    if (pillar || isDoorCell) { g.set(x0, y, z0, FRAME); continue; }

    const ground_ = y <= 3;
    g.set(x0, y, z0, ground_ ? GLASS_GROUND : GLASS_UPPER);

    // Warm light behind some glass, in the interior cell just inside the window.
    if ((y === 2 || y === 7) && (x0 + z0) % 3 === 0) {
      let ix = x0, iz = z0;
      if (f.n) iz = z0 + 1;
      else if (f.s) iz = z0 - 1;
      else if (f.w) ix = x0 + 1;
      else if (f.e) ix = x0 - 1;
      if (has(ix, iz) && !isPerim(ix, iz) && ground.get(key(ix, iz)) <= y) {
        g.set(ix, y, iz, (x0 + z0) % 2 === 0 ? "glowstone" : "shroomlight");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
