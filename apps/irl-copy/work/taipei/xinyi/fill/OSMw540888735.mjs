import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888735";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 21 x 8 footprint, roof about 11 blocks above lowest ground.
// Reads as a two-storey concrete-frame commercial block (late-1990s Xinyi-style):
// stone-brick plinth, white render walls, light-grey piers and spandrels,
// blue-tinted glass with a shopfront on the street (z = 0) face, a parapet with
// a smooth-quartz cornice, and rooftop plant.
const W = 21, H = 23, D = 8;
const g = new Voxels([W, H, D]);

const gnd = new Map();
for (const [x, z, h] of cells) gnd.set(`${x},${z}`, h);
const has = (x, z) => gnd.has(`${x},${z}`);
const at = (x, z) => gnd.get(`${x},${z}`);

const PLINTH = "stone_bricks";
const WALL = "white_concrete";
const PIER = "light_gray_concrete";
const SPANDREL = "light_gray_concrete";
const CORNICE = "smooth_quartz";
const SLAB = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const LIGHT = "glowstone";
const PLANT = "iron_block";

const ROOF = 11;      // roof cap layer
const FLOOR = 5;      // storey line
const CORN = 10;      // cornice band below the roof cap
const PARAPET = 12;   // parapet course above roof cap

// Pane connection states: z-facing faces connect north/south, x-facing connect east/west.
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

for (const [x, z, rawGround] of cells) {
  const gy = Math.max(0, Math.min(rawGround, CORN - 1));

  // Foundation: solid plinth from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, PLINTH);

  const ext = exterior(x, z);
  const frontFace = !has(x, z - 1);
  const backFace = !has(x, z + 1);
  const sideOnly = !frontFace && !backFace;
  const pane = sideOnly ? paneX : paneZ;
  const bayPier = x % 3 === 0;

  if (ext) {
    // Walls from ground up to the cornice band.
    for (let y = gy; y < CORN; y++) {
      if (y === FLOOR) {
        g.set(x, y, z, SPANDREL);                 // storey line
      } else if (y < FLOOR) {
        // Ground floor
        if (frontFace) {
          const entrance = x >= 9 && x <= 11;
          if (entrance) continue;                  // open entrance, air
          if (bayPier) g.set(x, y, z, PIER);
          else g.set(x, y, z, GLASS, pane);        // shopfront glazing
        } else {
          g.set(x, y, z, bayPier ? PIER : WALL);
        }
      } else {
        // Upper storey: window grid with piers
        if (bayPier) g.set(x, y, z, PIER);
        else g.set(x, y, z, GLASS, pane);
      }
    }
    // Cornice band, roof cap, parapet
    if (CORN >= gy) g.set(x, CORN, z, CORNICE);
    g.set(x, ROOF, z, SLAB);
    g.set(x, PARAPET, z, CORNICE);
  } else {
    // Interior cell: no interior, just air with floor slabs.
    if (gy <= FLOOR) g.set(x, FLOOR, z, SLAB);
    if (gy < 6 && z === 1 && x % 6 === 2 && has(x, 0) && x % 3 !== 0 && x !== 0 && x !== 20) {
      // Warm light behind the street-facing glass (air gap of one block)
      g.set(x, 6, z, LIGHT);
    }
    g.set(x, ROOF, z, SLAB);
  }

  // Rooftop plant on the interior of the roof
  if (!ext && x >= 4 && x <= 6 && z >= 2 && z <= 5) {
    if (!(x === 5 && z === 3)) g.set(x, PARAPET, z, PLANT);
  }
}

// Warm lights behind street-facing windows at the upper storey, on bays not on piers
for (const [x, z, rawGround] of cells) {
  if (z !== 1) continue;
  if (x % 6 !== 4 || x === 0 || x === 20) continue;
  if (!has(x, 0)) continue;
  if (g.get && false) continue;
  g.set(x, 7, z, LIGHT);
}

g.save(`${DIR}/${ID}.nbt`);
