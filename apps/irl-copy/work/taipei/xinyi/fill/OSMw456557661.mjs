import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof ~21 blocks above lowest ground, 8 x 21 footprint.
// Read as a 1980s-90s Taipei mid-rise: four storeys of 5 blocks, a granite base,
// cream concrete walls with quartz storey bands, light-blue glass bays, a shopfront
// on the street (north, z = 0) face, a cornice and parapet, and a rooftop housing.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw456557661";
const W = 8, H = 33, D = 21;
const STOREY = 5, STOREYS = 4, ROOF_Y = 20, PARAPET_Y = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior face of each footprint cell: n = street (z min), s = back (z max),
// w = x 0 side, e = x max side.
const faceOf = (x, z) => {
  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  const count = [n, s, w, e].filter(Boolean).length;
  return { n, s, w, e, count, single: count === 1, ext: count > 0 };
};

// Pass 1: body, foundation, base, bands, windows, roof.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faceOf(x, z);
  const face = f.n ? "n" : f.s ? "s" : f.w ? "w" : "e";

  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  for (let y = gr; y <= PARAPET_Y; y++) {
    if (y === PARAPET_Y) {
      if (f.ext) put(x, y, z, "white_concrete");
      continue;
    }
    if (y === ROOF_Y) {
      put(x, y, z, f.ext ? "smooth_quartz" : "gray_concrete");
      continue;
    }

    const k = Math.floor(y / STOREY);
    const ly = y % STOREY;

    if (!f.ext) {
      // Interior: air, with a floor slab at the base of each storey.
      if (ly === 0) put(x, y, z, k === 0 ? "gray_concrete" : "smooth_quartz");
      continue;
    }

    if (y === gr) { put(x, y, z, "polished_granite"); continue; } // base course
    if (ly === 0) { put(x, y, z, "smooth_quartz"); continue; }     // storey line
    if (ly === 4) { put(x, y, z, "white_concrete"); continue; }    // spandrel
    if (!f.single) { put(x, y, z, "white_concrete"); continue; }   // corner pier

    const u = (face === "n" || face === "s") ? x : z;
    const maxU = (face === "n" || face === "s") ? W - 1 : D - 1;

    if (face === "n" && k === 0) {
      // Shopfront: glass between piers at u = 0 and u = W-1.
      put(x, y, z, u >= 1 && u <= W - 2 ? "light_blue_stained_glass" : "white_concrete");
      continue;
    }
    const isWin = u % 3 === 1 && u > 0 && u < maxU;
    put(x, y, z, isWin ? "light_blue_stained_glass_pane" : "white_concrete");
  }
}

// Pass 2: entrance on the street face, lit by a hanging lantern.
if (has(3, 0)) {
  put(3, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(3, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(3, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 3: lanterns in the air gap behind some lit window bays, one per floor.
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faceOf(x, z);
  if (!f.single) continue;
  const face = f.n ? "n" : f.s ? "s" : f.w ? "w" : "e";
  const u = (face === "n" || face === "s") ? x : z;
  if (u % 6 !== 1) continue;
  const inX = face === "w" ? x + 1 : face === "e" ? x - 1 : x;
  const inZ = face === "n" ? z + 1 : face === "s" ? z - 1 : z;
  if (!has(inX, inZ) || faceOf(inX, inZ).ext) continue;
  for (let k = 1; k < STOREYS; k++) {
    put(inX, k * STOREY + 1, inZ, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 4: rooftop housing (stair and lift core) with glazed sides, a rooftop
// unit, and a lightning-rod mast.
for (let x = 2; x <= 5; x++) {
  for (let z = 7; z <= 13; z++) {
    if (!has(x, z)) continue;
    const edge = x === 2 || x === 5 || z === 7 || z === 13;
    for (let y = 21; y <= 24; y++) {
      if (!edge) { continue; }
      const mid = (x === 2 || x === 5) ? (z >= 9 && z <= 11) : (x >= 3 && x <= 4);
      const glass = (y === 22 || y === 23) && mid;
      put(x, y, z, glass ? "light_blue_stained_glass_pane" : "white_concrete");
    }
    put(x, 25, z, "gray_concrete");
  }
}
if (has(3, 10)) {
  for (let y = 26; y <= 28; y++) put(3, y, 10, "lightning_rod", { facing: "up" });
}
for (const [x, z] of [[1, 16], [2, 16], [1, 17], [2, 17]]) {
  if (!has(x, z)) continue;
  put(x, 21, z, "light_gray_concrete");
  put(x, 22, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
