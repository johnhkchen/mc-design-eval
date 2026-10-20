import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1960s-70s Taipei shophouse-office: two storeys on a concrete frame,
// stone-bricked foundation, shopfront glazing at street level, blue-tinted
// upper windows, a cornice band, a concrete parapet and a small roof plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883627";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 23, D = 5;
const g = new Voxels([W, H, D]);

const FOUND = "stone_bricks";
const FRAME = "white_concrete";
const BAND = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const CORNICE = "stone_bricks";
const ROOF = "smooth_stone";
const PLANT = "light_gray_concrete";
const PLANT_TOP = "stone_bricks";
const LIGHT = "glowstone";

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Pier columns: on long (z=0, z=D-1) faces at even x; on short faces at even z.
const isPier = (x, z) =>
  z === 0 || z === D - 1 ? x % 2 === 0 : z % 2 === 0;

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const doorCell = [3, 0];

for (const [x, z, grRaw] of cells) {
  const gg = Math.min(Math.max(Math.round(grRaw), 0), 9);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gg; y++) put(x, y, z, FOUND);

  const edge = perim(x, z);

  // Roof slab and parapet (sit directly on the storey below).
  if (10 > gg) put(x, 10, z, ROOF);
  if (edge && 11 > gg) put(x, 11, z, FRAME);

  for (let y = gg + 1; y <= 9; y++) {
    // Floor slab between storeys, interior and perimeter band.
    if (y === 5) {
      put(x, y, z, edge ? BAND : FRAME);
      continue;
    }
    if (!edge) {
      // Interior: air, with a warm light behind the glass on the upper floor.
      if (y === 7 && (x + z) % 3 === 0) put(x, y, z, LIGHT);
      continue;
    }
    if (y < 5) {
      // Ground storey: shopfront.
      if (x === doorCell[0] && z === doorCell[1] && gg + 2 <= 4 && (y === gg + 1 || y === gg + 2)) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: y === gg + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (y === 4) {
        put(x, y, z, FRAME);
      } else if (isPier(x, z)) {
        put(x, y, z, FRAME);
      } else {
        put(x, y, z, GLASS);
      }
    } else {
      // Upper storey: piers, glazed bays, spandrel and cornice bands.
      if (y === 6) put(x, y, z, FRAME);
      else if (y === 9) put(x, y, z, CORNICE);
      else if (isPier(x, z)) put(x, y, z, FRAME);
      else put(x, y, z, GLASS);
    }
  }
}

// Roof plant box, set inside the footprint on the roof slab.
for (let x = 4; x <= 5; x++) {
  for (let z = 1; z <= 2; z++) {
    if (!has(x, z) || perim(x, z)) continue;
    put(x, 11, z, PLANT);
    put(x, 12, z, PLANT);
    put(x, 13, z, PLANT_TOP);
  }
}

g.save(`${DIR}/${ID}.nbt`);
