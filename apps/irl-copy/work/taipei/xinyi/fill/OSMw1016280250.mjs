import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1016280250";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 7, H = 33, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height (rounded)
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => foot.has(`${x},${z}`);

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, block, props) => {
  if (!inB(x, y, z)) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Materials: 1990s-2000s Xinyi mid-rise commercial/office: white tiled walls,
// light grey storey bands, pale quartz piers, tinted glass windows.
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const PIER = "smooth_quartz";
const GLASS = "light_blue_stained_glass";
const BASE = "smooth_stone";
const STOREY = 5;
const ROOF_H = 20; // roof cap at ground + 20 => top surface 21 blocks above ground

for (const [key, gr] of foot) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const north = !has(x, z - 1);
  const south = !has(x, z + 1);
  const exterior = west || east || north || south;
  const xFace = west || east;
  const zFace = north || south;
  const corner = xFace && zFace;

  // Pier rhythm: along z on the long sides, along x on the short ends
  const idx = xFace ? z : x;
  const pier = corner || idx % 3 === 0;

  for (let h = 0; h <= ROOF_H; h++) {
    const y = gr + h;
    if (y >= H) continue;
    const s = Math.floor(h / STOREY);
    const k = h % STOREY;

    // Storey lines and floor slabs span the whole footprint
    if (k === 0 && h < ROOF_H) {
      put(x, y, z, BAND);
      continue;
    }

    // Roof cap / cornice across the whole footprint
    if (h === ROOF_H) {
      put(x, y, z, PIER);
      continue;
    }

    if (!exterior) {
      // Interior: air gap, with a few warm lights set back from the glass
      if (k === 2 && x === 2 && z % 6 === 3) put(x, y, z, "glowstone");
      continue;
    }

    // Exterior shell
    if (k === 4) {
      put(x, y, z, WALL); // spandrel band
      continue;
    }

    // k = 1..3: openings
    const frontEntrance = s === 0 && north && x === 3;
    if (frontEntrance && (h === 1 || h === 2)) continue; // door opening (air)
    if (frontEntrance && h === 3) {
      put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (pier) {
      put(x, y, z, PIER);
    } else {
      put(x, y, z, GLASS);
    }
  }
}

// Rooftop plant room at the centre of the roof, if the footprint allows
for (let x = 2; x <= 4; x++) {
  for (let z = 7; z <= 13; z++) {
    if (!has(x, z)) continue;
    const gr = foot.get(`${x},${z}`);
    put(x, gr + ROOF_H + 1, z, BAND);
    if (x === 3 && z === 10) {
      put(x, gr + ROOF_H + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${dir}/${id}.nbt`);
