import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Taipei commercial/office block, c. 1985-1995: white concrete frame,
// tinted glass bands, stone-clad shopfront, light-grey spandrels, smooth-stone
// cornice, parapet and a central plant penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643833930";
const W = 22, H = 38, D = 20;

const ROOF = 25;   // roof slab level (absolute y)
const PAR = 26;    // parapet course (absolute y)
const PEN_TOP = 28;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(([x, z, gr]) => [x, z, Math.round(gr)]);
const gmin = Math.min(...cells.map(c => c[2]));

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr - gmin);
const inside = (x, z) => ground.has(key(x, z));

// Number of orthogonal neighbours outside the footprint.
const missing = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inside(x + dx, z + dz)).length;
const isEdge = (x, z) => missing(x, z) > 0;
const isCorner = (x, z) => missing(x, z) >= 2;

// Entrance: south-facing (+z open) edge cell nearest the footprint's centre line.
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let entrance = null;
{
  const south = cells.filter(([x, z]) => !inside(x, z + 1));
  const pool = south.length ? south : cells.filter(([x, z]) => isEdge(x, z));
  pool.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx) || b[1] - a[1]);
  if (pool.length) entrance = key(pool[0][0], pool[0][1]);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isFloorLine = (y, gr) => y === gr || y % 5 === 0;

for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  if (gr > ROOF) continue;
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= PAR; y++) {
    const floor = isFloorLine(y, gr);
    const b = Math.max(gr, Math.floor(y / 5) * 5); // storey base
    const o = y - b;                               // offset within storey

    if (!edge) {
      // Interior: floor slabs only, air elsewhere, warm lanterns behind glass.
      if (y === PAR) continue;
      if (floor) {
        put(x, y, z, y === ROOF ? "smooth_stone" : "light_gray_concrete");
      } else if (o === 1 && y < ROOF && (x * 3 + z * 5 + y) % 9 === 0) {
        put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
      continue;
    }

    // Edge (facade) cells.
    if (y === PAR) {
      put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (floor) {
      put(x, y, z, y === ROOF ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (corner) {
      put(x, y, z, "white_concrete");
      continue;
    }
    const pattern = (x + z) % 3 !== 0; // window bays between piers
    const isGround = b === gr;

    if (o === 4) {
      put(x, y, z, isGround ? "stone_bricks" : "light_gray_concrete");
      continue;
    }

    if (isGround && key(x, z) === entrance && (o === 1 || o === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: o === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (isGround) {
      put(x, y, z, pattern ? "light_blue_stained_glass_pane" : "stone_bricks");
    } else {
      put(x, y, z, pattern ? "light_blue_stained_glass_pane" : "white_concrete");
    }
  }
}

// Plant penthouse on the roof, centred on the footprint.
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if (x < 6 || x > 15 || z < 5 || z > 14) continue;
  if (ground.get(key(x, z)) > ROOF) continue;
  put(x, PAR, z, "light_gray_concrete");
  put(x, PAR + 1, z, "light_gray_concrete");
  put(x, PEN_TOP, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
