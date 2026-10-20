import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343814";
const W = 26, HH = 23, D = 7;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, HH, D]);

// ---- footprint and ground lookup ----
const gm = new Map();
for (const [x, z, gr] of cells) gm.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => gm.has(`${x},${z}`);
const minG = Math.min(...gm.values());

// Roof level: about 11 blocks above the lowest ground. R is the exclusive top.
const R = Math.min(HH, minG + 11);
const TOP = R - 1;

function put(x, y, z, b, st) {
  if (x < 0 || x >= W || y < 0 || y >= HH || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, b, st);
  else g.set(x, y, z, b);
}

// Which exterior face a perimeter cell sits on (null = interior cell).
function faceOf(x, z) {
  if (!has(x, z - 1)) return { dir: "north", idx: x };
  if (!has(x, z + 1)) return { dir: "south", idx: x };
  if (!has(x - 1, z)) return { dir: "west", idx: z };
  if (!has(x + 1, z)) return { dir: "east", idx: z };
  return null;
}

// Main entrance: middle of the north (z = 0) frontage.
const frontXs = cells.filter(([, z]) => z === 0).map(([x]) => x).sort((a, b) => a - b);
const entranceX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

// ---- pass 1: shell, foundations, floors, facades ----
for (const [xr, zr, grr] of cells) {
  const x = xr, z = zr, gr = Math.max(0, Math.round(grr));
  const f = faceOf(x, z);
  const perim = !!f;

  // foundation fills solid from 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP; y++) {
    const rel = y - gr;
    let b = null, st = null;

    if (y === gr) {
      b = perim ? "stone_bricks" : "smooth_stone";            // base course / floor slab
    } else if (y === TOP) {
      b = perim ? "stone_bricks" : "smooth_stone";            // parapet cap / roof slab
    } else if (!perim) {
      if (rel === 5) b = "smooth_stone";                      // interior floor slab, air elsewhere
    } else if (y === TOP - 1) {
      b = "light_gray_concrete";                              // cornice
    } else if (rel === 4) {
      b = "red_concrete";                                     // awning band over shopfronts
    } else if (rel === 5) {
      b = "light_gray_concrete";                              // storey string course
    } else if (rel >= 1 && rel <= 3) {
      // ground storey: shopfront
      const bay = f.idx % 3 !== 0;
      const isDoorCol = f.dir === "north" && x === entranceX;
      if (isDoorCol && rel === 1) { b = "dark_oak_door"; st = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }; }
      else if (isDoorCol && rel === 2) { b = "dark_oak_door"; st = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }; }
      else if (isDoorCol && rel === 3) b = "white_concrete";  // transom over door
      else if (bay) b = "glass";
      else b = "white_concrete";
    } else if (rel >= 6 && rel <= 8) {
      // upper storey: punched windows in white walls
      const bay = f.idx % 3 !== 0;
      b = bay ? "glass_pane" : "white_concrete";
    } else {
      b = "white_concrete";
    }

    if (b) put(x, y, z, b, st);
  }

  // warm light behind some upper-storey windows (interior cell behind the pane)
  if (perim && f.idx % 6 === 1) {
    const y = gr + 7;
    let bx = x, bz = z;
    if (f.dir === "north") bz = z + 1;
    else if (f.dir === "south") bz = z - 1;
    else if (f.dir === "west") bx = x + 1;
    else if (f.dir === "east") bx = x - 1;
    if (has(bx, bz) && y < TOP - 1) put(bx, y, bz, "glowstone");
  }

  // warm light behind some ground-storey shopfront glass
  if (perim && f.idx % 6 === 2) {
    const y = gr + 2;
    let bx = x, bz = z;
    if (f.dir === "north") bz = z + 1;
    else if (f.dir === "south") bz = z - 1;
    else if (f.dir === "west") bx = x + 1;
    else if (f.dir === "east") bx = x - 1;
    if (has(bx, bz) && f.idx % 3 !== 0 && y < TOP - 1) put(bx, y, bz, "glowstone");
  }
}

// ---- pass 2: roof equipment ----
for (const [x, z] of [[...gm.keys()].map((k) => k.split(",").map(Number))].flat()) {
  if (R >= HH) break;
  if (x % 8 === 4 && z === 3) put(x, R, z, "barrel");          // water tank
}
if (R < HH && has(12, 3)) put(12, R, 3, "lightning_rod");     // roof mast

g.save(`${DIR}/${ID}.nbt`);
