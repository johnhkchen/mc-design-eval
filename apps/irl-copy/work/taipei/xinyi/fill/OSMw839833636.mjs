import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1990s commercial block on a Xinyi street: two storeys of pale
// tiled concrete over a stone plinth, shopfronts on the street (south) face,
// a white cornice and parapet, and light-grey roof plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833636";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 29, H = 23, D = 13;
const ROOF = 11;        // roof deck top, relative to lowest ground
const STOREY = 5;       // upper floor line
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const GROUND = new Map();
for (const [x, z, gr] of cells) GROUND.set(key(x, z), gr);
const has = (x, z) => GROUND.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassFor = (axisEW) => axisEW
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Facade face of an edge cell: outward direction (priority S, N, E, W).
function faceOf(x, z) {
  if (!has(x, z + 1)) return "S";
  if (!has(x, z - 1)) return "N";
  if (!has(x + 1, z)) return "E";
  if (!has(x - 1, z)) return "W";
  return null;
}
const DIRS = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] };

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const edgeN = !has(x, z - 1), edgeS = !has(x, z + 1);
  const edgeE = !has(x + 1, z), edgeW = !has(x - 1, z);
  const missing = [edgeN, edgeS, edgeE, edgeW].filter(Boolean).length;
  const isEdge = missing > 0;
  const isCorner = missing >= 2;
  const face = faceOf(x, z);
  const ewFace = face === "E" || face === "W";
  const u = ewFace ? z : x;
  const isPier = isCorner || (u % 4 === 0);
  const isEntrance = face === "S" && u === 14;
  const base = Math.max(0, gr);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / plinth course.
  put(x, base, z, isEdge ? "stone_bricks" : "smooth_stone");

  // Upper floor slab (storey line) across the footprint.
  if (base < STOREY) put(x, STOREY, z, isEdge ? "white_concrete" : "smooth_quartz");

  // Roof deck with white cornice on the edge.
  put(x, ROOF, z, isEdge ? "white_concrete" : "light_gray_concrete");

  // Parapet: solid corners and every other edge bay.
  if (isEdge && (isCorner || u % 2 === 0)) put(x, ROOF + 1, z, "white_concrete");

  if (!isEdge) continue;

  // Facade bands between floor and roof.
  for (let y = base + 1; y < ROOF; y++) {
    if (isCorner) { put(x, y, z, "white_concrete"); continue; }
    if (y === STOREY || y === 4 || y === 10) { put(x, y, z, "white_concrete"); continue; }
    if (isPier) { put(x, y, z, "white_concrete"); continue; }
    const lower = y < 4;
    if (lower && face === "S" && isEntrance) continue; // open doorway
    if (lower && face === "S" && y === base + 1 && !isEntrance) {
      put(x, y, z, "glass_pane", glassFor(ewFace));
      continue;
    }
    if (y >= 6 && y <= 9 || lower) {
      put(x, y, z, "glass_pane", glassFor(ewFace));
    }
  }

  // Warm lanterns just inside some upper-floor windows.
  if (!isCorner && !isPier && face) {
    const [dx, dz] = DIRS[face];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && u % 8 === 2) put(ix, 7, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof plant: a small block of AC housing and a lightning rod.
for (let x = 17; x <= 21; x++) {
  for (let z = 4; z <= 7; z++) {
    if (!has(x, z)) continue;
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}
if (has(19, 5)) put(19, ROOF + 3, 5, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
