import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey low-rise commercial block, Xinyi district: white-tile and concrete
// frame, shopfront ground floor on the street (z = 0) face, ribbon windows above,
// cornice and parapet, rooftop plant. Roof sits 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986979";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, D = 9, H = 23;
const g = new Voxels([W, H, D]);

const gr = new Map();
for (const [x, z, h] of cells) gr.set(`${x},${z}`, h);
const inside = (x, z) => gr.has(`${x},${z}`);
const ground = (x, z) => gr.get(`${x},${z}`);
const B = Math.min(...cells.map((c) => c[2])); // lowest ground, y 0 reference

const edge = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// Street frontage is the z = 0 side.
function faceOf(x, z) {
  if (!inside(x, z - 1)) return "front";
  if (!inside(x, z + 1)) return "back";
  if (!inside(x - 1, z)) return "west";
  return "east";
}

const ROOF_CORNICE = B + 10;
const PARAPET = B + 11;
const BAND = B + 5;      // storey line between floors
const SPAN_TOP = B + 4;  // top spandrel of storey 1

function wallId(isFront, pier, x, z, y, g0) {
  if (y >= PARAPET) return "white_concrete";
  if (y === ROOF_CORNICE) return "smooth_quartz";
  if (y === BAND) return "light_gray_concrete";
  if (y >= BAND + 1 && y <= B + 9) {
    if (y === B + 6 || y === B + 9) return "white_concrete";
    if (pier) return "white_concrete";
    return "light_blue_stained_glass";
  }
  // storey 1, from ground g0 up to SPAN_TOP
  if (y === g0) return "polished_andesite";
  if (pier) return "white_concrete";
  if (isFront && y === g0 + 3) return "gray_concrete"; // shopfront fascia
  if (y === SPAN_TOP) return "white_concrete";
  return "light_blue_stained_glass";
}

// Foundations, shell and interior floors
for (const [x, z, h] of cells) {
  for (let y = 0; y < h; y++) g.set(x, y, z, "stone_bricks");

  if (edge(x, z)) {
    const face = faceOf(x, z);
    const isFront = face === "front";
    const along = face === "front" || face === "back" ? x : z;
    const L = face === "front" || face === "back" ? W : D;
    const pier = along === 0 || along === L - 1 || along % 3 === 0;
    for (let y = h; y <= PARAPET; y++) {
      const id = wallId(isFront, pier, x, z, y, h);
      if (id) g.set(x, y, z, id);
    }
  } else {
    // interior: air, with a floor slab at the storey line and a roof slab
    if (h <= BAND) g.set(x, BAND, z, "smooth_stone");
    g.set(x, ROOF_CORNICE, z, "gray_concrete");
  }
}

// Shopfront entrance on the street face, centred at x = 9
if (inside(9, 0) && edge(9, 0)) {
  const g0 = ground(9, 0);
  g.set(9, g0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(9, g0 + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm light behind some windows (interior cells beside the street face)
for (let x = 1; x < W - 1; x++) {
  if (!inside(x, 1) || edge(x, 1)) continue;
  if (x % 6 === 4) {
    g.set(x, B + 7, 1, "glowstone");
  }
  if (x % 6 === 1) {
    const g0 = ground(x, 1);
    if (g0 + 1 <= B + 4) g.set(x, g0 + 1, 1, "shroomlight");
  }
}

// Rooftop plant: small screened units on the roof slab
for (const [x, z] of [[4, 3], [5, 3], [13, 5], [14, 5]]) {
  if (inside(x, z) && !edge(x, z)) {
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
