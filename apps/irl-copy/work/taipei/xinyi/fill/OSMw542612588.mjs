import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1990s Taipei mid-rise commercial block: 2 storeys over a stone base, white tiled
// piers, blue-tinted glass bays, a smooth-stone band at each floor line, a shopfront
// with a canopy on the longest street facade, and a plant box on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612588";
const CELLS = `${DIR}/${ID}.cells.json`;
const OUT = `${DIR}/${ID}.nbt`;

const W = 19, H = 23, D = 32;
const ROOF = 11;          // roof/parapet top, absolute y (lowest ground = 0)
const BAND_A = 5, BAND_B = 10; // storey lines

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const k = (x, z) => `${x},${z}`;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- footprint and ground ----
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
let minG = Infinity;
for (const [, , gr] of raw) minG = Math.min(minG, gr);
const G = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(k(x, z), Math.min(9, Math.max(0, Math.round(gr - minG))));
}
const has = (x, z) => G.has(k(x, z));

const info = new Map();
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const miss = Object.keys(DIRS).filter(n => !has(x + DIRS[n][0], z + DIRS[n][1]));
  info.set(key, {
    x, z, g: gr, miss,
    edge: miss.length > 0,
    corner: miss.length >= 2,
    normal: miss.length === 1 ? miss[0] : null,
  });
}

// ---- main street facade (most single-normal cells) and entrance ----
const counts = {};
for (const c of info.values()) if (c.normal) counts[c.normal] = (counts[c.normal] || 0) + 1;
const mainDir = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
const along = (mainDir === "north" || mainDir === "south") ? (c => c.x) : (c => c.z);
const list = [...info.values()].filter(c => c.normal === mainDir).sort((a, b) => along(a) - along(b));
const ei = Math.floor(list.length / 2);
const doorKey = list.length ? k(list[ei].x, list[ei].z) : null;
const trioKeys = new Set(list.slice(Math.max(0, ei - 1), ei + 2).map(c => k(c.x, c.z)));

// ---- walls, floors, foundations ----
const lights = [];
for (const c of info.values()) {
  const { x, z, g: gr, edge, normal } = c;
  const key = k(x, z);

  // foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // interior: floor slabs per storey and roof deck, air between (no interiors)
    for (let y = gr; y <= ROOF; y++) {
      if (y === gr || y === ROOF) put(x, y, z, "gray_concrete");
      else if (y === BAND_A || y === BAND_B) put(x, y, z, "smooth_stone");
    }
    continue;
  }

  const isDoor = key === doorKey;
  const isTrio = trioKeys.has(key);

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, "white_concrete"); continue; }          // parapet
    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }        // base course
    if (isTrio && y === gr + 4) { put(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" }); continue; } // canopy
    if (isDoor && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: normal,
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (y === BAND_A || y === BAND_B) { put(x, y, z, "smooth_stone"); continue; }
    const inZone = (y >= gr + 1 && y <= 3) || (y >= 6 && y <= 8);
    if (!inZone) { put(x, y, z, "white_concrete"); continue; }            // spandrel / lintel
    if (c.corner || (x + z) % 3 === 0) { put(x, y, z, "white_concrete"); continue; } // pier
    put(x, y, z, "light_blue_stained_glass");
    lights.push([x, y, z, DIRS[normal]]);
  }
}

// warm light behind some glass: glowstone one bay inside the building
for (const [x, y, z, [dx, dz]] of lights) {
  if ((x * 5 + z * 3 + y) % 7 !== 0) continue;
  const ix = x - dx, iz = z - dz;
  const inner = info.get(k(ix, iz));
  if (inner && !inner.edge) put(ix, y, iz, "glowstone");
}

// ---- roof plant box on the deep interior ----
let sx = 0, sz = 0, n = 0;
for (const c of info.values()) { sx += c.x; sz += c.z; n++; }
const cx = Math.round(sx / n), cz = Math.round(sz / n);
const deep = (x, z) => {
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (!has(x + dx, z + dz)) return false;
  return true;
};
for (let x = cx - 4; x <= cx + 4; x++) {
  for (let z = cz - 5; z <= cz + 5; z++) {
    if (!has(x, z) || !deep(x, z)) continue;
    put(x, 12, z, "light_gray_concrete");
    if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 3) {
      put(x, 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(OUT);
