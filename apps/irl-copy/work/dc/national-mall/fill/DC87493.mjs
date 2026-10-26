import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87493.cells.json`, "utf8"));

const W = 5, H = 25, D = 5;
const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => g.set(x, y, z, id, props);

// Materials: red brick shell, stone storey lines and cornice, dark-oak shopfront.
const BRICK = "bricks";
const STONE = "stone_bricks";
const SMOOTH = "smooth_stone";
const FASCIA = "dark_oak_planks";
const PARAPET = "stone_brick_wall";

// One flat roof for the whole block, 13 blocks above the lowest ground.
const baseY = Math.min(...cells.map(c => Math.round(c[2])));
const TOP = baseY + 13;                 // parapet tops out here
const DECK_REL = 12;                    // solid roof deck row (rel to baseY)
const FLOORS = new Set([4, 7, 10]);     // storey lines (rel to baseY)

for (const [x, z, ground] of cells) {
  const gr = Math.round(ground);
  const edge = x === 0 || x === 4 || z === 0 || z === 4;
  const front = z === 0;                // K Street face
  const back = z === 4;
  const sideWall = (x === 0 || x === 4) && !(z === 0 || z === 4);
  const mid = x >= 1 && x <= 3;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, STONE);

  // Building column from the cell's ground up to the flat roof.
  for (let y = gr; y < TOP; y++) {
    const rel = y - baseY;
    const sf = y - gr;                  // height above this cell's own ground

    if (y === gr) { put(x, y, z, SMOOTH); continue; }   // sidewalk-level floor
    if (rel === DECK_REL) { put(x, y, z, SMOOTH); continue; } // roof deck
    if (FLOORS.has(rel)) { put(x, y, z, SMOOTH); continue; }  // storey line

    if (!edge) continue;                // interior: air gap, no interior

    if (sideWall) { put(x, y, z, BRICK); continue; }  // abutting party walls
    if (!mid) { put(x, y, z, BRICK); continue; }      // corner piers

    if (sf <= 3) {
      // Ground-storey shopfront.
      if (front) {
        if (sf === 3) { put(x, y, z, FASCIA); continue; }
        if (x === 2) {
          put(x, y, z, "dark_oak_door", {
            facing: "north",
            half: sf === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }
        put(x, y, z, "glass_pane");
        continue;
      }
      // Rear ground storey.
      if (sf === 3) { put(x, y, z, BRICK); continue; }
      if (x === 2) { put(x, y, z, STONE); continue; }
      put(x, y, z, "glass_pane");
      continue;
    }

    // Upper window bands on the flat tiers; the middle floor is boarded (vacant).
    const windowRows = [5, 6, 8, 9, 11];
    if (windowRows.includes(rel)) {
      if (x === 2) { put(x, y, z, STONE); continue; }
      const boarded = (rel === 8 || rel === 9) && (front || back);
      put(x, y, z, boarded ? "oak_planks" : "glass_pane");
      continue;
    }

    put(x, y, z, BRICK);                // spandrels
  }

  // Parapet on the edge cells, standing on the deck below.
  if (edge) put(x, TOP, z, PARAPET);
}

g.save(`${DIR}/DC87493.nbt`);
