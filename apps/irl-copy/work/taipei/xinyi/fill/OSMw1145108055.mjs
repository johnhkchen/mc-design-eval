import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1145108055";
const W = 12, H = 23, D = 14;

// Storey and roof lines (absolute y). Roof deck ~11 blocks above lowest ground.
const FLOOR = 5;      // floor line between ground and upper storey
const CORNICE = 10;   // top of upper storey
const ROOF = 11;      // roof deck
const PARAPET = 12;   // parapet course on roof edge

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(10, Math.max(0, Math.round(gr))));
}
const inFp = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
function put(x, y, z, id, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

const paneFor = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, floor slab, roof deck on every footprint cell.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (FLOOR >= gr) put(x, FLOOR, z, "smooth_quartz");
  put(x, ROOF, z, "light_gray_concrete");
}

// Pass 2: facades on edge cells.
function facade(x, z, y, gr, face, c) {
  const shop = face === "N" && gr <= 3;
  if (y === FLOOR) {
    put(x, y, z, "smooth_quartz");
    return;
  }
  if (y < FLOOR) {
    // Ground storey
    if (shop) {
      if (c % 3 === 0) return put(x, y, z, "polished_andesite");
      if (c === 7 && gr <= 2) {
        if (y === gr) return put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        if (y === gr + 1) return put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      }
      if (y === 3) return put(x, y, z, "smooth_quartz");
      if (y === 4) return put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      if (c === 1 && y === 1) return put(x, y, z, "glowstone");
      return put(x, y, z, "light_blue_stained_glass_pane", paneFor(face));
    }
    if (c % 3 === 0) return put(x, y, z, "smooth_quartz");
    if (y === gr || y === FLOOR - 1) return put(x, y, z, "white_concrete");
    return put(x, y, z, "light_blue_stained_glass_pane", paneFor(face));
  }
  if (y >= 6 && y <= 9) {
    // Upper storey
    if (c % 3 === 0) return put(x, y, z, "smooth_quartz");
    if (y === 6) return put(x, y, z, c % 6 === 4 ? "shroomlight" : "white_concrete");
    if (y === 9) return put(x, y, z, "white_concrete");
    return put(x, y, z, "light_blue_stained_glass_pane", paneFor(face));
  }
  if (y === CORNICE) return put(x, y, z, "smooth_quartz");
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = [];
  if (!inFp(x, z - 1)) faces.push(["N", x]);
  if (!inFp(x, z + 1)) faces.push(["S", x]);
  if (!inFp(x - 1, z)) faces.push(["W", z]);
  if (!inFp(x + 1, z)) faces.push(["E", z]);
  if (faces.length === 0) continue;

  // Cornice and parapet on all roof-edge cells.
  put(x, CORNICE, z, "smooth_quartz");
  put(x, PARAPET, z, "smooth_quartz");

  for (const [face, c] of faces) {
    for (let y = gr; y <= CORNICE - 1; y++) facade(x, z, y, gr, face, c);
  }
}

// Pass 3: roof equipment box and a short mast on the roof.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = !inFp(x, z - 1) || !inFp(x, z + 1) || !inFp(x - 1, z) || !inFp(x + 1, z);
  if (edge) continue;
  if (x >= 4 && x <= 7 && z >= 5 && z <= 8) {
    put(x, 12, z, "gray_concrete");
    put(x, 13, z, "smooth_quartz");
  }
}
if (inFp(5, 6)) {
  for (let y = 14; y <= 16; y++) put(5, y, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
