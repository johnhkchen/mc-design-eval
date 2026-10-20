import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466780";
const W = 24, H = 38, D = 2;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));

// Storey structure, 1990s-2000s Xinyi commercial/office mid-rise:
// ground shopfront (rows 0-3, slab at 4), four upper storeys on a 5-block pitch
// (slabs at 9, 14, 19), cornice at 23, roof deck at 24, parapet at 25, roof plant above.
const SLABS = [4, 9, 14, 19];
const DOOR_X = [4, 19];
const isPier = (x) => x % 3 === 0 || x === 23;
const isDoorX = (x) => DOOR_X.includes(x);

// front = z 0 (Xinyi Road / street frontage); back = z 1 (air behind glass, no interiors)
function block(x, z, y, gr) {
  const front = z === 0;
  const pier = isPier(x);

  // Roof plant and parapet
  if (y >= 25) {
    if (x >= 7 && x <= 16) {
      if (y <= 26) return ["light_gray_concrete"];
      if (y === 27) return ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }];
    }
    if (y === 25) return ["smooth_quartz"];
    return null;
  }

  // Roof deck and cornice
  if (y === 24) return ["smooth_stone"];
  if (y === 23) return ["smooth_quartz"];

  // Ground storey: base course, shopfront glass, piers, entrances
  if (y < 4) {
    if (front && isDoorX(x)) {
      if (y === gr) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === gr + 1) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      if (y === gr + 2) return ["lantern", { hanging: "true", waterlogged: "false" }];
      if (y === gr + 3) return ["smooth_stone"];
    }
    if (y === gr) return ["polished_granite"];
    if (!front) return pier ? ["smooth_stone"] : null;
    if (pier) return ["smooth_stone"];
    return ["cyan_stained_glass"];
  }

  // Storey lines
  if (SLABS.includes(y)) return y === 4 ? ["smooth_stone"] : ["light_gray_concrete"];

  // Upper storeys: rel 1..3 = window zone, rel 4 = spandrel
  const s = 4 + 5 * Math.floor((y - 4) / 5);
  const rel = y - s;
  if (rel === 4) return ["light_gray_concrete"];

  if (!front) {
    if (pier) return ["white_concrete"];
    // warm light behind some windows
    if (rel === 2 && (s === 9 || s === 19) && x % 6 === 2) return ["glowstone"];
    if (rel === 2 && s === 14 && x % 6 === 5) return ["shroomlight"];
    return null; // air behind glass
  }

  if (pier) return ["white_concrete"];
  if (rel === 1) return ["smooth_quartz"]; // window sills
  return ["cyan_stained_glass"];
}

for (const [x, z, ground] of cells) {
  const gr = Math.max(0, Math.round(ground));
  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // body, cornice, roof, parapet and plant
  for (let y = gr; y <= 27; y++) {
    const b = block(x, z, y, gr);
    if (b) put(x, y, z, b[0], b[1]);
  }
}

g.save(`${DIR}/${ID}.nbt`);
