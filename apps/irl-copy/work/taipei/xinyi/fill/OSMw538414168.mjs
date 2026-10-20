import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414168";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey mid-century Taipei commercial block: granite base, cream
// terrazzo-like walls with white pilasters, blue-glass shopfront at street
// level, a cornice, and a parapet with rooftop plant. Roof at about y 11.
const W = 14, H = 23, D = 20;
const ROOF_Y = 10;          // roof deck (interior) at y 10, parapet at 11
const FLOOR2_Y = 5;         // second-storey floor slab
const MAX_G = 9;

const WALL = "smooth_quartz";
const PIER = "white_concrete";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const ROOFSLAB = "light_gray_concrete";
const FLOOR = "smooth_stone";

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.min(gr, MAX_G)));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Outward normals and the inward offset for each face.
const dirs = {
  north: [0, -1, 0, 1],
  south: [0, 1, 0, -1],
  east: [1, 0, -1, 0],
  west: [-1, 0, 1, 0],
};
function faceOf(x, z) {
  for (const [name, [dx, dz]] of Object.entries(dirs)) {
    if (!has(x + dx, z + dz)) return name;
  }
  return null;
}
const alongIndex = (face, x, z) => (face === "north" || face === "south" ? x : z);

// Pass 1: foundations, floors, walls, piers, glass.
const edgeCells = [];
for (const [x, z] of cells) {
  const gr = gnd(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const face = faceOf(x, z);

  if (!face) {
    // Interior: ground-floor slab, second-storey slab, roof deck. Air between.
    put(x, gr, z, FLOOR);
    if (gr < FLOOR2_Y) put(x, FLOOR2_Y, z, FLOOR);
    put(x, ROOF_Y, z, ROOFSLAB);
    continue;
  }

  edgeCells.push({ x, z, gr, face });

  // Wall column from ground to the roof deck, base course at ground.
  for (let y = gr; y <= ROOF_Y; y++) {
    put(x, y, z, y === gr ? BASE : WALL);
  }
  // Parapet on the roofline.
  put(x, ROOF_Y + 1, z, PIER);

  const idx = alongIndex(face, x, z);
  const mod = ((idx % 3) + 3) % 3;

  if (mod === 0) {
    // White pilaster, full height of the wall.
    for (let y = gr + 1; y <= ROOF_Y; y++) put(x, y, z, PIER);
  } else {
    // Shopfront glazing on storey one.
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, GLASS);
    // Storey-two windows between the floor slab (5) and the spandrel (9).
    for (let y = 6; y <= 8; y++) put(x, y, z, GLASS);
    // Storey-line spandrels stay as WALL (already placed).
  }
}

// Pass 2: entrance on the south face (near the middle, avoiding a pier).
const southCells = edgeCells.filter((c) => c.face === "south");
if (southCells.length) {
  const idxs = southCells.map((c) => c.x);
  const mid = (Math.min(...idxs) + Math.max(...idxs)) / 2;
  const candidates = southCells
    .filter((c) => ((c.x % 3) + 3) % 3 !== 0)
    .sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid));
  const door = candidates[0] ?? southCells[0];
  const gr = door.gr;
  put(door.x, gr, door.z, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, gr + 1, door.z, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Warm lantern under a small lintel above the door.
  put(door.x, gr + 3, door.z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  put(door.x, gr + 2, door.z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 3: warm shroomlights just inside some upper-storey windows.
for (const c of edgeCells) {
  const idx = alongIndex(c.face, c.x, c.z);
  const mod = ((idx % 3) + 3) % 3;
  if (mod !== 2 || idx % 6 !== 2) continue;
  const [, , ix, iz] = dirs[c.face];
  const tx = c.x + ix, tz = c.z + iz;
  if (!has(tx, tz) || faceOf(tx, tz)) continue;
  put(tx, 7, tz, "shroomlight");
}

// Pass 4: roof plant boxes on the roof deck, inside the footprint.
for (const [x, z] of cells) {
  if (faceOf(x, z)) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    put(x, ROOF_Y + 1, z, ROOFSLAB);
    put(x, ROOF_Y + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
