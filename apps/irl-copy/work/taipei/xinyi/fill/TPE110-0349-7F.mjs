import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE110-0349-7F: 2021 mid-rise mixed-use block on Xinyi Road.
// Four storeys of 5 blocks plus a crowned top band to a 24-block roof line,
// cream concrete piers with smoky glass bays, a stone base, a shopfront on the
// street (z=0) face with a central entrance, and a rooftop plant enclosure.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE110-0349-7F";
const W = 22, H = 36, D = 7;
const ROOF = 23;          // top course of the parapet (roof line at y=24)
const DOOR_X = 10;        // entrance on the street face
const PIER = 3;           // pier every 3 blocks along the facade

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, clamp(Math.floor(gr), 0, ROOF - 1));
}

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Which outward face a footprint cell sits on (null = interior cell).
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Facade logic for one perimeter cell, from its base course up to the roof.
function perimeter(x, z, gr, face) {
  const u = (face === "N" || face === "S") ? x : z;
  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, "light_gray_concrete"); continue; } // parapet cap
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (y < 5) {
      if (y === 4) { put(x, y, z, "light_gray_concrete"); continue; }  // shopfront fascia
      if (u % PIER === 0) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "light_blue_stained_glass");
      continue;
    }
    const off = y % 5;
    if (off === 0) put(x, y, z, "light_gray_concrete");                // floor line
    else if (off === 4) put(x, y, z, "white_concrete");                // spandrel
    else if (u % PIER === 0) put(x, y, z, "smooth_quartz");           // pier
    else put(x, y, z, "light_blue_stained_glass");                     // glazing
  }
}

// Interior cells: foundation to the ground, then floor slabs only (air gap behind glass).
function interior(x, z, gr) {
  const levels = new Set([gr, 5, 10, 15, 20].filter(y => y >= gr && y < ROOF));
  for (const y of levels) put(x, y, z, "light_gray_concrete");
  put(x, ROOF, z, "gray_concrete"); // roof deck
}

// Build every footprint cell.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  const face = faceOf(x, z);
  if (face) perimeter(x, z, gr, face);
  else interior(x, z, gr);
}

// Street-face entrance: dark oak doors in the central bay, with warm light inside.
if (has(DOOR_X, 0)) {
  const gr = gAt(DOOR_X, 0);
  if (gr + 2 <= 3) {
    put(DOOR_X, gr + 1, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(DOOR_X, gr + 2, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  put(DOOR_X, gr + 1, 1, "shroomlight");
}

// Warm lights behind some street-face windows (interior cell at z=1).
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (z !== 0 || faceOf(x, z) !== "N") continue;
  if (x % 6 !== 2 || x === DOOR_X) continue;
  if (!has(x, 1) || faceOf(x, 1)) continue;
  for (let y = gr + 1; y < ROOF; y++) {
    if (y % 5 === 2) put(x, y, 1, "shroomlight");
  }
}

// Rooftop plant enclosure on the interior roof deck, with a lightning rod.
for (let x = 7; x <= 14; x++) {
  for (let z = 2; z <= 4; z++) {
    if (!has(x, z)) continue;
    const ring = x === 7 || x === 14 || z === 2 || z === 4;
    if (ring) {
      put(x, ROOF + 1, z, "light_gray_concrete");
      put(x, ROOF + 2, z, "light_gray_concrete");
    }
    put(x, ROOF + 3, z, "smooth_stone");
  }
}
if (has(DOOR_X, 3)) {
  put(DOOR_X, ROOF + 4, 3, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
