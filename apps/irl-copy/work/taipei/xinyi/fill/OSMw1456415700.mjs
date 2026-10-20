import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1456415700";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 53, H = 23, D = 31;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
const roofTop = minG + 11;   // parapet top, about 11 blocks above lowest ground
const cx = 26;               // building centre x, for the entrance

// Perimeter: any cell with a missing neighbour
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Which outward face a perimeter cell sits on (south first, then north, west, east)
const faceOf = (x, z) => {
  if (!has(x, z + 1)) return "S";
  if (!has(x, z - 1)) return "N";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
};

// Step one cell inward from a perimeter cell
const inward = (x, z) => {
  if (!has(x, z + 1)) return [x, z - 1];
  if (!has(x, z - 1)) return [x, z + 1];
  if (!has(x - 1, z)) return [x + 1, z];
  return [x - 1, z];
};

// Lit interior cells (warm light behind selected upper-floor windows)
const lit = new Set();
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const face = faceOf(x, z);
  const t = face === "N" || face === "S" ? x : z;
  const r = minG + 7;
  // window at storey 2, mid-level, on a non-pier column
  if (r - minG === 7 && t % 4 !== 0 && t % 8 === 5) {
    const [ix, iz] = inward(x, z);
    if (has(ix, iz) && !isPerim(ix, iz)) lit.add(`${ix},${r},${iz}`);
  }
}

// Element for a perimeter cell at relative height r (= y - minG)
function perimElement(x, z, r) {
  const face = faceOf(x, z);
  const t = face === "N" || face === "S" ? x : z;
  const entrance = face === "S" && Math.abs(x - cx) <= 2;

  if (r === 1) return "stone_bricks";                       // base course

  if (r <= 4) {                                             // ground floor: shopfront / entrance
    if (entrance) {
      if (r <= 3) return "light_blue_stained_glass";        // glazed doors
      return "white_concrete";                              // canopy band over entrance
    }
    if (r === 4) return "smooth_stone";                     // fascia
    return t % 3 === 0 ? "polished_andesite" : "light_blue_stained_glass";
  }

  if (r === 5) return "smooth_stone";                       // storey line / floor slab
  if (r === 6) return "white_concrete";                     // lintel band
  if (r === 7 || r === 8) {                                 // window grid
    return t % 4 === 0 ? "white_concrete" : "light_blue_stained_glass";
  }
  if (r === 9) return "white_concrete";                     // sill band
  if (r === 10) return "smooth_stone";                      // cornice
  if (r === 11) return "white_concrete";                    // parapet
  return null;
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= Math.min(gr, H - 1); y++) g.set(x, y, z, "stone");

  const perim = isPerim(x, z);
  const top = Math.min(roofTop, H - 1);

  for (let y = gr + 1; y <= top; y++) {
    const r = y - minG;

    if (!perim) {
      // Interior: floor slab per storey, roof slab, rooftop units. No rooms.
      if (lit.has(`${x},${y},${z}`)) {
        g.set(x, y, z, "shroomlight");
        continue;
      }
      if (r === 5) g.set(x, y, z, "smooth_stone");
      else if (r === 10) g.set(x, y, z, "gray_concrete");
      else if (r === 11 && x % 9 === 4 && z % 7 === 3) g.set(x, y, z, "iron_block");
      continue;
    }

    const el = perimElement(x, z, r);
    if (el) g.set(x, y, z, el);
  }
}

g.save(`${DIR}/${ID}.nbt`);
