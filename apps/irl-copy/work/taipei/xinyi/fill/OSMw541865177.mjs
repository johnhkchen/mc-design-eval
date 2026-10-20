import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865177";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Record: roof ~11 blocks above lowest ground, two storeys of ~5 blocks.
// 1980s Taipei low-rise commercial block: stone plinth, quartz-tile walls,
// light concrete floor bands, glass shopfront and window bays, dark tiled roof.
const ROOF = 11;
const BAND = [5, 10];           // storey floor lines
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const inF = (x, z) => ground.has(key(x, z));
const perim = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

let minX = Infinity, minZ = Infinity;
for (const [x, z] of cells) { minX = Math.min(minX, x); minZ = Math.min(minZ, z); }

const isPillar = (x, z, onXFace) => {
  const rx = x - minX, rz = z - minZ;
  return onXFace ? (rz % 4 === 0 || !inF(x, z + 1) && !inF(x, z - 1) ? true : rz % 4 === 0)
                 : rx % 4 === 0;
};

const DOOR_REL_X = 6;

for (const [x, z, gr0] of cells) {
  const gr = ground.get(key(x, z));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  if (gr >= ROOF) continue;

  // Floor slabs per storey (solid under air gaps; interiors stay air).
  for (const L of BAND) if (gr < L) g.set(x, L, z, "light_gray_concrete");

  // Roof deck.
  g.set(x, ROOF, z, "deepslate_tiles");

  const isP = perim(x, z);
  // Which face (for pillar spacing): exterior on x-min/x-max means X-face.
  const onXFace = !inF(x - 1, z) || !inF(x + 1, z);
  const onZFace = !inF(x, z - 1) || !inF(x, z + 1);

  if (isP) {
    // Parapet
    g.set(x, ROOF + 1, z, "smooth_quartz");

    // Facade rows from just above ground up to the roof course.
    const pillar = (onXFace && (z - minZ) % 4 === 0) || (onZFace && (x - minX) % 4 === 0)
      || (onXFace && !inF(x, z + 1) && !inF(x, z - 1))
      || (onZFace && !inF(x + 1, z) && !inF(x - 1, z));
    const isFront = z === minZ;

    for (let y = gr + 1; y < ROOF; y++) {
      let id;
      if (BAND.includes(y)) {
        id = "light_gray_concrete";
      } else if (y <= 4) {
        if (y === gr + 1) id = "stone_bricks";        // base course
        else if (y === 4) id = "smooth_quartz";       // lintel
        else id = pillar ? "quartz_pillar" : "glass"; // shopfront bays
      } else {
        id = pillar ? "quartz_pillar" : "smooth_quartz";
        if (y >= 6 && y <= 9) id = pillar ? "quartz_pillar" : "glass";
      }
      g.set(x, y, z, id);
    }

    // Entrance door on the street (z minimum) face.
    if (isFront && x - minX === DOOR_REL_X && gr + 2 <= 3) {
      g.set(x, gr + 1, z, "birch_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "birch_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }

    // Hanging lanterns under the front lintel beside the door.
    if (isFront && gr + 1 <= 3 && [5, 7].includes(x - minX)) {
      g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }

    // Warm light: glowstone just inside some upper windows.
    if (!pillar && (x + z) % 4 === 0 && gr < 7) {
      let dx = 0, dz = 0;
      if (!inF(x - 1, z)) dx = 1; else if (!inF(x + 1, z)) dx = -1;
      else if (!inF(x, z - 1)) dz = 1; else if (!inF(x, z + 1)) dz = -1;
      const nx = x + dx, nz = z + dz;
      if (inF(nx, nz) && !perim(nx, nz)) g.set(nx, 7, nz, "glowstone");
    }
  }
}

// Roof equipment: a plant housing on the inner roof, standing on the roof deck.
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  if (gr >= ROOF) continue;
  const rx = x - minX, rz = z - minZ;
  const inner = rx >= 4 && rx <= 9 && rz >= 4 && rz <= 11;
  if (inner && !perim(x, z)) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    if (rx >= 5 && rx <= 8 && rz >= 5 && rz <= 10) g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
