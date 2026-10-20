import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE110-0018-2F";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 64 x 11, roof about 12 blocks above lowest ground.
// Two storeys: ground shopfront (base..4), upper office (5..9), cornice 10, parapet 11, roof cap 12.
// Facade skin on the outer row, glazing recessed one block behind it, so the piers project.
const W = 64, H = 24, D = 11;
const ROOF = 12;
const g = new Voxels([W, H, D]);

const FOUNDATION = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const SHOP_GLASS = "cyan_stained_glass";
const PIER = "white_concrete";
const SPANDREL = "light_gray_concrete";
const BAND = "smooth_quartz";
const BASE = "smooth_stone";
const LIGHT = "glowstone";

const ENTRANCE_X = [30, 31];

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation: solid from y 0 up to this cell's ground, so nothing floats on a slope.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  const endWall = x === 0 || x === W - 1;
  const outerRow = z === 0 || z === D - 1;
  const glassRow = z === 1 || z === D - 2;

  // End walls: solid, with storey lines and a roof cap.
  if (endWall) {
    for (let y = gr; y <= ROOF; y++) {
      if (y === ROOF) g.set(x, y, z, BAND);
      else if (y === 5 || y === 10) g.set(x, y, z, SPANDREL);
      else g.set(x, y, z, PIER);
    }
    continue;
  }

  // Street and back facades: piers on the outer skin, glazing recessed one block.
  if (outerRow || glassRow) {
    const pier = x % 4 === 0;
    const entrance = ENTRANCE_X.includes(x);
    for (let y = gr; y <= ROOF; y++) {
      if (y === ROOF) { g.set(x, y, z, outerRow ? BAND : SPANDREL); continue; }
      if (y === 11) { g.set(x, y, z, PIER); continue; }
      if (y === 10) { g.set(x, y, z, BAND); continue; }
      if (y === 9) { g.set(x, y, z, SPANDREL); continue; }
      if (y === 5) { g.set(x, y, z, BAND); continue; }
      if (y === 4) { g.set(x, y, z, entrance ? BAND : SPANDREL); continue; }
      if (y <= 3) {
        if (y === gr) { g.set(x, y, z, BASE); continue; }
        if (pier) { g.set(x, y, z, PIER); continue; }
        if (entrance) continue; // open entrance bay, air
        if (glassRow) g.set(x, y, z, SHOP_GLASS);
        continue;
      }
      if (y >= 6 && y <= 8) {
        if (pier) { g.set(x, y, z, PIER); continue; }
        if (glassRow) g.set(x, y, z, GLASS);
        continue;
      }
    }
    continue;
  }

  // Interior: air behind the glass, one floor slab per storey, warm lights on the slabs.
  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) { g.set(x, y, z, SPANDREL); continue; }
    if (y === 5 || y === 10) { g.set(x, y, z, SPANDREL); continue; }
    if (z === 2 && x % 8 === 3 && (y === 6 || y === gr)) { g.set(x, y, z, LIGHT); continue; }
    if (z === D - 3 && x % 8 === 5 && (y === 6 || y === gr)) { g.set(x, y, z, LIGHT); continue; }
  }

  // Roof equipment: a penthouse box on the roof deck, with a cap.
  if (x >= 14 && x <= 25 && z >= 3 && z <= 7) {
    const edge = x === 14 || x === 25 || z === 3 || z === 7;
    for (let y = ROOF + 1; y <= ROOF + 2; y++) {
      if (edge) g.set(x, y, z, SPANDREL);
    }
    if (edge) g.set(x, ROOF + 3, z, BAND);
  }
}

g.save(`${DIR}/${ID}.nbt`);
