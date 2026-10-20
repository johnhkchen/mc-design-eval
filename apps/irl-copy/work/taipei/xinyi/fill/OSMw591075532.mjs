import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075532";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 4 x 15. Five storeys of 5 blocks, roof at 25 above the lowest ground.
// Era: late-20th-century Taipei commercial block: cream concrete with a stone plinth,
// ribbon windows, a dark shopfront fascia, a cornice, a parapet and roof plant.
const W = 4, H = 37, D = 15;
const TOP = 25;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Footprint lookup: cell -> ground relative to the lowest ground (y 0).
let g0 = Infinity;
for (const [, , gr] of cells) g0 = Math.min(g0, gr);
const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, Math.round(gr - g0));
const has = (x, z) => map.has(`${x},${z}`);
const xsAll = cells.map((c) => c[0]);
const zsAll = cells.map((c) => c[1]);
const minX = Math.min(...xsAll), maxX = Math.max(...xsAll);
const minZ = Math.min(...zsAll), maxZ = Math.max(...zsAll);

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

// Facade block for an edge cell at height y (y >= its ground).
function facade(x, y, z, zFace, front, idx) {
  const k = Math.floor(y / 5), o = y % 5;

  // Cornice course and parapet at the top of the building.
  if (y === TOP - 2) return ["light_gray_concrete"];
  if (y === TOP - 1) return ["white_concrete"];

  // Storey sill / floor line band.
  if (o === 0) return [k === 0 ? "stone_bricks" : "light_gray_concrete"];

  // Ground-floor shopfront on the street face.
  if (k === 0 && front) {
    if (o === 1 || o === 2) {
      if (x === 1) return ["dark_oak_door", doorProps(o === 1 ? "lower" : "upper")];
      if (x === 2) return ["glass"];
      return ["stone_bricks"];
    }
    if (o === 3) return ["black_concrete"];
    return ["light_gray_concrete"]; // o === 4 canopy band
  }

  // Spandrel above each window row.
  if (o === 4) return ["white_concrete"];

  // Ribbon windows: glass panes between white concrete mullions.
  const window = idx % 3 !== 0;
  return window ? ["glass_pane"] : ["white_concrete"];
}

// Foundation, shell, floor slabs, warm lights.
for (const [key, gr] of map) {
  const [x, z] = key.split(",").map(Number);
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const front = !has(x, z - 1) && z === minZ;
  const idx = zFace ? x : z;

  // Inward direction for placing lights behind windows.
  const dx = x === minX ? 1 : x === maxX ? -1 : 0;
  const dz = z === minZ ? 1 : z === maxZ ? -1 : 0;

  for (let y = 0; y < TOP; y++) {
    if (y < gr) {
      put(x, y, z, "stone_bricks");          // foundation up to this cell's ground
      continue;
    }
    if (edge) {
      const [id, p] = facade(x, y, z, zFace, front, idx);
      put(x, y, z, id, p);

      // Warm light behind some windows, on the interior side.
      const k = Math.floor(y / 5), o = y % 5;
      const isWindow = o >= 1 && o <= 3 && idx % 3 !== 0 && !(k === 0 && front);
      if (isWindow && o === 2 && (k === 1 || k === 3) && idx % 6 === 1) {
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && ix > minX && ix < maxX && iz > minZ && iz < maxZ) {
          put(ix, y, iz, "glowstone");
        }
      }
    } else {
      // Interior: air gap, plus a floor slab at each upper storey line.
      if (y % 5 === 0 && y > 0) put(x, y, z, "smooth_stone");
    }
  }

  // Roof deck over interior cells; parapet is already set on edge cells.
  if (!edge) put(x, TOP - 1, z, "smooth_stone");
}

// Roof plant: a small penthouse, AC units and a lightning rod.
const pz0 = minZ + 4, pz1 = minZ + 7;
for (let x = 1; x <= 2; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!has(x, z)) continue;
    put(x, TOP, z, "white_concrete");
    put(x, TOP + 1, z, "white_concrete");
    put(x, TOP + 2, z, "light_gray_concrete");
  }
}
const acZ = maxZ - 2;
if (has(1, acZ)) put(1, TOP, acZ, "iron_block");
if (has(2, acZ)) put(2, TOP, acZ, "iron_block");
for (let y = TOP; y <= TOP + 2; y++) {
  put(1, y, minZ + 1, "lightning_rod", { facing: "up", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
