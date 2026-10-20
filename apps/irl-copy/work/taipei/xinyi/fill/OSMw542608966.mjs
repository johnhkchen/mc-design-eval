import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608966";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Materials: a 1980s-90s Xinyi low-rise commercial block. White concrete frame,
// tinted glass in aluminium-look piers, light grey spandrels, stone base and cornice.
const BASE = "polished_andesite";
const PLINTH = "stone_bricks";
const WALL = "white_concrete";
const PIER = "smooth_quartz";
const SPANDREL = "light_gray_concrete";
const FLOOR = "smooth_stone";
const CORNICE = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const CANOPY = "stone_brick_slab";

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inF = (x, z) => ground.has(key(x, z));

// Floor datum: highest ground under the footprint, so every storey sits level.
const F = Math.max(...cells.map(c => c[2]));

const DIRS = [
  { dx: 1, dz: 0, n: "east" },
  { dx: -1, dz: 0, n: "west" },
  { dx: 0, dz: 1, n: "south" },
  { dx: 0, dz: -1, n: "north" },
];
const exposures = (x, z) => DIRS.filter(d => !inF(x + d.dx, z + d.dz));
const perim = new Set();
for (const [x, z] of cells) if (exposures(x, z).length) perim.add(key(x, z));
const isPerim = (x, z) => perim.has(key(x, z));

// Index ranges along each exposed face, for piers and the entrance position.
const range = {};
for (const [x, z] of cells) {
  for (const d of exposures(x, z)) {
    const i = d.dz !== 0 ? x : z;
    const r = (range[d.n] ??= { min: Infinity, max: -Infinity });
    r.min = Math.min(r.min, i);
    r.max = Math.max(r.max, i);
  }
}
const faceLen = n => range[n].max - range[n].min + 1;
const front = range.north ? "north" : range.south ? "south" : range.west ? "west" : "east";
const frontDir = DIRS.find(d => d.n === front);
const doorIdx = Math.floor((faceLen(front) - 1) / 2);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const TRUEF = b => (b ? "true" : "false");

// Pass 1: foundations, interior slabs, and the shell of every footprint cell.
for (const [x, z] of cells) {
  // Foundation: solid from y 0 up to the datum (covers each cell's own ground).
  for (let y = 0; y < F; y++) put(x, y, z, PLINTH);

  const ex = exposures(x, z);
  if (!ex.length) {
    // Interior cell: floor slabs and roof deck only; air between.
    put(x, F, z, FLOOR);
    put(x, F + 5, z, FLOOR);
    put(x, F + 11, z, FLOOR);
    continue;
  }

  const d = ex[0];
  const idx = (d.dz !== 0 ? x : z) - range[d.n].min;
  const L = faceLen(d.n);
  const corner = ex.length > 1;
  const isDoorCell = !corner && d.n === front && idx === doorIdx;

  for (let y = F; y <= F + 11; y++) {
    const rel = y - F;
    if (rel === 0) {
      put(x, y, z, BASE);
    } else if (rel >= 1 && rel <= 3) {
      // Ground storey window band.
      if (isDoorCell && rel <= 2) {
        const props = {
          facing: d.n,
          hinge: "left",
          open: "false",
          powered: "false",
          half: rel === 1 ? "lower" : "upper",
        };
        put(x, y, z, "oak_door", props);
      } else if (isDoorCell && rel === 3) {
        put(x, y, z, CANOPY, { type: "bottom", waterlogged: "false" });
      } else if (corner || idx % 3 === 0 || idx === 0 || idx === L - 1) {
        put(x, y, z, PIER);
      } else {
        put(x, y, z, GLASS, {
          north: TRUEF(isPerim(x, z - 1)),
          south: TRUEF(isPerim(x, z + 1)),
          east: TRUEF(isPerim(x + 1, z)),
          west: TRUEF(isPerim(x - 1, z)),
          waterlogged: "false",
        });
      }
    } else if (rel === 4 || rel === 6 || rel === 10) {
      put(x, y, z, SPANDREL);
    } else if (rel === 5) {
      put(x, y, z, FLOOR);
    } else if (rel >= 7 && rel <= 9) {
      // Upper storey window band.
      if (corner || idx % 3 === 0 || idx === 0 || idx === L - 1) {
        put(x, y, z, PIER);
      } else {
        put(x, y, z, GLASS, {
          north: TRUEF(isPerim(x, z - 1)),
          south: TRUEF(isPerim(x, z + 1)),
          east: TRUEF(isPerim(x + 1, z)),
          west: TRUEF(isPerim(x - 1, z)),
          waterlogged: "false",
        });
      }
    } else if (rel === 11) {
      put(x, y, z, CORNICE);
    }
  }

  // Parapet on top of the cornice.
  put(x, F + 12, z, "stone_brick_wall", {
    north: isPerim(x, z - 1) ? "low" : "none",
    south: isPerim(x, z + 1) ? "low" : "none",
    east: isPerim(x + 1, z) ? "low" : "none",
    west: isPerim(x - 1, z) ? "low" : "none",
    up: "true",
    waterlogged: "false",
  });
}

// Roof plant: a small equipment box near the centre of the roof.
for (let x = 4; x <= 5; x++)
  for (let z = 9; z <= 10; z++)
    if (inF(x, z) && !isPerim(x, z)) {
      put(x, F + 12, z, SPANDREL);
      put(x, F + 13, z, SPANDREL);
    }

// Pass 2: warm lights just inside some windows, read from the street at dusk.
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const ex = exposures(x, z);
  if (ex.length !== 1) continue;
  const d = ex[0];
  const idx = (d.dz !== 0 ? x : z) - range[d.n].min;
  if (d.n === front && idx === doorIdx) continue;
  const ix = x - d.dx, iz = z - d.dz;
  if (!inF(ix, iz) || isPerim(ix, iz)) continue;
  if (idx % 6 === 2) {
    put(ix, F + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    put(ix, F + 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
  } else if (idx % 6 === 5) {
    put(ix, F + 10, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
