import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name or era tags. Read from the footprint and lidar height (roof ~11 above lowest ground):
// a two-storey 1980s-90s Taipei commercial block with a shopfront on the street (z=0) side,
// cream tiled piers, grey concrete window frames, blue-tinted glass, and a parapet roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682850";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 9;
const ROOF = 10;      // roof slab level (interior)
const CORNICE = 10;   // perimeter cornice row
const PARAPET = 11;   // parapet top row
const STOREY = 5;     // storey line / second floor slab

const g = new Voxels([W, H, D]);

const groundMap = new Map();
for (const [x, z, raw] of cells) {
  const gy = Math.max(0, Math.min(9, Math.round(raw)));
  groundMap.set(`${x},${z}`, gy);
}
const has = (x, z) => groundMap.has(`${x},${z}`);
const G = (x, z) => groundMap.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which outward faces a cell touches: N = z-1 (street side), S = z+1, W = x-1, E = x+1
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Window bays: along x faces (N/S) glass on x%4 in {1,2}; along z faces (W/E) glass on z%3 in {1,2}
function isWindow(face, x, z) {
  if (face === "N" || face === "S") return x !== 0 && x !== W - 1 && [1, 2].includes(x % 4);
  return z !== 0 && z !== D - 1 && [1, 2].includes(z % 3);
}

function paneProps(face) {
  return (face === "N" || face === "S")
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
}

// Pass 1: foundations, interior floors, interior roof
for (const [x, z] of groundMap.keys().map(k => k.split(",").map(Number))) {
  const gr = G(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (faces(x, z).length === 0) {
    put(x, gr, z, "smooth_stone");                       // ground-storey floor
    if (STOREY > gr) put(x, STOREY, z, "smooth_stone");  // second-floor slab
    if (ROOF >= gr) put(x, ROOF, z, "gray_concrete");    // roof slab
  }
}

// Pass 2: perimeter walls
for (const [x, z] of groundMap.keys().map(k => k.split(",").map(Number))) {
  const fs = faces(x, z);
  if (fs.length === 0) continue;
  const gr = G(x, z);
  const face = fs[0];
  const idx = (face === "N" || face === "S") ? x : z;
  const win = fs.length === 1 && isWindow(face, x, z);
  const props = win ? paneProps(face) : null;

  for (let y = gr; y <= PARAPET; y++) {
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }
    if (y === CORNICE) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === PARAPET) { put(x, y, z, "white_concrete"); continue; }
    if (y === STOREY) { put(x, y, z, "smooth_quartz"); continue; }
    if (y < STOREY) {
      if (!win) put(x, y, z, "smooth_quartz");
      else if (y === 4) put(x, y, z, "gray_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", props);
    } else {
      if (!win) put(x, y, z, "smooth_quartz");
      else if (y === 6) put(x, y, z, "light_gray_concrete");
      else if (y === 9) put(x, y, z, "gray_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", props);
    }
  }
}

// Pass 3: entrance, surround, interior lights, rooftop plant
for (const [x, z] of groundMap.keys().map(k => k.split(",").map(Number))) {
  const fs = faces(x, z);
  const gr = G(x, z);

  // Street entrance on the N face, cell (2,0)
  if (fs.length === 1 && fs[0] === "N" && x === 2) {
    put(1, gr + 1, z, "smooth_quartz");
    put(1, gr + 2, z, "smooth_quartz");
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Warm light behind glass: glowstone on second floor, hanging lantern in the shop
  if (fs.length === 1 && fs[0] === "N" && x % 8 === 2 && has(x, z + 1) && faces(x, z + 1).length === 0) {
    put(x, 7, z + 1, "glowstone");
  }
  if (fs.length === 1 && fs[0] === "S" && x % 8 === 6 && has(x, z - 1) && faces(x, z - 1).length === 0) {
    put(x, 7, z - 1, "shroomlight");
  }
  if (fs.length === 1 && fs[0] === "N" && x % 8 === 6 && has(x, z + 1) && faces(x, z + 1).length === 0) {
    put(x, 4, z + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Rooftop plant boxes and a low stair-like stack on interior roof
for (let x = 8; x <= 9; x++) for (let z = 3; z <= 4; z++) {
  if (has(x, z) && faces(x, z).length === 0) {
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
  }
}
for (let x = 16; x <= 18; x++) for (let z = 5; z <= 6; z++) {
  if (has(x, z) && faces(x, z).length === 0) put(x, 11, z, "stone");
}

g.save(`${DIR}/${ID}.nbt`);
