import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw662834819";
const W = 179, H = 23, D = 22;

// Two-storey Taipei-style commercial block: white tiled concrete walls, grey
// frames, open arcade (five-foot way) on the street side, glazed shopfront and
// upper windows, cornice and parapet, rooftop plant and warm lights.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS = "light_blue_stained_glass_pane";
const PIER = "white_concrete";
const FRAME = "light_gray_concrete";

// Street (front) side is z = 0 with the arcade; door bays chosen along it.
const DOOR_A = new Set([20, 88, 156]);

const isEdgeX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const isEdgeZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const isEdge = (x, z) => isEdgeX(x, z) || isEdgeZ(x, z);

for (const [x, z, f] of cells) {
  // Foundation and base course
  for (let y = 0; y < f; y++) put(x, y, z, "gray_concrete");
  put(x, f, z, "smooth_stone");

  const edge = isEdge(x, z);
  const runX = isEdgeZ(x, z); // facade runs along x
  const a = runX ? x : z;

  // ---- Ground floor (f+1 .. f+4) ----
  if (z <= 1 && runX) {
    // Arcade: open bays with pillars on every fourth x
    if (a % 4 === 0) {
      for (let y = f + 1; y <= f + 4; y++) put(x, y, z, PIER);
    }
  } else if (z === 2 && has(x, z)) {
    // Shopfront line
    if (DOOR_A.has(x)) {
      put(x, f + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, f + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      for (let y = f + 3; y <= f + 3; y++) put(x, y, z, GLASS, PANE_X);
      put(x, f + 4, z, FRAME);
    } else if (a % 4 === 0) {
      for (let y = f + 1; y <= f + 4; y++) put(x, y, z, PIER);
    } else {
      for (let y = f + 1; y <= f + 3; y++) put(x, y, z, GLASS, runX ? PANE_X : PANE_Z);
      put(x, f + 4, z, FRAME);
    }
  } else if (edge) {
    // Other ground-floor exterior walls
    for (let y = f + 1; y <= f + 4; y++) {
      if (y === f + 4) put(x, y, z, FRAME);
      else if (a % 4 === 0) put(x, y, z, PIER);
      else put(x, y, z, GLASS, runX ? PANE_X : PANE_Z);
    }
  }

  // ---- Upper floor (f+5 .. f+11) ----
  put(x, f + 5, z, FRAME); // storey line / slab over everything

  if (edge) {
    for (let y = f + 6; y <= f + 8; y++) {
      if (a % 4 === 0) put(x, y, z, PIER);
      else put(x, y, z, GLASS, runX ? PANE_X : PANE_Z);
    }
    put(x, f + 9, z, FRAME);
    put(x, f + 10, z, "smooth_quartz");   // cornice
    put(x, f + 11, z, PIER);              // parapet
  } else {
    put(x, f + 10, z, "gray_concrete");   // roof deck
    // Rooftop plant blocks
    if (x % 24 >= 6 && x % 24 <= 11 && z >= 7 && z <= 13) {
      put(x, f + 11, z, FRAME);
      put(x, f + 12, z, FRAME);
    }
  }
}

// Warm lights behind some upper windows on the exterior walls
for (const [x, z, f] of cells) {
  if (!isEdge(x, z)) continue;
  const runX = isEdgeZ(x, z);
  const a = runX ? x : z;
  if (a % 8 !== 5) continue;
  let dx = 0, dz = 0;
  if (runX) dz = z === 0 ? 1 : (z === D - 1 ? -1 : 0);
  else dx = x === 0 ? 1 : (x === W - 1 ? -1 : 0);
  if (dx === 0 && dz === 0) continue;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  put(ix, f + 6, iz, "glowstone");
}

// Entrance lanterns and cornice lights on the street side
for (const [x, z, f] of cells) {
  if (z === 2 && DOOR_A.has(x)) {
    put(x, f + 4, 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
  if (z === 0 && isEdgeZ(x, z) && x % 30 === 15) {
    put(x, f + 12, z, "sea_lantern");
  }
}

g.save(`${DIR}/${ID}.nbt`);
