import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377766";
const W = 116, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gz] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gz));
}
const has = (x, z) => ground.has(`${x},${z}`);
const B = Math.min(...ground.values());          // lowest ground under the footprint
const R = B + 10;                                 // roof slab level; roof top ~11 above lowest ground
const minZ = Math.min(...[...ground.keys()].map(k => Number(k.split(",")[1])));
const xs = [...ground.keys()].map(k => Number(k.split(",")[0]));
const xc = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);

// Facade kind: "long" for north/south edges, "end" for east/west ends, null for interior
const isF = (x, z) => {
  if (!has(x, z)) return null;
  if (!has(x, z - 1) || !has(x, z + 1)) return "long";
  if (!has(x - 1, z) || !has(x + 1, z)) return "end";
  return null;
};

// Warm lights: glowstone in the air gap directly behind selected upper windows
const lit = new Set();
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  const kd = isF(x, z);
  if (!kd || B + 8 <= 0) continue;
  const i = kd === "long" ? x : z;
  if (i % 9 !== 4) continue;
  let ix = x, iz = z;
  if (kd === "long") iz = has(x, z - 1) ? z - 1 : z + 1;
  else ix = has(x - 1, z) ? x - 1 : x + 1;
  if (isF(ix, iz)) continue;
  if (has(ix, iz)) lit.add(`${ix},${B + 8},${iz}`);
}

// Roof plant: a few 4x6 blocks of mechanical units on the flat roof
const roofUnit = (x, z) => {
  if (isF(x, z)) return false;
  const m = x % 28;
  return m >= 14 && m <= 19 && z >= 6 && z <= 13;
};

const paneProps = (kd) =>
  kd === "long"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// Returns [blockId, props?] for a footprint cell at height y, or null for air
function blockAt(x, z, gz, y) {
  if (y < gz) return ["stone_bricks"];                 // foundation
  if (y === gz) return ["smooth_stone"];               // ground floor slab
  if (y > R + 1) return null;
  const kd = isF(x, z);
  if (y === R + 1) {
    if (kd) return ["white_concrete"];                 // parapet
    return roofUnit(x, z) ? ["iron_block"] : null;
  }
  if (y === R) return kd ? ["smooth_quartz"] : ["light_gray_concrete"]; // cornice / roof slab
  if (y > R) return null;

  if (!kd) {
    if (lit.has(`${x},${y},${z}`)) return ["glowstone"];
    if (y === B + 5 && B + 5 > gz) return ["smooth_stone"]; // floor slab, interior
    return null;
  }

  // Facade cells between ground slab and roof
  const i = kd === "long" ? x : z;
  const pane = paneProps(kd);
  const pier = i % 3 === 0;
  const ent = kd === "long" && z === minZ && Math.abs(x - xc) <= 3;
  const dx = Math.abs(x - xc);

  if (y === B + 5 && B + 5 > gz) return ["smooth_stone"];          // belt course
  if (y === B + 6 && B + 6 > gz) return ["smooth_quartz"];         // upper sill
  if (y === B + 4 && B + 4 > gz) return ent ? ["dark_oak_planks"] : ["white_concrete"]; // lintel / canopy band

  if (y >= B + 7 && y <= B + 9) {
    return pier ? ["white_concrete"] : ["glass_pane", pane];
  }

  if (y > gz && y <= B + 3) {
    if (ent) {
      if (dx === 0) {
        if (y === gz + 1) return ["oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
        if (y === gz + 2) return ["oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
        return ["glass_pane", pane];
      }
      if (dx === 1) return ["glass_pane", pane];
      return ["smooth_quartz"];
    }
    return pier ? ["white_concrete"] : ["glass_pane", pane];
  }
  return null;
}

const g = new Voxels([W, H, D]);
for (const [key, gz] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < H && y <= R + 1; y++) {
    const b = blockAt(x, z, gz, y);
    if (!b) continue;
    if (b[1]) g.set(x, y, z, b[0], b[1]);
    else g.set(x, y, z, b[0]);
  }
}

g.save(`${DIR}/${ID}.nbt`);
