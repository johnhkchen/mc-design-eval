import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883605";
const W = 7, H = 23, D = 15;

// Record: 2-storey 1980s concrete shophouse-block, roof ~11 blocks above lowest ground.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const base = Math.min(...ground.values());
const top = base + 11;            // roof layers base .. base+10
const ROOF_Y = top;               // first block above the roof surface

const put = (x, y, z, name, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

const isInterior = (x, z) => has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);

const missingDirs = (x, z) => {
  const out = [];
  for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    if (!has(x + dx, z + dz)) out.push([dx, dz]);
  }
  return out;
};

const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells.map(([x, z]) => [x, z, ground.get(`${x},${z}`)])) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const missing = missingDirs(x, z);
  const exterior = missing.length > 0;
  // Face preference: front (north, z=0) first, then others.
  let face = missing.find(([dx, dz]) => dx === 0 && dz === -1) || missing[0];

  for (let y = gr; y < top; y++) {
    const h = y - base;

    if (!exterior) {
      // Interior: air gap, floor slabs at each storey line, roof slab at top.
      if (h === 10) put(x, y, z, "gray_concrete");
      else if (y === gr || h === 5) put(x, y, z, "smooth_stone");
      continue;
    }

    const [dx, dz] = face;
    const zFace = dz !== 0;              // wall runs along x (north/south face)
    const pos = zFace ? x : z;
    const maxPos = zFace ? 6 : 14;
    const isCorner = pos === 0 || pos === maxPos;

    // Cornice / parapet at top layer
    if (h === 10) { put(x, y, z, "stone_bricks"); continue; }
    // Storey string course
    if (h === 5) { put(x, y, z, "smooth_stone"); continue; }
    // Plinth
    if (h === 0) { put(x, y, z, "polished_andesite"); continue; }
    // Lintel band above ground-floor openings
    if (h === 4) { put(x, y, z, "white_concrete"); continue; }

    const isWindowRow = (h >= 1 && h <= 3) || (h >= 6 && h <= 8);
    const isWindowCol = !isCorner && pos % 2 === 1;

    // Main entrance on the north (front) face
    if (dz === -1 && z === 0 && pos === 3 && (h === 1 || h === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: h === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (isWindowRow && isWindowCol) {
      put(x, y, z, "light_blue_stained_glass_pane", zFace ? PANE_Z : PANE_X);
      // Warm light in the air gap behind some windows
      if ((pos + (h >= 6 ? 1 : 0)) % 4 === 1) {
        const ix = x - dx, iz = z - dz;
        if (isInterior(ix, iz)) {
          const igr = ground.get(`${ix},${iz}`);
          if (y >= igr) put(ix, y, iz, "glowstone");
        }
      }
      continue;
    }

    put(x, y, z, "white_concrete");
  }
}

// Rooftop mechanical penthouse on interior roof cells (above roof surface).
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!isInterior(x, z)) continue;
  if (x >= 2 && x <= 4 && z >= 5 && z <= 8) {
    put(x, ROOF_Y, z, "light_gray_concrete");
    if (x === 3 && (z === 6 || z === 7)) put(x, ROOF_Y + 1, z, "iron_block");
  }
}

// Rooftop rail-free parapet equipment: small AC units on one roof edge
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (isInterior(x, z) || !has(x, z)) continue;
  const m = missingDirs(x, z);
  if (m.length === 1 && m[0][0] === 0 && m[0][1] === -1 && x === 5 && z === 2) {
    put(x, ROOF_Y, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
