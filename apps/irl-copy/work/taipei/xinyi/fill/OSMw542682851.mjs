import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682851";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 11 x 13 footprint, roof surface at y 11 (about 11 above lowest ground), parapet to 12,
// rooftop penthouse and lightning rod above. Era: 1980s-90s Taipei commercial block,
// white concrete piers, tinted glass, quartz storey lines, stone plinth.
const W = 11, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const S = new Map();
for (const [x, z, gr] of cells) S.set(key(x, z), Math.round(gr));
const has = (x, z) => S.has(key(x, z));

const ROOF_Y = 11;
const PARAPET_Y = 12;
const SILL_Y = 6;
const WIN_TOP_Y = 9;
const CORNICE_Y = 10;
const STOREY_Y = 5;

// Missing neighbours in the four cardinal directions.
function missing(x, z) {
  const m = [];
  if (!has(x, z - 1)) m.push("n");
  if (!has(x, z + 1)) m.push("s");
  if (!has(x - 1, z)) m.push("w");
  if (!has(x + 1, z)) m.push("e");
  return m;
}

// Inward offset opposite to an outward direction.
const INWARD = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

// Facade cell at (x, z) with outward direction d. Pier on even index, window on odd.
function facadeBlock(d, corner, i, y, gr, isFront) {
  if (y === ROOF_Y) return "white_concrete";
  if (y === PARAPET_Y) return "smooth_quartz";
  if (y === STOREY_Y) return "smooth_quartz";
  if (y === CORNICE_Y) return "smooth_quartz";

  const isWin = !corner && i % 2 === 1;

  if (y <= 4) {
    if (isFront) {
      // Shopfront: glass bays with white piers, dark fascia at y 4, entrance at centre.
      const centre = i === 5 && !corner;
      if (y === 4) return "dark_oak_planks";
      if (centre) return y <= 3 ? null : "dark_oak_planks"; // open entrance
      if (isWin) return "glass";
      return "white_concrete";
    }
    // Other ground-floor sides: stone plinth band with windows.
    if (y === 1 && !isWin) return "stone_bricks";
    if (isWin) return "light_blue_stained_glass";
    return "white_concrete";
  }

  // Upper storey (6..9).
  if (y === SILL_Y) return "white_concrete";
  if (y >= SILL_Y + 1 && y <= WIN_TOP_Y) {
    return isWin ? "light_blue_stained_glass" : "white_concrete";
  }
  return "white_concrete";
}

// 1) Foundations, walls, floor slabs, roofs, and facade articulation.
for (const [k, gr] of S) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to and including this cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  const miss = missing(x, z);
  const corner = miss.length > 1;
  const d = miss.length ? (miss.includes("n") ? "n" : miss[0]) : null;
  const isFront = d === "n";
  const i = d === "n" || d === "s" ? x : z;

  for (let y = gr + 1; y <= PARAPET_Y; y++) {
    if (y === STOREY_Y && !d) {
      if (gr < STOREY_Y) g.set(x, y, z, "smooth_stone"); // interior floor slab
      continue;
    }
    if (y === ROOF_Y && !d) {
      g.set(x, y, z, "stone"); // interior roof deck
      continue;
    }
    if (y === PARAPET_Y && !d) continue;

    if (d) {
      const b = facadeBlock(d, corner, i, y, gr, isFront);
      if (b) g.set(x, y, z, b);
    }
  }

  // Dusk lights: shroomlights behind upper windows, glowstone behind shopfront windows.
  if (d) {
    const [ox, oz] = INWARD[d];
    const ix = x + ox, iz = z + oz;
    if (!corner && i % 2 === 1 && has(ix, iz)) {
      if (i % 4 === 1 && gr < 8) g.set(ix, 8, iz, "shroomlight");
      if (isFront && i % 4 === 3 && gr < 2) g.set(ix, 2, iz, "glowstone");
    }
  }
}

// 2) Rooftop penthouse on the roof deck, centred, with a lightning rod.
const PX0 = 3, PX1 = 7, PZ0 = 4, PZ1 = 8;
let penthouseOk = true;
for (let x = PX0; x <= PX1; x++)
  for (let z = PZ0; z <= PZ1; z++)
    if (!has(x, z)) penthouseOk = false;

if (penthouseOk) {
  for (let x = PX0; x <= PX1; x++) {
    for (let z = PZ0; z <= PZ1; z++) {
      const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
      for (let y = PARAPET_Y; y <= 14; y++) {
        if (edge) {
          const centre = (x === 5 && (z === PZ0 || z === PZ1)) || (z === 6 && (x === PX0 || x === PX1));
          if (y === 13 && centre) g.set(x, y, z, "light_blue_stained_glass");
          else g.set(x, y, z, "light_gray_concrete");
        }
      }
      g.set(x, 15, z, "stone_bricks");
    }
  }
  for (let y = 16; y <= 18; y++) g.set(6, y, 6, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
