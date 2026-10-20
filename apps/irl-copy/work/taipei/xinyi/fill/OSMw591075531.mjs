import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded commercial-office block, Xinyi district, c. 1995-2005 (Taiwan).
// Five storeys of 5 blocks each (roof slab at y 25), white-painted concrete
// piers and spandrels, blue-tinted glazing in pale concrete frames, a stone-brick
// base, a shopfront ground floor with entrance bays and canopies, a cornice
// and parapet, and rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075531";
const W = 75, H = 37, D = 21;
const ROOF = 25;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gr] of raw) {
  const gg = Math.max(0, Math.min(ROOF - 1, Math.round(gr - minG)));
  ground.set(x + "," + z, gg);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const has = (x, z) => ground.has(x + "," + z);
const out = (x, z, dx, dz) => !has(x + dx, z + dz);
const PANE = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_NS = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
const LANTERN = { hanging: "true", waterlogged: "false" };

const glowCells = [];

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const fz = out(x, z, 0, -1) || out(x, z, 0, 1); // faces north/south, runs along x
  const fx = out(x, z, -1, 0) || out(x, z, 1, 0); // faces east/west, runs along z
  const ext = fz || fx;
  const coord = fz ? x : z;

  // Foundation under the cell
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    const s = Math.floor(y / 5);
    const r = y % 5;

    if (y === ROOF) { put(x, y, z, "light_gray_concrete"); continue; } // roof slab

    if (!ext) {
      if (r === 0 && s >= 1) put(x, y, z, "light_gray_concrete"); // storey floor slab
      continue;
    }

    if (y === 0) { put(x, y, z, "stone_bricks"); continue; } // base course
    if (r === 0 && s >= 1) { put(x, y, z, "light_gray_concrete"); continue; } // storey line

    if (r === 4) {
      const entrance = s === 0 && coord % 12 === 6;
      put(x, y, z, entrance ? "light_gray_concrete" : "white_concrete"); // spandrel or canopy
      continue;
    }

    // Window rows r = 1..3
    if (coord % 4 === 0) { put(x, y, z, "white_concrete"); continue; } // pier / frame
    const entrance = s === 0 && coord % 12 === 6;
    if (entrance) {
      if (r === 3) put(x, y, z, "lantern", LANTERN); // lantern under canopy
      continue; // doorway stays open
    }
    if (fz) put(x, y, z, s === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", PANE);
    else put(x, y, z, s === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", PANE_NS);

    if (r === 2 && coord % 8 === 2) {
      const ix = fz ? 0 : (out(x, z, -1, 0) ? 1 : -1);
      const iz = fz ? (out(x, z, 0, -1) ? 1 : -1) : 0;
      glowCells.push([x + ix, y, z + iz, gr]);
    }
  }

  // Parapet and cornice on the exterior ring
  if (ext) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "white_concrete");
  }
}

// Warm light in the air gap behind selected windows (after main pass)
for (const [x, y, z, gr] of glowCells) {
  if (has(x, z) && gr <= y) put(x, y, z, "glowstone");
}

// Rooftop plant rooms and a small penthouse on the interior roof
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const fz = out(x, z, 0, -1) || out(x, z, 0, 1);
  const fx = out(x, z, -1, 0) || out(x, z, 1, 0);
  if (fz || fx) continue;
  if (x % 16 >= 5 && x % 16 <= 10 && z >= 6 && z <= 14) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
    if (x % 16 >= 7 && x % 16 <= 8 && z >= 8 && z <= 12) {
      put(x, ROOF + 3, z, "white_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
