import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265927";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record-less mid-century Xinyi low-rise: four storeys of 5 blocks, white
// concrete piers and spandrels, light-grey floor bands, a smooth-stone cornice,
// a shopfront with a central door on the street face, and a rooftop plant box.
const ROOF = 21;
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(20, Math.round(gr))));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const g = new Voxels([8, 33, 16]);

const GLASS_X_FACE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_Z_FACE = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

for (const [x, z, gr0] of cells) {
  const gr = ground.get(key(x, z));
  const hasN = (dx, dz) => ground.has(key(x + dx, z + dz));
  const exterior = !(hasN(-1, 0) && hasN(1, 0) && hasN(0, -1) && hasN(0, 1));
  const faceZ = !hasN(0, -1) || !hasN(0, 1);
  const street = !hasN(0, -1);
  const c = faceZ ? x - minX : z - minZ;
  const end = faceZ ? maxX - minX : maxZ - minZ;
  const pier = c % 2 === 0 || c === end;

  // Foundation below ground, plinth/floor plate at ground level.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");

  for (let y = gr + 1; y <= ROOF; y++) {
    if (y % 5 === 0) {
      // Floor slab / belt course; cornice at the top storey line.
      const b = (y === 20 && exterior) ? "smooth_stone" : "light_gray_concrete";
      g.set(x, y, z, b);
      continue;
    }
    if (y === ROOF) {
      if (exterior) g.set(x, y, z, "white_concrete"); // parapet
      continue;
    }
    if (!exterior) continue; // interior stays air behind the glass

    const k = Math.floor(y / 5);
    const r = y % 5;

    // Street-face ground storey: shopfront with central door.
    if (street && k === 0 && r >= 1 && r <= 3 && c !== 0 && c !== end) {
      if (c === 3 && (y === gr + 1 || y === gr + 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (r === 1) {
        g.set(x, y, z, "smooth_stone");
      } else {
        g.set(x, y, z, "glass");
      }
      continue;
    }

    if (r === 1 || r === 4 || pier) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // Window zone (rows 2 and 3 of each storey).
    if (k >= 1 && r === 2 && (c + k) % 4 === 1) {
      g.set(x, y, z, "glowstone"); // lit room behind glass
    } else {
      g.set(x, y, z, "glass_pane", faceZ ? GLASS_Z_FACE : GLASS_X_FACE);
    }
  }
}

// Rooftop plant room on the parapet deck.
for (let x = 2; x <= 5; x++)
  for (let z = 4; z <= 11; z++)
    for (let y = ROOF; y <= ROOF + 2; y++)
      g.set(x, y, z, "light_gray_concrete");

g.save(`${DIR}/${ID}.nbt`);
