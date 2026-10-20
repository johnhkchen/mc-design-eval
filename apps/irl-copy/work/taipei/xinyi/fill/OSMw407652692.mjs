import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 信義樓 (Xinyi Building), Taipei: a 1990s-style three-storey office block with a
// white-tile and blue-glass facade, a stone base course, a cornice parapet, a
// shopfront ground floor on the south face with a canopy over the entrance,
// corner piers, and a rooftop mechanical penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407652692";
const W = 27, H = 28, D = 39;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => x + "," + z;
const G = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gc = Math.round(gr);
  G.set(key(x, z), gc);
  if (gc < minG) minG = gc;
}
if (!Number.isFinite(minG)) minG = 0;

const has = (x, z) => G.has(key(x, z));
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (!inB(x, y, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Storey lines are absolute: floors at minG + 5k. Roof deck at minG + 15,
// parapet at minG + 16..17. Downhill cells get extra storeys.
const ROOF = minG + 15;
const PAR = minG + 16;

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gc = Math.round(gr);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const westOpen = !has(x - 1, z), eastOpen = !has(x + 1, z);
  const northOpen = !has(x, z - 1), southOpen = !has(x, z + 1);
  const edge = westOpen || eastOpen || northOpen || southOpen;
  const corner = (westOpen || eastOpen) && (northOpen || southOpen);

  if (!edge) {
    // Interior: floor slabs where they sit on solid below, and the roof deck.
    const slabs = new Set([gc, minG, minG + 5, minG + 10, ROOF]);
    for (const y of slabs) {
      if (y >= gc && y < H) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // Along-face coordinate: x on north/south faces, z on east/west faces.
  const along = (northOpen || southOpen) ? x : z;
  const top = Math.max(ROOF, gc);

  for (let y = gc; y <= top; y++) {
    const rel = y - minG;
    const s = Math.floor(rel / 5);
    const r = rel % 5;

    if (y === gc || rel === 0) {
      put(x, y, z, "stone_bricks"); // base course
    } else if (corner) {
      // Corner piers run the full height with a stone band at each storey line.
      put(x, y, z, r === 0 ? "smooth_stone" : "polished_andesite");
    } else if (r === 0) {
      put(x, y, z, "smooth_stone"); // storey line
    } else if (r === 4) {
      put(x, y, z, s === 0 ? "smooth_stone" : "white_concrete"); // spandrel / lintel
    } else {
      const pier = along % 3 === 0;
      if (s === 0) {
        // Ground-floor shopfront: glass between piers
        if (pier) put(x, y, z, "polished_andesite");
        else put(x, y, z, "glass");
      } else {
        if (pier) put(x, y, z, "white_concrete");
        else if (r === 2 && along % 9 === 4) put(x, y, z, "glowstone"); // warm lit window
        else put(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Parapet and cap above the roof deck.
  put(x, PAR, z, "white_concrete");
  put(x, PAR + 1, z, "smooth_stone");

  // Entrance on the south face, centred on x = 13, ground floor.
  if (southOpen && gc <= minG + 1) {
    // Stone surround framing the door recess
    if (x === 12 || x === 14) {
      put(x, minG + 1, z, "smooth_stone");
      put(x, minG + 2, z, "smooth_stone");
    }
    // Canopy band over the entrance, three blocks wide
    if (x >= 12 && x <= 14) {
      put(x, minG + 3, z, "smooth_stone_slab", { type: "bottom" });
      put(x, minG + 4, z, "light_gray_concrete");
    }
    if (x === 13) {
      put(x, minG + 1, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, minG + 2, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, minG + 3, z, "smooth_stone");
    }
  }
}

// Rooftop mechanical penthouse on interior cells, standing on the roof deck.
for (let x = 17; x <= 21; x++) {
  for (let z = 6; z <= 12; z++) {
    if (!has(x, z)) continue;
    const gc = G.get(key(x, z));
    if (gc > ROOF) continue;
    const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
    if (edge) continue;
    put(x, PAR, z, "light_gray_concrete");
    put(x, PAR + 1, z, (x === 17 || x === 21 || z === 6 || z === 12) ? "iron_bars" : "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
