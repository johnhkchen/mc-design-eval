import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE93-0391-14F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 102 x 34, 14 storeys, roof at y 69, parapet to 71, plant room to 75.
const W = 102, H = 81, D = 34;
const ROOF = 69;
const TOP_FLOOR = 65;
const PARAPET_TOP = 71;

const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const has = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));
const longFace = (z) => z === 0 || z === D - 1;
const isMullion = (x, z) => (longFace(z) ? x % 4 === 0 : z % 4 === 0);

function inward(x, z) {
  if (z === D - 1) return [x, z - 2];
  if (z === 0) return [x, z + 2];
  if (x === 0) return [x + 2, z];
  if (x === W - 1) return [x - 2, z];
  return null;
}

// Entrance on the south (long) face.
const DOOR_L = 49, DOOR_R = 52;
const ENTR_MIN = 49, ENTR_MAX = 52;
const CANOPY_MIN = 47, CANOPY_MAX = 54;

const v = new Voxels([W, H, D]);

for (const [x, z, g] of cells) {
  const F0 = Math.ceil(g / 5) * 5;
  const per = perim(x, z);
  const mull = per && isMullion(x, z);
  const entr = per && z === D - 1 && x >= ENTR_MIN && x <= ENTR_MAX;
  const canopy = per && z === D - 1 && x >= CANOPY_MIN && x <= CANOPY_MAX;

  // Foundation.
  for (let y = 0; y < F0 && y <= ROOF; y++) v.set(x, y, z, "stone");

  // Storey slabs: granite base course on the perimeter, floor slabs inside.
  for (let f = F0; f <= TOP_FLOOR; f += 5) {
    if (per) v.set(x, f, z, f === F0 ? "polished_granite" : "white_concrete");
    else v.set(x, f, z, "light_gray_concrete");
  }

  // Roof slab.
  v.set(x, ROOF, z, "light_gray_concrete");

  if (per) {
    // Storey index decides glass tone so each floor reads as a band.
    for (let y = F0 + 1; y <= ROOF - 1; y++) {
      if (y % 5 === 0) continue;
      const storey = Math.floor((y - F0) / 5);
      const glass = storey % 2 === 0 ? "light_blue_stained_glass" : "cyan_stained_glass";

      if (entr && y <= F0 + 3) {
        if (x === DOOR_L || x === DOOR_R) {
          const hinge = x === DOOR_L ? "left" : "right";
          if (y === F0 + 1) v.set(x, y, z, "oak_door", {
            facing: "south", half: "lower", hinge, open: "false", powered: "false",
          });
          else if (y === F0 + 2) v.set(x, y, z, "oak_door", {
            facing: "south", half: "upper", hinge, open: "false", powered: "false",
          });
          else v.set(x, y, z, "polished_granite");
        } else if (y === F0 + 3) {
          v.set(x, y, z, "polished_granite");   // lintel over the open entrance
        }
      } else if (canopy && y === F0 + 4) {
        v.set(x, y, z, "white_concrete_slab", { type: "bottom", waterlogged: "false" });
      } else if (mull) {
        v.set(x, y, z, "white_concrete");
      } else {
        v.set(x, y, z, glass);
      }
    }

    // Parapet with capping course; mullions continue as fins above the roof.
    for (let y = ROOF + 1; y <= PARAPET_TOP; y++) {
      if (y === PARAPET_TOP && !mull) {
        v.set(x, y, z, "white_concrete_slab", { type: "bottom", waterlogged: "false" });
      } else {
        v.set(x, y, z, "white_concrete");
      }
    }
  }
}

// Warm lights behind windows, on the interior floor slab.
for (const [x, z, g] of cells) {
  if (!perim(x, z) || isMullion(x, z)) continue;
  if (z === D - 1 && x >= ENTR_MIN && x <= ENTR_MAX) continue;
  const F0 = Math.ceil(g / 5) * 5;
  for (let f = F0; f <= TOP_FLOOR; f += 5) {
    if ((x + z + f / 5) % 7 !== 0) continue;
    const inn = inward(x, z);
    if (!inn) continue;
    const [ix, iz] = inn;
    if (!has(ix, iz) || perim(ix, iz)) continue;
    v.set(ix, f + 1, iz, "glowstone");
  }
}

// Plant penthouse on the roof, footprint-limited.
const PH = { x0: 30, x1: 70, z0: 9, z1: 24, y0: ROOF + 1, y1: 74, roof: 75 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!has(x, z)) continue;
    const ring = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    v.set(x, PH.y0, z, "light_gray_concrete");
    if (!ring) {
      v.set(x, PH.roof, z, "light_gray_concrete");
      continue;
    }
    const mull = longFace(z) || z === PH.z0 || z === PH.z1 ? x % 4 === 0 : z % 4 === 0;
    for (let y = PH.y0; y <= PH.y1; y++) {
      if (y === PH.y0 || y === PH.y1) v.set(x, y, z, "white_concrete");
      else if (y >= 71 && y <= 73 && !mull) v.set(x, y, z, "light_blue_stained_glass");
      else v.set(x, y, z, "white_concrete");
    }
    v.set(x, PH.roof, z, "light_gray_concrete");
  }
}

v.save(`${DIR}/${ID}.nbt`);
