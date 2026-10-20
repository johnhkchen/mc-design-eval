import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980400";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 30, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Levels (absolute y). Roof at 11 above the lowest ground (y 0).
const ROOF = 11;   // parapet top / roof deck
const BAND = 5;    // storey line between ground and upper storey
const CORN = 10;   // cornice course under the parapet

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.min(Math.max(gr, 0), ROOF - 2));
const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground.has(key(x, z));

const GLASS = "light_blue_stained_glass_pane";
const WALL = "white_concrete";
const BASE = "stone_bricks";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const CORNICE = "smooth_quartz";
const ROOFDECK = "light_gray_concrete";
const DARK = "dark_oak_planks";

for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const gr = ground.get(key(x, z));

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Storey floor slab and roof deck across the whole footprint.
  g.set(x, BAND, z, FLOOR);
  g.set(x, ROOF, z, ROOFDECK);

  const front = !has(x, z - 1);   // low-z face: shopfront side
  const back = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const ext = front || back || west || east;
  if (!ext) continue;

  // Column index along the facade, so pillars and windows repeat evenly.
  const c = (front || back) ? x : z;

  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) { g.set(x, y, z, BASE); continue; }
    if (y === ROOF) { g.set(x, y, z, WALL); continue; }
    if (y === CORN) { g.set(x, y, z, CORNICE); continue; }
    if (y === BAND) { g.set(x, y, z, FLOOR); continue; }

    if (front && y < BAND) {
      // Ground-floor shopfront: glass with corner piers, a door, and a fascia.
      if (y === BAND - 1) { g.set(x, y, z, DARK); continue; }
      if ((x === 14 || x === 15) && (y === gr + 1 || y === gr + 2) && y < BAND - 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: x === 14 ? "left" : "right",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (x === 0 || x === W - 1) { g.set(x, y, z, WALL); continue; }
      g.set(x, y, z, GLASS);
      continue;
    }

    // Upper storey and sides: pier every third column, glass in between.
    if (c % 3 === 0) { g.set(x, y, z, WALL); continue; }
    g.set(x, y, z, GLASS);

    // Warm light behind some glass, placed on the interior cell next to the pane.
    if (front || back) {
      const inZ = front ? z + 1 : z - 1;
      if (has(x, inZ) && c % 3 === 1 && (x + y) % 4 === 0) g.set(x, y, inZ, "glowstone");
    } else {
      const inX = west ? x + 1 : x - 1;
      if (has(inX, z) && c % 3 === 1 && (z + y) % 4 === 0) g.set(inX, y, z, "glowstone");
    }
  }
}

// Roof equipment: a plant box and a small penthouse, both on the roof deck.
for (let x = 4; x <= 9; x++)
  for (let z = 3; z <= 9; z++) {
    if (!has(x, z)) continue;
    const edge = x === 4 || x === 9 || z === 3 || z === 9;
    g.set(x, ROOF + 1, z, ROOFDECK);
    if (edge) { g.set(x, ROOF + 2, z, ROOFDECK); g.set(x, ROOF + 3, z, "iron_bars"); }
  }

for (let x = 19; x <= 24; x++)
  for (let z = 4; z <= 8; z++) {
    if (!has(x, z)) continue;
    const rim = x === 19 || x === 24 || z === 4 || z === 8;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (rim) g.set(x, y, z, (x % 3 === 0 || z === 4 || z === 8) ? WALL : GLASS);
    }
    g.set(x, ROOF + 4, z, FLOOR);
  }

// Lightning rod at the west end of the roof.
if (has(1, 6)) {
  g.set(1, ROOF + 1, 6, "lightning_rod");
  g.set(1, ROOF + 2, 6, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
