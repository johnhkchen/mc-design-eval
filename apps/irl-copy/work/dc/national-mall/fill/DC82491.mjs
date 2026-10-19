// DC82491: 501 1st St SE, Commercial-Office-Small. A two-storey brick office block on a stone plinth with a
// shopfront on its north (street) face, a stone cornice and a flat tar roof. Lidar gives roofs at 4 blocks over the
// lowest ground, 3 and 2 over the lower wings; each cell's column runs from its ground up to its roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC82491.cells.json", "utf8"));

const FOUNDATION = "stone_bricks", PLINTH = "stone_bricks", FLOOR = "smooth_stone", ROOF = "stone";
const BRICK = "bricks", GLASS = "light_blue_stained_glass", CORNICE = "stone_bricks";
const CORNICE_DETAIL = "chiseled_stone_bricks", WARM = "glowstone", PLANT = "light_gray_concrete";
const DOOR = "dark_oak_door";

const g = new Voxels([15, 16, 34]);
const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const has = (x, z) => foot.has(key(x, z));
const missing = (x, z) => [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].filter(([a, b]) => !has(a, b)).length;
const ringCell = (x, z) => missing(x, z) > 0;
const touchesRing = (x, z) => [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([a, b]) => has(a, b) && ringCell(a, b));

// The face a wall cell stands on (north first, so corners take the north face) and its position along that face.
function facade(x, z) {
  if (!has(x, z - 1)) return { face: "n", t: x };
  if (!has(x, z + 1)) return { face: "s", t: x };
  if (!has(x - 1, z)) return { face: "w", t: z };
  return { face: "e", t: z };
}

for (const [x, z, ground, roof] of cells) {
  const H = roof - ground, top = H - 1;
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUNDATION);     // foundation: nothing floats on a slope

  if (!ringCell(x, z)) {
    // Interior: floor slabs at the ground, the storey line and the roof; a one-block air gap between them.
    for (let k = 0; k < H; k++) {
      const y = ground + k;
      if (k === 0) g.set(x, y, z, FLOOR);
      else if (k === top) g.set(x, y, z, ROOF);
      else if (H >= 4 && k === 2) g.set(x, y, z, FLOOR);
      else if (k === 1 && touchesRing(x, z) && (x + z) % 3 === 0) g.set(x, y, z, WARM);   // lamp behind the glass
    }
  } else {
    const { face, t } = facade(x, z);
    const corner = missing(x, z) >= 2;
    for (let k = 0; k < H; k++) {
      const y = ground + k;
      if (k === top && k > 0) { g.set(x, y, z, t % 2 === 0 ? CORNICE_DETAIL : CORNICE); continue; }
      if (k === 0) { g.set(x, y, z, PLINTH); continue; }
      // The entrance: a dark oak door in the north wall, its two halves in the ground and upper storeys.
      if (face === "n" && z === 0 && x === 5 && (k === 1 || k === 2)) {
        const half = k === 1 ? "lower" : "upper";
        g.set(x, y, z, DOOR, { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (face === "n" && z === 0 && (x === 4 || x === 6) && (k === 1 || k === 2)) { g.set(x, y, z, PLINTH); continue; }
      // Punched windows: one glass bay in every three cells, brick piers between (the DC brick read).
      if (corner || t % 3 !== 1) { g.set(x, y, z, BRICK); continue; }
      g.set(x, y, z, GLASS);
    }
  }
}

// Roof plant: a small 2 x 2 unit set on the flat roof at the rear of the block.
for (const [x, z] of [[10, 21], [11, 21], [10, 22], [11, 22]]) {
  if (!has(x, z)) continue;
  g.set(x, foot.get(key(x, z)).roof, z, PLANT);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC82491.nbt";
const info = g.save(out);
console.log(`DC82491: ${info.blocks} blocks, palette ${info.palette}`);
