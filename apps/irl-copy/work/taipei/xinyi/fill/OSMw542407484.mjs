import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542407484";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 12 x 24 footprint, roof ~21 blocks above lowest ground: four office storeys
// of 5 blocks, a cornice, a parapet and a central plant box, in pale concrete
// with blue-green tinted glazing (1990s Xinyi commercial/office character).
const W = 12, H = 33, D = 24;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const GLASS = "cyan_stained_glass_pane";
const FLOOR = "light_gray_concrete";
const TRIM = "white_concrete";
const PLINTH = "polished_granite";
const FOUND = "stone_bricks";

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const xFace = !has(x - 1, z) || !has(x + 1, z); // wall runs along z
  const zFace = !has(x, z - 1) || !has(x, z + 1); // wall runs along x
  const perim = xFace || zFace;
  const corner = xFace && zFace;
  const entranceCell = !has(x, z - 1) && x >= 5 && x <= 6;

  const paneProps = xFace && !zFace
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : zFace && !xFace
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : null;

  // Storey walls: five-block rhythm per storey (floor line, three glazed
  // courses, sill beam), four storeys from the cell's ground.
  for (let k = 0; k < 4; k++) {
    for (let o = 0; o < 5; o++) {
      const y = gr + 5 * k + o;
      const ground0 = k === 0;

      if (!perim) {
        // Interior: only floor slabs, air gap elsewhere.
        if (o === 0) put(x, y, z, k === 0 ? "smooth_stone" : FLOOR);
        continue;
      }

      if (corner) {
        put(x, y, z, TRIM);
        continue;
      }

      if (ground0 && o === 0) {
        put(x, y, z, PLINTH);
        continue;
      }
      if (o === 0) {
        put(x, y, z, FLOOR);
        continue;
      }
      if (o === 4) {
        put(x, y, z, ground0 ? TRIM : TRIM);
        continue;
      }

      // o = 1..3: glazing with white concrete mullions every three cells.
      const mullion = xFace ? (z % 3 === 0) : (x % 3 === 0);
      if (ground0) {
        if (entranceCell && o <= 2) continue; // open entrance
        if (mullion) put(x, y, z, PLINTH);
        else put(x, y, z, GLASS, paneProps);
        continue;
      }
      if (mullion) {
        put(x, y, z, TRIM);
      } else {
        const lit = k >= 1 && ((x * 7 + z * 3 + y * 5) % 17 === 0);
        if (lit) put(x, y, z, "glowstone");
        else put(x, y, z, GLASS, paneProps);
      }
    }
  }

  // Ground-floor canopy over the entrance and transom band.
  if (perim && !corner && has(x, z - 1) === false && x >= 4 && x <= 7) {
    put(x, gr + 4, z, TRIM);
  }

  // Roof: cornice on the perimeter, roof deck inside, parapet ring above.
  const roofY = gr + 20;
  if (perim) {
    put(x, roofY, z, FLOOR);
    put(x, roofY + 1, z, TRIM);
  } else {
    put(x, roofY, z, FLOOR);
    // Central plant box on the roof.
    if (x >= 3 && x <= 8 && z >= 8 && z <= 15) {
      put(x, roofY + 1, z, FLOOR);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
