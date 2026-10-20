import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 34 x 17 footprint, roof ~40 blocks above lowest ground (lidar).
// Read as an eight-storey Xinyi mid-rise from the 1990s-2000s: white tiled
// piers and spandrels, blue-glass window bands, a shopfront storey at street
// level, a plain parapet, and a central plant room on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245227";
const W = 34, D = 17, H = 52;
const STOREY = 5;
const ROOF_ABOVE = 40;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gnd = new Map();
for (const [x, z, gr] of cells) gnd.set(`${x},${z}`, gr);
const has = (x, z) => gnd.has(`${x},${z}`);

const gMin = Math.min(...cells.map((c) => c[2]));
const ROOF = gMin + ROOF_ABOVE;
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const midX = (minX + maxX) / 2;
const midZ = (minZ + maxZ) / 2;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which outward face a footprint cell sits on (null = interior cell)
function outwardDir(x, z) {
  if (!has(x, z - 1)) return "n";
  if (!has(x, z + 1)) return "s";
  if (!has(x - 1, z)) return "w";
  if (!has(x + 1, z)) return "e";
  return null;
}

// Step from an edge cell into the building (for placing lights behind glass)
const INWARD = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

for (const [x, z, base] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  const dir = outwardDir(x, z);
  const edge = dir !== null;
  const n = Math.max(1, Math.floor((ROOF - base) / STOREY));
  const top = base + n * STOREY; // roof slab level for this cell

  for (let s = 0; s < n; s++) {
    const y = base + s * STOREY;

    // Storey floor line: slab (also the spandrel base on the facade)
    put(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
    if (!edge) continue;

    // Piers every third cell along the wall, glass in between
    const t = dir === "n" || dir === "s" ? x : z;
    const pier = t % 3 === 0;

    // Entrance: centre of the south (street) wall, ground storey only
    const entrance = dir === "s" && s === 0 && Math.abs(x - midX) <= 1.5;

    for (let k = 1; k <= 3; k++) {
      const yy = y + k;
      if (entrance && k <= 2) continue; // doorway opening (air)
      if (entrance && k === 3) {
        put(x, yy, z, "smooth_stone"); // canopy slab over the door
        continue;
      }
      if (pier) {
        put(x, yy, z, "quartz_block");
      } else {
        put(x, yy, z, "light_blue_stained_glass");
      }
    }

    // Spandrel course under the next storey line
    if (!entrance) put(x, y + 4, z, "white_concrete");
    else put(x, y + 4, z, "white_concrete");

    // Warm light behind some windows, in the air gap just inside the glass
    if (s >= 1 && !pier && (t + s) % 4 === 0) {
      const [dx, dz] = INWARD[dir];
      if (has(x + dx, z + dz)) put(x + dx, y + 2, z + dz, "glowstone");
    }
  }

  // Roof slab: smooth stone on the edge (cornice line), membrane inside
  put(x, top, z, edge ? "smooth_stone" : "gray_concrete");

  // Parapet on the edge of the roof
  if (edge) {
    put(x, top + 1, z, "white_concrete");
    put(x, top + 2, z, "smooth_stone");
  }

  // Central plant room on the tallest cells
  const maxN = Math.max(...cells.map(([cx, cz, cb]) =>
    Math.max(1, Math.floor((ROOF - cb) / STOREY))));
  if (!edge && n === maxN && Math.abs(x - midX) <= 6 && Math.abs(z - midZ) <= 3) {
    for (let k = 1; k <= 3; k++) put(x, top + k, z, "quartz_block");
    put(x, top + 4, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
