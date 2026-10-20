import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610195";
const W = 20, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Materials: 1980s Taipei low-rise commercial, cream tiled concrete, aluminium-framed glass.
const FOUND = "gray_concrete";
const WALL = "white_concrete";
const TRIM = "light_gray_concrete";
const PLINTH = "stone_bricks";
const CORN = "smooth_stone";
const GLASS = "glass_pane";
const DECK = "light_gray_concrete";
const GLOW = "glowstone";
const UNIT = "iron_block";

// Storey lines (absolute y, roof about 11 blocks above lowest ground)
const GF_TOP = 4;     // last ground-floor index
const BELT = 5;       // storey line / floor slab
const UP_TOP = 9;     // last upper-floor index
const CORNICE = 10;   // cornice / roof deck level
const PARAPET = 11;   // parapet top

const key = (x, z) => `${x},${z}`;
const S = new Set();
const groundOf = new Map();
for (const [x, z, gr] of cells) {
  S.add(key(x, z));
  groundOf.set(key(x, z), Math.max(0, Math.round(gr)));
}

// Outward normal of a footprint cell (null if interior)
function outward(x, z) {
  if (!S.has(key(x, z - 1))) return [0, -1];
  if (!S.has(key(x, z + 1))) return [0, 1];
  if (!S.has(key(x - 1, z))) return [-1, 0];
  if (!S.has(key(x + 1, z))) return [1, 0];
  return null;
}

const wallCells = new Map();
const interior = [];
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const n = outward(x, z);
  if (n) wallCells.set(key(x, z), n);
  else interior.push([x, z]);
}

// 1) Foundations, interior floor slab, roof deck for every footprint cell
for (const [x, z, gr0] of cells) {
  const gr = groundOf.get(key(x, z));
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  if (gr <= BELT) g.set(x, BELT, z, TRIM);      // storey-line slab across the plate
  g.set(x, CORNICE, z, DECK);                   // roof deck
}

// 2) Shell walls
let entranceCell = null;
{
  // Entrance: north-facing wall cells, nearest the middle of that face
  const north = [];
  for (const [k, n] of wallCells) {
    if (n[0] === 0 && n[1] === -1) {
      const [x] = k.split(",").map(Number);
      north.push(x);
    }
  }
  if (north.length) {
    const mid = north.reduce((a, b) => a + b, 0) / north.length;
    const best = north.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
    entranceCell = key(best, [...wallCells.keys()].find(k => {
      const [x, z] = k.split(",").map(Number);
      return x === best && wallCells.get(k)[1] === -1;
    }).split(",")[1]);
  }
}

for (const [k, n] of wallCells) {
  const [x, z] = k.split(",").map(Number);
  const gr = groundOf.get(k);
  const along = n[0] !== 0 ? z : x;
  const pillar = along % 3 === 0;
  const isEntrance = k === entranceCell;

  for (let y = gr; y <= PARAPET; y++) {
    let id;
    if (y === PARAPET) id = WALL;                       // parapet
    else if (y === CORNICE) id = CORN;                  // cornice
    else if (y <= GF_TOP) {                             // ground floor shopfront
      if (y === gr) id = PLINTH;                        // base course
      else if (y === GF_TOP) id = CORN;                 // fascia
      else id = pillar ? TRIM : GLASS;
    } else if (y === BELT) id = TRIM;                   // storey belt
    else if (y <= UP_TOP) {                             // upper floor windows
      if (y === UP_TOP) id = TRIM;                      // sill/lintel band
      else id = pillar ? TRIM : GLASS;
    } else id = WALL;
    g.set(x, y, z, id);
  }

  // Entrance door and lintel
  if (isEntrance && gr + 1 <= GF_TOP - 1) {
    const props = { facing: "south", hinge: "left", open: "false", powered: "false" };
    g.set(x, gr, z, "oak_door", { ...props, half: "lower" });
    g.set(x, gr + 1, z, "oak_door", { ...props, half: "upper" });
    g.set(x, gr + 2, z, TRIM);
  }
}

// 3) Warm light: glowstone on the inside, behind some upper-floor panes
for (const [k, n] of wallCells) {
  const [x, z] = k.split(",").map(Number);
  const gr = groundOf.get(k);
  const along = n[0] !== 0 ? z : x;
  if (k === entranceCell) continue;
  if (along % 3 === 1 && along % 2 === 0) {
    const ix = x - n[0], iz = z - n[1];
    const ik = key(ix, iz);
    if (S.has(ik) && !wallCells.has(ik) && gr <= 6) {
      g.set(ix, 6, iz, GLOW);   // rests on the storey slab at y=5
    }
  }
}

// 4) Rooftop plant: small iron units on the deck, standing on the roof slab
const plant = interior.filter(([x, z]) => x >= 5 && x <= 14 && z >= 4 && z <= 10);
for (let i = 0; i < plant.length; i += 4) {
  const [x, z] = plant[i];
  g.set(x, PARAPET, z, UNIT);
}

g.save(`${DIR}/${ID}.nbt`);
