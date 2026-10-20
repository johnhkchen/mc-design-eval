import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119873";
const W = 8, H = 23, D = 33;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const ground = new Map();
let minG = Infinity;
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, gy);
  if (gy < minG) minG = gy;
}
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Outward face for a perimeter cell (null = interior)
function faceOf(x, z) {
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  return null;
}

// Storey plan, relative to minG (1 block = 1 course):
// rel 0-3 ground storey (base course, glazing), rel 4 lintel/awning,
// rel 5 floor line, rel 6-8 upper storey, rel 9 lintel, rel 10 cornice,
// rel 11 parapet. Roof deck sits at rel 10 inside the parapet.
for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const face = faceOf(x, z);

  if (!face) {
    // Interior: floor slabs, roof deck, rooftop units; air gap otherwise
    put(x, gy, z, "smooth_stone");
    if (minG + 5 >= gy) put(x, minG + 5, z, "smooth_stone");
    if (minG + 10 >= gy) put(x, minG + 10, z, "gray_concrete");
    if (minG + 11 >= gy && x % 3 === 1 && z % 9 === 4) {
      put(x, minG + 11, z, "light_gray_concrete");
      put(x, minG + 12, z, "light_gray_concrete");
    }
    continue;
  }

  const shop = face === "west";
  const t = (face === "west" || face === "east") ? z : x;

  for (let y = gy; y <= minG + 11; y++) {
    const rel = y - minG;
    let b = null;
    let p;

    if (shop && t === 16 && (rel === 1 || rel === 2) && y > gy) {
      // Entrance door on the street (west) frontage
      b = "oak_door";
      p = {
        facing: "west",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    } else if (y === gy) {
      b = "stone_bricks"; // base course
    } else if (rel >= 1 && rel <= 3) {
      if (t % 3 === 0) b = "white_concrete";
      else b = shop ? "glass" : "glass_pane";
    } else if (rel === 4) {
      b = shop ? "red_concrete" : "light_gray_concrete"; // awning / lintel band
    } else if (rel === 5) {
      b = "light_gray_concrete"; // floor line
    } else if (rel >= 6 && rel <= 8) {
      b = t % 3 === 0 ? "white_concrete" : "glass_pane";
    } else if (rel === 9) {
      b = "light_gray_concrete";
    } else if (rel === 10 || rel === 11) {
      b = "stone_bricks"; // cornice and parapet
    }

    if (b) put(x, y, z, b, p);
  }
}

// Warm lights: shroomlight just inside some upper-storey windows
for (const [x, z, gy] of cells) {
  const face = faceOf(x, z);
  if (!face) continue;
  const t = (face === "west" || face === "east") ? z : x;
  if (t % 6 !== 2 || t % 3 === 0) continue;

  let ix = x, iz = z;
  if (face === "west") ix = 1;
  else if (face === "east") ix = W - 2;
  else if (face === "north") iz = 1;
  else if (face === "south") iz = D - 2;

  const iy = minG + 7;
  if (!has(ix, iz)) continue;
  const ig = ground.get(`${ix},${iz}`);
  if (faceOf(ix, iz) !== null) continue;
  if (iy <= ig) continue;
  put(ix, iy, iz, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
