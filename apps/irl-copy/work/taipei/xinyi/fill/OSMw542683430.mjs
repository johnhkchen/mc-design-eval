import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century Taipei commercial block: granite-based plinth, white tiled concrete
// frame with smooth stone bands, blue-glass window bays, a shopfront ground floor,
// a flat roof with a parapet and a small rooftop plant room.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542683430";
const W = 14, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// rel = height above the lowest ground; roof deck at rel 10, parapet to rel 11
const rel = (y) => y - minG;
const FACE_CODE = { west: 1, east: 2, north: 3, south: 4 };

// 1. Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Floor slabs at ground, storey 2 line and roof deck (interior cells)
for (const [x, z, gr] of cells) {
  if (gr <= minG + 0) put(x, gr, z, "light_gray_concrete");
  else put(x, gr, z, "light_gray_concrete");
  if (gr <= minG + 5) put(x, minG + 5, z, "light_gray_concrete");
  if (gr <= minG + 10) put(x, minG + 10, z, "light_gray_concrete");
}

// 3. Facade walls
function facadeFace(x, z) {
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  if (!has(x, z - 1)) return "north";
  return "south";
}

// Pick the entrance: south-facing facade cell nearest the middle
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!has(x, z + 1) && Math.abs(x - (W - 1) / 2) < best) {
      best = Math.abs(x - (W - 1) / 2);
      entrance = `${x},${z}`;
    }
  }
}

function wallBlock(y, gr, i, r, lit) {
  if (y === gr) return ["polished_granite"];
  if (r >= 11) return ["white_concrete"];          // parapet
  if (r === 10) return ["smooth_stone"];           // cornice
  if (r === 4 || r === 5 || r === 9) return ["smooth_stone"]; // storey bands
  const pillar = i % 3 === 0;
  if (r >= 1 && r <= 3) {                          // shopfront
    if (pillar) return ["white_concrete"];
    return ["glass"];
  }
  if (r >= 6 && r <= 8) {                          // upper window bays
    if (pillar) return ["white_concrete"];
    return lit ? ["glowstone"] : ["light_blue_stained_glass"];
  }
  return ["white_concrete"];
}

for (const [x, z, gr] of cells) {
  const face = facadeFace(x, z);
  if (!face) continue;
  const i = face === "west" || face === "east" ? z : x;
  const isEntrance = `${x},${z}` === entrance;
  const top = minG + 11;
  for (let y = gr; y <= top; y++) {
    const r = rel(y);
    if (isEntrance && (y === gr || y === gr + 1)) {
      const half = y === gr ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isEntrance && y === gr + 2) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    const lit = ((x * 7 + z * 13 + r * 5 + FACE_CODE[face]) % 7) === 0;
    const [block] = wallBlock(y, gr, i, r, lit);
    put(x, y, z, block);
  }
}

// 4. Roof deck (interior, below cornice) is already set at rel 10 by floor pass;
//    rooftop plant room: small concrete box on the deck, away from the edges
const edgeDist = (x, z) => {
  let d = 99;
  for (const [cx, cz] of cells) d = Math.min(d, Math.abs(cx - x) + Math.abs(cz - z));
  return d;
};
for (const [x, z, gr] of cells) {
  if (x < 5 || x > 8 || z < 5 || z > 8) continue;
  if (gr > minG + 10) continue;
  if (edgeDist(x, z) < 3) continue;
  put(x, minG + 11, z, "light_gray_concrete");
  put(x, minG + 12, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
