import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020163";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 8 (x) x 17 (z), 23 blocks tall.
const W = 8, H = 23, D = 17;
const vox = new Voxels([W, H, D]);

// Era: 1980s-90s Xinyi low-rise commercial block. Two storeys, tiled white
// facade, stone-brick plinth and cornice, ground-floor shopfront, flat roof
// with parapet. Roof top sits at y=11 above the lowest ground.
const FLOOR1 = 5;   // slab between storeys
const ROOF = 10;    // roof slab / cornice course
const TOP = 11;     // parapet top

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
function faceOf(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  return "east";
}
function inward(face, x, z) {
  switch (face) {
    case "north": return [x, z + 1];
    case "south": return [x, z - 1];
    case "west": return [x + 1, z];
    default: return [x - 1, z];
  }
}
const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
function put(x, y, z, id, props) {
  if (!inBounds(x, y, z)) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

const minZ = Math.min(...cells.map(([, z]) => z));

// Interior columns on a regular grid, away from the facades.
const isColumn = (x, z) => (x === 2 || x === 5) && (z === 4 || z === 8 || z === 12);

for (const [cx, cz, cg0] of cells) {
  const gr = Math.round(cg0);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(cx, y, cz, "stone_bricks");

  if (!isEdge(cx, cz)) {
    // Interior: floor slabs and roof slab, columns, air elsewhere (no interiors).
    for (let y = gr; y <= ROOF; y++) {
      if (y === gr || y === FLOOR1 || y === ROOF) put(cx, y, cz, "smooth_stone");
    }
    if (isColumn(cx, cz)) {
      for (let y = gr + 1; y < ROOF; y++) {
        if (y !== FLOOR1) put(cx, y, cz, "polished_andesite");
      }
    }
    // Small rooftop air-handling plant on two interior cells.
    if (cx >= 3 && cx <= 4 && cz >= 7 && cz <= 8) {
      put(cx, 11, cz, "light_gray_concrete");
      put(cx, 12, cz, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter (facade) cell.
  const face = faceOf(cx, cz);
  const u = (face === "north" || face === "south") ? cx : cz;
  const isWindowCol = u % 2 === 1;
  const isDoorCell = face === "north" && cz === minZ && u === 3;
  const doorOK = gr + 2 <= 3;

  for (let y = gr; y <= TOP; y++) {
    if (y === gr) {
      // Plinth course.
      put(cx, y, cz, "polished_andesite");
    } else if (y < FLOOR1) {
      if (y === FLOOR1 - 1) {
        // Shopfront lintel band.
        put(cx, y, cz, "stone_bricks");
      } else if (isDoorCell && doorOK && (y === gr + 1 || y === gr + 2)) {
        put(cx, y, cz, "dark_oak_door", {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else {
        // Shopfront: glass bays between white piers.
        put(cx, y, cz, isWindowCol ? "glass" : "white_concrete");
      }
    } else if (y === FLOOR1) {
      // Storey line.
      put(cx, y, cz, "stone_bricks");
    } else if (y < ROOF) {
      // Upper storey: framed windows between tiled piers.
      if (isWindowCol) {
        if (y === 6 || y === 9) put(cx, y, cz, "stone_bricks");
        else put(cx, y, cz, "light_blue_stained_glass");
      } else {
        put(cx, y, cz, "white_concrete");
      }
    } else if (y === ROOF) {
      // Cornice.
      put(cx, y, cz, "smooth_stone");
    } else {
      // Parapet.
      put(cx, y, cz, "white_concrete");
    }
  }

  // Warm light behind some upper windows, in the air gap just inside the glass.
  if (isWindowCol && (u === 1 || u === 5)) {
    const [ix, iz] = inward(face, cx, cz);
    if (has(ix, iz) && !isEdge(ix, iz) && gr <= 7) {
      put(ix, 7, iz, "shroomlight");
    }
  }
}

vox.save(`${DIR}/${ID}.nbt`);
