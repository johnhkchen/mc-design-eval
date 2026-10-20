import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988708";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground y (integer)
const ground = new Map();
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(10, Math.round(gy))));
}
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Materials: cream tiled/quartz mid-century Taipei commercial block,
// dark concrete base, glass in aluminium-look frames, stone cornice.
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const WALL = "smooth_quartz";
const PIER = "quartz_pillar";
const FLOOR_SLAB = { type: "bottom", waterlogged: "false" };
const CORNICE = { type: "top", waterlogged: "false" };
const ROOF = "light_gray_concrete";
const PARAPET_CAP = { type: "top", waterlogged: "false" };

// Face detection for an edge cell: returns "N","S","W","E" or null
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

// Entrance column: middle of the footprint on the south face
const xs = cells.map(c => c[0]);
const midX = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);

const cellList = [...ground.entries()].map(([k, gy]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gy };
});

// 1) Foundation and ground floor for every footprint cell
for (const { x, z, gy } of cellList) {
  for (let y = 0; y < gy; y++) put(x, y, z, FOUND);
  const face = faceOf(x, z);
  put(x, gy, z, face ? BASE : FLOOR);
}

// 2) Floor slabs at storey lines (interior and edge) and roof slab
for (const { x, z, gy } of cellList) {
  put(x, gy + 5, z, WALL, null); // placeholder overwritten below for edges
  put(x, gy + 5, z, "smooth_quartz_slab", FLOOR_SLAB);
  put(x, gy + 10, z, ROOF);
}

// 3) Walls, windows, piers, cornice, parapet on perimeter cells
for (const { x, z, gy } of cellList) {
  const face = faceOf(x, z);
  if (!face) continue;

  const idx = (face === "N" || face === "S") ? x : z;
  const slot = ((idx % 4) + 4) % 4;
  const isWin = slot === 1 || slot === 2;
  const alongX = face === "N" || face === "S";
  const glassProps = alongX
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
  const pierProps = { axis: "y" };

  // Wall column from first storey to parapet
  for (let y = gy + 1; y <= gy + 11; y++) put(x, y, z, WALL);

  // Storey 1 shopfront: glass y gy+1..gy+3, transom at gy+4
  for (let y = gy + 1; y <= gy + 3; y++) {
    if (isWin) put(x, y, z, "glass_pane", glassProps);
    else put(x, y, z, PIER, pierProps);
  }
  put(x, gy + 4, z, WALL);

  // Storey 2 windows y gy+6..gy+8, spandrel at gy+9
  for (let y = gy + 6; y <= gy + 8; y++) {
    if (isWin) put(x, y, z, "glass_pane", glassProps);
    else put(x, y, z, PIER, pierProps);
  }
  put(x, gy + 9, z, WALL);

  // Storey line course at gy+5 on the perimeter
  put(x, gy + 5, z, "smooth_quartz_slab", FLOOR_SLAB);

  // Cornice and parapet
  put(x, gy + 10, z, "stone_brick_slab", CORNICE);
  put(x, gy + 11, z, WALL);
  put(x, gy + 11, z, "smooth_quartz_slab", PARAPET_CAP);

  // Warm lights behind some glass
  if (isWin && (x + z) % 5 === 0) put(x, gy + 2, z, "glowstone");
  if (isWin && (x * 2 + z) % 7 === 3) put(x, gy + 7, z, "shroomlight");

  // Main entrance on the south face, centre bay
  if (face === "S" && Math.abs(x - midX) <= 0) {
    put(x, gy + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 3, z, "glass_pane", glassProps);
    // canopy/lintel band across the entrance bay
    put(x, gy + 4, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 4) Rooftop plant: a few air-conditioning units on interior roof cells
for (const { x, z, gy } of cellList) {
  if (faceOf(x, z)) continue;
  if ((x % 6 === 3) && (z % 6 === 3)) {
    put(x, gy + 11, z, "iron_block");
  } else if ((x % 6 === 4) && (z % 6 === 2)) {
    put(x, gy + 11, z, "light_gray_concrete");
    put(x, gy + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
