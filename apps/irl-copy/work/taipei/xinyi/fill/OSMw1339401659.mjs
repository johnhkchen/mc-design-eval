import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 21 x 7 footprint, roof ~12 blocks above lowest ground.
// Reading: a two-storey 1980s Taipei commercial/office block with a granite
// shopfront, white tiled facade, light-grey string courses, blue-tinted glass
// panes and a parapet. Roof is set absolutely at minG + 12 so the top is level.

const W = 21, H = 24, D = 7;
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339401659.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1339401659.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

const T = minG + 12;      // roof top (exclusive): roof slab sits at T-1
const F1 = minG + 5;      // first floor / storey line
const F2 = minG + 10;     // parapet line

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const paneX = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const paneZ = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

const doorLower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const doorUpper = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [x, z, gc] of cells) {
  // Foundation: solid stone from y 0 up to this cell's ground.
  for (let y = 0; y < gc && y < H; y++) put(x, y, z, "stone_bricks");

  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const front = !has(x, z - 1);          // street face (z = min side)
  const back = !has(x, z + 1);
  const alongX = front || back;          // wall runs along x
  const iz = front ? z + 1 : z - 1;      // interior cell behind the glass

  for (let y = gc; y < T; y++) {
    // Roof slab
    if (y === T - 1) {
      put(x, y, z, edge ? "smooth_stone" : "stone_bricks");
      continue;
    }

    // Interior cells: only floor slabs and roof, air elsewhere (no interiors)
    if (!edge) {
      if (y === F1 || y === F2) put(x, y, z, "stone");
      continue;
    }

    // Storey lines
    if (y === F1 || y === F2) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Parapet above second floor
    if (y > F2) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Ground storey: shopfront on street face
    if (y < F1) {
      const lo = y - minG;
      if (front) {
        if (lo === 0) put(x, y, z, "polished_granite");
        else if (lo === 4) put(x, y, z, "red_concrete");        // fascia sign band
        else if (x % 3 === 0 || x === 0 || x === 20) put(x, y, z, "polished_granite");
        else if (x === 10 && (lo === 1 || lo === 2)) {
          put(x, y, z, "oak_door", lo === 1 ? doorLower : doorUpper);
        } else put(x, y, z, "light_blue_stained_glass");
      } else {
        put(x, y, z, lo === 0 ? "polished_granite" : "white_concrete");
      }
      continue;
    }

    // Second storey: window grid with mullions
    const row = y - F1;
    if (row === 4) {
      put(x, y, z, "light_gray_concrete");                       // cornice/string course
    } else if (row >= 1 && row <= 3) {
      const mullion = alongX ? (x % 3 === 0 || x === 0 || x === 20) : false;
      if (mullion) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", alongX ? paneX : paneZ);
        // warm light behind some glass, inside the air gap
        if (alongX && row === 2 && x % 6 === 4 && has(x, iz)) {
          put(x, y, iz, "glowstone");
        }
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

// Rooftop air-conditioning plant, on the roof slab (only if it fits the canvas)
if (T + 2 < H) {
  for (let x = 15; x <= 17; x++) for (let z = 2; z <= 4; z++) {
    if (has(x, z)) put(x, T, z, "light_gray_concrete");
  }
  if (has(16, 3)) put(16, T + 1, 3, "white_concrete");
}

g.save(OUT);
