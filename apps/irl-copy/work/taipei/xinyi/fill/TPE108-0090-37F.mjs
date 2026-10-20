import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE108-0090-37F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 65, H = 23, D = 65;
const ROOF = 11;          // parapet level (about 11 blocks above lowest ground)
const SHOP_TOP = 4;       // ground-floor shopfront runs y <= 4
const FLOOR1 = 5;         // storey line / second-floor deck
const DECK = 10;          // roof deck level, spandrel band on perimeter
const GRID = 8;           // structural column grid inside

const g = new Voxels([W, H, D]);
const ground = new Map();
const key = (x, z) => x * 1000 + z;
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));

const inFp = (x, z) => ground.has(key(x, z));
const DIRS = [
  [1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"],
];
const outDirs = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const isColumn = (x, z) => x % GRID === 0 && z % GRID === 0;

// Central roof pavilion (plant core with a glazed clerestory ring)
const PX0 = 26, PX1 = 38, PZ0 = 26, PZ1 = 38;
const inPlant = (x, z) => x >= PX0 && x <= PX1 && z >= PZ0 && z <= PZ1;
const plantRing = (x, z) => inPlant(x, z) && (x === PX0 || x === PX1 || z === PZ0 || z === PZ1);

const perim = new Map();
for (const k of ground.keys()) {
  const x = Math.floor(k / 1000), z = k % 1000;
  perim.set(k, outDirs(x, z));
}

const glow = [];

for (const [k, G] of ground) {
  const x = Math.floor(k / 1000), z = k % 1000;
  const out = perim.get(k);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  if (out.length === 0) {
    // interior: structural columns, floor deck at storey line, roof deck
    if (isColumn(x, z)) {
      for (let y = G; y <= DECK; y++) put(x, y, z, "white_concrete");
    } else {
      if (FLOOR1 >= G) put(x, FLOOR1, z, "light_gray_concrete");
      if (DECK >= G) put(x, DECK, z, "light_gray_concrete");
    }

    // roof pavilion: solid core to y 12, glazed ring walls to 13, cap at 13
    if (G <= DECK && inPlant(x, z)) {
      if (plantRing(x, z)) {
        for (let y = ROOF; y <= 13; y++) {
          const b = y === 12 ? "light_blue_stained_glass" : "smooth_quartz";
          put(x, y, z, b);
        }
      } else {
        put(x, ROOF, z, "stone_bricks");
        put(x, 12, z, "stone_bricks");
        put(x, 13, z, "smooth_quartz");
      }
      // interior ring corner pilasters on the pavilion ring
      if ((x === PX0 || x === PX1) && (z === PZ0 || z === PZ1)) {
        put(x, 14, z, "smooth_quartz");
      }
    }
    continue;
  }

  // perimeter: facade stack from ground to deck, parapet above
  if (G > ROOF) continue;
  const [odx, odz] = out[0];
  const a = odx !== 0 ? z : x;
  const mull = a % 4 === 0;
  const corner = out.length > 1;

  const entrance =
    out.some(([, dz]) => dz === 1) && Math.abs(x - 32) <= 3 && G <= SHOP_TOP;
  const entranceFlank =
    out.some(([, dz]) => dz === 1) && Math.abs(x - 32) >= 4 && Math.abs(x - 32) <= 5 && G <= SHOP_TOP;

  for (let y = G; y <= DECK; y++) {
    let b;
    if (y === G && G <= SHOP_TOP) b = "polished_andesite";          // base course
    else if (y <= SHOP_TOP) b = (mull || corner) ? "smooth_quartz" : "light_blue_stained_glass";
    else if (y === FLOOR1) b = "smooth_quartz";                      // storey line
    else if (y < DECK) b = (mull || corner) ? "smooth_quartz" : "light_blue_stained_glass";
    else b = "white_concrete";                                       // spandrel / cornice band
    put(x, y, z, b);
  }

  // parapet, with a heavier cap on corners
  put(x, ROOF, z, "smooth_quartz");
  if (corner) put(x, ROOF + 1, z, "smooth_quartz");

  // entrance: recessed door pair, lintel, and flanking warm lights
  if (entrance) {
    const p = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
    put(x, G, z, "dark_oak_door", p("lower"));
    put(x, G + 1, z, "dark_oak_door", p("upper"));
    put(x, G + 2, z, "smooth_quartz");
    put(x, G + 1, z, "dark_oak_door", p("upper"));
  }
  if (entranceFlank && G + 1 <= SHOP_TOP) {
    put(x, G + 1, z, "shroomlight");
  }

  // warm lights behind some windows
  if (!mull && !entrance && !corner) {
    for (const y of [2, 6, 7, 8]) {
      if (y < G) continue;
      if (((Math.floor(a / 4) + y) % 3) !== 0) continue;
      const ix = x - odx, iz = z - odz;
      if (!inFp(ix, iz)) continue;
      if (!perim.has(key(ix, iz)) && !isColumn(ix, iz) && !inPlant(ix, iz)) {
        const gi = ground.get(key(ix, iz));
        if (gi <= y) glow.push([ix, y, iz, ((Math.floor(a / 4) + y) % 5 === 0) ? "shroomlight" : "glowstone"]);
      }
    }
  }
}

for (const [x, y, z, b] of glow) put(x, y, z, b);

g.save(`${DIR}/${ID}.nbt`);
