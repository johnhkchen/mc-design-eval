import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no building data. Read as a 1980s-90s Xinyi office block:
// four storeys on a granite-look plinth, cream quartz spandrels, white concrete
// mullions, tinted blue glass, grey roof membrane, parapet, and a rooftop plant box.
// Roof sits ~21 blocks above the lowest ground (4 storeys x 5 + parapet).

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1016280195";
const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));

const W = 28, H = 33, D = 21;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

let minX = Infinity, maxX = -Infinity;
for (const [x] of cells) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
const cx = (minX + maxX) / 2;

const STOREYS = 4;
const STOREY_H = 5;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Exterior faces: a neighbour outside the footprint marks an edge.
  const miss = [];
  if (!has(x - 1, z)) miss.push("W");
  if (!has(x + 1, z)) miss.push("E");
  if (!has(x, z - 1)) miss.push("N");
  if (!has(x, z + 1)) miss.push("S");
  const edge = miss.length > 0;
  const corner = miss.length >= 2;
  const face = miss[0];
  const u = face === "W" || face === "E" ? z : x;

  // Inward neighbour (interior cell directly behind the glass).
  let inX = null, inZ = null;
  if (face === "W") { inX = x + 1; inZ = z; }
  else if (face === "E") { inX = x - 1; inZ = z; }
  else if (face === "N") { inX = x; inZ = z + 1; }
  else if (face === "S") { inX = x; inZ = z - 1; }

  for (let s = 0; s < STOREYS; s++) {
    const b = gr + STOREY_H * s;

    // Floor slab / base course on every cell.
    if (s === 0 && edge) put(x, b, z, "polished_andesite");
    else put(x, b, z, "smooth_quartz");

    if (!edge) continue;

    // Facade band.
    if (corner) {
      put(x, b + 1, z, "white_concrete");
      put(x, b + 2, z, "white_concrete");
      put(x, b + 3, z, "white_concrete");
    } else if (s === 0 && (face === "N" || face === "S") && Math.abs(u - cx) <= 0.5) {
      // Central entrance on the north/south ground storey.
      const facing = face === "N" ? "north" : "south";
      put(x, b + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, b + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, b + 3, z, "smooth_quartz");
    } else if (u % 3 === 0) {
      // Mullion column.
      put(x, b + 1, z, "white_concrete");
      put(x, b + 2, z, "white_concrete");
      put(x, b + 3, z, "white_concrete");
    } else if (s === 0) {
      // Shopfront glazing with a spandrel head.
      put(x, b + 1, z, "light_blue_stained_glass_pane");
      put(x, b + 2, z, "light_blue_stained_glass_pane");
      put(x, b + 3, z, "smooth_quartz");
    } else {
      // Office window band.
      put(x, b + 1, z, "light_blue_stained_glass_pane");
      put(x, b + 2, z, "light_blue_stained_glass_pane");
      put(x, b + 3, z, "light_blue_stained_glass_pane");
    }

    // Spandrel above each window band.
    put(x, b + 4, z, "smooth_quartz");

    // Warm light on the floor just behind some windows.
    const isWindow = !corner && !(s === 0 && (face === "N" || face === "S") && Math.abs(u - cx) <= 0.5) && u % 3 !== 0;
    if (isWindow && has(inX, inZ) && (u + s) % 3 === 1) {
      put(inX, b + 1, inZ, "glowstone");
    }
  }

  // Roof: membrane on interior cells, parapet on the edge.
  const roofY = gr + STOREY_H * STOREYS; // gr + 20
  if (edge) {
    put(x, roofY, z, "smooth_quartz");
    put(x, roofY + 1, z, "smooth_quartz");
  } else {
    put(x, roofY, z, "gray_concrete");
  }
}

// Rooftop plant box: a low walled enclosure in the middle of the roof.
const roofBase = (gx, gz) => {
  const gr = ground.get(key(gx, gz));
  return gr === undefined ? null : gr + STOREY_H * STOREYS;
};
for (let x = 8; x <= 19; x++) {
  for (let z = 6; z <= 14; z++) {
    const rb = roofBase(x, z);
    if (rb === null) continue;
    const ring = x === 8 || x === 19 || z === 6 || z === 14;
    if (!ring) continue;
    put(x, rb + 1, z, "light_gray_concrete");
    put(x, rb + 2, z, "light_gray_concrete");
  }
}

g.save(`${SRC}.nbt`);
