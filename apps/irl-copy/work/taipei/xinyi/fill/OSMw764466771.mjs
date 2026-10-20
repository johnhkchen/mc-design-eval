import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi office block, c. 1980s: five storeys of white tiled concrete,
// blue-glass window bands, grey plinth, cornice, entrance canopy, rooftop penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466771";
const W = 23, H = 38, D = 16;
const ROOF_Y = 25;          // top course of the roof; building height = 26 blocks
const STOREY = 5;           // blocks per storey
const DOOR_Z = 0;           // entrance on the z = 0 face
const DOOR_X = [10, 11, 12];

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(20, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const perim = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !has(x + dx, z + dz));

// Faces running along z (north/south walls) use x as the along-face axis; others use z.
const alongFace = (x, z) => (!has(x, z - 1) || !has(x, z + 1) ? x : z);

// Rectangle of penthouse cells, only used where the footprint allows it.
const PH = { x0: 6, x1: 16, z0: 4, z1: 11 };
const phCell = (x, z) => x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1 && has(x, z);
const phEdge = (x, z) =>
  phCell(x, z) && (x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1);

for (const [x, z, gr] of cells) {
  const gy = ground.get(key(x, z));
  const isP = perim(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gy; y <= ROOF_Y; y++) {
    const s = Math.floor(y / STOREY);
    const b = s * STOREY;
    const r = y - b;

    if (y === ROOF_Y) {
      g.set(x, y, z, isP ? "smooth_stone" : "gray_concrete"); // cornice / roof slab
      continue;
    }

    if (!isP) {
      // Interior: floor slabs only, air between.
      if (y === gy || r === 0) g.set(x, y, z, "light_gray_concrete");
      else g.set(x, y, z, "air");
      continue;
    }

    // Perimeter facade.
    if (s === 0) {
      if (y === gy) {
        g.set(x, y, z, "gray_concrete"); // base course / plinth
        continue;
      }
      if (z === DOOR_Z && has(x, z) && DOOR_X.includes(x)) {
        if (y === gy + 3) g.set(x, y, z, "smooth_stone"); // canopy
        else if (y <= gy + 2) g.set(x, y, z, "air");      // doorway
        else g.set(x, y, z, "white_concrete");
        if (x === 11 && y === gy + 2) g.set(x, y, z, "lantern", { hanging: "true" });
        continue;
      }
      if (r === 4) {
        g.set(x, y, z, "white_concrete"); // lintel band
        continue;
      }
    }

    if (r === 0) {
      g.set(x, y, z, "white_concrete"); // storey line / spandrel
    } else if (r === 4) {
      g.set(x, y, z, "white_concrete"); // sill belt
    } else {
      // Window band: glass with light_gray frames every third cell.
      const a = alongFace(x, z);
      if (a % 3 === 0) {
        g.set(x, y, z, "light_gray_concrete");
      } else if ((x * 5 + z * 3 + s * 7 + y) % 13 === 0) {
        g.set(x, y, z, "glowstone"); // warm lit room behind glass
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    }
  }
}

// Rooftop penthouse: two storeys of plant room on the roof slab.
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!phCell(x, z)) continue;
    for (let y = ROOF_Y + 1; y <= ROOF_Y + 2; y++) {
      if (phEdge(x, z)) {
        const a = alongFace(x, z);
        g.set(x, y, z, y === ROOF_Y + 1 && a % 3 === 0 ? "light_gray_concrete" : "white_concrete");
      } else {
        g.set(x, y, z, "air");
      }
    }
    g.set(x, ROOF_Y + 3, z, "gray_concrete"); // penthouse roof
  }
}

g.save(`${DIR}/${ID}.nbt`);
