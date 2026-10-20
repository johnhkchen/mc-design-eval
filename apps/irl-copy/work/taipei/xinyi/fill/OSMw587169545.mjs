import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// No record: read as a 4-storey, c.1980s Taipei commercial block.
// White-tile-look concrete frame, tinted glass curtain bays, stone plinth,
// shopfront ground storey with a central entrance, flat roof with plant
// boxes, a short mast and an aviation light. Roof at y 20 (cornice) and 21 (parapet).

const W = 26, H = 33, D = 15;
const ROOF_DECK = 20;   // roof deck / cornice row
const PARAPET = 21;     // parapet course (roof about 21 above lowest ground)
const WALL_TOP = 19;    // last exterior storey row below the cornice

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587169545.cells.json", "utf8"));

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Face of an exterior cell: which side is open, the inward direction, and the position along the face.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "N", dx: 0, dz: 1, p: x };
  if (!has(x, z + 1)) return { face: "S", dx: 0, dz: -1, p: x };
  if (!has(x - 1, z)) return { face: "W", dx: 1, dz: 0, p: z };
  if (!has(x + 1, z)) return { face: "E", dx: -1, dz: 0, p: z };
  return null;
}

// Entrance: centre of the north (long) face.
const northXs = [];
for (const [x, z] of cells.map(c => [c[0], c[1]])) if (!has(x, z - 1)) northXs.push(x);
const doorX = northXs.length ? Math.floor((Math.min(...northXs) + Math.max(...northXs)) / 2) : -1;

// Wall material by absolute row y (storey k = floor(y/5), row r = y%5).
function wallMat(k, r, p) {
  if (k === 0 && r === 0) return "stone_bricks";        // plinth
  if (r === 0) return "white_concrete";                  // floor belt course
  if (r === 4) return k === 0 ? "white_concrete" : "smooth_quartz"; // lintel / spandrel
  if (k === 0) return p % 3 === 0 ? "stone_bricks" : "glass_pane";  // shopfront bays
  return p % 3 === 0 ? "light_gray_concrete" : "light_blue_stained_glass_pane"; // curtain bays
}

const g = new Voxels([W, H, D]);

for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = gAt(x, z);
  const ext = exterior(x, z);
  const f = ext ? faceOf(x, z) : null;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Walls, floors and roof for this cell, from its ground up.
  for (let y = gr; y <= WALL_TOP; y++) {
    const k = Math.floor(y / 5), r = y % 5;

    if (!ext) {
      // Interior: an air gap with a floor slab at each storey line.
      if (y === gr || (y % 5 === 0)) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Entrance door on the north face (ground storey, rows g and g+1).
    if (f && f.face === "N" && x === doorX && y <= 3 && y <= gr + 1) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    g.set(x, y, z, wallMat(k, r, f ? f.p : 0));

    // Warm light: glowstone on the inside, behind some upper-storey windows.
    if (f && k >= 1 && r === 2 && (f.p * 5 + k * 3) % 5 === 0) {
      const ix = x + f.dx, iz = z + f.dz;
      if (has(ix, iz) && !exterior(ix, iz)) g.set(ix, y, iz, "glowstone");
    }
    // Ground storey: a warm light inside a few shopfront bays.
    if (f && k === 0 && r === 2 && f.p % 6 === 1) {
      const ix = x + f.dx, iz = z + f.dz;
      if (has(ix, iz) && !exterior(ix, iz)) g.set(ix, y, iz, "glowstone");
    }
  }

  if (ext) {
    // Cornice row (exterior), then parapet with light pilasters.
    g.set(x, ROOF_DECK, z, "white_concrete");
    g.set(x, PARAPET, z, f && f.p % 3 === 0 ? "light_gray_concrete" : "white_concrete");
  } else {
    // Roof deck over the interior.
    g.set(x, ROOF_DECK, z, "light_gray_concrete");
  }
}

// Roof plant: air-conditioning boxes on the deck, a central mast with an aviation light.
for (let x = 7; x <= 10; x++) {
  for (let z = 5; z <= 8; z++) {
    if (has(x, z) && !exterior(x, z)) {
      g.set(x, PARAPET, z, "gray_concrete");
      g.set(x, PARAPET + 1, z, "gray_concrete");
    }
  }
}

const mx = Math.floor(W / 2), mz = 7;
if (has(mx, mz)) {
  for (let y = PARAPET; y <= 29; y++) g.set(mx, y, mz, "iron_bars");
  g.set(mx, 30, mz, "redstone_lamp", { lit: "true" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587169545.nbt");
