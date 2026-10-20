import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541986971.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541986971.nbt";

// Footprint 16 x 9, two storeys of 5 blocks, flat roof at y 10 with parapet at y 11.
const W = 16, H = 23, D = 9;
const ROOF = 10;
const PARAPET = 11;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (block == null) return;
  if (typeof block === "string") g.set(x, y, z, block);
  else g.set(x, y, z, block.id, block.p);
};

// Facade vocabulary for one perimeter cell at height y.
// face: "N" (z=0 side), "S" (z=8 street side), "W" (x=0), "E" (x=15)
// t: position along the face (x for N/S, z for W/E)
function facade(y, gr, t, face) {
  if (y === PARAPET) return "white_concrete";
  if (y === ROOF) return "smooth_quartz";
  if (y === gr) return "stone_bricks";
  // Street-level double entrance, centred on the south face.
  if (face === "S" && (t === 7 || t === 8) && (y === gr + 1 || y === gr + 2)) {
    const upper = y === gr + 2;
    return {
      id: "dark_oak_door",
      p: {
        facing: "south",
        half: upper ? "upper" : "lower",
        hinge: t === 7 ? "right" : "left",
        open: "false",
        powered: "false",
      },
    };
  }
  if (y === 5) return "smooth_quartz";            // storey line
  if (y > gr && y <= 4) return "smooth_quartz";   // ground-storey lintel band
  if (y > gr && y <= 3) {                          // ground-storey shopfront
    return t % 3 === 0 ? "black_concrete" : "glass";
  }
  if (y >= 6 && y <= 9) {                          // upper storey ribbon windows
    return t % 3 === 0 ? "smooth_quartz" : "light_blue_stained_glass";
  }
  return "white_concrete";                         // wall
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  const exposed = [];
  if (!has(x, z - 1)) exposed.push("N");
  if (!has(x, z + 1)) exposed.push("S");
  if (!has(x - 1, z)) exposed.push("W");
  if (!has(x + 1, z)) exposed.push("E");
  const perim = exposed.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs only, air between (no interiors).
    put(x, gr, z, "light_gray_concrete");
    put(x, 5, z, "light_gray_concrete");
    put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Perimeter wall: pick the dominant exposed face (street face wins at corners).
  const face = exposed.includes("S") ? "S" : exposed[0];
  const t = face === "N" || face === "S" ? x : z;
  for (let y = gr; y <= PARAPET; y++) {
    put(x, y, z, facade(y, gr, t, face));
  }
}

// Warm lights set back behind the street-face windows (air gap between glass and light).
for (let x = 1; x <= 14; x++) {
  if ((x % 3 !== 0) && (x % 6 === 2 || x % 6 === 1) && has(x, 5)) {
    put(x, 7, 5, "glowstone");
  }
}

// Roof plant: AC boxes on interior roof cells, one lightning rod.
const plant = [[3, 3], [4, 3], [11, 3], [12, 3], [3, 5], [12, 5]];
for (const [x, z] of plant) {
  if (has(x, z)) put(x, PARAPET, z, "light_gray_concrete");
}
if (has(8, 4)) {
  for (let y = PARAPET; y <= PARAPET + 2; y++) put(8, y, 4, "lightning_rod");
}

g.save(OUT);
