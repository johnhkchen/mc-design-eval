import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Era read from the record: a 1980s Taipei mid-rise office/retail block.
// Five storeys (5 blocks each, storey lines every 5 y), flat concrete deck,
// white-tiled concrete piers, quartz storey bands, glass window bands,
// a shopfront ground storey with a glass entrance, and a rooftop plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169552";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : raw.cells;

const W = 21, H = 41, D = 16;
const g = new Voxels([W, H, D]);

const DECK_Y = 27;     // roof deck (top of walls is 26)
const PARAPET_Y = 28;  // parapet/cornice; roof top sits at about 29 blocks

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), gr);
const has = (x, z) => groundOf.has(key(x, z));

const minG = Math.min(...cells.map((c) => c[2]));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: on the street (north, low-z) face, nearest the middle of that face.
const northXs = cells.filter((c) => !has(c[0], c[1] - 1)).map((c) => c[0]);
const midX = northXs.length ? (Math.min(...northXs) + Math.max(...northXs)) / 2 : W / 2;
const entranceX = northXs.length
  ? northXs.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), northXs[0])
  : -1;

// Deterministic "lit window" pick for a few warm windows at dusk.
const isLit = (x, y, z) => ((x * 7 + z * 13 + y * 5) % 9) === 0;

for (const [x, z, gr0] of cells) {
  const gr = gr0 - minG;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const edge = nN || nS || nW || nE;
  const corner = (nN || nS) && (nW || nE);
  const isEntrance = nN && x === entranceX;

  for (let y = gr; y <= 26; y++) {
    const r = y % 5;

    if (!edge) {
      // Interior: floor slab per storey, otherwise air (no interiors).
      if (r === 0 && y > 0) put(x, y, z, "white_concrete");
      continue;
    }

    // Edge: facade.
    const pier = corner || (nN || nS) && x % 3 === 0 || (nW || nE) && z % 3 === 0;

    if (isEntrance && y - gr <= 2 && y < 5) {
      put(x, y, z, "glass");                       // glazed entrance
      continue;
    }
    if (y === 0) { put(x, y, z, "polished_andesite"); continue; } // base course
    if (pier) { put(x, y, z, "white_concrete"); continue; }        // tiled piers
    if (r === 0 || r === 4) { put(x, y, z, "smooth_quartz"); continue; } // storey bands
    // Window rows: glass with concrete frame from piers.
    if (isLit(x, y, z)) put(x, y, z, "glowstone");
    else put(x, y, z, "light_blue_stained_glass");
  }

  // Roof deck sits on every cell, so nothing hangs.
  put(x, DECK_Y, z, "light_gray_concrete");

  // Parapet cornice around the perimeter.
  if (edge) put(x, PARAPET_Y, z, "smooth_quartz");
}

// Rooftop plant: a screened mechanical block on interior cells, standing on the deck.
for (const [x, z] of cells) {
  const edge = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  if (edge) continue;
  if (x >= 7 && x <= 13 && z >= 4 && z <= 11) {
    put(x, 28, z, "light_gray_concrete");
    put(x, 29, z, (x + z) % 2 === 0 ? "iron_bars" : "light_gray_concrete");
  }
}

// Single rooftop lightning rod near the middle of the plant block.
const rodX = Math.round(midX), rodZ = Math.round(D / 2);
if (has(rodX, rodZ)) {
  put(rodX, 30, rodZ, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
