import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-district commercial block, 2 storeys (ground shopfront + office floor)
// with a 1-block cornice, flat roof and rooftop plant. Roof sits 11 blocks above lowest ground.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016292940";
const W = 22, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let minG = Infinity;
for (const [x, z, g] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, g);
  minG = Math.min(minG, g);
}
if (!Number.isFinite(minG)) minG = 0;

const inFp = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const faces = (x, z) => {
  const f = [];
  if (!inFp(x, z - 1)) f.push({ d: "north", idx: x });
  if (!inFp(x, z + 1)) f.push({ d: "south", idx: x });
  if (!inFp(x - 1, z)) f.push({ d: "west", idx: z });
  if (!inFp(x + 1, z)) f.push({ d: "east", idx: z });
  return f;
};
const perim = (x, z) => inFp(x, z) && faces(x, z).length > 0;
const nearPerim = (x, z) =>
  perim(x - 1, z) || perim(x + 1, z) || perim(x, z - 1) || perim(x, z + 1);

// Entrance: north-facing (lowest z) perimeter cell nearest the middle of that run.
let door = null;
{
  const north = [];
  for (const [k] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (perim(x, z) && faces(x, z).some(f => f.d === "north")) north.push([x, z]);
  }
  if (north.length) {
    const mean = north.reduce((s, [x]) => s + x, 0) / north.length;
    const nonCorner = north.filter(([x, z]) => faces(x, z).length === 1);
    const pool = nonCorner.length ? nonCorner : north;
    pool.sort((a, b) => Math.abs(a[0] - mean) - Math.abs(b[0] - mean));
    door = { x: pool[0][0], z: pool[0][1], d: "north" };
  } else {
    for (const [k] of ground) {
      const [x, z] = k.split(",").map(Number);
      if (perim(x, z)) { door = { x, z, d: faces(x, z)[0].d }; break; }
    }
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [k, ground0] of ground) {
  const [x, z] = k.split(",").map(Number);
  const gy = ground0;

  // Foundation below each cell's ground, so nothing floats on a slope.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  if (!perim(x, z)) {
    // Interior: floor slab at its ground, storey slab at level 5, roof deck at level 10.
    put(x, gy, z, "smooth_quartz");
    const l5 = minG + 5, l10 = minG + 10;
    if (l5 > gy) put(x, l5, z, "smooth_quartz");
    if (l10 > gy) put(x, l10, z, "gray_concrete");
    // Rooftop plant boxes, one block above the roof deck.
    if (x % 5 === 2 && z % 5 === 2) put(x, minG + 11, z, "smooth_stone");
    // Warm light in the air gap behind the glass.
    if (nearPerim(x, z) && (x + z) % 3 === 0) {
      put(x, minG + 7, z, "shroomlight");
      put(x, minG + 8, z, "shroomlight");
    }
    continue;
  }

  const fs = faces(x, z);
  const corner = fs.length > 1;
  const f0 = fs[0];
  const glassBay = !corner && f0.idx % 3 === 1;
  const isDoor = door && door.x === x && door.z === z;

  for (let y = gy; y <= minG + 10; y++) {
    const L = y - minG;
    if (isDoor && (y === gy + 1 || y === gy + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: door.d,
        half: y === gy + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (y === gy) { put(x, y, z, "polished_andesite"); continue; }   // base course
    if (L >= 1 && L <= 4) {                                           // shopfront floor
      if (L === 4) put(x, y, z, "light_gray_concrete");               // lintel
      else put(x, y, z, glassBay ? "light_blue_stained_glass" : "smooth_quartz");
      continue;
    }
    if (L === 5) { put(x, y, z, "light_gray_concrete"); continue; }   // storey line
    if (L >= 6 && L <= 9) {                                           // office floor
      if (L === 6 || L === 9) put(x, y, z, "smooth_quartz");
      else put(x, y, z, glassBay ? "light_blue_stained_glass" : "smooth_quartz");
      continue;
    }
    if (L === 10) { put(x, y, z, "polished_andesite"); continue; }    // cornice / parapet
  }
}

g.save(`${DIR}/${ID}.nbt`);
