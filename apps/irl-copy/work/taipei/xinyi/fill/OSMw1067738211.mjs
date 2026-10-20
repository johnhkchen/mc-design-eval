import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1067738211.cells.json", "utf8"));

const W = 21, H = 33, D = 19;
const g = new Voxels([W, H, D]);

// footprint lookup: key "x,z" -> ground height
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// facade face and index along that face
function faceOf(x, z) {
  if (!has(x, z + 1)) return { face: "S", idx: x };
  if (!has(x, z - 1)) return { face: "N", idx: x };
  if (!has(x + 1, z)) return { face: "E", idx: z };
  return { face: "W", idx: z };
}

const SLAB_LEVELS = [5, 10, 15, 20]; // floor slabs (top of roof slab at 20)
const DOOR_IDX = 10;

for (const [x, z, gy] of cells) {
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y <= gy; y++) g.set(x, y, z, "stone_bricks");

  // floor slabs across the full footprint
  for (const y of SLAB_LEVELS) if (y > gy) g.set(x, y, z, "smooth_stone");

  // interior volume stays air; only the shell is built
  if (!isEdge(x, z)) continue;

  const { face, idx } = faceOf(x, z);

  // walls from just above ground to the parapet
  for (let y = gy + 1; y <= 20; y++) {
    if (y <= 4) {
      // ground storey: base course, shopfront glass, dark lintel
      if (y === gy + 1) {
        g.set(x, y, z, "polished_andesite");
      } else if (y === 4) {
        g.set(x, y, z, "dark_oak_planks");
      } else {
        g.set(x, y, z, idx % 3 === 0 ? "white_concrete" : "glass");
      }
      continue;
    }
    const m = y % 5; // 0 = slab line, 1-3 = window band, 4 = spandrel
    if (m === 0) {
      g.set(x, y, z, "smooth_stone"); // storey line / cornice-like band
    } else if (m >= 1 && m <= 3) {
      g.set(x, y, z, idx % 3 === 0 ? "white_concrete" : "light_blue_stained_glass_pane");
    } else {
      g.set(x, y, z, "white_concrete"); // spandrel
    }
  }

  // parapet and cap
  g.set(x, 21, z, "white_concrete");
  g.set(x, 22, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
}

// entrance on the south facade, centred
for (const [x, z, gy] of cells) {
  if (!isEdge(x, z)) continue;
  const { face, idx } = faceOf(x, z);
  if (face !== "S" || idx !== DOOR_IDX) continue;
  const lo = gy + 1, up = gy + 2;
  if (up > 4) continue;
  g.set(x, lo, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, up, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// warm light behind some windows: glowstone on upper floors, interior cells only
for (const [x, z, gy] of cells) {
  if (isEdge(x, z)) continue;
  if (x % 4 === 2 && z % 4 === 2) {
    for (const y of [7, 12, 17]) {
      if (y > gy) g.set(x, y, z, (x + z) % 8 === 0 ? "glowstone" : "shroomlight");
    }
  }
  if (x % 5 === 2 && z % 5 === 1 && gy < 2) g.set(x, 2, z, "glowstone");
}

// rooftop equipment: AC plant boxes on the roof slab
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if (x % 6 === 3 && z % 5 === 2) {
    g.set(x, 21, z, "light_gray_concrete");
    g.set(x, 22, z, "iron_block");
  }
}

// central stair and lift tower, rising above the roof
for (let x = 9; x <= 11; x++) {
  for (let z = 7; z <= 9; z++) {
    if (!has(x, z)) continue;
    const edgeTower = x === 9 || x === 11 || z === 7 || z === 9;
    for (let y = 21; y <= 24; y++) {
      if (edgeTower) {
        g.set(x, y, z, y === 23 ? "light_blue_stained_glass_pane" : "light_gray_concrete");
      } else {
        g.set(x, y, z, "air");
      }
    }
    g.set(x, 25, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1067738211.nbt");
