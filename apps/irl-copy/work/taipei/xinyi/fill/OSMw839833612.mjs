import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833612";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 21, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(`${x},${z}`, gr);
}
const inF = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const keys = [...G.keys()].map(k => k.split(",").map(Number));
const minG = Math.min(...G.values());
const zmin = Math.min(...keys.map(k => k[1]));

// Two storeys of ~5 blocks, roof slab ~11 above lowest ground
const S1 = minG + 5;     // first-floor slab
const ROOF = minG + 10;  // roof slab level

function put(x, y, z, id, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Exposed faces of a footprint cell
function faces(x, z) {
  const f = [];
  if (!inF(x, z - 1)) f.push("N");
  if (!inF(x, z + 1)) f.push("S");
  if (!inF(x - 1, z)) f.push("W");
  if (!inF(x + 1, z)) f.push("E");
  return f;
}

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, floor decks, floor slab, roof slab
for (const [k, gc] of G) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
  put(x, gc, z, "smooth_stone");                 // ground deck on foundation
  if (gc < S1) put(x, S1, z, "smooth_stone");    // first-floor slab
  if (gc < ROOF) put(x, ROOF, z, "light_gray_concrete"); // roof slab
}

// Pass 2: perimeter walls
for (const [k, gc] of G) {
  const [x, z] = k.split(",").map(Number);
  const f = faces(x, z);
  if (f.length === 0 || gc >= ROOF) continue;

  const alongX = f.includes("N") || f.includes("S");
  const alongZ = f.includes("W") || f.includes("E");
  const corner = alongX && alongZ;
  const t = alongX ? x : z;
  const pillar = corner || t % 3 === 0;
  const front = f.includes("N") && z === zmin;
  const pane = alongX ? paneNS : paneEW;

  for (let y = gc + 1; y <= ROOF - 1; y++) {
    if (y === S1) continue; // floor slab already placed
    let id, p;
    if (y === gc + 1) {
      id = "polished_andesite";                   // base course
    } else if (y < S1) {
      if (y === S1 - 1) id = "smooth_quartz";     // ground-storey lintel
      else if (pillar) id = "white_concrete";
      else if (front) id = "glass";               // shopfront
      else { id = "glass_pane"; p = pane; }
    } else {
      if (y === ROOF - 1) id = "smooth_quartz";   // upper cornice band
      else if (pillar) id = "white_concrete";
      else { id = "glass_pane"; p = pane; }       // upper-storey windows
    }
    put(x, y, z, id, p);
  }

  // Parapet and cap on the roof edge
  put(x, ROOF, z, "smooth_quartz");
  put(x, ROOF + 1, z, "white_concrete");
  put(x, ROOF + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance: a door on the street (north) face, off a pillar line
const frontXs = keys.filter(([x, z]) => z === zmin && !inF(x, zmin - 1)).map(([x]) => x).sort((a, b) => a - b);
const doorCands = frontXs.filter(x => x % 3 !== 0);
const doorX = (doorCands.length ? doorCands : frontXs)[Math.floor((doorCands.length ? doorCands : frontXs).length / 2)];
if (doorX !== undefined) {
  const dG = gnd(doorX, zmin);
  if (dG + 2 < S1) {
    put(doorX, dG + 1, zmin, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(doorX, dG + 2, zmin, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Warm lantern just inside the entrance, hung from the first-floor slab
    if (inF(doorX, zmin + 1)) put(doorX, S1 - 1, zmin + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Warm light behind upper windows: glowstone on street side, shroomlight on rear
for (const [x, z] of keys) {
  if (x % 3 !== 1) continue;
  if (z === zmin + 1 && inF(x, z) && gnd(x, z) < S1 + 1 && faces(x, z).length === 0) {
    put(x, S1 + 2, z, "glowstone");
  }
  if (z === D - 2 && inF(x, z) && gnd(x, z) < S1 + 1 && faces(x, z).length === 0) {
    put(x, S1 + 2, z, "shroomlight");
  }
}

// Rooftop plant enclosure in the middle of the roof
for (let x = 7; x <= 12; x++) {
  for (let z = 6; z <= 9; z++) {
    if (inF(x, z) && gnd(x, z) < ROOF) {
      put(x, ROOF + 1, z, "light_gray_concrete");
      put(x, ROOF + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
